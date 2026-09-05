/**
 * AI assistant routes.
 *
 *   POST /api/ai/doctor  — clinical decision support (MedAssist)
 *   POST /api/ai/patient — plain-language health companion (HealthGuide)
 *   GET  /api/ai/status  — which provider is active, for diagnostics
 *
 * Both POST routes are protected by verifyToken plus the caller's role guard,
 * registered in backend-server.js.
 *
 * These handlers know nothing about which model answers. They assemble context
 * and a system prompt, then hand off to utils/ai, which resolves the provider
 * from the environment.
 */

const express = require('express');

const router = express.Router();
const pool = require('../utils/db');
const { requireDoctor, requirePatient } = require('../middleware/roleGuard');
const ai = require('../utils/ai');
const { DOCTOR_SYSTEM, PATIENT_SYSTEM } = require('../utils/ai/prompts');

/** Shared failure handling so both routes report problems the same way. */
function fail(res, error, label) {
  console.error(`${label} error:`, error.message);

  if (error.code === 'AI_NOT_CONFIGURED') {
    return res.status(503).json({ error: error.message });
  }
  // 429 from a provider is a quota problem, which is worth distinguishing from
  // a generic outage — it tells the operator to check their plan, not the logs.
  if (error.status === 429) {
    return res.status(429).json({
      error: 'The assistant has reached its rate limit. Please try again shortly.',
    });
  }
  return res.status(502).json({
    error: 'The assistant is unavailable right now. Please try again.',
  });
}

function badRequest(res) {
  return res.status(400).json({ error: 'A non-empty messages array is required.' });
}

// ─── GET /api/ai/status ──────────────────────────────────────────────────────

router.get('/status', (req, res) => res.json(ai.describe()));

// ─── POST /api/ai/doctor ─────────────────────────────────────────────────────

router.post('/doctor', requireDoctor, async (req, res) => {
  const messages = ai.sanitizeMessages(req.body?.messages);
  if (messages.length === 0) return badRequest(res);

  const doctorId = req.user.id;
  const { patient_id: patientId } = req.body;
  let context = '';

  // Patient context is injected only after the server confirms the patient
  // approved this clinician. The access check lives here, not in the client.
  if (patientId) {
    try {
      const [access] = await pool.execute(
        'SELECT id FROM consultation_requests WHERE patient_id = ? AND doctor_id = ? AND status = "accepted"',
        [patientId, doctorId],
      );

      if (access.length > 0) {
        const [rows] = await pool.execute(
          `SELECT u.full_name, u.patient_id,
                  c.consultation_date, c.diagnosis, c.prescription, c.notes
           FROM users u
           LEFT JOIN consultations c ON c.patient_id = u.id AND c.doctor_id = ?
           WHERE u.id = ? AND u.role = 'patient'
           ORDER BY c.consultation_date DESC
           LIMIT 10`,
          [doctorId, patientId],
        );

        if (rows.length > 0) {
          const history = rows
            .filter((r) => r.consultation_date)
            .map((r) => `  - ${r.consultation_date}: Dx: ${r.diagnosis || '—'} | Rx: ${r.prescription || '—'}`
              + `${r.notes ? ` | Notes: ${r.notes}` : ''}`)
            .join('\n');

          context = `\n\n--- ACTIVE PATIENT: ${rows[0].full_name} (${rows[0].patient_id}) ---\n`
            + `Consultation history with you:\n${history || '  No previous consultations on record'}\n`
            + '--- END PATIENT CONTEXT ---';
        }
      }
    } catch (dbErr) {
      // Context is an enhancement; the assistant is still useful without it.
      console.warn('Patient context unavailable:', dbErr.message);
    }
  }

  try {
    const reply = await ai.ask({ system: DOCTOR_SYSTEM + context, messages });
    res.json({ reply, provider: ai.describe().provider });
  } catch (error) {
    fail(res, error, 'MedAssist');
  }
});

// ─── POST /api/ai/patient ────────────────────────────────────────────────────

router.post('/patient', requirePatient, async (req, res) => {
  const messages = ai.sanitizeMessages(req.body?.messages);
  if (messages.length === 0) return badRequest(res);

  const patientId = req.user.id;
  let context = '';

  try {
    const [[user]] = await pool.execute('SELECT full_name FROM users WHERE id = ?', [patientId]);
    const [consultations] = await pool.execute(
      `SELECT c.consultation_date, u.full_name AS doctor_name, u.specialization,
              c.diagnosis, c.prescription
       FROM consultations c
       JOIN users u ON c.doctor_id = u.id
       WHERE c.patient_id = ?
       ORDER BY c.consultation_date DESC
       LIMIT 8`,
      [patientId],
    );

    context = user ? `\n\nYou are speaking with ${user.full_name}.` : '';

    if (consultations.length > 0) {
      context += '\n\nTheir recent medical history:\n';
      context += consultations
        .map((c) => `  - ${c.consultation_date} with ${c.doctor_name}`
          + `${c.specialization ? ` (${c.specialization})` : ''}: `
          + `${c.diagnosis ? `Diagnosis: ${c.diagnosis}. ` : ''}`
          + `${c.prescription ? `Prescription: ${c.prescription}.` : ''}`)
        .join('\n');
    } else {
      context += '\n\nThey have no medical history on file yet.';
    }
  } catch (dbErr) {
    console.warn('Patient context unavailable:', dbErr.message);
  }

  try {
    const reply = await ai.ask({ system: PATIENT_SYSTEM + context, messages });
    res.json({ reply, provider: ai.describe().provider });
  } catch (error) {
    fail(res, error, 'HealthGuide');
  }
});

module.exports = router;
