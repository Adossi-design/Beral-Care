const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const pool = require('../utils/db');

const evidenceDir = path.join(__dirname, '../../uploads/reviews');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

const ALLOWED_EVIDENCE = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
const MIN_COMMENT = 15;

/**
 * What people see on a doctor's profile: the average, how many rated, and
 * every comment. This is open to anyone, signed in or not, because the point
 * of a rating is to help a person choose a doctor before they commit to one.
 *
 * Comments carry no names. A patient who says a doctor treated them badly
 * should not have that published under their own name, and the rating is
 * about the doctor, not about who wrote it.
 */
const getDoctorReviews = async (req, res) => {
  try {
    const viewer = req.user || null;
    const doctorId = Number(req.params.doctorId);
    if (!Number.isInteger(doctorId)) return res.status(400).json({ error: 'Unknown doctor.' });

    const [[summary]] = await pool.execute(
      `SELECT COUNT(*) AS count, ROUND(AVG(rating), 2) AS average
       FROM doctor_reviews WHERE doctor_id = ?`,
      [doctorId],
    );

    const [rows] = await pool.execute(
      `SELECT id, rating, comment, reply, replied_at, created_at, updated_at, patient_id,
              evidence_file IS NOT NULL AS has_evidence
       FROM doctor_reviews WHERE doctor_id = ?
       ORDER BY updated_at DESC LIMIT 100`,
      [doctorId],
    );

    const isAdmin = viewer?.role === 'admin';
    const reviews = rows.map((r) => {
      const isMine = !!viewer && r.patient_id === viewer.id;
      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        reply: r.reply,
        replied_at: r.replied_at,
        created_at: r.created_at,
        updated_at: r.updated_at,
        mine: isMine,
        // The comment is for everyone. Any file attached to it is not: it can
        // hold personal details, so only the writer and an administrator see
        // that one exists at all.
        has_evidence: (isAdmin || isMine) ? !!Number(r.has_evidence) : false,
      };
    });

    res.json({
      count: Number(summary.count) || 0,
      average: summary.average === null ? null : Number(summary.average),
      reviews,
    });
  } catch (error) {
    console.error('Error loading reviews:', error);
    res.status(500).json({ error: 'Could not load the ratings.' });
  }
};

router.get('/doctor/:doctorId', getDoctorReviews);

