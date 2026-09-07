/**
 * set-password.js — set an account's password from the command line.
 *
 * A password is only ever stored as a bcrypt hash, so a forgotten one cannot be
 * read back. It can only be replaced. This does that, for whichever database
 * backend/.env currently points at.
 *
 *   node set-password.js someone@example.com 'NewPass123!'
 *
 * It refuses a password the API itself would refuse, so an account can never be
 * left with one that cannot be used to log in. Setting a password also ends any
 * session that account already had open, which is the point when the reason for
 * changing it is that the old one leaked.
 */

const path = require('path');
const fs = require('fs');

// Read .env the same way backend-server.js does, so the values match exactly
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    const eq = trimmed.indexOf('=');
    if (!trimmed || trimmed.startsWith('#') || eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    if (key && !(key in process.env)) process.env[key] = trimmed.slice(eq + 1).trim();
  });
}

const pool = require('./utils/db');
const auth = require('./utils/auth');

const [email, password] = process.argv.slice(2);

const usage = () => {
  console.log('Usage: node set-password.js <email> <new password>');
  console.log("Example: node set-password.js someone@example.com 'NewPass123!'");
};

(async () => {
  if (!email || !password) {
    usage();
    process.exitCode = 1;
    return;
  }

  if (!auth.isValidPassword(password)) {
    console.error('That password would be refused at login.');
    console.error('It needs at least 8 characters, with a capital, a small letter, and a number.');
    process.exitCode = 1;
    return;
  }

  const [[user]] = await pool.execute(
    'SELECT id, full_name, role, suspended FROM users WHERE email = ?', [email],
  );
  if (!user) {
    console.error(`No account here uses ${email}.`);
    console.error('Check which database backend/.env points at.');
    process.exitCode = 1;
    return;
  }

  const hash = await auth.hashPassword(password);
  // Raising the session version signs out anywhere the old password reached
  await pool.execute(
    'UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?',
    [hash, user.id],
  );

  console.log(`Password set for ${user.full_name} (${user.role}).`);
  console.log('Any session that account had open has ended.');
  if (user.suspended) {
    console.log('Note: this account is currently blocked, so it still cannot log in.');
  }
})()
  .catch((error) => {
    console.error('Could not set that password:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    // utils/db tests its connection on load. On the short paths, such as a
    // password that fails the rules, we finish before that test does, and
    // closing the pool underneath it prints an alarming error about nothing.
    await new Promise((resolve) => setTimeout(resolve, 200));
    await pool.end();
  });
