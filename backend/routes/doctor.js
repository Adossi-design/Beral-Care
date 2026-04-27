/**
 * doctor.js — Doctor-only routes.
 * All routes here are protected by verifyToken + requireDoctor in backend-server.js.
 * Doctors can only view patient data if the patient has approved their access request.
 */

const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const doctorUtils = require('../utils/doctor');
const consultationUtils = require('../utils/consultation');

// GET /api/doctor/recent-patients — list recently accessed patients by this doctor
router.get('/recent-patients', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.full_name, u.patient_id, u.email, dpa.updated_at AS last_accessed
       FROM doctor_patient_access dpa
       JOIN users u ON u.id = dpa.patient_user_id
       WHERE dpa.doctor_id = ? AND dpa.status = 'approved'
       ORDER BY dpa.updated_at DESC
       LIMIT 10`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Recent patients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/doctor/profile — get the logged-in doctor's own profile
router.get('/profile', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, full_name, email, phone, role FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Doctor not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Doctor profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Only returns data if doctor has approved access
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check patient exists
    const [users] = await pool.execute(
      'SELECT id, full_name, email, phone, patient_id FROM users WHERE patient_id = ? AND role = ?',
      [patientId, 'patient']
    );
    if (users.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const patient = users[0];

    // Check if this doctor has approved access
    const [access] = await pool.execute(
      "SELECT status FROM doctor_patient_access WHERE doctor_id = ? AND patient_user_id = ? AND status = 'approved'",
      [req.user.id, patient.id]
    );

    if (access.length === 0) {
      // Check if a pending request already exists
      const [pending] = await pool.execute(
        "SELECT status FROM doctor_patient_access WHERE doctor_id = ? AND patient_user_id = ?",
        [req.user.id, patient.id]
      );
      if (pending.length > 0 && pending[0].status === 'pending') {
        return res.status(403).json({ error: 'Access request pending patient approval' });
      }
      if (pending.length > 0 && pending[0].status === 'denied') {
        return res.status(403).json({ error: 'Access denied by patient' });
      }
      // No request yet — create one and notify patient
      await pool.execute(
        'INSERT INTO doctor_patient_access (doctor_id, patient_user_id, status) VALUES (?, ?, ?)',
        [req.user.id, patient.id, 'pending']
      );
      return res.status(403).json({ error: 'Access request sent to patient for approval' });
    }

    // Access approved — return full patient profile and consultations
    const [consultations] = await pool.execute(
      'SELECT * FROM consultations WHERE patient_id = ? ORDER BY consultation_date DESC',
      [patient.id]
    );

    res.json({ patient, consultations });
  } catch (error) {
    console.error('Doctor get patient error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/doctor/appointments — today's appointments for this doctor
router.get('/appointments', async (req, res) => {
  try {
    const consultations = await consultationUtils.getConsultationsByDoctorId(req.user.id);
    res.json(consultations);
  } catch (error) {
    console.error('Doctor appointments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/doctor/create-patient — doctor creates a patient account
router.post('/create-patient', async (req, res) => {
  try {
    const auth = require('../utils/auth');
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !email || !phone || !password)
      return res.status(400).json({ error: 'All fields are required' });

    const user = await auth.registerUser({ full_name, email, phone, password, role: 'patient' });
    res.status(201).json({
      message: 'Patient account created successfully',
      patient_id: user.patient_id,
      user: { id: user.id, full_name: user.full_name, email: user.email, patient_id: user.patient_id },
    });
  } catch (error) {
    console.error('Doctor create patient error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