/**
 * POST /api/reviews
 * A patient rates a doctor they are connected with. Every rating carries a
 * written reason, and a file can be attached when there is something to show.
 */
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can rate a doctor.' });
    }

    const patientId = req.user.id;
    const doctorId = Number(req.body.doctor_id);
    const rating = Number(req.body.rating);
    const comment = (req.body.comment || '').trim();

    if (!Number.isInteger(doctorId)) return res.status(400).json({ error: 'Unknown doctor.' });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Please choose between one and five stars.' });
    }
    if (comment.length < MIN_COMMENT) {
      return res.status(400).json({ error: 'Please say a little more about why you chose that rating.' });
    }

    const [[doctor]] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND role = "doctor"', [doctorId],
    );
    if (!doctor) return res.status(404).json({ error: 'That doctor was not found.' });

    // Only someone who actually dealt with the doctor can rate them
    const [[link]] = await pool.execute(
      `SELECT status FROM consultation_requests
       WHERE patient_id = ? AND doctor_id = ?`,
      [patientId, doctorId],
    );
    if (!link || (link.status !== 'accepted' && link.status !== 'completed')) {
      return res.status(403).json({ error: 'You can rate a doctor once you are connected with them.' });
    }

    let evidenceFile = null;
    let evidenceName = null;
    let evidenceMime = null;

    if (req.files && req.files.evidence) {
      const file = req.files.evidence;
      if (!ALLOWED_EVIDENCE.includes(file.mimetype)) {
        return res.status(400).json({ error: 'The file must be an image or a PDF.' });
      }
      if (file.size > MAX_EVIDENCE_BYTES) {
        return res.status(400).json({ error: 'That file is larger than 5 MB.' });
      }
      const ext = path.extname(file.name).toLowerCase().slice(0, 6);
      evidenceFile = `review_${patientId}_${Date.now()}${ext}`;
      evidenceName = file.name.slice(0, 200);
      evidenceMime = file.mimetype;
      await file.mv(path.join(evidenceDir, evidenceFile));
    }

    // One rating per patient per doctor. Rating again replaces the old one.
    const [[existing]] = await pool.execute(
      'SELECT id, evidence_file FROM doctor_reviews WHERE doctor_id = ? AND patient_id = ?',
      [doctorId, patientId],
    );

    if (existing) {
      await pool.execute(
        `UPDATE doctor_reviews
         SET rating = ?, comment = ?,
             evidence_file = COALESCE(?, evidence_file),
             evidence_name = COALESCE(?, evidence_name),
             evidence_mime = COALESCE(?, evidence_mime)
         WHERE id = ?`,
        [rating, comment, evidenceFile, evidenceName, evidenceMime, existing.id],
      );
      return res.json({ id: existing.id, updated: true });
    }

    const [result] = await pool.execute(
      `INSERT INTO doctor_reviews
        (doctor_id, patient_id, rating, comment, evidence_file, evidence_name, evidence_mime)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [doctorId, patientId, rating, comment, evidenceFile, evidenceName, evidenceMime],
    );

    res.status(201).json({ id: result.insertId, updated: false });
  } catch (error) {
    console.error('Error saving a review:', error);
    res.status(500).json({ error: 'Could not save your rating. Please try again.' });
  }
});

/**
 * GET /api/reviews/:id/evidence
 * A file attached to a rating can hold personal information, so it is served
 * only to the person who attached it and to an administrator. Not to other
 * patients, and not to the doctor being rated.
 */
router.get('/:id/evidence', async (req, res) => {
  try {
    const [[review]] = await pool.execute(
      'SELECT patient_id, evidence_file, evidence_mime, evidence_name FROM doctor_reviews WHERE id = ?',
      [req.params.id],
    );

    if (!review || !review.evidence_file) {
      return res.status(404).json({ error: 'No file was attached to this rating.' });
    }

    const allowed = req.user.role === 'admin' || review.patient_id === req.user.id;
    if (!allowed) return res.status(403).json({ error: 'You are not allowed to open this file.' });

    const filepath = path.join(evidenceDir, path.basename(review.evidence_file));
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'The file is no longer available.' });
    }

    res.setHeader('Content-Type', review.evidence_mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${review.evidence_name || 'attachment'}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    fs.createReadStream(filepath).pipe(res);
  } catch (error) {
    console.error('Error serving review evidence:', error);
    res.status(500).json({ error: 'Could not open the file.' });
  }
});

/**
 * POST /api/reviews/:id/reply
 * The doctor being rated answers once, under the rating. A rating with no
 * right of reply is not fair to the person it is about.
 */
router.post('/:id/reply', async (req, res) => {
  try {
    const reply = (req.body.reply || '').trim();
    if (reply.length < 5) return res.status(400).json({ error: 'Please write your answer.' });

    const [[review]] = await pool.execute(
      'SELECT id, doctor_id FROM doctor_reviews WHERE id = ?', [req.params.id],
    );
    if (!review) return res.status(404).json({ error: 'That rating was not found.' });

    if (req.user.role !== 'doctor' || review.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the doctor being rated can answer.' });
    }

    await pool.execute(
      'UPDATE doctor_reviews SET reply = ?, replied_at = NOW() WHERE id = ?',
      [reply.slice(0, 1000), review.id],
    );

    res.json({ reply });
  } catch (error) {
    console.error('Error saving a reply:', error);
    res.status(500).json({ error: 'Could not save your answer.' });
  }
});

// DELETE /api/reviews/:id - the person who wrote it, or an administrator
router.delete('/:id', async (req, res) => {
  try {
    const [[review]] = await pool.execute(
      'SELECT id, patient_id FROM doctor_reviews WHERE id = ?', [req.params.id],
    );
    if (!review) return res.status(404).json({ error: 'That rating was not found.' });

    if (req.user.role !== 'admin' && review.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only remove your own rating.' });
    }

    await pool.execute('DELETE FROM doctor_reviews WHERE id = ?', [review.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting a review:', error);
    res.status(500).json({ error: 'Could not remove that rating.' });
  }
});

module.exports = router;
module.exports.getDoctorReviews = getDoctorReviews;
