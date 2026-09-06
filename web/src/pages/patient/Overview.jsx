import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PageHeader, Section, Card, CardHeader, Stat, Badge, Button,
  EmptyState, SkeletonRows, Notice, Icon, useToast,
} from '../../components/ui';
import { QrDialog } from '../../components/QrCode';
import PersonAvatar from '../../components/PersonCard';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { useAsyncAll } from '../../lib/useAsync';
import { patient as patientApi } from '../../lib/services';
import { formatDate, relativeDate, greetingKey, isUpcoming } from '../../lib/format';
import { assetUrl, errorMessage } from '../../lib/api';

// Ordered by what needs an answer first, so pending access requests sit above
// everything else: a doctor cannot work until the patient replies.
export default function Overview({ summary, onChange }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const toast = useToast();

  const [qrOpen, setQrOpen] = useState(false);
  const [deciding, setDeciding] = useState(null);

  const { data, loading, refetch } = useAsyncAll({
    appointments: () => patientApi.appointments(),
    consultations: () => patientApi.consultations(),
    requests: () => patientApi.accessRequests(),
  }, []);

  const appointments = data?.appointments || [];
  const consultations = data?.consultations || [];
  // Two things can need an answer: a doctor asking to connect, and a doctor
  // already connected asking to see the health records.
  const requests = data?.requests || [];
  const pending = [
    ...requests
      .filter((r) => r.status === 'pending' && r.requested_by === 'doctor')
      .map((r) => ({ ...r, kind: 'connect' })),
    ...requests
      .filter((r) => r.records_status === 'pending')
      .map((r) => ({ ...r, kind: 'records' })),
  ];

  const upcoming = appointments.filter((a) => isUpcoming(a.consultation_date) && a.status !== 'cancelled');
  const diagnoses = consultations.filter((c) => c.diagnosis).length;
  const prescriptions = consultations.filter((c) => c.prescription).length;

  // Booking stores the patient's reason as notes, so notes alone do not make
  // it a past visit. It counts once a doctor has written it up.
  const activity = consultations.filter(
    (c) => c.diagnosis || c.prescription || c.status === 'completed',
  );

  const firstName = (user?.full_name || user?.name || '').split(' ')[0];

  const decide = async (item, decision) => {
    setDeciding(`${item.kind}-${item.id}`);
    try {
      if (item.kind === 'records') {
        await patientApi.decideRecords(item.id, decision);
        toast.success(decision === 'approved'
          ? 'Done. This doctor can now see your health records.'
          : 'Done. Your health records stay closed.');
      } else {
        await patientApi.decideAccess(item.id, decision);
        toast.success(decision === 'approved'
          ? 'Done. You are connected with this doctor.'
          : 'Done. This doctor is not connected with you.');
      }
      refetch();
      onChange?.();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeciding(null);
    }
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(user?.patient_id || '');
      toast.success(`${t('copied')}: ${user?.patient_id}`);
    } catch {
      toast.error('Copy did not work. Please select the ID and copy it yourself.');
    }
  };

  return (
    <>
      <PageHeader
        title={`${t(greetingKey())}, ${firstName || 'there'}`}
        description="Here is what needs you today."
        actions={<Button to="/app/care-team" variant="primary" icon="plus">{t('book')}</Button>}
      />

      {/* A doctor is waiting on each of these */}
      {pending.length > 0 ? (
        <Section title={`${t('pendingRequests')} (${pending.length})`}>
          <div className="stack gap-3">
            {pending.map((r) => {
              const isRecords = r.kind === 'records';
              const key = `${r.kind}-${r.id}`;
              const note = isRecords ? r.records_reason : r.reason;
              return (
                <Card key={key}>
                  <div className="spread wrap gap-4">
                    <div className="row gap-3 grow">
                      <PersonAvatar
                        id={r.doctor_id}
                        name={r.doctor_name}
                        src={assetUrl(r.profile_image_url)}
                        size={40}
                      />
                      <div className="grow">
                        <div className="row gap-2 wrap">
                          <span className="strong">{r.doctor_name}</span>
                          <Badge tone={isRecords ? 'brand' : 'pending'}>
                            {isRecords ? 'Wants to see your records' : 'Wants to connect'}
                          </Badge>
                        </div>
                        <div className="muted text-sm mt-1">
                          {[r.specialization || 'Doctor', r.hospital].filter(Boolean).join(' · ')}
                          {' · asked '}{relativeDate(isRecords ? r.updated_at : r.created_at, lang)}
                        </div>
                        {note ? (
                          <p className="text-sm mt-2" style={{ maxWidth: '60ch' }}>“{note}”</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="row gap-2">
                      <Button
                        variant="primary" icon="check"
                        loading={deciding === key}
                        onClick={() => decide(r, 'approved')}
                      >
                        {t('approve')}
                      </Button>
                      <Button
                        variant="danger-quiet" icon="x"
                        disabled={deciding === key}
                        onClick={() => decide(r, 'denied')}
                      >
                        {t('decline')}
                      </Button>
                    </div>
                  </div>
                  <p className="muted text-xs mt-4">
                    {isRecords
                      ? 'If you say yes, this doctor can read your past visits, medicines and diagnoses. You can close them again at any time.'
                      : 'Connecting lets this doctor see your profile and work with you. It does not open your health records. They have to ask for that separately.'}
                  </p>
                </Card>
              );
            })}
          </div>
        </Section>
      ) : null}

      <div className="grid grid--main">
        <div>
          <Section title={t('upcoming')} action={<Link className="text-sm" to="/app/appointments">{t('viewAll')}</Link>}>
            {loading ? (
              <SkeletonRows rows={2} />
            ) : upcoming.length === 0 ? (
              <Card>
                <EmptyState
                  compact
                  icon="calendar"
                  title={t('noAppointments')}
                  description="Your next visits with a doctor will show up here."
                  action={<Button to="/app/care-team" variant="primary" icon="plus">{t('book')}</Button>}
                />
              </Card>
            ) : (
              <div className="stack gap-3">
                {upcoming.slice(0, 3).map((a) => (
                  <Card key={a.id}>
                    <div className="spread wrap gap-3">
                      <div className="row gap-3 grow">
                        <div
                          style={{
                            width: 46, textAlign: 'center', padding: 'var(--sp-2) 0',
                            background: 'var(--primary-subtle)', borderRadius: 'var(--r-md)',
                          }}
                        >
                          <div className="text-xs muted" style={{ textTransform: 'uppercase' }}>
                            {new Date(a.consultation_date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { month: 'short' })}
                          </div>
                          <div className="strong" style={{ fontSize: 'var(--fs-md)' }}>
                            {new Date(a.consultation_date).getDate()}
                          </div>
                        </div>
                        <div className="grow">
                          <div className="strong">{a.doctor_name}</div>
                          <div className="muted text-sm">
                            {a.specialization || 'Visit'} · {relativeDate(a.consultation_date, lang)}
                          </div>
                        </div>
                      </div>
                      <Badge status={a.status} />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Section>

          <Section title={t('recentActivity')} action={<Link className="text-sm" to="/app/records">{t('viewAll')}</Link>}>
            {loading ? (
              <SkeletonRows rows={2} />
            ) : activity.length === 0 ? (
              <Card>
                <EmptyState compact icon="records" title={t('noRecords')}
                  description="After a doctor sees you, their notes and medicines will show up here." />
              </Card>
            ) : (
              <Card flush>
                <div className="rows">
                  {activity.slice(0, 4).map((c) => (
                    <div className="row-item" key={c.id}>
                      <span className="card__icon"><Icon name="clipboard" size={17} /></span>
                      <div className="grow">
                        <div className="row-item__title">{c.diagnosis || 'Visit'}</div>
                        <div className="row-item__meta">
                          {c.doctor_name} · {formatDate(c.consultation_date, lang)}
                        </div>
                      </div>
                      <Badge status={c.status} />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Section>
        </div>

        {/* ------------------------------------------------------- sidebar */}
        <div className="stack gap-4">
          <div className="idcard">
            <div className="idcard__label">{t('healthId')}</div>
            <div className="idcard__value">{user?.patient_id || '-'}</div>
            <p className="text-xs mt-2" style={{ color: 'var(--pine-200)', position: 'relative' }}>
              Show this to your doctor. They can scan it and ask to connect with you.
            </p>
            <div className="idcard__actions">
              <button type="button" className="idcard__btn" onClick={copyId}>
                <Icon name="copy" size={15} /> {t('copy')}
              </button>
              <button type="button" className="idcard__btn" onClick={() => setQrOpen(true)}>
                <Icon name="qr" size={15} /> Show code
              </button>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Stat label={t('diagnoses')} value={loading ? '–' : diagnoses} icon="stethoscope" />
            <Stat label={t('prescriptions')} value={loading ? '–' : prescriptions} icon="pill" tone="accent" />
          </div>

          <Card>
            <CardHeader title={t('quickActions')} />
            <div className="stack gap-2">
              <Button to="/app/care-team" icon="search" block>Find a doctor</Button>
              <Button to="/app/records" icon="records" block>See my records</Button>
              <Button to="/app/profile" icon="user" block>Edit my profile</Button>
            </div>
          </Card>

          {summary?.unread_notifications ? (
            <Notice tone="info" action={<Button to="/app/notifications" size="sm">Open</Button>}>
              You have {summary.unread_notifications} new message
              {summary.unread_notifications === 1 ? '' : 's'}.
            </Notice>
          ) : null}
        </div>
      </div>

      <QrDialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        value={user?.patient_id}
        name={user?.full_name || user?.name}
        label={t('healthId')}
        caption="A doctor can scan this to ask to connect. Your health records stay closed until you allow them separately."
      />
    </>
  );
}
