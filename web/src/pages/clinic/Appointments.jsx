import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader, Card, Badge, Button, Avatar, Tabs, EmptyState,
  SkeletonRows, Notice, Dialog, Field, useToast, Icon,
} from '../../components/ui';
import { useI18n } from '../../lib/i18n';
import { useAsync } from '../../lib/useAsync';
import { clinic as clinicApi } from '../../lib/services';
import { formatLongDate, relativeDate, isUpcoming, groupBy } from '../../lib/format';
import { errorMessage } from '../../lib/api';

/**
 * Clinician schedule.
 *
 * Grouped by day rather than presented as one flat list — a clinician reads
 * their schedule a day at a time, not as an undifferentiated stream of rows.
 */
export default function Appointments() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState('upcoming');
  const [booking, setBooking] = useState(false);

  const { data, loading, error, refetch } = useAsync(() => clinicApi.appointments(), []);
  const appointments = data || [];

  const { upcoming, past } = useMemo(() => {
    const up = [];
    const old = [];
    for (const a of appointments) {
      (isUpcoming(a.consultation_date) && a.status !== 'cancelled' ? up : old).push(a);
    }
    up.sort((x, y) => new Date(x.consultation_date) - new Date(y.consultation_date));
    old.sort((x, y) => new Date(y.consultation_date) - new Date(x.consultation_date));
    return { upcoming: up, past: old };
  }, [appointments]);

  const list = tab === 'upcoming' ? upcoming : past;
  const byDay = useMemo(
    () => groupBy(list, (a) => new Date(a.consultation_date).toDateString()),
    [list],
  );

  return (
    <>
      <PageHeader
        title={t('appointments')}
        description="Your visits with patients."
        actions={<Button variant="primary" icon="plus" onClick={() => setBooking(true)}>Book a visit</Button>}
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'upcoming', label: t('upcoming'), count: upcoming.length },
          { value: 'past', label: 'Past visits', count: past.length },
        ]}
      />

      <div className="mt-6">
        {error ? (
          <Notice tone="danger" action={<Button size="sm" onClick={refetch}>{t('retry')}</Button>}>{error}</Notice>
        ) : loading ? (
          <SkeletonRows rows={3} />
        ) : list.length === 0 ? (
          <Card>
            <EmptyState
              icon="calendar"
              title={tab === 'upcoming' ? 'Nothing booked yet' : 'No past visits'}
              description={
                tab === 'upcoming'
                  ? 'Visits booked by patients, and visits you book yourself, show up here.'
                  : 'Visits that are finished will show up here.'
              }
              action={tab === 'upcoming'
                ? <Button variant="primary" icon="plus" onClick={() => setBooking(true)}>Book a visit</Button>
                : null}
            />
          </Card>
        ) : (
          <div className="stack gap-6">
            {[...byDay.entries()].map(([day, items]) => (
              <section key={day}>
                <div className="row gap-3 mb-4">
                  <h2 className="section__title">{formatLongDate(items[0].consultation_date, lang)}</h2>
                  <span className="badge badge--neutral">{items.length}</span>
                  <span className="muted text-sm">{relativeDate(items[0].consultation_date, lang)}</span>
                </div>

                <Card flush>
                  <div className="rows">
                    {items.map((a) => (
                      <div className="row-item" key={a.id}>
                        <Avatar name={a.patient_name} size={38} />
                        <div className="grow">
                          <div className="row-item__title">{a.patient_name}</div>
                          <div className="row-item__meta mono">{a.patient_id}</div>
                          {a.notes ? <div className="text-sm mt-2">{a.notes}</div> : null}
                        </div>
                        <Badge status={a.status} />
                        <Button
                          size="sm"
                          iconRight="chevronRight"
                          onClick={() => navigate(`/clinic/patients/${encodeURIComponent(a.patient_id)}`)}
                        >
                          Open
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>
            ))}
          </div>
        )}
      </div>

      <ScheduleDialog
        open={booking}
        onClose={() => setBooking(false)}
        onSaved={() => { setBooking(false); refetch(); }}
      />
    </>
  );
}

function ScheduleDialog({ open, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ patient_id: '', appointment_date: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.patient_id.trim()) next.patient_id = 'Please enter the patient health ID.';
    if (!form.appointment_date) next.appointment_date = 'Please choose a day.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await clinicApi.createAppointment({
        patient_id: form.patient_id.trim().toUpperCase(),
        appointment_date: form.appointment_date,
        notes: form.notes.trim() || null,
      });
      toast.success('The visit was booked.');
      setForm({ patient_id: '', appointment_date: '', notes: '' });
      onSaved();
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
      title="Book a visit"
      subtitle="Book a follow up visit for one of your patients."
      footer={
        <>
          <Button onClick={onClose} block>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={busy} block>Book it</Button>
        </>
      }
    >
      <form className="stack gap-4" onSubmit={submit}>
        <Field
          label="Patient health ID"
          icon="idCard"
          required
          placeholder="BC-2026-00001"
          value={form.patient_id}
          onChange={(e) => setForm((f) => ({ ...f, patient_id: e.target.value.toUpperCase() }))}
          error={errors.patient_id}
          hint="This patient must already have allowed you to see their records."
        />
        <Field
          label="Which day?"
          type="date"
          required
          min={today}
          value={form.appointment_date}
          onChange={(e) => setForm((f) => ({ ...f, appointment_date: e.target.value }))}
          error={errors.appointment_date}
        />
        <Field
          label="Note for the patient"
          textarea
          rows={3}
          placeholder="For example: come back so we can check your blood pressure."
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </form>
    </Dialog>
  );
}
