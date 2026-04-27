/**
 * admin.js — Admin-only routes.
 * All routes here are protected by verifyToken + requireAdmin in backend-server.js.
 * Admins can manage users but cannot view patient medical records (privacy).
 */

const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// GET /api/admin/users — list all users filterable by role
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    let query = 'SELECT id, full_name, email, phone, role, patient_id, suspended, created_at FROM users';
    const params = [];
    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }
    query += ' ORDER BY created_at DESC';
    const [users] = await pool.execute(query, params);
    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users/:id — get single user details
router.get('/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, full_name, email, phone, role, patient_id, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Admin get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/stats — dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [[{ total_patients }]] = await pool.execute("SELECT COUNT(*) AS total_patients FROM users WHERE role = 'patient'");
    const [[{ total_doctors }]] = await pool.execute("SELECT COUNT(*) AS total_doctors FROM users WHERE role = 'doctor'");
    const [[{ total_consultations }]] = await pool.execute('SELECT COUNT(*) AS total_consultations FROM consultations');
    res.json({ total_patients, total_doctors, total_consultations });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id — delete a user account
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (String(req.params.id) === String(req.user.id))
      return res.status(400).json({ error: 'Cannot delete your own account' });

    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/users/:id/suspend — suspend or unsuspend a user
router.patch('/users/:id/suspend', async (req, res) => {
  try {
    const { suspended } = req.body;
    await pool.execute('UPDATE users SET suspended = ? WHERE id = ?', [suspended ? 1 : 0, req.params.id]);
    res.json({ message: `User ${suspended ? 'suspended' : 'unsuspended'} successfully` });
  } catch (error) {
    console.error('Admin suspend user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
