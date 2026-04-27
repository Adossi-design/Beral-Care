const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const JWT_TOKEN = process.env.JWT_TOKEN;

// Generate unique patient ID in format BC-YYYY-NNNNN
const generatePatientId = async () => {
  const year = new Date().getFullYear();
  const prefix = `BC-${year}-`;
  const [rows] = await pool.execute(
    "SELECT patient_id FROM users WHERE patient_id LIKE ? ORDER BY patient_id DESC LIMIT 1",
    [`${prefix}%`]
  );
  let nextNum = 1;
  if (rows.length > 0) {
    const last = rows[0].patient_id.split('-')[2];
    nextNum = parseInt(last, 10) + 1;
  }
  return `${prefix}${String(nextNum).padStart(5, '0')}`;
};

const auth = {
  hashPassword: async (password) => {
    return await bcrypt.hash(password, 10);
  },

  comparePassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // JWT includes id, email, role, name, patient_id — expires in 24h
  generateToken: (user) => {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.full_name,
        patient_id: user.patient_id || null,
      },
      JWT_TOKEN,
      { expiresIn: '24h' }
    );
  },

  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_TOKEN);
    } catch (error) {
      return null;
    }
  },

  // Middleware: verifies JWT and attaches decoded user to req.user
  requireAuth: (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = auth.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = decoded;
    next();
  },

  requireAdmin: (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  },

  requireDoctor: (req, res, next) => {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Doctor access required' });
    next();
  },

  isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),

  isValidPhone: (phone) => /^\+?[1-9]\d{1,14}$/.test(phone),

  isValidPassword: (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password),

  registerUser: async (userData) => {
    try {
      const { full_name, email, phone, password, role = 'patient' } = userData;

      const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) throw new Error('User with this email already exists');

      const hashedPassword = await auth.hashPassword(password);
      const phoneValue = phone && phone.trim() !== '' ? phone : null;

      // Auto-generate patient_id only for patients
      const patient_id = role === 'patient' ? await generatePatientId() : null;

      const [result] = await pool.execute(
        'INSERT INTO users (full_name, email, phone, password_hash, role, patient_id) VALUES (?, ?, ?, ?, ?, ?)',
        [full_name, email, phoneValue, hashedPassword, role, patient_id]
      );
      const userId = result.insertId;

      if (role === 'patient') {
        try {
          await pool.execute(
            'INSERT INTO patients (id, full_name, date_of_birth, gender, contact_info, address) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, full_name, null, null, email || phoneValue || '', null]
          );
        } catch (e) {
          console.error('Failed to create patient record:', e.message);
        }
      }

      return { id: userId, full_name, email, phone: phoneValue, role, patient_id };
    } catch (error) {
      throw new Error(`Error registering user: ${error.message}`);
    }
  },

  loginUser: async (email, password) => {
    try {
      const [users] = await pool.execute(
        'SELECT id, full_name, email, password_hash, role, patient_id FROM users WHERE email = ?',
        [email]
      );
      if (users.length === 0) throw new Error('Invalid email or password');

      const user = users[0];
      const valid = await auth.comparePassword(password, user.password_hash);
      if (!valid) throw new Error('Invalid email or password');

      const token = auth.generateToken(user);
      return {
        // Include both full_name and name so screens work regardless of which field they read
        user: { id: user.id, full_name: user.full_name, name: user.full_name, email: user.email, role: user.role, patient_id: user.patient_id },
        token,
      };
    } catch (error) {
      throw new Error(`Error logging in: ${error.message}`);
    }
  },
};

module.exports = auth;
