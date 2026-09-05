import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PageHeader, Section, Card, CardHeader, Stat, Badge, Button, Avatar,
  EmptyState, SkeletonRows, Notice, Icon, useToast,
} from '../../components/ui';
import { QrDialog } from '../../components/QrCode';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { useAsyncAll } from '../../lib/useAsync';
import { patient as patientApi } from '../../lib/services';
import { formatDate, relativeDate, greetingKey, isUpcoming } from '../../lib/format';
import { errorMessage } from '../../lib/api';

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
  const pending = (data?.requests || []).filter((r) => r.status === 'pending');

  const upcoming = appointments.filter((a) => isUpcoming(a.consultation_date) && a.status !== 'cancelled');
  const diagnoses = consultations.filter((c) => c.diagnosis).length;
  const prescriptions = consultations.filter((c) => c.prescription).length;

  // Booking stores the patient's reason as notes, so notes alone do not make
  // it a past visit. It counts once a doctor has written it up.
  const activity = consultations.filter(
    (c) => c.diagnosis || c.prescription || c.status === 'completed',
  );

  const firstName = (user?.full_name || user?.name || '').split(' ')[0];

  const decide = async (id, decision) => {
    setDeciding(id);
    try {
      await patientApi.decideAccess(id, decision);
      toast.success(decision === 'approved' ? 'Done. This doctor can now see your records.' : 'Done. This doctor cannot see your records.');
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
            {pending.map((r) => (
              <Card key={r.id}>
                <div className="spread wrap gap-4">
                  <div className="row gap-3 grow">
                    <Avatar name={r.doctor_name} size={40} />
                    <div className="grow">
                      <div className="strong">{r.doctor_name}</div>
                      <div className="muted text-sm">
                        {r.specialization || 'Doctor'} · asked {relativeDate(r.created_at, lang)}
                      </div>
                    </div>
                  </div>
                  <div className="row gap-2">
                    <Button
                      variant="primary" icon="check"
                      loading={deciding === r.id}
                      onClick={() => decide(r.id, 'approved')}
                    >
                      {t('approve')}
                    </Button>
                    <Button
                      variant="danger-quiet" icon="x"
                      disabled={deciding === r.id}
                      onClick={() => decide(r.id, 'denied')}
                    >
                      {t('decline')}
                    </Button>
                  </div>
                </div>
                <p className="muted text-xs mt-4">
                  If you say yes, this doctor can read your past visits. You can say no without
                  giving a reason, and you can change your mind later.
                </p>
              </Card>
            ))}
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
              Show this to your doctor so they can find your file quickly.
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
        caption="Your doctor can scan this code to open your file. No typing needed."
      />
    </>
  );
}
