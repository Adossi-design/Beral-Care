const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// POST /api/patient/consultation-requests - Request consultation from doctor
router.post('/consultation-requests', async (req, res) => {
  try {
    const { doctor_id, reason } = req.body;
    const patientId = req.user.id;

    if (!doctor_id) {
      return res.status(400).json({ error: 'Doctor ID required' });
    }

    // Check if request already exists
    const [existing] = await pool.execute(
      'SELECT id FROM consultation_requests WHERE patient_id = ? AND doctor_id = ? AND status IN ("pending", "accepted")',
      [patientId, doctor_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Request already exists with this doctor' });
    }

    // Create request
    const [result] = await pool.execute(
      'INSERT INTO consultation_requests (patient_id, doctor_id, reason, status) VALUES (?, ?, ?, "pending")',
      [patientId, doctor_id, reason || null]
    );

    // Create notification for doctor
    const [patient] = await pool.execute('SELECT full_name FROM users WHERE id = ?', [patientId]);
    const message = `${patient[0].full_name} requested a consultation`;

    await pool.execute(
      'INSERT INTO notifications (user_id, type, related_user_id, message) VALUES (?, ?, ?, ?)',
      [doctor_id, 'consultation_request', patientId, message]
    );

    res.status(201).json({
      id: result.insertId,
      doctor_id,
      status: 'pending',
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// GET /api/patient/consultation-requests - Get request status
router.get('/consultation-requests', async (req, res) => {
  try {
    const patientId = req.user.id;

    const [requests] = await pool.execute(
      `SELECT cr.id, cr.doctor_id, u.full_name as doctor_name, u.specialization, cr.status, cr.created_at
       FROM consultation_requests cr
       JOIN users u ON cr.doctor_id = u.id
       WHERE cr.patient_id = ?
       ORDER BY cr.created_at DESC`,
      [patientId]
    );

    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /api/patient/consultations - Get medical history
router.get('/consultations', async (req, res) => {
  try {
    const patientId = req.user.id;

    const [consultations] = await pool.execute(
      `SELECT c.id, c.doctor_id, u.full_name as doctor_name, u.specialization, c.consultation_date, c.diagnosis, c.prescription, c.notes, c.status
       FROM consultations c
       JOIN users u ON c.doctor_id = u.id
       WHERE c.patient_id = ?
       ORDER BY c.consultation_date DESC`,
      [patientId]
    );

    res.json(consultations);
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

// GET /api/patient/notifications - Get notifications
router.get('/notifications', async (req, res) => {
  try {
    const patientId = req.user.id;

    const [notifications] = await pool.execute(
      `SELECT n.id, n.type, n.message, u.full_name as related_user_name, n.is_read, n.created_at
       FROM notifications n
       LEFT JOIN users u ON n.related_user_id = u.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [patientId]
    );

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/patient/notifications/{id} - Mark as read
router.patch('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.user.id;

    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, patientId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// GET /api/patient/dashboard - Get dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const patientId = req.user.id;

    // Get pending requests
    const [pendingRequests] = await pool.execute(
      `SELECT COUNT(*) as count FROM consultation_requests 
       WHERE patient_id = ? AND status = 'pending'`,
      [patientId]
    );

    // Get unread notifications
    const [unreadNotifications] = await pool.execute(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [patientId]
    );

    // Get consultation summary
    const [consultationSummary] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN diagnosis IS NOT NULL THEN 1 ELSE 0 END) as with_diagnosis,
        SUM(CASE WHEN prescription IS NOT NULL THEN 1 ELSE 0 END) as with_prescription
       FROM consultations WHERE patient_id = ?`,
      [patientId]
    );

    // Get recent consultations
    const [recentConsultations] = await pool.execute(
      `SELECT c.id, u.full_name as doctor_name, c.consultation_date, c.diagnosis, c.prescription
       FROM consultations c
       JOIN users u ON c.doctor_id = u.id
       WHERE c.patient_id = ?
       ORDER BY c.consultation_date DESC
       LIMIT 5`,
      [patientId]
    );

    res.json({
      pending_requests: pendingRequests[0].count,
      unread_notifications: unreadNotifications[0].count,
      consultation_summary: consultationSummary[0],
      recent_consultations: recentConsultations
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// GET /api/patient/appointments - Get patient's appointments
router.get('/appointments', async (req, res) => {
  try {
    const patientId = req.user.id;

    const [appointments] = await pool.execute(
      `SELECT c.id, c.doctor_id, u.full_name as doctor_name, u.specialization, c.consultation_date, c.notes, c.status
       FROM consultations c
       JOIN users u ON c.doctor_id = u.id
       WHERE c.patient_id = ?
       ORDER BY c.consultation_date DESC`,
      [patientId]
    );

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/patient/doctors - Get all available doctors for booking
router.get('/doctors', async (req, res) => {
  try {
    const [doctors] = await pool.execute(
      `SELECT id, full_name, specialization, hospital, profile_image_url
       FROM users
       WHERE role = 'doctor' AND suspended = 0
       ORDER BY full_name ASC`
    );

    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// POST /api/patient/appointments - Book appointment with doctor
router.post('/appointments', async (req, res) => {
  try {
    const { doctor_id, consultation_date, notes, status } = req.body;
    const patientId = req.user.id;

    if (!doctor_id || !consultation_date) {
      return res.status(400).json({ error: 'Doctor ID and consultation date are required' });
    }

    // Create consultation record
    const [result] = await pool.execute(
      `INSERT INTO consultations (patient_id, doctor_id, consultation_date, notes, status)
       VALUES (?, ?, ?, ?, ?)`,
      [patientId, doctor_id, consultation_date, notes || null, status || 'pending']
    );

    res.status(201).json({
      id: result.insertId,
      doctor_id,
      consultation_date,
      status: status || 'pending',
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

module.exports = router;
