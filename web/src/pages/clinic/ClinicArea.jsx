import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import Assistant, { DOCTOR_PROMPTS } from '../../components/Assistant';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { useAsync } from '../../lib/useAsync';
import { clinic as clinicApi } from '../../lib/services';

import Overview from './Overview';
import Patients from './Patients';
import PatientDetail from './PatientDetail';
import Appointments from './Appointments';
import Requests from './Requests';
import Profile from './Profile';

/**
 * Longest-prefix match, so nested routes such as /clinic/patients/BC-2026-00001
 * still show a meaningful heading instead of falling back to the product name.
 */
const TITLES = [
  ['/clinic/patients/', 'Patient record'],
  ['/clinic/patients', 'Patients'],
  ['/clinic/appointments', 'Appointments'],
  ['/clinic/requests', 'Access requests'],
  ['/clinic/profile', 'Profile'],
  ['/clinic', 'Overview'],
];

const titleFor = (path) => TITLES.find(([prefix]) => path.startsWith(prefix))?.[1] || 'Beral Care';

export default function ClinicArea() {
  const { user } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  const { data: requests, refetch } = useAsync(() => clinicApi.requests(), []);
  const pendingCount = (requests || []).filter((r) => r.status === 'pending').length;

  const nav = [
    { to: '/clinic', end: true, label: t('overview'), icon: 'home' },
    { to: '/clinic/patients', label: t('patients'), icon: 'users' },
    { to: '/clinic/appointments', label: t('appointments'), icon: 'calendar' },
    { to: '/clinic/requests', label: t('requests'), icon: 'inbox', badge: pendingCount },
    { to: '/clinic/profile', label: t('profile'), icon: 'user', profile: true },
  ];

  return (
    <>
      <AppShell
        nav={nav}
        title={titleFor(location.pathname)}
        notifyTo="/clinic/requests"
        notifyCount={pendingCount}
      >
        <Routes>
          <Route index element={<Overview pendingCount={pendingCount} />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:patientId" element={<PatientDetail />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="requests" element={<Requests onChange={refetch} />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/clinic" replace />} />
        </Routes>
      </AppShell>

      <Assistant
        audience="doctor"
        name={user?.full_name}
        greeting={`Good day, ${user?.full_name || 'Doctor'}. I can help with differential diagnosis, drug interactions, dosing, and WHO Africa treatment protocols. Guidance is evidence-linked, and clinical judgement remains yours.`}
        prompts={DOCTOR_PROMPTS}
        disclaimer="Decision support only. The treating clinician remains responsible for all clinical decisions."
      />
    </>
  );
}
