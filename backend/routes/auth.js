/**
 * auth.js — Public authentication routes.
 * No token required. Accessible by anyone.
 * Handles: POST /api/auth/register, POST /api/auth/login
 */

const express = require('express');
const router = express.Router();
const auth = require('../utils/auth');

// POST /api/auth/register — create a new patient or doctor account
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password, role = 'patient' } = req.body;

    if (!full_name || !email || !phone || !password)
      return res.status(400).json({ error: 'All fields are required: full_name, email, phone, password' });
    if (!auth.isValidEmail(email))
      return res.status(400).json({ error: 'Invalid email format' });
    if (!auth.isValidPassword(password))
      return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase, and number' });
    if (!auth.isValidPhone(phone))
      return res.status(400).json({ error: 'Invalid phone format' });

    // Prevent admin self-registration through public endpoint
    const safeRole = role === 'admin' ? 'patient' : role;

    const user = await auth.registerUser({ full_name, email, phone, password, role: safeRole });
    const token = auth.generateToken(user);

    res.status(201).json({
      message: 'Account created successfully',
      user: { id: user.id, full_name: user.full_name, name: user.full_name, email: user.email, phone: user.phone, role: user.role, patient_id: user.patient_id },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/auth/login — login for all roles (patient, doctor, admin)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });
    if (!auth.isValidEmail(email))
      return res.status(400).json({ error: 'Invalid email format' });

    const { user, token } = await auth.loginUser(email, password);

    res.json({
      message: 'Login successful',
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role, patient_id: user.patient_id },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

module.exports = router;
