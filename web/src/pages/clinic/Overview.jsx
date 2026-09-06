import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PageHeader, Section, Card, CardHeader, Stat, Badge, Button, Avatar,
  EmptyState, SkeletonRows, Icon,
} from '../../components/ui';
import { QrDialog } from '../../components/QrCode';
import PatientScan from '../../components/PatientScan';
import PersonAvatar from '../../components/PersonCard';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { useAsyncAll } from '../../lib/useAsync';
import { clinic as clinicApi } from '../../lib/services';
import { assetUrl } from '../../lib/api';
import { formatDate, relativeDate, greetingKey, isUpcoming } from '../../lib/format';

// Built around what a doctor does first: open the file of the patient in front
// of them, then clear the requests waiting on a reply.
export default function Overview({ pendingCount }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  const [scanning, setScanning] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [lookup, setLookup] = useState('');

  const { data, loading } = useAsyncAll({
    patients: () => clinicApi.patients(),
    appointments: () => clinicApi.appointments(),
    requests: () => clinicApi.requests(),
  }, []);

  const patients = data?.patients || [];
  const appointments = data?.appointments || [];
  const pending = (data?.requests || []).filter((r) => r.status === 'pending');

  const todayStr = new Date().toDateString();
  const today = appointments.filter((a) => new Date(a.consultation_date).toDateString() === todayStr);
  const upcoming = appointments
    .filter((a) => isUpcoming(a.consultation_date) && a.status !== 'cancelled')
    .sort((x, y) => new Date(x.consultation_date) - new Date(y.consultation_date));

  const openPatient = (patientId) => {
    const id = String(patientId || '').trim().toUpperCase();
    if (!id) return;
    setScanning(false);
    navigate(`/clinic/patients/${encodeURIComponent(id)}`);
  };

  const firstName = (user?.full_name || '').replace(/^Dr\.?\s*/i, '').split(' ')[0];

  return (
    <>
      <PageHeader
        title={`${t(greetingKey())}, ${user?.full_name?.startsWith('Dr') ? user.full_name : `Dr ${firstName || ''}`.trim()}`}
        description="Find a patient, or answer the requests waiting for you."
        actions={
          <>
            <Button icon="qr" onClick={() => setQrOpen(true)}>My code</Button>
            <Button variant="primary" icon="scan" onClick={() => setScanning(true)}>Scan patient</Button>
          </>
        }
      />

      {/* The first thing a doctor needs */}
      <Card className="mb-6">
        <CardHeader
          title="Open a patient file"
          subtitle="Type their health ID, or scan their code."
          icon="search"
        />
        <form
          className="row gap-2 wrap"
          onSubmit={(e) => { e.preventDefault(); openPatient(lookup); }}
        >
          <div className="input-wrap grow" style={{ minWidth: 220 }}>
            <span className="input-icon"><Icon name="idCard" size={17} /></span>
            <input
              className="input mono"
              placeholder="BC-2026-00001"
              value={lookup}
              onChange={(e) => setLookup(e.target.value.toUpperCase())}
              aria-label="Patient Health ID"
            />
          </div>
          <Button type="submit" variant="primary" icon="arrowRight" disabled={!lookup.trim()}>
            Open file
          </Button>
          <Button type="button" icon="scan" onClick={() => setScanning(true)}>Scan</Button>
        </form>
        <p className="muted text-xs mt-4">
          You can only open files for patients who have said yes to you.
        </p>
      </Card>

      <div className="grid grid--stats mb-6">
        <Stat label={t('totalPatients')} value={loading ? '–' : patients.length} icon="users" />
        <Stat label="Today" value={loading ? '–' : today.length} icon="calendar" tone="accent" />
        <Stat label={t('upcoming')} value={loading ? '–' : upcoming.length} icon="clock" tone="success" />
        <Stat
          label={t('pendingRequests')}
          value={loading ? '–' : pendingCount ?? pending.length}
          icon="inbox"
          tone={pending.length ? 'warning' : 'primary'}
        />
      </div>

      <div className="grid grid--main">
        <Section
          title="Coming up"
          action={<Link className="text-sm" to="/clinic/appointments">{t('viewAll')}</Link>}
        >
          {loading ? (
            <SkeletonRows rows={3} />
          ) : upcoming.length === 0 ? (
            <Card>
              <EmptyState compact icon="calendar" title="No visits booked"
                description="When a patient books a visit with you, it will show up here." />
            </Card>
          ) : (
            <Card flush>
              <div className="rows">
                {upcoming.slice(0, 6).map((a) => (
                  <div className="row-item" key={a.id}>
                    <PersonAvatar
                      id={a.patient_user_id}
                      name={a.patient_name}
                      src={assetUrl(a.profile_image_url)}
                      size={36}
                    />
                    <div className="grow">
                      <div className="row-item__title">{a.patient_name}</div>
                      <div className="row-item__meta">
                        <span className="mono">{a.patient_id}</span> · {formatDate(a.consultation_date, lang)}
                        {' · '}{relativeDate(a.consultation_date, lang)}
                      </div>
                    </div>
                    <Badge status={a.status} />
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="chevronRight"
                      onClick={() => openPatient(a.patient_id)}
                      aria-label={`Open ${a.patient_name}`}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Section>

        <div className="stack gap-4">
          <Card>
            <CardHeader
              title={t('pendingRequests')}
              subtitle={pending.length ? 'Patients waiting for your answer' : 'Nothing waiting'}
              icon="inbox"
            />
            {loading ? (
              <SkeletonRows rows={2} height={48} />
            ) : pending.length === 0 ? (
              <p className="muted text-sm">You have answered every request.</p>
            ) : (
              <div className="stack gap-3">
                {pending.slice(0, 3).map((r) => (
                  <div className="row gap-3" key={r.id}>
                    <PersonAvatar id={r.patient_user_id} name={r.patient_name} size={32} />
                    <div className="grow">
                      <div className="text-sm strong">{r.patient_name}</div>
                      <div className="muted text-xs">{relativeDate(r.created_at, lang)}</div>
                    </div>
                  </div>
                ))}
                <Button to="/clinic/requests" variant="primary" size="sm" block>
                  Answer {pending.length} request{pending.length === 1 ? '' : 's'}
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Recent patients" icon="users" />
            {loading ? (
              <SkeletonRows rows={2} height={44} />
            ) : patients.length === 0 ? (
              <p className="muted text-sm">
                Scan a patient code and ask them for permission. They show up here as soon
                as they say yes.
              </p>
            ) : (
              <div className="stack gap-3">
                {patients.slice(0, 5).map((p) => (
                  <div className="row gap-3" key={p.id}>
                    <PersonAvatar id={p.id} name={p.full_name} src={assetUrl(p.profile_image_url)} size={32} />
                    <div className="grow">
                      <div className="text-sm strong">{p.full_name}</div>
                      <div className="muted text-xs mono">{p.patient_id}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="chevronRight"
                      aria-label={`Open the file of ${p.full_name}`}
                      onClick={() => openPatient(p.patient_id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <PatientScan open={scanning} onClose={() => setScanning(false)} />

      <QrDialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        value={user?.doctor_id}
        name={user?.full_name}
        label={t('clinicianId')}
        caption="Patients can scan this code to book a visit with you."
      />
    </>
  );
}
