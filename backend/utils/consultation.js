const pool = require('./db');
const { sendSms } = require('./twilio');
const { sendEmail } = require('./email');

const consultationUtils = {
  // Get all consultations
  getAllConsultations: async () => {
    try {
      const [rows] = await pool.execute(`
        SELECT c.*, p.full_name as patient_name, d.full_name as doctor_name 
        FROM consultations c
        JOIN patients p ON c.patient_id = p.id
        JOIN doctors d ON c.doctor_id = d.id
      `);
      return rows;
    } catch (error) {
      throw new Error(`Error getting consultations: ${error.message}`);
    }
  },

  // Get consultation by ID
  getConsultationById: async (id) => {
    try {
      const [rows] = await pool.execute(`
        SELECT c.*, p.full_name as patient_name, d.full_name as doctor_name 
        FROM consultations c
        JOIN patients p ON c.patient_id = p.id
        JOIN doctors d ON c.doctor_id = d.id
        WHERE c.id = ?
      `, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting consultation: ${error.message}`);
    }
  },

  // Get consultations by patient ID (patient_id = users.id)
  getConsultationsByPatientId: async (patientId) => {
    try {
      const [rows] = await pool.execute(`
        SELECT c.*, u.full_name as doctor_name
        FROM consultations c
        LEFT JOIN users u ON c.doctor_id = u.id
        WHERE c.patient_id = ?
        ORDER BY c.consultation_date DESC
      `, [patientId]);
      return rows;
    } catch (error) {
      throw new Error(`Error getting consultations by patient ID: ${error.message}`);
    }
  },

  // Get consultations by doctor ID (doctor_id = users.id)
  getConsultationsByDoctorId: async (doctorId) => {
    try {
      const [rows] = await pool.execute(`
        SELECT c.*, u.full_name as patient_name, u.patient_id as patient_hb_id
        FROM consultations c
        LEFT JOIN users u ON c.patient_id = u.id
        WHERE c.doctor_id = ?
        ORDER BY c.consultation_date DESC
      `, [doctorId]);
      return rows;
    } catch (error) {
      throw new Error(`Error getting consultations by doctor ID: ${error.message}`);
    }
  },

  // Create consultation
  createConsultation: async (consultationData) => {
    try {
      const { patient_id, doctor_id, consultation_date, notes, diagnosis, prescription, status } = consultationData;
      const allowedStatuses = ['pending', 'completed', 'cancelled'];
      const resolvedStatus = allowedStatuses.includes(status) ? status : 'pending';
      const [result] = await pool.execute(
        'INSERT INTO consultations (patient_id, doctor_id, consultation_date, notes, diagnosis, prescription, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [patient_id, doctor_id, consultation_date, notes || null, diagnosis || null, prescription || null, resolvedStatus]
      );

      // Send notification (best-effort, never blocks booking)
      try {
        const [[patient]] = await pool.execute('SELECT full_name, phone, email FROM users WHERE id = ?', [patient_id]);
        const [[doctor]]  = await pool.execute('SELECT full_name FROM users WHERE id = ?', [doctor_id]);

        if (patient && doctor) {
          const smsMessage = `Hi ${patient.full_name}. Your appointment with Dr. ${doctor.full_name} on ${consultation_date} is confirmed. Beral Care.`;
          const emailHtml = `<p>Hi ${patient.full_name}, your appointment with Dr. ${doctor.full_name} on ${consultation_date} is confirmed.</p>`;
          if (patient.phone) await sendSms(patient.phone, smsMessage);
          else if (patient.email) await sendEmail(patient.email, 'Appointment Confirmed', smsMessage, emailHtml);
        }
      } catch (notificationError) {
        console.error(`Notification failed: ${notificationError.message}`);
      }

      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating consultation: ${error.message}`);
    }
  },

  // Update consultation
  updateConsultation: async (id, consultationData) => {
    try {
      const { patient_id, doctor_id, consultation_date, notes, diagnosis, prescription } = consultationData;
      const [result] = await pool.execute(
        'UPDATE consultations SET patient_id = ?, doctor_id = ?, consultation_date = ?, notes = ?, diagnosis = ?, prescription = ? WHERE id = ?',
        [patient_id, doctor_id, consultation_date, notes, diagnosis, prescription, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating consultation: ${error.message}`);
    }
  },

  // Delete consultation
  deleteConsultation: async (id) => {
    try {
      const [result] = await pool.execute('DELETE FROM consultations WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting consultation: ${error.message}`);
    }
  }
};

module.exports = consultationUtils;