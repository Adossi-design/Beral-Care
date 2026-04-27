/**
 * doctor.js — utility helpers for doctor user lookups.
 * All doctors are stored in the `users` table with role='doctor'.
 */
const pool = require('./db');

const doctorUtils = {
  getAllDoctors: async () => {
    const [rows] = await pool.execute(
      "SELECT id, full_name, email, phone, created_at FROM users WHERE role = 'doctor' ORDER BY created_at DESC"
    );
    return rows;
  },

  getDoctorByUserId: async (id) => {
    const [rows] = await pool.execute(
      "SELECT id, full_name, email, phone, created_at FROM users WHERE id = ? AND role = 'doctor'",
      [id]
    );
    return rows[0] || null;
  },
};

module.exports = doctorUtils;
