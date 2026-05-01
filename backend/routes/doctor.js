const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// GET /api/doctors - Get all doctors (public endpoint for patient discovery)
const getPublicDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;

    let query = 'SELECT id, full_name, specialization, hospital FROM users WHERE role = "doctor" AND suspended = 0';
    let params = [];

    if (specialization && specialization.trim()) {
      query += ' AND specialization = ?';
      params.push(specialization);
    }

    query += ' ORDER BY full_name ASC';

    const [doctors] = await pool.execute(query, params);
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

// GET /api/doctor/requests - Get incoming consultation requests
router.get('/requests', async (req, res) => {
  try {
    const doctorId = req.user.id;

    const [requests] = await pool.execute(
      `SELECT cr.id, cr.patient_id, u.full_name as patient_name, u.patient_id, cr.reason, cr.status, cr.created_at
       FROM consultation_requests cr
       JOIN users u ON cr.patient_id = u.id
       WHERE cr.doctor_id = ? AND cr.status = 'pending'
       ORDER BY cr.created_at DESC`,
      [doctorId]
    );

    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// PATCH /api/doctor/requests/{id} - Accept or reject consultation request
router.patch('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const doctorId = req.user.id;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify request belongs to this doctor
    const [requests] = await pool.execute(
      'SELECT patient_id FROM consultation_requests WHERE id = ? AND doctor_id = ?',
      [id, doctorId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const patientId = requests[0].patient_id;

    // Update request status
    await pool.execute(
      'UPDATE consultation_requests SET status = ? WHERE id = ?',
      [status, id]
    );

    // Create notification for patient
    const [doctor] = await pool.execute('SELECT full_name FROM users WHERE id = ?', [doctorId]);
    const message = status === 'accepted' 
      ? `Dr. ${doctor[0].full_name} accepted your consultation request` 
      : `Dr. ${doctor[0].full_name} rejected your consultation request`;

    await pool.execute(
      'INSERT INTO notifications (user_id, type, related_user_id, message) VALUES (?, ?, ?, ?)',
      [patientId, `consultation_${status}`, doctorId, message]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// POST /api/doctor/consultations - Create consultation record
router.post('/consultations', async (req, res) => {
  try {
    const { patient_id, request_id, consultation_date, notes, diagnosis, prescription } = req.body;
    const doctorId = req.user.id;

    // Validation
    if (!patient_id || !consultation_date || !diagnosis || !prescription) {
      return res.status(400).json({ error: 'Patient ID, date, diagnosis, and prescription are required' });
    }

    // Verify doctor has accepted request from this patient
    const [requests] = await pool.execute(
      'SELECT id FROM consultation_requests WHERE patient_id = ? AND doctor_id = ? AND status = "accepted"',
      [patient_id, doctorId]
    );

    if (requests.length === 0) {
      return res.status(403).json({ error: 'No accepted request from this patient' });
    }

    // Create consultation
    const [result] = await pool.execute(
      `INSERT INTO consultations (patient_id, doctor_id, request_id, consultation_date, notes, diagnosis, prescription, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')`,
      [patient_id, doctorId, request_id || null, consultation_date, notes || null, diagnosis, prescription]
    );

    // Update request status to completed
    if (request_id) {
      await pool.execute(
        'UPDATE consultation_requests SET status = "completed" WHERE id = ?',
        [request_id]
      );
    }

    // Create notification for patient
    const [doctor] = await pool.execute('SELECT full_name FROM users WHERE id = ?', [doctorId]);
    const message = `Dr. ${doctor[0].full_name} created a consultation record`;

    await pool.execute(
      'INSERT INTO notifications (user_id, type, related_user_id, related_consultation_id, message) VALUES (?, ?, ?, ?, ?)',
      [patient_id, 'consultation_created', doctorId, result.insertId, message]
    );

    res.status(201).json({
      id: result.insertId,
      patient_id,
      doctor_id: doctorId,
      diagnosis,
      prescription,
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error creating consultation:', error);
    res.status(500).json({ error: 'Failed to create consultation' });
  }
});

// GET /api/doctor/patients - Get list of patients doctor has consulted
router.get('/patients', async (req, res) => {
  try {
    const doctorId = req.user.id;

    const [patients] = await pool.execute(
      `SELECT DISTINCT u.id, u.full_name, u.patient_id, MAX(c.consultation_date) as last_consultation
       FROM users u
       JOIN consultations c ON u.id = c.patient_id
       WHERE c.doctor_id = ? AND u.role = 'patient'
       GROUP BY u.id
       ORDER BY last_consultation DESC`,
      [doctorId]
    );

    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /api/doctor/appointments - Get doctor's appointments
router.get('/appointments', async (req, res) => {
  try {
    const doctorId = req.user.id;

    const [appointments] = await pool.execute(
      `SELECT c.id, c.patient_id, u.full_name as patient_name, u.patient_id, c.consultation_date, c.notes, c.status
       FROM consultations c
       JOIN users u ON c.patient_id = u.id
       WHERE c.doctor_id = ?
       ORDER BY c.consultation_date DESC`,
      [doctorId]
    );

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/doctor/recent-patients - Get recently accessed patients
router.get('/recent-patients', async (req, res) => {
  try {
    const doctorId = req.user.id;

    const [patients] = await pool.execute(
      `SELECT DISTINCT u.id, u.full_name, u.patient_id, MAX(c.consultation_date) as last_consultation
       FROM users u
       JOIN consultations c ON u.id = c.patient_id
       WHERE c.doctor_id = ? AND u.role = 'patient'
       GROUP BY u.id
       ORDER BY last_consultation DESC
       LIMIT 10`,
      [doctorId]
    );

    res.json(patients);
  } catch (error) {
    console.error('Error fetching recent patients:', error);
    res.status(500).json({ error: 'Failed to fetch recent patients' });
  }
});

// GET /api/doctor/patient/{patient_id} - Get patient details (requires access)
router.get('/patient/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const doctorId = req.user.id;

    // Find user by patient_id
    const [users] = await pool.execute(
      'SELECT id, full_name, patient_id, email, phone FROM users WHERE patient_id = ? AND role = "patient"',
      [patient_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientUserId = users[0].id;

    // Check if doctor has access
    const [access] = await pool.execute(
      'SELECT id FROM consultation_requests WHERE patient_id = ? AND doctor_id = ? AND status = "accepted"',
      [patientUserId, doctorId]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: 'No access to this patient. Patient must approve your request first.' });
    }

    // Get patient consultations
    const [consultations] = await pool.execute(
      `SELECT id, consultation_date, diagnosis, prescription, notes, status
       FROM consultations
       WHERE patient_id = ? AND doctor_id = ?
       ORDER BY consultation_date DESC`,
      [patientUserId, doctorId]
    );

    res.json({
      ...users[0],
      consultations
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// GET /api/doctor/patients/{patient_id}/consultations - Get patient's consultation history
router.get('/patients/:patient_id/consultations', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const doctorId = req.user.id;

    // Verify doctor has accepted request from this patient
    const [access] = await pool.execute(
      'SELECT id FROM consultation_requests WHERE patient_id = ? AND doctor_id = ? AND status = "accepted"',
      [patient_id, doctorId]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: 'No access to this patient' });
    }

    // Get consultations
    const [consultations] = await pool.execute(
      `SELECT c.id, c.consultation_date, c.diagnosis, c.prescription, c.notes, c.status
       FROM consultations c
       WHERE c.patient_id = ? AND c.doctor_id = ?
       ORDER BY c.consultation_date DESC`,
      [patient_id, doctorId]
    );

    res.json(consultations);
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

// Export both router and public function
module.exports = router;
module.exports.getPublicDoctors = getPublicDoctors;
