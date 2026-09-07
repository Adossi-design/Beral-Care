import React, { useState } from 'react';
import {
  PageHeader, Card, Badge, Button, Stat, ChipGroup, EmptyState, DetailRow,
  SkeletonRows, Notice, Field, Icon, Dialog, useToast,
} from '../../components/ui';
import PersonAvatar from '../../components/PersonCard';
import { useI18n } from '../../lib/i18n';
import { useAsync } from '../../lib/useAsync';
import { admin as adminApi } from '../../lib/services';
import { formatDate } from '../../lib/format';
import api, { errorMessage } from '../../lib/api';

const STATUS = {
  pending: { label: 'Waiting to be checked', tone: 'pending' },
  verified: { label: 'Verified', tone: 'accepted' },
  refused: { label: 'Not verified', tone: 'rejected' },
};

// The licence document, fetched with the token rather than linked
function Licence({ doctorId }) {
  const [state, setState] = useState({ url: null, loading: false, error: null });

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api.get(adminApi.licenceUrl(doctorId), { responseType: 'blob' });
      setState({ url: URL.createObjectURL(res.data), loading: false, error: null });
    } catch (err) {
      setState({ url: null, loading: false, error: errorMessage(err) });
    }
  };

  return (
    <div className="stack gap-3 mt-3">
      {!state.url ? (
        <Button size="sm" icon="eye" loading={state.loading} onClick={load}>Open the licence</Button>
      ) : null}
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      {state.url ? (
        <div className="evidence-view"><img src={state.url} alt="The licence sent by this doctor" /></div>
      ) : null}
    </div>
  );
}

/**
 * Checking doctors before patients can find them. Anyone can type "doctor"
 * on a registration form, so this page is what stands between that and a
 * patient trusting them with their health.
 */
export default function Doctors() {
  const { t, lang } = useI18n();
  const toast = useToast();

  const [status, setStatus] = useState('pending');
  const [deciding, setDeciding] = useState(null); // { doctor, decision }
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, loading, error, refetch } = useAsync(
    () => adminApi.doctors(status === 'all' ? undefined : status),
    [status],
  );

  const doctors = data?.doctors || [];
  const counts = data?.counts || {};

  const decide = async () => {
    if (!deciding) return;
    setBusy(true);
    try {
      await adminApi.decideDoctor(deciding.doctor.id, deciding.decision, note.trim() || null);
      toast.success(deciding.decision === 'verified'
        ? `${deciding.doctor.full_name} is now visible to patients.`
        : `${deciding.doctor.full_name} stays hidden from patients.`);
      setDeciding(null);
      setNote('');
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Doctors"
        description="A doctor is only shown to patients after you have checked their licence. Read what they sent, then decide."
        actions={<Button icon="refresh" onClick={refetch}>Refresh</Button>}
      />

      <div className="grid grid--stats mb-6">
        <Stat
          label="Waiting"
          value={loading ? '-' : Number(counts.pending || 0)}
          icon="inbox"
          tone={Number(counts.pending) ? 'warning' : 'primary'}
        />
        <Stat label="Verified" value={loading ? '-' : Number(counts.verified || 0)} icon="checkCircle" tone="success" />
        <Stat label="Not verified" value={loading ? '-' : Number(counts.refused || 0)} icon="x" tone="primary" />
      </div>

      <div className="toolbar">
        <ChipGroup
          value={status}
          onChange={setStatus}
          options={[
            { value: 'pending', label: 'Waiting' },
            { value: 'verified', label: 'Verified' },
            { value: 'refused', label: 'Not verified' },
            { value: 'all', label: 'All' },
          ]}
        />
        <span className="muted text-sm">{doctors.length} shown</span>
      </div>

      {error ? (
        <Notice tone="danger" action={<Button size="sm" onClick={refetch}>{t('retry')}</Button>}>{error}</Notice>
      ) : loading ? (
        <SkeletonRows rows={3} height={110} />
      ) : doctors.length === 0 ? (
        <Card>
          <EmptyState
            icon="stethoscope"
            title={status === 'pending' ? 'Nobody is waiting' : 'No doctors here'}
            description={
              status === 'pending'
                ? 'When a doctor registers, they appear here until you check them.'
                : 'Try another filter.'
            }
          />
        </Card>
      ) : (
        <div className="stack gap-3">
          {doctors.map((d) => (
            <Card key={d.id}>
              <div className="spread wrap gap-4">
                <div className="row gap-3 grow">
                  <PersonAvatar id={d.id} name={d.full_name} size={44} />
                  <div className="grow">
                    <div className="row gap-2 wrap">
                      <span className="strong">{d.full_name}</span>
                      <Badge tone={STATUS[d.verification]?.tone}>{STATUS[d.verification]?.label}</Badge>
                      {d.suspended ? <Badge tone="suspended">Blocked</Badge> : null}
                    </div>
                    <div className="muted text-sm mt-1">
                      {[d.specialization, d.hospital].filter(Boolean).join(' · ') || 'No details given'}
                    </div>
                  </div>
                </div>
                <div className="muted text-sm">Registered {formatDate(d.created_at, lang)}</div>
              </div>

              <div className="mt-4">
                <DetailRow label="Licence number" value={d.licence_number} icon="idCard" />
                <DetailRow label="Email" value={d.email} icon="mail" />
                <DetailRow label="Phone" value={d.phone} icon="phone" />
                {d.verification_note ? (
                  <DetailRow label="Your note" value={d.verification_note} icon="clipboard" />
                ) : null}
              </div>

              {Number(d.has_licence_file) ? (
                <Licence doctorId={d.id} />
              ) : (
                <p className="muted text-xs mt-3 row gap-2">
                  <Icon name="info" size={14} />
                  No licence document was uploaded. You can still verify on the number,
                  or wait until they send it from their profile.
                </p>
              )}

              <div className="row gap-2 wrap mt-4">
                {d.verification !== 'verified' ? (
                  <Button
                    size="sm" variant="primary" icon="check"
                    onClick={() => { setDeciding({ doctor: d, decision: 'verified' }); setNote(''); }}
                  >
                    Verify this doctor
                  </Button>
                ) : null}
                {d.verification !== 'refused' ? (
                  <Button
                    size="sm" variant="danger-quiet" icon="x"
                    onClick={() => { setDeciding({ doctor: d, decision: 'refused' }); setNote(''); }}
                  >
                    Do not verify
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!deciding}
        onClose={() => setDeciding(null)}
        title={deciding?.decision === 'verified'
          ? `Verify ${deciding?.doctor?.full_name}?`
          : `Do not verify ${deciding?.doctor?.full_name}?`}
        subtitle={deciding?.decision === 'verified'
          ? 'Patients will be able to find them and connect with them.'
          : 'They keep their account but stay hidden from patients.'}
        width={460}
        footer={
          <>
            <Button onClick={() => setDeciding(null)} block>Cancel</Button>
            <Button
              variant={deciding?.decision === 'verified' ? 'primary' : 'danger'}
              onClick={decide}
              loading={busy}
              block
            >
              {deciding?.decision === 'verified' ? 'Yes, verify' : 'Yes, keep them hidden'}
            </Button>
          </>
        }
      >
        <Field
          label={deciding?.decision === 'verified' ? 'Note (optional)' : 'What is missing?'}
          textarea
          rows={3}
          placeholder={deciding?.decision === 'verified'
            ? 'For example: licence checked against the medical council register.'
            : 'For example: the licence number does not match the document you sent.'}
          hint="This is sent to the doctor as a message."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Dialog>
    </>
  );
}
