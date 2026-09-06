import React, { useState, useMemo } from 'react';
import {
  PageHeader, Card, Badge, Button, SearchInput, EmptyState,
  SkeletonRows, Dialog, Field, Tabs, useToast, Icon, Notice,
} from '../../components/ui';
import ReportDialog from '../../components/ReportDialog';
import PersonAvatar from '../../components/PersonCard';
import { useI18n } from '../../lib/i18n';
import { useAsyncAll } from '../../lib/useAsync';
import { patient as patientApi } from '../../lib/services';
import { assetUrl, errorMessage } from '../../lib/api';
import { relativeDate } from '../../lib/format';

// Doctors and access status in one place, since the patient's real question is
// "who can see my records".
export default function CareTeam({ onChange }) {
  const { t, lang } = useI18n();
  const toast = useToast();

  const [tab, setTab] = useState('team');
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const [reporting, setReporting] = useState(null);

  const { data, loading, refetch } = useAsyncAll({
    doctors: () => patientApi.doctors(),
    requests: () => patientApi.accessRequests(),
  }, []);

  const doctors = data?.doctors || [];
  const requests = data?.requests || [];

  // Access state for each doctor, keyed by user id
  const statusFor = useMemo(() => {
    const map = new Map();
    for (const r of requests) map.set(r.doctor_id, r);
    return map;
  }, [requests]);

  const myTeam = doctors.filter((d) => {
    const state = statusFor.get(d.id)?.status;
    return state === 'accepted' || state === 'completed';
  });
  // Requests a doctor sent are the ones waiting on the patient
  const pending = requests.filter((r) => r.status === 'pending' && r.requested_by === 'doctor');

  const directory = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((d) =>
      [d.full_name, d.specialization, d.hospital]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [doctors, query]);

  const requestAccess = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await patientApi.requestAccess(target.id, reason.trim() || null);
      toast.success(`Your request was sent to ${target.full_name}.`);
      setTarget(null);
      setReason('');
      refetch();
      onChange?.();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (requestId, name) => {
    setRevoking(requestId);
    try {
      await patientApi.decideAccess(requestId, 'denied');
      toast.success(`Done. ${name} can no longer see your records.`);
      refetch();
      onChange?.();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setRevoking(null);
    }
  };

  return (
    <>
      <PageHeader
        title={t('careTeam')}
        description="Doctors who can see your records, and where to find new ones."
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'team', label: 'My doctors', count: myTeam.length },
          { value: 'directory', label: 'Find a doctor', count: doctors.length },
        ]}
      />

      <div className="mt-6">
        {loading ? <SkeletonRows rows={3} /> : tab === 'team' ? (
          <>
            {pending.length > 0 ? (
              <Notice tone="warning" title="Waiting for your answer">
                {pending.length} doctor{pending.length === 1 ? '' : 's'} asked to see your
                records. You can answer on the home page.
              </Notice>
            ) : null}

            {myTeam.length === 0 ? (
              <Card>
                <EmptyState
                  icon="stethoscope"
                  title="No doctor can see your records yet"
                  description="Your records stay private until you allow someone. Find a doctor to get started."
                  action={<Button variant="primary" onClick={() => setTab('directory')}>Find a doctor</Button>}
                />
              </Card>
            ) : (
              <div className="grid grid--cards">
                {myTeam.map((d) => {
                  const req = statusFor.get(d.id);
                  return (
                    <Card key={d.id}>
                      <div className="row gap-3 mb-4">
                        <PersonAvatar id={d.id} name={d.full_name} src={assetUrl(d.profile_image_url)} size={44} />
                        <div className="grow">
                          <div className="strong">{d.full_name}</div>
                          <div className="muted text-sm">{d.specialization || 'Doctor'}</div>
                        </div>
                        <Badge tone="accepted">Can see records</Badge>
                      </div>

                      {d.hospital ? (
                        <div className="row gap-2 muted text-sm mb-4">
                          <Icon name="hospital" size={15} /> {d.hospital}
                        </div>
                      ) : null}

                      <div className="row gap-2">
                        <Button
                          variant="danger-quiet"
                          size="sm"
                          icon="lock"
                          loading={revoking === req?.id}
                          onClick={() => revoke(req.id, d.full_name)}
                        >
                          Stop sharing
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="alert"
                          onClick={() => setReporting({ id: d.id, name: d.full_name })}
                        >
                          Report
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="toolbar">
              <div className="toolbar__search">
                <SearchInput
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, illness treated, or hospital"
                />
              </div>
            </div>

            {directory.length === 0 ? (
              <Card>
                <EmptyState
                  icon="search"
                  title="No doctors found"
                  description="Try another word."
                  action={<Button onClick={() => setQuery('')}>Clear</Button>}
                />
              </Card>
            ) : (
              <div className="grid grid--cards">
                {directory.map((d) => {
                  const req = statusFor.get(d.id);
                  const state = req?.status;
                  return (
                    <Card key={d.id}>
                      <div className="row gap-3 mb-4">
                        <PersonAvatar id={d.id} name={d.full_name} src={assetUrl(d.profile_image_url)} size={44} />
                        <div className="grow">
                          <div className="strong">{d.full_name}</div>
                          <div className="muted text-sm">{d.specialization || 'Doctor'}</div>
                        </div>
                      </div>

                      {d.hospital ? (
                        <div className="row gap-2 muted text-sm mb-4">
                          <Icon name="hospital" size={15} /> {d.hospital}
                        </div>
                      ) : null}

                      <div className="spread wrap gap-2">
                        {state === 'accepted' ? (
                          <Badge tone="accepted">Already your doctor</Badge>
                        ) : state === 'pending' ? (
                          <div className="stack gap-2">
                            <Badge tone="pending">Waiting for reply</Badge>
                            <span className="muted text-xs">
                              Sent {relativeDate(req.created_at, lang)}
                            </span>
                          </div>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            icon="plus"
                            onClick={() => setTarget(d)}
                          >
                            Ask to be my doctor
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          icon="alert"
                          onClick={() => setReporting({ id: d.id, name: d.full_name })}
                        >
                          Report
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <Dialog
        open={!!target}
        onClose={() => setTarget(null)}
        title="Ask this doctor to see you"
        subtitle={target ? `${target.full_name}${target.specialization ? ` · ${target.specialization}` : ''}` : ''}
        footer={
          <>
            <Button onClick={() => setTarget(null)} block>Cancel</Button>
            <Button variant="primary" onClick={requestAccess} loading={busy} block>Send request</Button>
          </>
        }
      >
        <div className="stack gap-4">
          <Notice tone="info">
            This tells the doctor you would like their help. They still cannot open your records
            until you say yes.
          </Notice>
          <Field
            label="What would you like help with?"
            textarea
            rows={4}
            placeholder="For example: pain in my chest when I walk."
            hint="You can leave this empty."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </Dialog>

      <ReportDialog
        open={!!reporting}
        person={reporting}
        onClose={() => setReporting(null)}
      />
    </>
  );
}
