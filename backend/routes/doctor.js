const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// GET /api/doctors - Get all doctors (public endpoint for patient discovery)
const getPublicDoctors = async (req, res) => {
  try {
    const { specialization, search } = req.query;

    let query = 'SELECT id, full_name, doctor_id, specialization, hospital FROM users WHERE role = "doctor" AND suspended = 0';
    let params = [];

    if (search && search.trim()) {
      query += ' AND (full_name LIKE ? OR doctor_id LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

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
      `SELECT cr.id, cr.patient_id AS patient_user_id, u.full_name as patient_name, u.patient_id, cr.reason, cr.status, cr.created_at
       FROM consultation_requests cr
       JOIN users u ON cr.patient_id = u.id
       WHERE cr.doctor_id = ? AND cr.status = 'pending' AND cr.requested_by = 'patient'
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

// GET /api/doctor/patients - Patients who have allowed this doctor
router.get('/patients', async (req, res) => {
  try {
    const doctorId = req.user.id;

    // Anyone who said yes belongs here, even before their first visit
    const [patients] = await pool.execute(
      `SELECT u.id, u.full_name, u.patient_id, u.profile_image_url,
              MAX(c.consultation_date) AS last_consultation
       FROM consultation_requests cr
       JOIN users u ON u.id = cr.patient_id
       LEFT JOIN consultations c ON c.patient_id = u.id AND c.doctor_id = cr.doctor_id
       WHERE cr.doctor_id = ? AND cr.status = 'accepted' AND u.role = 'patient'
       GROUP BY u.id, u.full_name, u.patient_id, u.profile_image_url
       ORDER BY (last_consultation IS NULL), last_consultation DESC`,
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
      `SELECT c.id, c.patient_id AS patient_user_id, u.full_name as patient_name, u.patient_id,
              u.profile_image_url, c.consultation_date, c.notes, c.status
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

/**
 * GET /api/doctor/scan/{patient_id}
 * What a doctor sees straight after scanning a code: enough to be sure they
 * have the right person in front of them, and where the connection stands.
 * No records, no contact details, nothing until the patient says yes.
 */
router.get('/scan/:patient_id', async (req, res) => {
  try {
    const doctorId = req.user.id;
    const patientId = String(req.params.patient_id || '').trim().toUpperCase();

    const [[patient]] = await pool.execute(
      `SELECT id, full_name, patient_id, profile_image_url, suspended
       FROM users WHERE patient_id = ? AND role = 'patient'`,
      [patientId],
    );

    if (!patient || patient.suspended) {
      return res.status(404).json({
        error: 'No patient was found with that code. Please check the health ID and try again.',
      });
    }

    const [[link]] = await pool.execute(
      `SELECT id, status, requested_by, reason, created_at
       FROM consultation_requests WHERE patient_id = ? AND doctor_id = ?`,
      [patient.id, doctorId],
    );

    // 'none' means nobody has asked yet, so the doctor can send a request
    let state = 'none';
    if (link) {
      if (link.status === 'accepted' || link.status === 'completed') state = 'connected';
      else if (link.status === 'pending') state = link.requested_by === 'doctor' ? 'waiting' : 'their_request';
      else if (link.status === 'rejected') state = 'refused';
    }

    res.json({
      patient: {
        id: patient.id,
        full_name: patient.full_name,
        patient_id: patient.patient_id,
        profile_image_url: patient.profile_image_url,
      },
      state,
      request: link ? { id: link.id, reason: link.reason, created_at: link.created_at } : null,
    });
  } catch (error) {
    console.error('Error reading scanned code:', error);
    res.status(500).json({ error: 'Could not read that code. Please try again.' });
  }
});

/**
 * POST /api/doctor/access-requests
 * The doctor asks one patient for permission. Nothing opens here: the request
 * waits until that patient approves it in their own account.
 */
router.post('/access-requests', async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { patient_id: patientId, reason } = req.body;

    if (!patientId) return res.status(400).json({ error: 'Please scan a patient code first.' });

    const [[patient]] = await pool.execute(
      `SELECT id, full_name FROM users
       WHERE patient_id = ? AND role = 'patient' AND suspended = 0`,
      [String(patientId).trim().toUpperCase()],
    );
    if (!patient) return res.status(404).json({ error: 'That patient was not found.' });

    const [[link]] = await pool.execute(
      'SELECT id, status FROM consultation_requests WHERE patient_id = ? AND doctor_id = ?',
      [patient.id, doctorId],
    );

    if (link && (link.status === 'accepted' || link.status === 'completed')) {
      return res.status(400).json({ error: 'This patient has already allowed you.' });
    }
    if (link && link.status === 'pending') {
      return res.status(400).json({ error: 'A request is already waiting for their answer.' });
    }

    const note = reason && reason.trim() ? reason.trim().slice(0, 500) : null;

    // One row holds the connection between a doctor and a patient, so a
    // refused request is reused rather than piling up a second row.
    if (link) {
      await pool.execute(
        `UPDATE consultation_requests
         SET status = 'pending', requested_by = 'doctor', reason = ? WHERE id = ?`,
        [note, link.id],
      );
    } else {
      await pool.execute(
        `INSERT INTO consultation_requests (patient_id, doctor_id, reason, requested_by, status)
         VALUES (?, ?, ?, 'doctor', 'pending')`,
        [patient.id, doctorId, note],
      );
    }

    const [[doctor]] = await pool.execute(
      'SELECT full_name, hospital FROM users WHERE id = ?', [doctorId],
    );
    const where = doctor.hospital ? ` at ${doctor.hospital}` : '';
    await pool.execute(
      'INSERT INTO notifications (user_id, type, related_user_id, message) VALUES (?, ?, ?, ?)',
      [
        patient.id, 'consultation_request', doctorId,
        `Dr ${doctor.full_name}${where} scanned your code and is asking to see your records. Open your home page to answer.`,
      ],
    );

    res.status(201).json({ state: 'waiting', patient_name: patient.full_name });
  } catch (error) {
    console.error('Error asking for access:', error);
    res.status(500).json({ error: 'Could not send your request. Please try again.' });
  }
});

// GET /api/doctor/patient/{patient_id} - Get patient details (requires access)
router.get('/patient/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const doctorId = req.user.id;

    // Find user by patient_id. The profile details come from the patients
    // table, and are only sent once the access check below has passed.
    const [users] = await pool.execute(
      `SELECT u.id, u.full_name, u.patient_id, u.email, u.phone, u.profile_image_url,
              p.date_of_birth, p.gender, p.address
       FROM users u
       LEFT JOIN patients p ON p.id = u.id
       WHERE u.patient_id = ? AND u.role = "patient"`,
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

// POST /api/doctor/create-appointment - Doctor creates appointment with a patient
router.post('/create-appointment', async (req, res) => {
  try {
    const { patient_id, appointment_date, notes } = req.body;
    const doctorId = req.user.id;

    if (!patient_id || !appointment_date) {
      return res.status(400).json({ error: 'Patient ID and appointment date are required' });
    }

    // Find the patient by patient_id (BC-YYYY-NNNNN format)
    const [patients] = await pool.execute(
      'SELECT id FROM users WHERE patient_id = ? AND role = "patient"',
      [patient_id]
    );

    if (patients.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientUserId = patients[0].id;

    // Create the appointment (consultation record)
    const [result] = await pool.execute(
      `INSERT INTO consultations (patient_id, doctor_id, consultation_date, notes, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [patientUserId, doctorId, appointment_date, notes || null]
    );

    // Create notification for patient
    const [doctor] = await pool.execute('SELECT full_name FROM users WHERE id = ?', [doctorId]);
    const message = `Dr. ${doctor[0].full_name} scheduled an appointment for ${new Date(appointment_date).toLocaleDateString()}`;

    await pool.execute(
      'INSERT INTO notifications (user_id, type, related_user_id, related_consultation_id, message) VALUES (?, ?, ?, ?, ?)',
      [patientUserId, 'appointment_created', doctorId, result.insertId, message]
    );

    res.status(201).json({
      id: result.insertId,
      patient_id: patientUserId,
      doctor_id: doctorId,
      appointment_date,
      status: 'pending',
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// POST /api/doctor/assign-id - Assign a doctor_id if the doctor doesn't have one
router.post('/assign-id', async (req, res) => {
  try {
    const doctorId = req.user.id;

    const [doctor] = await pool.execute(
      'SELECT doctor_id FROM users WHERE id = ? AND role = "doctor"',
      [doctorId]
    );

    if (doctor.length === 0) {
      return res.status(403).json({ error: 'Only doctors can use this endpoint' });
    }

    // If doctor already has an ID, return it
    if (doctor[0].doctor_id) {
      return res.json({
        message: 'Doctor ID already exists',
        doctor_id: doctor[0].doctor_id
      });
    }

    // Generate new doctor ID
    const year = new Date().getFullYear();
    const prefix = `DR-${year}-`;
    const [rows] = await pool.execute(
      "SELECT doctor_id FROM users WHERE role = 'doctor' AND doctor_id LIKE ? ORDER BY doctor_id DESC LIMIT 1",
      [`${prefix}%`]
    );

    let nextNum = 1;
    if (rows.length > 0 && rows[0].doctor_id) {
      const last = rows[0].doctor_id.split('-')[2];
      nextNum = parseInt(last, 10) + 1;
    }

    const newDoctorId = `${prefix}${String(nextNum).padStart(5, '0')}`;

    // Update the doctor's record
    await pool.execute(
      'UPDATE users SET doctor_id = ? WHERE id = ?',
      [newDoctorId, doctorId]
    );

    res.json({
      message: 'Doctor ID assigned successfully',
      doctor_id: newDoctorId
    });
  } catch (error) {
    console.error('Error assigning doctor ID:', error);
    res.status(500).json({ error: 'Failed to assign doctor ID' });
  }
});

// Export both router and public function
module.exports = router;
module.exports.getPublicDoctors = getPublicDoctors;
