/**
 * admin.js — Admin-only routes.
 * All routes here are protected by verifyToken + requireAdmin in backend-server.js.
 * Admins can manage users but cannot view patient medical records (privacy).
 */

const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { forgetSession } = require('../middleware/roleGuard');
const storage = require('../utils/storage');

// GET /api/admin/users — list all users filterable by role
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    let query = 'SELECT id, full_name, email, phone, role, patient_id, suspended, created_at FROM users';
    const params = [];
    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }
    query += ' ORDER BY created_at DESC';
    const [users] = await pool.execute(query, params);
    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users/:id — get single user details
router.get('/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, full_name, email, phone, role, patient_id, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Admin get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/stats — dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [[{ total_patients }]] = await pool.execute("SELECT COUNT(*) AS total_patients FROM users WHERE role = 'patient'");
    const [[{ total_doctors }]] = await pool.execute("SELECT COUNT(*) AS total_doctors FROM users WHERE role = 'doctor'");
    const [[{ total_consultations }]] = await pool.execute('SELECT COUNT(*) AS total_consultations FROM consultations');
    res.json({ total_patients, total_doctors, total_consultations });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id — delete a user account
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (String(req.params.id) === String(req.user.id))
      return res.status(400).json({ error: 'Cannot delete your own account' });

    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/users/:id/suspend — suspend or unsuspend a user
router.patch('/users/:id/suspend', async (req, res) => {
  try {
    const { suspended } = req.body;
    
    // Check if user exists
    const [existing] = await pool.execute('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'User not found' });
    
    // Bumping the session version ends any session the person already had open
    await pool.execute(
      'UPDATE users SET suspended = ?, session_version = session_version + 1 WHERE id = ?',
      [suspended ? 1 : 0, req.params.id],
    );
    forgetSession(req.params.id);
    res.json({ message: `User ${suspended ? 'suspended' : 'unsuspended'} successfully` });
  } catch (error) {
    console.error('Admin suspend user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/closures
 * People who asked for their account to be closed. Their account is already
 * locked, so nothing more happens in it, and this is the queue the
 * administrator works through before removing anything for good.
 */
router.get('/closures', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, full_name, email, role, patient_id, doctor_id,
              deletion_reason, deletion_requested_at,
              DATEDIFF(NOW(), deletion_requested_at) AS days_waiting
       FROM users
       WHERE deletion_requested_at IS NOT NULL
       ORDER BY deletion_requested_at ASC`,
    );
    res.json(rows);
  } catch (error) {
    console.error('Admin closures error:', error);
    res.status(500).json({ error: 'Could not load the closed accounts.' });
  }
});

/**
 * POST /api/admin/closures/:id/restore
 * Puts an account back, for the times when someone asks to come back or the
 * request turns out to be a mistake.
 */
router.post('/closures/:id/restore', async (req, res) => {
  try {
    const [result] = await pool.execute(
      `UPDATE users
       SET deletion_requested_at = NULL, deletion_reason = NULL, suspended = 0
       WHERE id = ? AND deletion_requested_at IS NOT NULL`,
      [req.params.id],
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'That account was not found.' });

    forgetSession(req.params.id);
    await pool.execute(
      'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
      [req.params.id, 'account_restored', 'Your account has been opened again. You can log in as before.'],
    );

    res.json({ restored: true });
  } catch (error) {
    console.error('Admin restore error:', error);
    res.status(500).json({ error: 'Could not open that account again.' });
  }
});

/**
 * GET /api/admin/doctors
 * Doctors waiting to be checked, and the ones already decided. A doctor is
 * only shown to patients once an administrator has confirmed their licence.
 */
router.get('/doctors', async (req, res) => {
  try {
    const { status } = req.query;
    const where = ["role = 'doctor'"];
    const params = [];

    if (['pending', 'verified', 'refused'].includes(status)) {
      where.push('verification = ?');
      params.push(status);
    }

    const [doctors] = await pool.execute(
      `SELECT id, full_name, email, phone, specialization, hospital, doctor_id,
              licence_number, licence_file IS NOT NULL AS has_licence_file,
              verification, verification_note, suspended, created_at
       FROM users
       WHERE ${where.join(' AND ')}
       ORDER BY FIELD(verification, 'pending', 'refused', 'verified'), created_at DESC`,
      params,
    );

    const [[counts]] = await pool.execute(
      `SELECT SUM(verification = 'pending') AS pending,
              SUM(verification = 'verified') AS verified,
              SUM(verification = 'refused') AS refused
       FROM users WHERE role = 'doctor'`,
    );

    res.json({ doctors, counts });
  } catch (error) {
    console.error('Admin doctors error:', error);
    res.status(500).json({ error: 'Could not load the doctors.' });
  }
});

/**
 * PATCH /api/admin/doctors/:id/verification
 * The decision itself. A refused doctor keeps their account and is told why,
 * but patients never see them in the directory.
 */
router.patch('/doctors/:id/verification', async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!['pending', 'verified', 'refused'].includes(status)) {
      return res.status(400).json({ error: 'Unknown decision.' });
    }

    const [[doctor]] = await pool.execute(
      "SELECT id, full_name FROM users WHERE id = ? AND role = 'doctor'", [req.params.id],
    );
    if (!doctor) return res.status(404).json({ error: 'That doctor was not found.' });

    await pool.execute(
      'UPDATE users SET verification = ?, verification_note = ? WHERE id = ?',
      [status, note?.trim()?.slice(0, 300) || null, doctor.id],
    );

    const message = status === 'verified'
      ? 'Your licence has been checked. Patients can now find you on Beral Care.'
      : status === 'refused'
        ? `We could not confirm your licence.${note?.trim() ? ` ${note.trim()}` : ''} You can send the right details and ask again.`
        : 'Your account is being checked again.';

    await pool.execute(
      'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
      [doctor.id, 'verification', message],
    );

    res.json({ verification: status });
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Could not save that decision.' });
  }
});

/**
 * GET /api/admin/doctors/:id/licence
 * The licence document a doctor uploaded. Administrators only.
 */
router.get('/doctors/:id/licence', async (req, res) => {
  try {
    const [[doctor]] = await pool.execute(
      'SELECT licence_file FROM users WHERE id = ? AND role = "doctor"', [req.params.id],
    );
    if (!doctor?.licence_file) return res.status(404).json({ error: 'No licence was uploaded.' });

    const contents = await storage.read(doctor.licence_file, 'licences');
    if (!contents) return res.status(404).json({ error: 'The file is no longer available.' });

    res.setHeader('Cache-Control', 'private, no-store');
    res.send(contents);
  } catch (error) {
    console.error('Admin licence error:', error);
    res.status(500).json({ error: 'Could not open the file.' });
  }
});

/**
 * GET /api/admin/reviews
 * Every rating patients have left, so an administrator can read what is being
 * said about a doctor, open anything attached to it, and decide whether the
 * account needs action. Filterable to the low ratings and to the ones that
 * came with a file, which are the ones worth reading first.
 */
router.get('/reviews', async (req, res) => {
  try {
    const { rating, withFile } = req.query;
    const where = [];
    const params = [];

    if (rating === 'low') where.push('r.rating <= 2');
    if (String(withFile) === 'true') where.push('r.evidence_file IS NOT NULL');

    const [rows] = await pool.execute(
      `SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at,
              r.evidence_file IS NOT NULL AS has_evidence, r.evidence_name,
              d.id AS doctor_id, d.full_name AS doctor_name, d.specialization,
              d.hospital, d.suspended AS doctor_blocked,
              p.id AS patient_id, p.full_name AS patient_name
       FROM doctor_reviews r
       JOIN users d ON d.id = r.doctor_id
       LEFT JOIN users p ON p.id = r.patient_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY r.updated_at DESC
       LIMIT 200`,
      params,
    );

    const [[counts]] = await pool.execute(
      `SELECT COUNT(*) AS total,
              SUM(rating <= 2) AS low,
              SUM(evidence_file IS NOT NULL) AS with_file
       FROM doctor_reviews`,
    );

    res.json({ reviews: rows, counts });
  } catch (error) {
    console.error('Admin reviews error:', error);
    res.status(500).json({ error: 'Could not load the ratings.' });
  }
});

module.exports = router;
