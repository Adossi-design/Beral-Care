import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * RoleGuard — conditionally renders children based on the user's role.
 * Use this inside screens to show/hide UI elements per role.
 *
 * Usage:
 *   <RoleGuard role="admin"><AdminOnlyButton /></RoleGuard>
 *   <RoleGuard role={['doctor', 'admin']}><SensitiveData /></RoleGuard>
 */
const RoleGuard = ({ role, children }) => {
  const { user } = useAuth();
  if (!user) return null;

  const allowed = Array.isArray(role) ? role.includes(user.role) : user.role === role;
  return allowed ? children : null;
};

export default RoleGuard;
