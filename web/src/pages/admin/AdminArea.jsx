import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { useI18n } from '../../lib/i18n';

import Overview from './Overview';
import Users from './Users';
import Reports from './Reports';
import Ratings from './Ratings';
import Settings from './Settings';

const TITLES = {
  '/admin': 'Home',
  '/admin/users': 'Users',
  '/admin/reports': 'Reports',
  '/admin/ratings': 'Ratings',
  '/admin/settings': 'Settings',
};

export default function AdminArea() {
  const { t } = useI18n();
  const location = useLocation();

  const nav = [
    { to: '/admin', end: true, label: t('overview'), icon: 'chart' },
    { to: '/admin/users', label: t('users'), icon: 'users' },
    { to: '/admin/reports', label: 'Reports', icon: 'shield' },
    { to: '/admin/ratings', label: 'Ratings', icon: 'star' },
  ];

  return (
    <AppShell nav={nav} profileTo="/admin/settings" title={TITLES[location.pathname] || 'Administration'}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="users" element={<Users />} />
        <Route path="reports" element={<Reports />} />
        <Route path="ratings" element={<Ratings />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AppShell>
  );
}
