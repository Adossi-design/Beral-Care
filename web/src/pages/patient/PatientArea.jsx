import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import Assistant, { PATIENT_PROMPTS } from '../../components/Assistant';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { useAsync } from '../../lib/useAsync';
import { patient as patientApi } from '../../lib/services';

import Overview from './Overview';
import Appointments from './Appointments';
import Records from './Records';
import CareTeam from './CareTeam';
import Notifications from './Notifications';
import Profile from './Profile';

/** Longest-prefix match so nested routes keep a meaningful heading. */
const TITLES = [
  ['/app/appointments', 'Appointments'],
  ['/app/records', 'Medical records'],
  ['/app/care-team', 'Care team'],
  ['/app/notifications', 'Notifications'],
  ['/app/profile', 'Profile'],
  ['/app', 'Overview'],
];

const titleFor = (path) => TITLES.find(([prefix]) => path.startsWith(prefix))?.[1] || 'Beral Care';

export default function PatientArea() {
  const { user } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  // Drives the bell badge and the pending-approval prompt on the overview.
  const { data: summary, refetch } = useAsync(() => patientApi.dashboard(), []);

  const nav = [
    { to: '/app', end: true, label: t('overview'), icon: 'home' },
    { to: '/app/appointments', label: t('appointments'), icon: 'calendar' },
    { to: '/app/records', label: t('records'), icon: 'records' },
    { to: '/app/care-team', label: t('careTeam'), icon: 'stethoscope' },
    { to: '/app/profile', label: t('profile'), icon: 'user', profile: true },
  ];

  return (
    <>
      <AppShell
        nav={nav}
        title={titleFor(location.pathname)}
        notifyTo="/app/notifications"
        notifyCount={summary?.unread_notifications || 0}
      >
        <Routes>
          <Route index element={<Overview summary={summary} onChange={refetch} />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="records" element={<Records />} />
          <Route path="care-team" element={<CareTeam onChange={refetch} />} />
          <Route path="notifications" element={<Notifications onChange={refetch} />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AppShell>

      <Assistant
        audience="patient"
        name={user?.full_name?.split(' ')[0]}
        greeting={`Hello ${user?.full_name?.split(' ')[0] || 'there'}. I can explain your diagnoses and medication in plain language, or help you prepare for your next appointment. What would you like to know?`}
        prompts={PATIENT_PROMPTS}
        disclaimer="Information only. Always speak to your clinician before making a medical decision."
      />
    </>
  );
}
