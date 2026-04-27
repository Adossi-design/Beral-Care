/**
 * patient.js — Patient-only routes.
 * All routes here are protected by verifyToken + requirePatient in backend-server.js.
 * Patients manage their own profile, appointments, and doctor access requests.
 */

const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const consultationUtils = require('../utils/consultation');

// GET /api/patient/notifications — all access requests (all statuses) for this patient
router.get('/notifications', async (req, res) => {
  try {
    const [requests] = await pool.execute(
      `SELECT dpa.id, dpa.status, dpa.created_at, dpa.updated_at,
              u.full_name AS doctor_name, u.email AS doctor_email
       FROM doctor_patient_access dpa
       JOIN users u ON u.id = dpa.doctor_id
       WHERE dpa.patient_user_id = ?
       ORDER BY dpa.created_at DESC`,
      [req.user.id]
    );
    res.json(requests);
  } catch (error) {
    console.error('Patient notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/patient/history — get this patient's medical history summary
router.get('/history', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, consultation_date, diagnosis, prescription, notes, status
       FROM consultations WHERE patient_id = ?
       ORDER BY consultation_date DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Patient history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/patient/profile — get the logged-in patient's own profile
router.get('/profile', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, full_name, email, phone, role, patient_id, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Patient profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/patient/appointments — get this patient's consultations
router.get('/appointments', async (req, res) => {
  try {
    const consultations = await consultationUtils.getConsultationsByPatientId(req.user.id);
    res.json(consultations);
  } catch (error) {
    console.error('Patient appointments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/patient/appointments — book a new appointment
router.post('/appointments', async (req, res) => {
  try {
    const consultationId = await consultationUtils.createConsultation({
      ...req.body,
      patient_id: req.user.id,
    });
    res.status(201).json({ id: consultationId, message: 'Appointment booked successfully' });
  } catch (error) {
    console.error('Patient book appointment error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/patient/access-requests — list pending doctor access requests
router.get('/access-requests', async (req, res) => {
  try {
    const [requests] = await pool.execute(
      `SELECT dpa.id, dpa.status, dpa.created_at,
              u.full_name AS doctor_name, u.email AS doctor_email
       FROM doctor_patient_access dpa
       JOIN users u ON u.id = dpa.doctor_id
       WHERE dpa.patient_user_id = ? AND dpa.status = 'pending'
       ORDER BY dpa.created_at DESC`,
      [req.user.id]
    );
    res.json(requests);
  } catch (error) {
    console.error('Patient access requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/patient/access-requests/:id — approve or deny a doctor access request
router.patch('/access-requests/:id', async (req, res) => {
  try {
    const { decision } = req.body; // 'approved' or 'denied'
    if (!['approved', 'denied'].includes(decision))
      return res.status(400).json({ error: "Decision must be 'approved' or 'denied'" });

    const [result] = await pool.execute(
      'UPDATE doctor_patient_access SET status = ? WHERE id = ? AND patient_user_id = ?',
      [decision, req.params.id, req.user.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Access request not found' });

    res.json({ message: `Access ${decision} successfully` });
  } catch (error) {
    console.error('Patient access decision error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
