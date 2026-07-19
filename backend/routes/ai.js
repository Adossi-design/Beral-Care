/**
 * ai.js — AI assistant routes for doctors and patients.
 *
 * POST /api/ai/doctor  — clinical decision support for doctors
 * POST /api/ai/patient — personal health companion for patients
 *
 * Both endpoints are protected by verifyToken and the caller's role guard
 * (requireDoctor / requirePatient) registered in backend-server.js.
 */

const express  = require('express');
const router   = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const pool     = require('../utils/db');
const { requireDoctor, requirePatient } = require('../middleware/roleGuard');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── System prompts ───────────────────────────────────────────────────────────

const DOCTOR_SYSTEM = `You are MedAssist, a clinical decision support AI built into Beral Care — a telemedicine platform serving patients across Africa.

Your role is to support the treating doctor by:
- Suggesting differential diagnoses ranked by likelihood, with short reasoning
- Recommending evidence-based treatment protocols (WHO Africa region guidelines preferred)
- Checking drug interactions, contraindications, and dosage ranges
- Interpreting symptoms, clinical findings, and basic lab values
- Flagging emergency presentations that require immediate escalation
- Keeping the African healthcare context in mind: high burden of malaria, typhoid fever, TB, HIV/AIDS, sickle cell disease, hypertension, and type 2 diabetes; variable resource settings; availability of essential medicines

How you communicate:
1. Be concise and clinically precise. Skip lengthy preambles — the doctor is busy.
2. When a presentation is an emergency, start the reply with 🚨 and state what immediate action is needed.
3. For each recommendation, note the evidence level (WHO guideline, RCT evidence, clinical consensus) in one short phrase.
4. When quoting drug dosages, always include the indication, route, dose, and frequency.
5. End each reply with one line reminding the doctor that final clinical judgment is theirs.

Patient context will be injected automatically when the doctor is viewing a specific patient.`;

const PATIENT_SYSTEM = `You are HealthGuide, a personal health AI companion for patients on Beral Care, a telemedicine platform across Africa.

Your role is to help patients understand their health by:
- Explaining diagnoses and medical terms in simple, everyday language
- Describing what medications do, how to take them, and what side effects to watch for
- Answering health questions in a warm, friendly, and reassuring way
- Helping patients prepare questions before meeting their doctor
- Providing general health education and wellness tips suited to everyday life in Africa
- Empowering patients to take an active role in their own health

How you communicate:
1. Speak simply — never use medical jargon without explaining it right away.
2. Be warm and supportive. Never dismiss a worry as unimportant.
3. For anything that could be serious, say clearly: "Please speak to your doctor about this."
4. Never recommend specific medications or advise a patient to change their dose — that is strictly the doctor's job.
5. Keep answers focused. Use short paragraphs or a short bullet list when that is clearer.
6. End with a short encouragement or a reminder to stay connected with their care team.

The patient's name and recent medical history will be provided as context.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function notConfigured(res) {
  return res.status(503).json({
    error: 'AI assistant is not configured. Add ANTHROPIC_API_KEY to backend/.env to enable this feature.',
  });
}

function sanitize(messages) {
  return messages
    .filter(m => m.role && m.content && typeof m.content === 'string')
    .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content.slice(0, 2000) }));
}

// ─── POST /api/ai/doctor ──────────────────────────────────────────────────────

router.post('/doctor', requireDoctor, async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) return notConfigured(res);

  try {
    const { messages, patient_id } = req.body;
    const doctorId = req.user.id;

    if (!messages || !Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ error: 'messages array is required' });

    let contextBlock = '';

    // Inject patient history only when the doctor has approved access.
    // DB errors are caught silently — the AI still responds without context.
    if (patient_id) {
      try {
        const [access] = await pool.execute(
          'SELECT id FROM consultation_requests WHERE patient_id = ? AND doctor_id = ? AND status = "accepted"',
          [patient_id, doctorId]
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
            [doctorId, patient_id]
          );

          if (rows.length > 0) {
            const name = rows[0].full_name;
            const pid  = rows[0].patient_id;
            const history = rows
              .filter(r => r.consultation_date)
              .map(r => `  • ${r.consultation_date}: Dx: ${r.diagnosis || '—'} | Rx: ${r.prescription || '—'}${r.notes ? ` | Notes: ${r.notes}` : ''}`)
              .join('\n');

            contextBlock = `\n\n--- ACTIVE PATIENT: ${name} (${pid}) ---\nYour consultation history with this patient:\n${history || '  No previous consultations on record'}\n--- END PATIENT CONTEXT ---`;
          }
        }
      } catch (dbErr) {
        console.warn('Patient context unavailable (DB):', dbErr.message);
      }
    }

    const response = await client.messages.create({
      model:      process.env.ANTHROPIC_MODEL,
      max_tokens: 1024,
      system:     DOCTOR_SYSTEM + contextBlock,
      messages:   sanitize(messages),
    });

    res.json({ reply: response.content[0].text });
  } catch (error) {
    console.error('Doctor AI error:', error.message);
    res.status(500).json({ error: 'AI assistant is currently unavailable. Please try again.' });
  }
});

// ─── POST /api/ai/patient ─────────────────────────────────────────────────────

router.post('/patient', requirePatient, async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) return notConfigured(res);

  try {
    const { messages } = req.body;
    const patientId = req.user.id;

    if (!messages || !Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ error: 'messages array is required' });

    // Load patient's name and medical history for context.
    // DB errors are caught silently — the AI still responds without context.
    let contextBlock = '';
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
        [patientId]
      );

      contextBlock = user ? `\n\nYou are speaking with ${user.full_name}.` : '';

      if (consultations.length > 0) {
        contextBlock += '\n\nTheir recent medical history:\n';
        consultations.forEach(c => {
          contextBlock += `  • ${c.consultation_date} — Dr. ${c.doctor_name}${c.specialization ? ` (${c.specialization})` : ''}: ${c.diagnosis ? `Diagnosis: ${c.diagnosis}.` : ''} ${c.prescription ? `Prescription: ${c.prescription}.` : ''}\n`;
        });
      } else {
        contextBlock += '\n\nNo medical history on file yet.';
      }
    } catch (dbErr) {
      console.warn('Patient context unavailable (DB):', dbErr.message);
    }

    const response = await client.messages.create({
      model:      process.env.ANTHROPIC_MODEL,
      max_tokens: 1024,
      system:     PATIENT_SYSTEM + contextBlock,
      messages:   sanitize(messages),
    });

    res.json({ reply: response.content[0].text });
  } catch (error) {
    console.error('Patient AI error:', error.message);
    res.status(500).json({ error: 'AI assistant is currently unavailable. Please try again.' });
  }
});

module.exports = router;
