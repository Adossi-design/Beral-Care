/**
 * patient.js — utility helpers for patient user lookups.
 * All patients are stored in the `users` table with role='patient'.
 */
const pool = require('./db');

const patientUtils = {
  getAllPatients: async () => {
    const [rows] = await pool.execute(
      "SELECT id, full_name, email, phone, patient_id, suspended, created_at FROM users WHERE role = 'patient' ORDER BY created_at DESC"
    );
    return rows;
  },

  getPatientByUserId: async (id) => {
    const [rows] = await pool.execute(
      "SELECT id, full_name, email, phone, patient_id, created_at FROM users WHERE id = ? AND role = 'patient'",
      [id]
    );
    return rows[0] || null;
  },

  getPatientByPatientId: async (patientId) => {
    const [rows] = await pool.execute(
      "SELECT id, full_name, email, phone, patient_id, created_at FROM users WHERE patient_id = ? AND role = 'patient'",
      [patientId]
    );
    return rows[0] || null;
  },
};

module.exports = patientUtils;
