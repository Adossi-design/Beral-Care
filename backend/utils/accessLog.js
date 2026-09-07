const pool = require('./db');

/**
 * Writes down every time a doctor reaches into a patient's account, so the
 * patient can check afterwards that their permission was respected. The
 * doctor's name is copied in, so the record still reads properly if that
 * account is later removed.
 *
 * Logging must never break the thing it is recording, so a failure here is
 * written to the server log and swallowed.
 */
const record = async ({ patientId, doctor, action, detail = null }) => {
  try {
    await pool.execute(
      `INSERT INTO record_access_log (patient_id, doctor_id, doctor_name, action, detail)
       VALUES (?, ?, ?, ?, ?)`,
      [patientId, doctor?.id || null, doctor?.name || null, action, detail],
    );
  } catch (error) {
    console.error('Could not write the access log:', error.message);
  }
};

module.exports = { record };
