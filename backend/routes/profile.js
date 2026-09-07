const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const storage = require('../utils/storage');
const { forgetSession } = require('../middleware/roleGuard');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// GET /api/profile - Get current user's profile
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.execute(
      `SELECT id, full_name, email, phone, role, patient_id, doctor_id, specialization, hospital,
              profile_image_url, email_verified, phone_verified, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/profile - Update user profile
router.put('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, specialization, hospital } = req.body;

    // Validation
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    if (phone && phone.trim()) {
      // Check if phone is unique (excluding current user)
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE phone = ? AND id != ?',
        [phone, userId]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: 'This phone number is already in use' });
      }
    }

    // Get current user to check role
    const [users] = await pool.execute('SELECT role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRole = users[0].role;

    // Build update query based on role
    let updateQuery = 'UPDATE users SET full_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    let params = [full_name, phone || null, userId];

    if (userRole === 'doctor') {
      if (specialization && specialization.trim()) {
        updateQuery = 'UPDATE users SET full_name = ?, phone = ?, specialization = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        params = [full_name, phone || null, specialization, userId];
      }
      if (hospital && hospital.trim()) {
        updateQuery = 'UPDATE users SET full_name = ?, phone = ?, specialization = ?, hospital = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        params = [full_name, phone || null, specialization || null, hospital, userId];
      }
    }

    await pool.execute(updateQuery, params);

    // Fetch updated profile
    const [updated] = await pool.execute(
      `SELECT id, full_name, email, phone, role, patient_id, doctor_id, specialization, hospital,
              profile_image_url, email_verified, phone_verified, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );

    res.json({
      message: 'Profile updated successfully',
      user: updated[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/profile/upload-image - Upload profile image
/**
 * POST /api/profile/licence
 * A doctor uploads the licence an administrator checks. The file is never
 * public: only administrators can open it, through the admin route.
 */
router.post('/licence', async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only a doctor sends a licence.' });
    }
    if (!req.files || !req.files.licence) {
      return res.status(400).json({ error: 'Please choose the file to send.' });
    }

    const file = req.files.licence;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      return res.status(400).json({ error: 'The licence must be a picture or a PDF.' });
    }
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'That file is larger than 5 MB.' });
    }

    const stored = await storage.savePrivate(file, 'licences', `licence_${req.user.id}_${Date.now()}`);

    // Sending a new licence puts the account back in the queue
    await pool.execute(
      "UPDATE users SET licence_file = ?, verification = 'pending' WHERE id = ?",
      [stored, req.user.id],
    );

    res.json({ sent: true, verification: 'pending' });
  } catch (error) {
    console.error('Licence upload error:', error);
    res.status(500).json({ error: 'Could not send that file. Please try again.' });
  }
});

router.post('/upload-image', async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if file was uploaded
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageFile = req.files.image;
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedMimes.includes(imageFile.mimetype)) {
      return res.status(400).json({ error: 'Invalid image format. Allowed: JPEG, PNG, GIF, WebP' });
    }

    if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit
      return res.status(400).json({ error: 'Image size must be less than 5MB' });
    }

    // Stored wherever storage says: Cloudinary in production, the local disk
    // during development
    const saved = await storage.savePublic(imageFile, 'profiles', `profile_${userId}_${Date.now()}`);
    const imageUrl = saved.url;
    await pool.execute(
      'UPDATE users SET profile_image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [imageUrl, userId]
    );

    res.json({
      message: 'Image uploaded successfully',
      image_url: imageUrl
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// DELETE /api/profile/image - Delete profile image
router.delete('/image', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current image URL
    const [users] = await pool.execute(
      'SELECT profile_image_url FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const imageUrl = users[0].profile_image_url;

    if (imageUrl) {
      // Local files are named in the URL. A file kept elsewhere is left to
      // its own housekeeping, and the account simply stops pointing at it.
      if (!imageUrl.startsWith('http')) await storage.remove(path.basename(imageUrl), 'profiles');
    }

    // Clear image URL from database
    await pool.execute(
      'UPDATE users SET profile_image_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

/**
 * POST /api/profile/close-account
 * Closing an account is not instant and it is not silent. The person says why,
 * the account is locked straight away so nothing more can happen in it, and
 * the administrator removes it after reading the reason. Nothing is deleted
 * here: that decision stays with a person.
 */
router.post('/close-account', async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(400).json({ error: 'An administrator account cannot be closed from here.' });
    }

    const reason = (req.body.reason || '').trim();
    if (reason.length < 10) {
      return res.status(400).json({ error: 'Please say why you want to close your account.' });
    }

    await pool.execute(
      `UPDATE users
       SET deletion_requested_at = NOW(), deletion_reason = ?,
           suspended = 1, session_version = session_version + 1
       WHERE id = ?`,
      [reason.slice(0, 500), req.user.id],
    );
    forgetSession(req.user.id);

    res.json({
      closed: true,
      message: 'Your account is closed. It will be removed after it has been read.',
    });
  } catch (error) {
    console.error('Close account error:', error);
    res.status(500).json({ error: 'Could not close your account. Please try again.' });
  }
});

// GET /api/profile/doctor/:doctor_id - Get doctor's public profile (for patients)
router.get('/doctor/:doctor_id', async (req, res) => {
  try {
    const { doctor_id } = req.params;

    const [doctors] = await pool.execute(
      `SELECT id, full_name, email, phone, specialization, hospital, profile_image_url, created_at
       FROM users WHERE id = ? AND role = 'doctor' AND suspended = 0`,
      [doctor_id]
    );

    if (doctors.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json(doctors[0]);
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ error: 'Failed to fetch doctor profile' });
  }
});

// GET /api/profile/patient/:patient_id - Get patient's public profile (for doctors with access)
router.get('/patient/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const doctorId = req.user.id;

    // Find patient by patient_id
    const [patients] = await pool.execute(
      'SELECT id FROM users WHERE patient_id = ? AND role = "patient"',
      [patient_id]
    );

    if (patients.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientUserId = patients[0].id;

    // Check if doctor has access
    const [access] = await pool.execute(
      'SELECT id FROM consultation_requests WHERE patient_id = ? AND doctor_id = ? AND status = "accepted"',
      [patientUserId, doctorId]
    );

    if (access.length === 0) {
      return res.status(403).json({ error: 'No access to this patient profile' });
    }

    // Return patient profile
    const [profile] = await pool.execute(
      `SELECT id, full_name, email, phone, patient_id, profile_image_url, created_at
       FROM users WHERE id = ?`,
      [patientUserId]
    );

    res.json(profile[0]);
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ error: 'Failed to fetch patient profile' });
  }
});

module.exports = router;
