const express = require('express');

const router = express.Router();
const pool = require('../utils/db');

/**
 * The profile card behind every picture in the app. It carries who a person
 * is: name, picture, role, and how to reach them. It never carries medical
 * records, and it never carries a password.
 *
 * A doctor's card is open to anyone signed in, the same details the directory
 * already shows. A patient's card is private: only the patient themselves, an
 * administrator, or a doctor that patient has allowed sees the full card.
 * Anyone else who scans or clicks gets the name and health ID only, which is
 * what it takes to know you have the right person before asking permission.
 */
router.get('/:id', async (req, res) => {
  try {
    const viewer = req.user;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'That is not a valid person.' });
    }

    const [[person]] = await pool.execute(
      `SELECT u.id, u.full_name, u.role, u.email, u.phone, u.patient_id, u.doctor_id,
              u.specialization, u.hospital, u.profile_image_url, u.created_at, u.suspended,
              p.date_of_birth, p.gender, p.address
       FROM users u
       LEFT JOIN patients p ON p.id = u.id
       WHERE u.id = ?`,
      [id],
    );

    if (!person || person.role === 'admin') {
      return res.status(404).json({ error: 'That person was not found.' });
    }

    const isSelf = viewer.id === person.id;
    const isAdmin = viewer.role === 'admin';

    // One patient has no reason to look up another patient
    if (!isSelf && !isAdmin && viewer.role === 'patient' && person.role === 'patient') {
      return res.status(403).json({ error: 'You cannot open this profile.' });
    }

    // Are these two connected? That is what opens the private half of a card.
    let connected = false;
    if (!isSelf && !isAdmin && viewer.role !== person.role) {
      const patientId = viewer.role === 'patient' ? viewer.id : person.id;
      const doctorId = viewer.role === 'doctor' ? viewer.id : person.id;
      const [[link]] = await pool.execute(
        'SELECT status FROM consultation_requests WHERE patient_id = ? AND doctor_id = ?',
        [patientId, doctorId],
      );
      connected = !!link && (link.status === 'accepted' || link.status === 'completed');
    }

    // A doctor's working details are open, the same as in the directory. A
    // patient's details need permission from that patient.
    const full = isSelf || isAdmin || connected || person.role === 'doctor';

    const card = {
      id: person.id,
      full_name: person.full_name,
      role: person.role,
      profile_image_url: person.profile_image_url,
      identifier: person.role === 'doctor' ? person.doctor_id : person.patient_id,
      full,
    };

    if (person.role === 'doctor') {
      card.specialization = person.specialization;
      card.hospital = person.hospital;
      card.member_since = person.created_at;
      // A doctor's own email and phone stay between them and their patients
      if (isSelf || isAdmin || connected) {
        card.email = person.email;
        card.phone = person.phone;
      }
    }

    if (person.role === 'patient' && (isSelf || isAdmin || connected)) {
      card.email = person.email;
      card.phone = person.phone;
      card.date_of_birth = person.date_of_birth;
      card.gender = person.gender;
      card.address = person.address;
      card.member_since = person.created_at;
    }

    if (isAdmin) card.suspended = person.suspended;

    res.json(card);
  } catch (error) {
    console.error('Error loading a profile card:', error);
    res.status(500).json({ error: 'Could not open that profile.' });
  }
});

module.exports = router;
