const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const pool = require('../utils/db');

const evidenceDir = path.join(__dirname, '../../uploads/evidence');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

const REASONS = [
  'inappropriate_behaviour',
  'harassment',
  'abuse',
  'false_information',
  'misuse_of_platform',
  'other',
];

const ALLOWED_EVIDENCE = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf',
];
const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

// POST /api/reports - report another account
router.post('/', async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { reported_id: reportedId, reason, explanation } = req.body;

    if (!reportedId || !reason || !explanation || !explanation.trim()) {
      return res.status(400).json({ error: 'Please choose a reason and explain what happened.' });
    }
    if (!REASONS.includes(reason)) {
      return res.status(400).json({ error: 'That reason is not recognised.' });
    }
    if (explanation.trim().length < 20) {
      return res.status(400).json({ error: 'Please describe what happened in a little more detail.' });
    }
    if (Number(reportedId) === reporterId) {
      return res.status(400).json({ error: 'You cannot report your own account.' });
    }

    const [[reported]] = await pool.execute(
      'SELECT id, full_name, role FROM users WHERE id = ?', [reportedId],
    );
    if (!reported || reported.role === 'admin') {
      return res.status(404).json({ error: 'That account was not found.' });
    }

    // One open report per person per target, so a single dispute cannot flood the queue
    const [open] = await pool.execute(
      `SELECT id FROM reports WHERE reporter_id = ? AND reported_id = ?
       AND status IN ('pending', 'under_review')`,
      [reporterId, reportedId],
    );
    if (open.length) {
      return res.status(400).json({
        error: 'You already have a report about this account waiting to be reviewed.',
      });
    }

    let evidenceFile = null;
    let evidenceName = null;
    let evidenceMime = null;

    if (req.files && req.files.evidence) {
      const file = req.files.evidence;
      if (!ALLOWED_EVIDENCE.includes(file.mimetype)) {
        return res.status(400).json({ error: 'Evidence must be an image or a PDF.' });
      }
      if (file.size > MAX_EVIDENCE_BYTES) {
        return res.status(400).json({ error: 'That file is larger than 5 MB.' });
      }
      // Stored name is generated, never taken from the upload
      const ext = path.extname(file.name).toLowerCase().slice(0, 6);
      evidenceFile = `evidence_${reporterId}_${Date.now()}${ext}`;
      evidenceName = file.name.slice(0, 200);
      evidenceMime = file.mimetype;
      await file.mv(path.join(evidenceDir, evidenceFile));
    }

    const [[reporter]] = await pool.execute(
      'SELECT full_name FROM users WHERE id = ?', [reporterId],
    );

    // Names are copied in so the record survives if either account is deleted
    const [result] = await pool.execute(
      `INSERT INTO reports
        (reporter_id, reported_id, reporter_name, reported_name, reported_role,
         reason, explanation, evidence_file, evidence_name, evidence_mime)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reporterId, reportedId, reporter?.full_name || null, reported.full_name, reported.role,
        reason, explanation.trim(), evidenceFile, evidenceName, evidenceMime,
      ],
    );

    res.status(201).json({
      id: result.insertId,
      status: 'pending',
      message: 'Thank you. An administrator will look at this.',
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Could not send your report. Please try again.' });
  }
});

// GET /api/reports/mine - reports the signed in user has sent
router.get('/mine', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, reported_name, reported_role, reason, explanation, status, created_at
       FROM reports WHERE reporter_id = ? ORDER BY created_at DESC`,
      [req.user.id],
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Could not load your reports.' });
  }
});

/**
 * GET /api/reports/:id/evidence
 * Evidence can contain personal information, so it is only served to an
 * administrator or to the person who submitted the report.
 */
router.get('/:id/evidence', async (req, res) => {
  try {
    const [[report]] = await pool.execute(
      'SELECT reporter_id, evidence_file, evidence_mime, evidence_name FROM reports WHERE id = ?',
      [req.params.id],
    );

    if (!report || !report.evidence_file) {
      return res.status(404).json({ error: 'No evidence was attached to this report.' });
    }

    const isAdmin = req.user.role === 'admin';
    const isReporter = report.reporter_id === req.user.id;
    if (!isAdmin && !isReporter) {
      return res.status(403).json({ error: 'You are not allowed to open this file.' });
    }

    const filepath = path.join(evidenceDir, path.basename(report.evidence_file));
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'The file is no longer available.' });
    }

    res.setHeader('Content-Type', report.evidence_mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${report.evidence_name || 'evidence'}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    fs.createReadStream(filepath).pipe(res);
  } catch (error) {
    console.error('Error serving evidence:', error);
    res.status(500).json({ error: 'Could not open the file.' });
  }
});

module.exports = router;
module.exports.REASONS = REASONS;
