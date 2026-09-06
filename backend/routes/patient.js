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

    // Create request. requested_by says the patient asked, so this waits for
    // the doctor to answer and not the other way round.
    const [result] = await pool.execute(
      `INSERT INTO consultation_requests (patient_id, doctor_id, reason, requested_by, status)
       VALUES (?, ?, ?, 'patient', 'pending')
       ON DUPLICATE KEY UPDATE
         status = 'pending', requested_by = 'patient', reason = VALUES(reason)`,
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

// PATCH /api/patient/consultation-requests/:id - Patient approves or denies a doctor's request
router.patch('/consultation-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;
    const patientId = req.user.id;

    if (!['approved', 'denied'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be "approved" or "denied"' });
    }

    // Map patient decision to the status used by the system
    const newStatus = decision === 'approved' ? 'accepted' : 'rejected';

    // Verify this request belongs to this patient
    const [requests] = await pool.execute(
      'SELECT doctor_id, requested_by, status FROM consultation_requests WHERE id = ? AND patient_id = ?',
      [id, patientId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const doctorId = requests[0].doctor_id;

    // A patient answers a doctor's request. Their own request is for the
    // doctor to answer, so approving it here would let anyone in.
    if (requests[0].requested_by === 'patient' && decision === 'approved') {
      return res.status(400).json({
        error: 'This is your own request. The doctor has to answer it.',
      });
    }

    await pool.execute(
      'UPDATE consultation_requests SET status = ? WHERE id = ?',
      [newStatus, id]
    );

    // Losing the connection ends the records permission with it
    if (decision === 'denied') {
      await pool.execute(
        "UPDATE consultation_requests SET records_status = 'none', records_reason = NULL WHERE id = ?",
        [id],
      );
    }

    // Notify the doctor of the patient decision
    const [patient] = await pool.execute('SELECT full_name FROM users WHERE id = ?', [patientId]);
    const message = decision === 'approved'
      ? `${patient[0].full_name} is now connected with you`
      : `${patient[0].full_name} did not accept your request`;

    await pool.execute(
      'INSERT INTO notifications (user_id, type, related_user_id, message) VALUES (?, ?, ?, ?)',
      [doctorId, `access_${decision}`, patientId, message]
    );

    res.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Error updating consultation request:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

/**
 * PATCH /api/patient/records-requests/:id
 * The second permission, answered by the patient. Allowing it lets that one
 * doctor read their health history. Stopping it closes the history again and
 * leaves the connection in place.
 */
router.patch('/records-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;
    const patientId = req.user.id;

    if (!['approved', 'denied', 'stopped'].includes(decision)) {
      return res.status(400).json({ error: 'Unknown decision.' });
    }

    const [[link]] = await pool.execute(
      `SELECT doctor_id, status, records_status FROM consultation_requests
       WHERE id = ? AND patient_id = ?`,
      [id, patientId],
    );
    if (!link) return res.status(404).json({ error: 'Request not found.' });

    if (decision === 'approved' && link.status !== 'accepted' && link.status !== 'completed') {
      return res.status(400).json({ error: 'Connect with this doctor first.' });
    }

    const next = decision === 'approved' ? 'granted' : decision === 'denied' ? 'refused' : 'none';

    await pool.execute(
      'UPDATE consultation_requests SET records_status = ?, records_reason = NULL WHERE id = ?',
      [next, id],
    );

    const [[patient]] = await pool.execute('SELECT full_name FROM users WHERE id = ?', [patientId]);
    const message = decision === 'approved'
      ? `${patient.full_name} allowed you to see their health records`
      : decision === 'denied'
        ? `${patient.full_name} did not allow you to see their health records`
        : `${patient.full_name} closed their health records`;

    await pool.execute(
      'INSERT INTO notifications (user_id, type, related_user_id, message) VALUES (?, ?, ?, ?)',
      [link.doctor_id, 'records_answer', patientId, message],
    );

    res.json({ records_status: next });
  } catch (error) {
    console.error('Error answering a records request:', error);
    res.status(500).json({ error: 'Could not save your answer.' });
  }
});

// GET /api/patient/consultation-requests - Get request status
router.get('/consultation-requests', async (req, res) => {
  try {
    const patientId = req.user.id;

    const [requests] = await pool.execute(
      `SELECT cr.id, cr.doctor_id, u.full_name as doctor_name, u.specialization, u.hospital,
              u.profile_image_url, cr.reason, cr.requested_by, cr.status,
              cr.records_status, cr.records_reason, cr.created_at, cr.updated_at
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

    // Waiting on the patient: a doctor asking to connect, or one asking to
    // see their health records
    const [pendingRequests] = await pool.execute(
      `SELECT COUNT(*) as count FROM consultation_requests
       WHERE patient_id = ?
         AND ((status = 'pending' AND requested_by = 'doctor') OR records_status = 'pending')`,
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
      `SELECT c.id, c.doctor_id, u.full_name as doctor_name, u.specialization, u.hospital,
              u.profile_image_url, c.consultation_date, c.notes, c.status
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
