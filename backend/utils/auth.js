const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const JWT_TOKEN = process.env.JWT_TOKEN;

// Generate a unique patient ID in BC-YYYY-NNNNN format inside a transaction.
const generatePatientId = async (connection) => {
  const year = new Date().getFullYear();
  const prefix = `BC-${year}-`;
  const [rows] = await connection.execute(
    "SELECT patient_id FROM users WHERE patient_id LIKE ? ORDER BY patient_id DESC LIMIT 1 FOR UPDATE",
    [`${prefix}%`]
  );
  let nextNum = 1;
  if (rows.length > 0) {
    const last = rows[0].patient_id.split('-')[2];
    nextNum = parseInt(last, 10) + 1;
  }
  return `${prefix}${String(nextNum).padStart(5, '0')}`;
};

// Generate a unique doctor ID in DR-YYYY-NNNNN format inside a transaction.
const generateDoctorId = async (connection) => {
  const year = new Date().getFullYear();
  const prefix = `DR-${year}-`;
  const [rows] = await connection.execute(
    "SELECT doctor_id FROM users WHERE doctor_id LIKE ? ORDER BY doctor_id DESC LIMIT 1 FOR UPDATE",
    [`${prefix}%`]
  );
  let nextNum = 1;
  if (rows.length > 0 && rows[0].doctor_id) {
    const last = rows[0].doctor_id.split('-')[2];
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

  // JWT includes id, email, role, name, patient_id, doctor_id — expires in 24h
  generateToken: (user) => {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.full_name,
        patient_id: user.patient_id || null,
        doctor_id: user.doctor_id || null,
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



  isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),

  isValidPhone: (phone) => /^\+?[1-9]\d{1,14}$/.test(phone),

  isValidPassword: (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password),

  registerUser: async (userData) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const { full_name, email, phone, password, role = 'patient', specialization, hospital } = userData;

      const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) throw new Error('User with this email already exists');

      const hashedPassword = await auth.hashPassword(password);
      const phoneValue = phone && phone.trim() !== '' ? phone : null;

      // Auto-generate unique IDs for patients and doctors inside the transaction
      const patient_id = role === 'patient' ? await generatePatientId(conn) : null;
      const doctor_id  = role === 'doctor'  ? await generateDoctorId(conn)  : null;

      const [result] = await conn.execute(
        'INSERT INTO users (full_name, email, phone, password_hash, role, patient_id, doctor_id, specialization, hospital) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [full_name, email, phoneValue, hashedPassword, role, patient_id, doctor_id, specialization || null, hospital || null]
      );
      const userId = result.insertId;

      if (role === 'patient') {
        await conn.execute(
          'INSERT INTO patients (id, full_name, date_of_birth, gender, contact_info, address) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, full_name, null, null, email || phoneValue || '', null]
        );
      }

      await conn.commit();
      return { id: userId, full_name, email, phone: phoneValue, role, patient_id, doctor_id, specialization, hospital };
    } catch (error) {
      await conn.rollback();
      throw new Error(`Error registering user: ${error.message}`);
    } finally {
      conn.release();
    }
  },

  loginUser: async (email, password) => {
    try {
      const [users] = await pool.execute(
        'SELECT id, full_name, email, password_hash, role, patient_id, doctor_id, specialization, hospital, suspended, suspended_until FROM users WHERE email = ?',
        [email]
      );
      if (users.length === 0) throw new Error('Invalid email or password');

      const user = users[0];

      if (user.suspended) {
        // A temporary block lifts itself once its date has passed
        if (user.suspended_until && new Date(user.suspended_until) <= new Date()) {
          await pool.execute(
            'UPDATE users SET suspended = 0, suspended_until = NULL WHERE id = ?',
            [user.id]
          );
        } else {
          let reason = 'Your account has been blocked. Please contact the administrator.';
          if (user.suspended_until) {
            const until = new Date(user.suspended_until).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            });
            reason = `Your account is blocked until ${until}. Please check your messages for the reason.`;
          }
          // Flagged so the login route can explain this instead of the usual
          // "wrong email or password", which would leave the person guessing.
          const blocked = new Error(reason);
          blocked.blocked = true;
          throw blocked;
        }
      }

      const valid = await auth.comparePassword(password, user.password_hash);
      if (!valid) throw new Error('Invalid email or password');

      const token = auth.generateToken(user);
      return {
        // Include both full_name and name so screens work regardless of which field they read
        user: { id: user.id, full_name: user.full_name, name: user.full_name, email: user.email, role: user.role, patient_id: user.patient_id, doctor_id: user.doctor_id, specialization: user.specialization, hospital: user.hospital },
        token,
      };
    } catch (error) {
      if (error.blocked) throw error;
      throw new Error(`Error logging in: ${error.message}`);
    }
  },


};

module.exports = auth;
