const express = require('express');

const router = express.Router();
const pool = require('../utils/db');

const STATUSES = ['pending', 'under_review', 'resolved', 'dismissed'];

// Actions that close a report, and the status each one leaves behind
const ACTION_RESULT = {
  dismissed: 'dismissed',
  warning: 'resolved',
  temporary_block: 'resolved',
  permanent_block: 'resolved',
  deleted: 'resolved',
};

// GET /api/admin/reports - queue, filterable by status, role and date
router.get('/', async (req, res) => {
  try {
    const { status, role, from, to } = req.query;
    const where = [];
    const params = [];

    if (status && STATUSES.includes(status)) { where.push('r.status = ?'); params.push(status); }
    if (role === 'patient' || role === 'doctor') { where.push('r.reported_role = ?'); params.push(role); }
    if (from) { where.push('r.created_at >= ?'); params.push(`${from} 00:00:00`); }
    if (to) { where.push('r.created_at <= ?'); params.push(`${to} 23:59:59`); }

    const [rows] = await pool.execute(
      `SELECT r.id, r.reason, r.status, r.created_at,
              r.reporter_name, r.reported_name, r.reported_role,
              r.reported_id, r.evidence_file IS NOT NULL AS has_evidence,
              u.suspended, u.suspended_until
       FROM reports r
       LEFT JOIN users u ON u.id = r.reported_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY FIELD(r.status, 'pending', 'under_review', 'resolved', 'dismissed'), r.created_at DESC
       LIMIT 200`,
      params,
    );

    const [[counts]] = await pool.execute(
      `SELECT
        SUM(status = 'pending') AS pending,
        SUM(status = 'under_review') AS under_review,
        SUM(status = 'resolved') AS resolved,
        SUM(status = 'dismissed') AS dismissed
       FROM reports`,
    );

    res.json({ reports: rows, counts });
  } catch (error) {
    console.error('Error listing reports:', error);
    res.status(500).json({ error: 'Could not load reports.' });
  }
});

// GET /api/admin/reports/:id - full report with its moderation history
router.get('/:id', async (req, res) => {
  try {
    const [[report]] = await pool.execute(
      `SELECT r.*, r.evidence_file IS NOT NULL AS has_evidence,
              u.email AS reported_email, u.suspended, u.suspended_until,
              u.patient_id, u.doctor_id
       FROM reports r
       LEFT JOIN users u ON u.id = r.reported_id
       WHERE r.id = ?`,
      [req.params.id],
    );

    if (!report) return res.status(404).json({ error: 'Report not found.' });

    // Never expose the stored filename to the browser
    delete report.evidence_file;

    const [history] = await pool.execute(
      `SELECT action, message, blocked_until, admin_name, created_at
       FROM moderation_actions WHERE report_id = ? ORDER BY created_at DESC`,
      [req.params.id],
    );

    // Other reports about the same account, which is useful context when deciding
    const [others] = await pool.execute(
      `SELECT id, reason, status, created_at FROM reports
       WHERE reported_id = ? AND id != ? ORDER BY created_at DESC LIMIT 10`,
      [report.reported_id, req.params.id],
    );

    res.json({ report, history, other_reports: others });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Could not load the report.' });
  }
});

// PATCH /api/admin/reports/:id/status - mark a report as being looked at
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status.' });

    const [result] = await pool.execute('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Report not found.' });

    res.json({ status });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Could not update the report.' });
  }
});

/**
 * POST /api/admin/reports/:id/action
 * Applies the administrator's decision. A report is only an allegation until
 * this runs, so nothing happens to an account before an administrator acts.
 */
router.post('/:id/action', async (req, res) => {
  const { action, message, days, confirm_delete: confirmDelete } = req.body;

  if (!ACTION_RESULT[action]) return res.status(400).json({ error: 'Unknown action.' });
  if (action === 'warning' && (!message || !message.trim())) {
    return res.status(400).json({ error: 'Please write the message the person will receive.' });
  }
  if (action === 'deleted' && confirmDelete !== true) {
    return res.status(400).json({ error: 'Deleting an account must be confirmed explicitly.' });
  }
  if (action === 'temporary_block') {
    const n = Number(days);
    if (!Number.isInteger(n) || n < 1 || n > 365) {
      return res.status(400).json({ error: 'Choose between 1 and 365 days.' });
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[report]] = await conn.execute(
      'SELECT id, reported_id, reported_name FROM reports WHERE id = ? FOR UPDATE',
      [req.params.id],
    );
    if (!report) {
      await conn.rollback();
      return res.status(404).json({ error: 'Report not found.' });
    }

    const targetId = report.reported_id;
    let blockedUntil = null;

    if (targetId) {
      if (action === 'temporary_block') {
        blockedUntil = new Date(Date.now() + Number(days) * 86400000);
        await conn.execute(
          'UPDATE users SET suspended = 1, suspended_until = ? WHERE id = ?',
          [blockedUntil, targetId],
        );
      } else if (action === 'permanent_block') {
        await conn.execute(
          'UPDATE users SET suspended = 1, suspended_until = NULL WHERE id = ?', [targetId],
        );
      }
    }

    // A warning arrives in the person's own account, whatever their role
    if (action === 'warning' && targetId) {
      await conn.execute(
        'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
        [targetId, 'admin_warning', message.trim()],
      );
    }

    if ((action === 'temporary_block' || action === 'permanent_block') && targetId && message?.trim()) {
      await conn.execute(
        'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
        [targetId, 'admin_warning', message.trim()],
      );
    }

    await conn.execute(
      `INSERT INTO moderation_actions (report_id, admin_id, admin_name, action, message, blocked_until)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [report.id, req.user.id, req.user.name || 'Administrator', action, message?.trim() || null, blockedUntil],
    );

    await conn.execute('UPDATE reports SET status = ? WHERE id = ?', [ACTION_RESULT[action], report.id]);

    // Deletion happens last. Reports and history keep the copied names, so the
    // record of what happened survives the account being removed.
    if (action === 'deleted' && targetId) {
      await conn.execute('DELETE FROM users WHERE id = ? AND role != "admin"', [targetId]);
    }

    await conn.commit();
    res.json({ action, status: ACTION_RESULT[action], blocked_until: blockedUntil });
  } catch (error) {
    await conn.rollback();
    console.error('Error applying action:', error);
    res.status(500).json({ error: 'Could not apply that action.' });
  } finally {
    conn.release();
  }
});

// POST /api/admin/reports/:id/unblock - lift a block without touching the report
router.post('/:id/unblock', async (req, res) => {
  try {
    const [[report]] = await pool.execute('SELECT reported_id FROM reports WHERE id = ?', [req.params.id]);
    if (!report?.reported_id) return res.status(404).json({ error: 'Account not found.' });

    await pool.execute(
      'UPDATE users SET suspended = 0, suspended_until = NULL WHERE id = ?', [report.reported_id],
    );
    await pool.execute(
      `INSERT INTO moderation_actions (report_id, admin_id, admin_name, action, message)
       VALUES (?, ?, ?, 'unblocked', 'The block was lifted and the account can log in again.')`,
      [req.params.id, req.user.id, req.user.name || 'Administrator'],
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error unblocking:', error);
    res.status(500).json({ error: 'Could not unblock that account.' });
  }
});

module.exports = router;
