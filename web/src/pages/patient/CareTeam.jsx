import React, { useState, useMemo } from 'react';
import {
  PageHeader, Card, Badge, Button, Avatar, SearchInput, EmptyState,
  SkeletonRows, Dialog, Field, Tabs, useToast, Icon, Notice,
} from '../../components/ui';
import { useI18n } from '../../lib/i18n';
import { useAsyncAll } from '../../lib/useAsync';
import { patient as patientApi } from '../../lib/services';
import { assetUrl, errorMessage } from '../../lib/api';
import { relativeDate } from '../../lib/format';

/**
 * Care team.
 *
 * Merges what the prototype split across two disconnected screens — a doctor
 * directory and a separate consultation-requests list. Access status belongs on
 * the clinician's own card, not on another page: the question a patient has is
 * "who can see my records", and this answers it in one place.
 */
export default function CareTeam({ onChange }) {
  const { t, lang } = useI18n();
  const toast = useToast();

  const [tab, setTab] = useState('team');
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState(null);

  const { data, loading, refetch } = useAsyncAll({
    doctors: () => patientApi.doctors(),
    requests: () => patientApi.accessRequests(),
  }, []);

  const doctors = data?.doctors || [];
  const requests = data?.requests || [];

  /** Access state for a clinician, keyed by their user id. */
  const statusFor = useMemo(() => {
    const map = new Map();
    for (const r of requests) map.set(r.doctor_id, r);
    return map;
  }, [requests]);

  const myTeam = doctors.filter((d) => statusFor.get(d.id)?.status === 'accepted');
  const pending = requests.filter((r) => r.status === 'pending');

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
      toast.success(`Request sent to ${target.full_name}.`);
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
      toast.success(`${name} can no longer read your records.`);
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
        description="Clinicians who can read your records, and the full directory to find more."
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'team', label: 'My care team', count: myTeam.length },
          { value: 'directory', label: 'Find a clinician', count: doctors.length },
        ]}
      />

      <div className="mt-6">
        {loading ? <SkeletonRows rows={3} /> : tab === 'team' ? (
          <>
            {pending.length > 0 ? (
              <Notice tone="warning" title="Awaiting your decision">
                {pending.length} clinician{pending.length === 1 ? '' : 's'} asked to read your
                records. Approve or decline from your overview.
              </Notice>
            ) : null}

            {myTeam.length === 0 ? (
              <Card>
                <EmptyState
                  icon="stethoscope"
                  title="No clinician has access yet"
                  description="Nobody can read your medical records until you approve them. Find a clinician in the directory to get started."
                  action={<Button variant="primary" onClick={() => setTab('directory')}>Browse the directory</Button>}
                />
              </Card>
            ) : (
              <div className="grid grid--cards">
                {myTeam.map((d) => {
                  const req = statusFor.get(d.id);
                  return (
                    <Card key={d.id}>
                      <div className="row gap-3 mb-4">
                        <Avatar name={d.full_name} src={assetUrl(d.profile_image_url)} size={44} />
                        <div className="grow">
                          <div className="strong">{d.full_name}</div>
                          <div className="muted text-sm">{d.specialization || 'Clinician'}</div>
                        </div>
                        <Badge tone="accepted">Access granted</Badge>
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
                          Revoke access
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
                  placeholder="Search by name, specialisation, or hospital…"
                />
              </div>
            </div>

            {directory.length === 0 ? (
              <Card>
                <EmptyState
                  icon="search"
                  title="No clinicians found"
                  description="Try a different search term."
                  action={<Button onClick={() => setQuery('')}>Clear search</Button>}
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
                        <Avatar name={d.full_name} src={assetUrl(d.profile_image_url)} size={44} />
                        <div className="grow">
                          <div className="strong">{d.full_name}</div>
                          <div className="muted text-sm">{d.specialization || 'Clinician'}</div>
                        </div>
                      </div>

                      {d.hospital ? (
                        <div className="row gap-2 muted text-sm mb-4">
                          <Icon name="hospital" size={15} /> {d.hospital}
                        </div>
                      ) : null}

                      {state === 'accepted' ? (
                        <Badge tone="accepted">In your care team</Badge>
                      ) : state === 'pending' ? (
                        <div className="stack gap-2">
                          <Badge tone="pending">Request pending</Badge>
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
                          Request consultation
                        </Button>
                      )}
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
        title={`Request a consultation`}
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
            Sending this request also asks the clinician to review your records. They cannot read
            anything until you approve their access.
          </Notice>
          <Field
            label="What would you like to discuss?"
            textarea
            rows={4}
            placeholder="Describe your symptoms or the reason for the consultation."
            hint="Optional."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </Dialog>
    </>
  );
}
