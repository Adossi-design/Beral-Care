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
import Messages from '../Messages';
import RecordAccess from './RecordAccess';
import Profile from './Profile';

/** Longest-prefix match so nested routes keep a meaningful heading. */
const TITLES = [
  ['/app/appointments', 'My visits'],
  ['/app/records', 'My records'],
  ['/app/record-access', 'Who opened my records'],
  ['/app/care-team', 'My doctors'],
  ['/app/notifications', 'Messages'],
  ['/app/profile', 'My profile'],
  ['/app', 'Home'],
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
    { to: '/app/record-access', label: 'Who opened them', icon: 'eye' },
    { to: '/app/care-team', label: t('careTeam'), icon: 'stethoscope' },
  ];

  return (
    <>
      <AppShell
        nav={nav}
        profileTo="/app/profile"
        title={titleFor(location.pathname)}
        notifyTo="/app/notifications"
        notifyCount={summary?.unread_notifications || 0}
      >
        <Routes>
          <Route index element={<Overview summary={summary} onChange={refetch} />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="records" element={<Records />} />
          <Route path="record-access" element={<RecordAccess />} />
          <Route path="care-team" element={<CareTeam onChange={refetch} />} />
          <Route path="notifications" element={<Messages onChange={refetch} />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AppShell>

      <Assistant
        audience="patient"
        name={user?.full_name?.split(' ')[0]}
        greeting={`Hello ${user?.full_name?.split(' ')[0] || 'there'}. I can explain your illness and your medicine in simple words, or help you get ready for your next visit. What would you like to know?`}
        prompts={PATIENT_PROMPTS}
        disclaimer="This is general information only. Always speak to your doctor before you change anything about your health."
      />
    </>
  );
}
