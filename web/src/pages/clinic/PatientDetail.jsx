import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  PageHeader, Card, CardHeader, Badge, Button, Avatar, DetailRow,
  EmptyState, SkeletonRows, Notice, Dialog, Field, Icon, useToast, Stat,
} from '../../components/ui';
import { useI18n } from '../../lib/i18n';
import { useAsync } from '../../lib/useAsync';
import { clinic as clinicApi } from '../../lib/services';
import { formatLongDate, relativeDate } from '../../lib/format';
import { errorMessage } from '../../lib/api';

/**
 * Patient record, as seen by a clinician with approved access.
 *
 * A 403 here is not an error to apologise for — it is the access control model
 * working as designed, so it is explained rather than shown as a failure.
 */
export default function PatientDetail() {
  const { patientId } = useParams();
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  const [writing, setWriting] = useState(false);

  const { data, loading, error, refetch } = useAsync(
    () => clinicApi.lookupPatient(patientId),
    [patientId],
  );

  const denied = error && /no access/i.test(error);
  const notFound = error && /not found/i.test(error);
  const consultations = data?.consultations || [];

  const withDiagnosis = consultations.filter((c) => c.diagnosis).length;
  const withPrescription = consultations.filter((c) => c.prescription).length;

  if (loading) {
    return (
      <>
        <PageHeader title="Loading record…" />
        <SkeletonRows rows={4} height={90} />
      </>
    );
  }

  if (denied || notFound) {
    return (
      <>
        <PageHeader
          title={notFound ? 'Patient not found' : 'Access not granted'}
          actions={<Button icon="arrowLeft" onClick={() => navigate('/clinic/patients')}>Back to patients</Button>}
        />
        <Card>
          <EmptyState
            icon={notFound ? 'search' : 'lock'}
            title={notFound ? `No patient with ID ${patientId}` : 'This record is sealed'}
            description={
              notFound
                ? 'Check the Health ID and try again. IDs look like BC-2026-00001.'
                : 'The patient has not approved your access. Ask them to open Beral Care and approve your request, then this record will open.'
            }
            action={<Button to="/clinic/patients" variant="primary">Back to patients</Button>}
          />
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Could not load record" />
        <Notice tone="danger" action={<Button size="sm" onClick={refetch}>{t('retry')}</Button>}>{error}</Notice>
      </>
    );
  }

  return (
    <>
      <Link to="/clinic/patients" className="row gap-2 text-sm muted mb-4">
        <Icon name="arrowLeft" size={15} /> {t('patients')}
      </Link>

      <PageHeader
        title={data.full_name}
        description={<span className="mono">{data.patient_id}</span>}
        actions={
          <>
            <Button icon="print" onClick={() => window.print()} className="no-print">Print</Button>
            <Button variant="primary" icon="plus" onClick={() => setWriting(true)}>
              New consultation
            </Button>
          </>
        }
      />

      <div className="grid grid--main">
        <div>
          {consultations.length === 0 ? (
            <Card>
              <EmptyState
                icon="clipboard"
                title="No consultations recorded"
                description="Record the first consultation for this patient to begin their history with you."
                action={<Button variant="primary" icon="plus" onClick={() => setWriting(true)}>New consultation</Button>}
              />
            </Card>
          ) : (
            <div className="timeline">
              {consultations.map((c) => (
                <article className="timeline__item" key={c.id}>
                  <span className={`timeline__dot ${c.status !== 'completed' ? 'timeline__dot--muted' : ''}`} />
                  <Card>
                    <div className="spread wrap gap-3 mb-4">
                      <div>
                        <div className="strong">{formatLongDate(c.consultation_date, lang)}</div>
                        <div className="muted text-sm">{relativeDate(c.consultation_date, lang)}</div>
                      </div>
                      <Badge status={c.status} />
                    </div>

                    <div className="stack gap-3">
                      {c.diagnosis ? <Line icon="stethoscope" label="Diagnosis" value={c.diagnosis} /> : null}
                      {c.prescription ? <Line icon="pill" label="Prescription" value={c.prescription} /> : null}
                      {c.notes ? <Line icon="clipboard" label="Notes" value={c.notes} /> : null}
                      {!c.diagnosis && !c.prescription && !c.notes ? (
                        <p className="muted text-sm">Booked, not yet written up.</p>
                      ) : null}
                    </div>
                  </Card>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="stack gap-4">
          <Card>
            <div className="stack center gap-3 mb-4" style={{ textAlign: 'center' }}>
              <Avatar name={data.full_name} size={64} />
              <div>
                <div className="strong">{data.full_name}</div>
                <div className="muted text-sm mono">{data.patient_id}</div>
              </div>
              <Badge tone="accepted">Access granted</Badge>
            </div>

            <DetailRow label="Email" value={data.email} icon="mail" />
            <DetailRow label="Phone" value={data.phone} icon="phone" />
          </Card>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Stat label="Consultations" value={consultations.length} icon="clipboard" />
            <Stat label="Diagnoses" value={withDiagnosis} icon="stethoscope" tone="accent" />
          </div>

          <Notice tone="info">
            You are seeing this record because {data.full_name.split(' ')[0]} approved your access
            request. Prescriptions recorded here appear in their app immediately.
          </Notice>
        </div>
      </div>

      <ConsultationDialog
        open={writing}
        onClose={() => setWriting(false)}
        patient={data}
        onSaved={() => { setWriting(false); refetch(); }}
      />
    </>
  );
}

function Line({ icon, label, value }) {
  return (
    <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
      <span className="card__icon" style={{ width: 30, height: 30 }}><Icon name={icon} size={15} /></span>
      <div className="grow">
        <div className="text-xs strong muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <p style={{ marginTop: 2 }}>{value}</p>
      </div>
    </div>
  );
}

function ConsultationDialog({ open, onClose, patient, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    consultation_date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    prescription: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.consultation_date) next.consultation_date = 'Select the consultation date.';
    if (!form.diagnosis.trim() && !form.notes.trim()) {
      next.diagnosis = 'Record a diagnosis, or at least clinical notes.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await clinicApi.createConsultation({
        patient_id: patient.id,
        consultation_date: form.consultation_date,
        diagnosis: form.diagnosis.trim() || null,
        prescription: form.prescription.trim() || null,
        notes: form.notes.trim() || null,
      });
      toast.success('Consultation recorded.');
      setForm({ consultation_date: new Date().toISOString().split('T')[0], diagnosis: '', prescription: '', notes: '' });
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
      title="Record a consultation"
      subtitle={patient ? `${patient.full_name} · ${patient.patient_id}` : ''}
      width={580}
      footer={
        <>
          <Button onClick={onClose} block>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={busy} block>Save consultation</Button>
        </>
      }
    >
      <form className="stack gap-4" onSubmit={submit}>
        <Field
          label="Consultation date" type="date" required
          value={form.consultation_date} onChange={set('consultation_date')}
          error={errors.consultation_date}
        />
        <Field
          label="Diagnosis" icon="stethoscope"
          placeholder="e.g. Uncomplicated malaria, confirmed by RDT"
          value={form.diagnosis} onChange={set('diagnosis')} error={errors.diagnosis}
        />
        <Field
          label="Prescription" textarea rows={3} icon="pill"
          placeholder="Medicine, dose, frequency, and duration."
          value={form.prescription} onChange={set('prescription')}
        />
        <Field
          label="Clinical notes" textarea rows={4}
          placeholder="Presentation, examination findings, and follow-up plan."
          hint="The patient can read these notes in their record."
          value={form.notes} onChange={set('notes')}
        />
      </form>
    </Dialog>
  );
}
