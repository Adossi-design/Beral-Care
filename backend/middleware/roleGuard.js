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

const JWT_TOKEN = process.env.JWT_TOKEN;

/**
 * verifyToken — validates the Bearer JWT in the Authorization header.
 * Attaches the decoded payload to req.user on success.
 * Returns 401 if token is missing or invalid/expired.
 */
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    req.user = jwt.verify(token, JWT_TOKEN);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
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

module.exports = { verifyToken, requireAdmin, requireDoctor, requirePatient };
