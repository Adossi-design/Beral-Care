const pool = require('../utils/db');

async function runMigration() {
  try {
    console.log('Starting database migration...\n');

    // 1. Add missing columns to users table
    console.log('Updating users table...');
    const columnsToAdd = [
      { name: 'specialization', type: 'VARCHAR(100)', check: 'specialization' },
      { name: 'hospital', type: 'VARCHAR(200)', check: 'hospital' },
      { name: 'google_id', type: 'VARCHAR(255) UNIQUE', check: 'google_id' },
      { name: 'patient_id', type: 'VARCHAR(20) UNIQUE', check: 'patient_id' },
      { name: 'suspended', type: 'TINYINT(1) DEFAULT 0', check: 'suspended' },
      { name: 'updated_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', check: 'updated_at' }
    ];

    for (const col of columnsToAdd) {
      try {
        const [columns] = await pool.execute(
          "SELECT COUNT(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = ?",
          [col.check]
        );
        
        if (columns[0].count === 0) {
          await pool.execute(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
          console.log(`Added column: ${col.name}`);
        } else {
          console.log(`Column already exists: ${col.name}`);
        }
      } catch (e) {
        console.log(`Column already exists or skipped: ${col.name}`);
      }
    }

    // 2. Create consultation_requests table
    console.log('\nCreating consultation_requests table...');
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS consultation_requests (
          id INT PRIMARY KEY AUTO_INCREMENT,
          patient_id INT NOT NULL,
          doctor_id INT NOT NULL,
          reason TEXT,
          status ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_request (patient_id, doctor_id),
          INDEX idx_patient_id (patient_id),
          INDEX idx_doctor_id (doctor_id),
          INDEX idx_status (status)
        )
      `);
      console.log('consultation_requests table created');
    } catch (e) {
      console.log('consultation_requests table already exists');
    }

    // 3. Create notifications table
    console.log('Creating notifications table...');
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          type ENUM('consultation_request', 'consultation_accepted', 'consultation_rejected', 'consultation_created') NOT NULL,
          related_user_id INT,
          related_consultation_id INT,
          message TEXT NOT NULL,
          is_read TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (related_consultation_id) REFERENCES consultations(id) ON DELETE SET NULL,
          INDEX idx_user_id (user_id),
          INDEX idx_is_read (is_read)
        )
      `);
      console.log('notifications table created');
    } catch (e) {
      console.log('notifications table already exists');
    }

    // 4. Update consultations table to include request_id
    console.log('Updating consultations table...');
    try {
      const [columns] = await pool.execute(
        "SELECT COUNT(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultations' AND COLUMN_NAME = 'request_id'"
      );
      
      if (columns[0].count === 0) {
        await pool.execute(`
          ALTER TABLE consultations 
          ADD COLUMN request_id INT,
          ADD FOREIGN KEY (request_id) REFERENCES consultation_requests(id) ON DELETE SET NULL
        `);
        console.log('Added request_id to consultations');
      } else {
        console.log('request_id already exists in consultations');
      }
    } catch (e) {
      console.log('request_id already exists or skipped');
    }

    // 5. Add indexes to consultations
    console.log('Adding indexes to consultations...');
    try {
      await pool.execute('ALTER TABLE consultations ADD INDEX idx_patient_id (patient_id)');
      console.log('Added index on patient_id');
    } catch (e) {
      console.log('Index already exists');
    }

    try {
      await pool.execute('ALTER TABLE consultations ADD INDEX idx_doctor_id (doctor_id)');
      console.log('Added index on doctor_id');
    } catch (e) {
      console.log('Index already exists');
    }

    console.log('\nDatabase migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
