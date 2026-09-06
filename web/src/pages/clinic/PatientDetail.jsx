import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  PageHeader, Card, CardHeader, Badge, Button, Avatar, DetailRow,
  EmptyState, SkeletonRows, Notice, Dialog, Field, Icon, useToast, Stat,
} from '../../components/ui';
import ReportDialog from '../../components/ReportDialog';
import { useI18n } from '../../lib/i18n';
import { useAsync } from '../../lib/useAsync';
import { clinic as clinicApi } from '../../lib/services';
import { formatLongDate, relativeDate } from '../../lib/format';
import { assetUrl, errorMessage } from '../../lib/api';

// Whole years, so the sidebar can say "32 years" without any working out
const ageFrom = (dob) => {
  if (!dob) return null;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - born.getFullYear();
  const month = now.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < born.getDate())) years -= 1;
  return years >= 0 && years < 130 ? years : null;
};

// A refused record is the access rules working, not a failure, so it is
// explained rather than shown as an error.
export default function PatientDetail() {
  const { patientId } = useParams();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();

  const [writing, setWriting] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [asking, setAsking] = useState(false);

  const { data, loading, error, refetch } = useAsync(
    () => clinicApi.lookupPatient(patientId),
    [patientId],
  );

  const denied = error && /no access/i.test(error);
  const notFound = error && /not found/i.test(error);
  const consultations = data?.consultations || [];

  // A doctor who typed an ID and was refused can ask to connect right here
  const askToConnect = async () => {
    setAsking(true);
    try {
      await clinicApi.askConnect(patientId, null);
      toast.success('Your request was sent. You are connected once they say yes.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setAsking(false);
    }
  };

  // The second permission, asked for after the two are connected
  const askForRecords = async () => {
    setAsking(true);
    try {
      await clinicApi.askRecords(patientId, null);
      toast.success('Your request was sent. Their records open once they agree.');
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setAsking(false);
    }
  };

  const age = ageFrom(data?.date_of_birth);
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
          title={notFound ? 'Patient not found' : 'You are not connected with this person'}
          actions={<Button icon="arrowLeft" onClick={() => navigate('/clinic/patients')}>Back to patients</Button>}
        />
        <Card>
          <EmptyState
            icon={notFound ? 'search' : 'lock'}
            title={notFound ? `No patient found with ID ${patientId}` : 'This page is private'}
            description={
              notFound
                ? 'Please check the health ID and try again. An ID looks like BC-2026-00001.'
                : 'Ask this person to connect with you. Once they agree, you can see their profile and ask to see their health records.'
            }
            action={
              notFound
                ? <Button to="/clinic/patients" variant="primary">Back to patients</Button>
                : (
                  <div className="row gap-2 wrap" style={{ justifyContent: 'center' }}>
                    <Button
                      variant="primary"
                      icon="send"
                      loading={asking}
                      onClick={askToConnect}
                    >
                      Ask to connect
                    </Button>
                    <Button to="/clinic/patients">Back to patients</Button>
                  </div>
                )
            }
          />
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="We could not open this file" />
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
              Add a note
            </Button>
          </>
        }
      />

      <div className="grid grid--main">
        <div>
          {/* Being connected is not the same as being allowed to read a
              history, so the second permission is asked for here. */}
          {!data.can_read_records ? (
            <Notice
              tone="info"
              title="You are connected, but their records are closed"
              action={
                data.records_status === 'pending' ? null : (
                  <Button size="sm" variant="primary" icon="records" loading={asking} onClick={askForRecords}>
                    Ask to see them
                  </Button>
                )
              }
            >
              {data.records_status === 'pending'
                ? `${data.full_name.split(' ')[0]} has your request and will answer on their home page.`
                : 'You can see who this person is and the notes you write yourself. Their past visits, medicines and diagnoses need their permission.'}
            </Notice>
          ) : null}

          {consultations.length === 0 ? (
            <Card>
              <EmptyState
                icon="clipboard"
                title="No notes yet"
                description={
                  data.can_read_records
                    ? 'This person has no visits written down yet.'
                    : 'Add your first note for this patient to start their history with you.'
                }
                action={<Button variant="primary" icon="plus" onClick={() => setWriting(true)}>Add a note</Button>}
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
                        <div className="muted text-sm">
                          {relativeDate(c.consultation_date, lang)}
                          {c.doctor_name ? ` · written by ${c.doctor_name}` : ''}
                        </div>
                      </div>
                      <Badge status={c.status} />
                    </div>

                    <div className="stack gap-3">
                      {c.diagnosis ? <Line icon="stethoscope" label="Diagnosis" value={c.diagnosis} /> : null}
                      {c.prescription ? <Line icon="pill" label="Medicine" value={c.prescription} /> : null}
                      {c.notes ? <Line icon="clipboard" label="Notes" value={c.notes} /> : null}
                      {!c.diagnosis && !c.prescription && !c.notes ? (
                        <p className="muted text-sm">Booked. No notes added yet.</p>
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
              <Avatar name={data.full_name} src={assetUrl(data.profile_image_url)} size={64} />
              <div>
                <div className="strong">{data.full_name}</div>
                <div className="muted text-sm mono">{data.patient_id}</div>
              </div>
              <div className="row gap-2 wrap" style={{ justifyContent: 'center' }}>
                <Badge tone="accepted">Connected</Badge>
                {data.can_read_records
                  ? <Badge tone="brand">Records open</Badge>
                  : <Badge tone="neutral">Records closed</Badge>}
              </div>
            </div>

            <DetailRow label="Age" value={age != null ? `${age} years` : null} icon="user" />
            <DetailRow label="Gender" value={data.gender} icon="user" />
            <DetailRow label="Lives in" value={data.address} icon="location" />
            <DetailRow label="Email" value={data.email} icon="mail" />
            <DetailRow label="Phone" value={data.phone} icon="phone" />

            <div className="mt-4 no-print">
              <Button variant="ghost" size="sm" icon="alert" onClick={() => setReporting(true)}>
                Report this patient
              </Button>
            </div>
          </Card>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Stat label="Visits" value={consultations.length} icon="clipboard" />
            <Stat label="Diagnoses" value={withDiagnosis} icon="stethoscope" tone="accent" />
          </div>

          <Notice tone="info">
            {data.can_read_records
              ? `${data.full_name.split(' ')[0]} allowed you to see their health records. Any medicine you write here shows up for them right away.`
              : `You are connected with ${data.full_name.split(' ')[0]}. Any note you write is theirs to read, and you can see your own notes here.`}
          </Notice>
        </div>
      </div>

      <ConsultationDialog
        open={writing}
        onClose={() => setWriting(false)}
        patient={data}
        onSaved={() => { setWriting(false); refetch(); }}
      />

      <ReportDialog
        open={reporting}
        person={{ id: data.id, name: data.full_name }}
        onClose={() => setReporting(false)}
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
    if (!form.consultation_date) next.consultation_date = 'Please choose the date of the visit.';
    if (!form.diagnosis.trim() && !form.notes.trim()) {
      next.diagnosis = 'Please add what you found, or at least a short note.';
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
      toast.success('Your note was saved.');
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
      title="Add a note for this visit"
      subtitle={patient ? `${patient.full_name} · ${patient.patient_id}` : ''}
      width={580}
      footer={
        <>
          <Button onClick={onClose} block>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={busy} block>Save note</Button>
        </>
      }
    >
      <form className="stack gap-4" onSubmit={submit}>
        <Field
          label="Date of the visit" type="date" required
          value={form.consultation_date} onChange={set('consultation_date')}
          error={errors.consultation_date}
        />
        <Field
          label="What did you find?" icon="stethoscope"
          placeholder="For example: malaria, confirmed by a rapid test"
          value={form.diagnosis} onChange={set('diagnosis')} error={errors.diagnosis}
        />
        <Field
          label="Medicine" textarea rows={3} icon="pill"
          placeholder="Name of the medicine, how much, how often, and for how many days."
          value={form.prescription} onChange={set('prescription')}
        />
        <Field
          label="Other notes" textarea rows={4}
          placeholder="What you saw, what you checked, and what happens next."
          hint="The patient can read this in their records."
          value={form.notes} onChange={set('notes')}
        />
      </form>
    </Dialog>
  );
}
