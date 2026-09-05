const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function backfillDoctorIds() {
  const conn = await pool.getConnection();
  try {
    console.log('Starting doctor ID backfill...');

    // Get doctors without doctor_id
    const [doctors] = await conn.execute(
      'SELECT id, full_name FROM users WHERE role = "doctor" AND doctor_id IS NULL ORDER BY id ASC'
    );

    if (doctors.length === 0) {
      console.log('All doctors already have doctor IDs');
      return;
    }

    console.log(`Found ${doctors.length} doctors without IDs. Assigning IDs...`);

    for (const doctor of doctors) {
      const year = new Date().getFullYear();
      const prefix = `DR-${year}-`;

      // Get the max number for this year
      const [rows] = await conn.execute(
        "SELECT doctor_id FROM users WHERE role = 'doctor' AND doctor_id LIKE ? ORDER BY doctor_id DESC LIMIT 1",
        [`${prefix}%`]
      );

      let nextNum = 1;
      if (rows.length > 0 && rows[0].doctor_id) {
        const last = rows[0].doctor_id.split('-')[2];
        nextNum = parseInt(last, 10) + 1;
      }

      const doctorId = `${prefix}${String(nextNum).padStart(5, '0')}`;

      // Update the doctor's record
      await conn.execute(
        'UPDATE users SET doctor_id = ? WHERE id = ?',
        [doctorId, doctor.id]
      );

      console.log(`${doctor.full_name} (ID: ${doctor.id}) → ${doctorId}`);
    }

    console.log(`\nSuccessfully assigned doctor IDs to ${doctors.length} doctors`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    conn.release();
    await pool.end();
  }
}

backfillDoctorIds();
