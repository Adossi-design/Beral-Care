import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import api, { tokenStore, setUnauthorizedHandler } from './api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStore.getUser());
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // A 401 from any request drops the session rather than leaving the UI in a
  // half-authenticated state showing empty data.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  // Revalidate the stored session on load: a token in localStorage proves
  // nothing about whether the server still accepts it.
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) { setLoading(false); return; }

    let cancelled = false;
    api.get('/api/profile')
      .then((res) => {
        if (cancelled) return;
        const merged = { ...tokenStore.getUser(), ...res.data };
        tokenStore.setUser(merged);
        setUser(merged);
      })
      .catch(() => { if (!cancelled) signOut(); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [signOut]);

  const signIn = useCallback((userData, token) => {
    tokenStore.set(token);
    tokenStore.setUser(userData);
    setUser(userData);
  }, []);

  const patchUser = useCallback((partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      tokenStore.setUser(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, patchUser, isAuthenticated: !!user }),
    [user, loading, signIn, signOut, patchUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Landing route for each role, used after sign-in and by the root redirect. */
export const homeFor = (role) =>
  ({ admin: '/admin', doctor: '/clinic', patient: '/app' }[role] || '/app');
