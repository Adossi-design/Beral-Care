/**
 * roleGuard.js — JWT verification and role-based access control middleware.
 *
 * Security is always enforced server-side. The frontend UI is never the
 * sole guard — every protected route must pass through these middleware
 * functions before any handler logic runs.
 *
 * Usage:
 *   router.get('/route', verifyToken, requireAdmin, handler)
 *   router.get('/route', verifyToken, requireDoctor, handler)
 *   router.get('/route', verifyToken, requirePatient, handler)
 */

const jwt = require('jsonwebtoken');
const pool = require('../utils/db');

const JWT_TOKEN = process.env.JWT_TOKEN;

/**
 * verifyToken — validates the Bearer JWT in the Authorization header.
 * Attaches the decoded payload to req.user on success.
 * Returns 401 if token is missing or invalid/expired.
 */
/**
 * A token stays valid for a day, so blocking or deleting an account has to be
 * able to end a session that is already open. Each account carries a session
 * version, the token carries the version it was issued with, and a mismatch
 * ends the session. The version is cached briefly so this costs one query a
 * minute per person rather than one on every request.
 */
const SESSION_CACHE_MS = 60 * 1000;
const sessionCache = new Map();

const currentSessionVersion = async (userId) => {
  const cached = sessionCache.get(userId);
  if (cached && cached.expires > Date.now()) return cached.state;

  const [[row]] = await pool.execute(
    'SELECT session_version, suspended FROM users WHERE id = ?', [userId],
  );
  const state = row ? { version: row.session_version, suspended: !!row.suspended } : null;
  sessionCache.set(userId, { state, expires: Date.now() + SESSION_CACHE_MS });
  return state;
};

// Called after blocking or deleting so the change is felt straight away
const forgetSession = (userId) => sessionCache.delete(Number(userId));

const verifyToken = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  let payload;
  try {
    payload = jwt.verify(token, JWT_TOKEN);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const current = await currentSessionVersion(payload.id);
    if (!current) return res.status(401).json({ error: 'This account no longer exists.' });
    if (current.suspended || current.version !== (payload.sv || 1)) {
      return res.status(401).json({ error: 'Your session has ended. Please log in again.' });
    }
  } catch (error) {
    // A database hiccup should not lock everyone out of a signed token
    console.error('Session check failed:', error.message);
  }

  req.user = payload;
  next();
};

/**
 * requireAdmin — protects /api/admin/* routes.
 * Returns 403 if the authenticated user is not an admin.
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Access denied: admin only' });
  next();
};

/**
 * requireDoctor — protects /api/doctor/* routes.
 * Returns 403 if the authenticated user is not a doctor.
 */
const requireDoctor = (req, res, next) => {
  if (req.user?.role !== 'doctor')
    return res.status(403).json({ error: 'Access denied: doctor only' });
  next();
};

/**
 * requirePatient — protects /api/patient/* routes.
 * Returns 403 if the authenticated user is not a patient.
 */
const requirePatient = (req, res, next) => {
  if (req.user?.role !== 'patient')
    return res.status(403).json({ error: 'Access denied: patient only' });
  next();
};

/**
 * readToken — for routes that are open to everyone but show a little more to
 * someone signed in. A missing or invalid token is not an error here, it just
 * means the request is treated as a visitor.
 */
const readToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_TOKEN);
    } catch {
      req.user = undefined;
    }
  }
  next();
};

module.exports = {
  verifyToken, readToken, forgetSession,
  requireAdmin, requireDoctor, requirePatient,
};
