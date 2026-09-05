const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const rateLimit = require('express-rate-limit');

// Load .env manually so the values are never transformed by dotenvx.
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  });
}

const { verifyToken, requireAdmin, requireDoctor, requirePatient } = require('./middleware/roleGuard');
const authRoutes    = require('./routes/auth');
const adminRoutes   = require('./routes/admin');
const doctorRoutes  = require('./routes/doctor');
const patientRoutes = require('./routes/patient');
const profileRoutes = require('./routes/profile');
const aiRoutes      = require('./routes/ai');

const pool = require('./utils/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Behind a hosting proxy (Render), the client IP arrives in X-Forwarded-For.
// Without this, express-rate-limit sees every request as coming from the proxy
// and cannot tell callers apart, which defeats the brute-force protection on
// the auth routes. Trust exactly one hop — the platform load balancer.
app.set('trust proxy', 1);

// CORS: allow the mobile app origin and localhost during development
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:19006')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting on auth routes: max 20 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting on AI routes: max 30 messages per minute per user
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many AI requests. Please wait a moment before sending another message.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(fileUpload());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => res.json({ message: 'Beral Care API is running' }));

// Public — no token required
app.use('/api/auth', authLimiter, authRoutes);
const doctorRoutesPublic = require('./routes/doctor');
app.get('/api/doctors', doctorRoutesPublic.getPublicDoctors);

// Protected — token + role required
// All role checks are enforced server-side here, never rely on frontend alone
app.use('/api/profile', verifyToken,                    profileRoutes);
app.use('/api/admin',   verifyToken, requireAdmin,       adminRoutes);
app.use('/api/doctor',  verifyToken, requireDoctor,      doctorRoutes);
app.use('/api/patient', verifyToken, requirePatient,     patientRoutes);
app.use('/api/ai',      aiLimiter,   verifyToken,        aiRoutes);

// Database setup — run once after deployment, then disable or protect this endpoint
app.get('/setup-db', async (req, res) => {
  // Simple protection: check for a setup key in environment
  const setupKey = process.env.DB_SETUP_KEY;
  const providedKey = req.query.key;
  
  if (setupKey && setupKey !== providedKey) {
    return res.status(403).json({ error: 'Unauthorized: Invalid setup key' });
  }
  
  try {
    const shouldSeed = String(process.env.DB_SEED_SAMPLE_DATA || 'false').toLowerCase() === 'true';

    const setupSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(200) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('patient', 'doctor', 'admin') DEFAULT 'patient',
        patient_id VARCHAR(20) UNIQUE DEFAULT NULL,
        doctor_id VARCHAR(20) UNIQUE DEFAULT NULL,
        specialization VARCHAR(100),
        hospital VARCHAR(200),
        profile_image_url VARCHAR(500),
        email_verified TINYINT(1) DEFAULT 0,
        phone_verified TINYINT(1) DEFAULT 0,
        suspended TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS patients (
        id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(200) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(15),
        contact_info VARCHAR(200),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS doctors (
        id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(100) NOT NULL,
        specialty VARCHAR(50) NOT NULL,
        license_number VARCHAR(50) UNIQUE NOT NULL,
        contact_info VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS consultations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        request_id INT DEFAULT NULL,
        consultation_date DATE NOT NULL,
        notes TEXT,
        diagnosis TEXT,
        prescription TEXT,
        status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS consultation_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        reason TEXT,
        status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_request (patient_id, doctor_id),
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        type VARCHAR(50),
        related_user_id INT,
        related_consultation_id INT,
        message TEXT,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (related_consultation_id) REFERENCES consultations(id) ON DELETE SET NULL
      );
    `;

    const sampleDataSQL = `
      INSERT IGNORE INTO doctors (id, full_name, specialty, license_number, contact_info) VALUES
        (1, 'Dr. Primary Care', 'General Practice', 'MD000', 'doctor1@example.com'),
        (2, 'Dr. Cardio Team', 'Cardiology', 'MD001', 'doctor2@example.com'),
        (3, 'Dr. Pediatrics Team', 'Pediatrics', 'MD002', 'doctor3@example.com');

      INSERT IGNORE INTO patients (full_name, date_of_birth, gender, contact_info, address) VALUES
        ('Sample Patient One', '1985-03-15', 'Male', 'patient1@example.com', 'Sample Address 1'),
        ('Sample Patient Two', '1965-07-22', 'Female', 'patient2@example.com', 'Sample Address 2'),
        ('Sample Patient Three', '1998-11-03', 'Male', 'patient3@example.com', 'Sample Address 3');

      INSERT IGNORE INTO consultations (patient_id, doctor_id, consultation_date, notes, diagnosis, status) VALUES
        (1, 1, '2024-07-20', 'Patient complained of chest pain', 'Mild angina', 'completed'),
        (2, 2, '2024-07-21', 'Regular checkup', 'Healthy', 'completed'),
        (3, 3, '2024-07-22', 'Child vaccination', 'Vaccination completed', 'completed');
    `;

    for (const stmt of setupSQL.split(';').filter(s => s.trim()))
      await pool.query(stmt);

    // Add doctor_id column if it does not exist yet (safe to run on existing databases).
    // MySQL has no ADD COLUMN IF NOT EXISTS, so check information_schema first.
    const [[{ has_doctor_id }]] = await pool.query(
      `SELECT COUNT(*) AS has_doctor_id FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'doctor_id'`
    );
    if (!has_doctor_id) {
      await pool.query('ALTER TABLE users ADD COLUMN doctor_id VARCHAR(20) UNIQUE DEFAULT NULL');
    }

    if (shouldSeed)
      for (const stmt of sampleDataSQL.split(';').filter(s => s.trim()))
        await pool.query(stmt);

    res.json({
      message: 'Database setup completed successfully!',
      tables_created: ['users', 'patients', 'doctors', 'consultations', 'consultation_requests', 'notifications'],
      sample_data: shouldSeed ? 'Sample records inserted' : 'Skipped (set DB_SEED_SAMPLE_DATA=true to enable)',
    });
  } catch (error) {
    console.error('Database setup error:', error);
    res.status(500).json({ error: 'Database setup failed', details: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Beral Care API running on port ${PORT}`);
});

module.exports = app;
