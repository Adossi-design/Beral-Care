import React, { useState, useMemo } from 'react';
import {
  PageHeader, Card, Badge, Button, Avatar, Tabs, EmptyState,
  SkeletonRows, Dialog, Field, SelectField, useToast, Icon,
} from '../../components/ui';
import { useI18n } from '../../lib/i18n';
import { useAsyncAll } from '../../lib/useAsync';
import { patient as patientApi } from '../../lib/services';
import { formatLongDate, relativeDate, isUpcoming } from '../../lib/format';
import { errorMessage } from '../../lib/api';

export default function Appointments() {
  const { t, lang } = useI18n();
  const toast = useToast();

  const [tab, setTab] = useState('upcoming');
  const [booking, setBooking] = useState(false);

  const { data, loading, refetch } = useAsyncAll({
    appointments: () => patientApi.appointments(),
    doctors: () => patientApi.doctors(),
  }, []);

  const appointments = data?.appointments || [];
  const doctors = data?.doctors || [];

  const { upcoming, past } = useMemo(() => {
    const up = [];
    const old = [];
    for (const a of appointments) {
      (isUpcoming(a.consultation_date) && a.status !== 'cancelled' ? up : old).push(a);
    }
    up.sort((x, y) => new Date(x.consultation_date) - new Date(y.consultation_date));
    return { upcoming: up, past: old };
  }, [appointments]);

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <>
      <PageHeader
        title={t('appointments')}
        description="Consultations you have booked with clinicians on Beral Care."
        actions={<Button variant="primary" icon="plus" onClick={() => setBooking(true)}>{t('book')}</Button>}
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'upcoming', label: t('upcoming'), count: upcoming.length },
          { value: 'past', label: 'Past', count: past.length },
        ]}
      />

      <div className="mt-6">
        {loading ? (
          <SkeletonRows rows={3} />
        ) : list.length === 0 ? (
          <Card>
            <EmptyState
              icon="calendar"
              title={tab === 'upcoming' ? t('noAppointments') : 'No past appointments'}
              description={
                tab === 'upcoming'
                  ? 'Book a consultation with any clinician on the platform.'
                  : 'Completed and cancelled consultations will be listed here.'
              }
              action={tab === 'upcoming'
                ? <Button variant="primary" icon="plus" onClick={() => setBooking(true)}>{t('book')}</Button>
                : null}
            />
          </Card>
        ) : (
          <div className="stack gap-3">
            {list.map((a) => (
              <Card key={a.id}>
                <div className="spread wrap gap-4">
                  <div className="row gap-3 grow">
                    <Avatar name={a.doctor_name} size={44} />
                    <div className="grow">
                      <div className="strong">{a.doctor_name}</div>
                      <div className="muted text-sm">{a.specialization || 'General consultation'}</div>
                      <div className="row gap-2 muted text-sm mt-2">
                        <Icon name="calendar" size={15} />
                        {formatLongDate(a.consultation_date, lang)}
                        <span className="muted">· {relativeDate(a.consultation_date, lang)}</span>
                      </div>
                      {a.notes ? <p className="text-sm mt-2">{a.notes}</p> : null}
                    </div>
                  </div>
                  <Badge status={a.status} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BookDialog
        open={booking}
        onClose={() => setBooking(false)}
        doctors={doctors}
        onBooked={() => { setBooking(false); refetch(); toast.success('Appointment requested.'); }}
      />
    </>
  );
}

function BookDialog({ open, onClose, doctors, onBooked }) {
  const [form, setForm] = useState({ doctor_id: '', consultation_date: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const today = new Date().toISOString().split('T')[0];

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.doctor_id) next.doctor_id = 'Choose a clinician.';
    if (!form.consultation_date) next.consultation_date = 'Choose a date.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await patientApi.book({
        doctor_id: Number(form.doctor_id),
        consultation_date: form.consultation_date,
        notes: form.notes || null,
        status: 'pending',
      });
      setForm({ doctor_id: '', consultation_date: '', notes: '' });
      onBooked();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Book an appointment"
      subtitle="Choose a clinician and a preferred date. They will confirm the time."
      footer={
        <>
          <Button onClick={onClose} block>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={busy} block>Request appointment</Button>
        </>
      }
    >
      <form className="stack gap-4" onSubmit={submit}>
        <SelectField
          label="Clinician"
          required
          value={form.doctor_id}
          onChange={(e) => setForm((f) => ({ ...f, doctor_id: e.target.value }))}
          error={errors.doctor_id}
          options={[
            { value: '', label: 'Select a clinician…' },
            ...doctors.map((d) => ({
              value: String(d.id),
              label: `${d.full_name}${d.specialization ? ` — ${d.specialization}` : ''}`,
            })),
          ]}
        />

        <Field
          label="Preferred date"
          type="date"
          required
          min={today}
          value={form.consultation_date}
          onChange={(e) => setForm((f) => ({ ...f, consultation_date: e.target.value }))}
          error={errors.consultation_date}
        />

        <Field
          label="Reason for visit"
          textarea
          rows={3}
          placeholder="Briefly describe your symptoms or the reason for the consultation."
          hint="Optional, but it helps the clinician prepare."
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </form>
    </Dialog>
  );
}
