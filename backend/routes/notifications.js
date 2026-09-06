const express = require('express');

const router = express.Router();
const pool = require('../utils/db');

// Notifications for whoever is signed in. Patients had their own endpoint
// already; doctors need one too so administrator warnings reach them.
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT n.id, n.type, n.message, n.is_read, n.created_at,
              u.full_name AS related_user_name
       FROM notifications n
       LEFT JOIN users u ON u.id = n.related_user_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id],
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Could not load your messages.' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id],
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Could not update the message.' });
  }
});

module.exports = router;
