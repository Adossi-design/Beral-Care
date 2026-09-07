import React, { useState } from 'react';
import {
  PageHeader, Card, Badge, Button, Stat, EmptyState, DetailRow,
  SkeletonRows, Notice, Dialog, useToast,
} from '../../components/ui';
import PersonAvatar from '../../components/PersonCard';
import { useI18n } from '../../lib/i18n';
import { useAsync } from '../../lib/useAsync';
import { admin as adminApi } from '../../lib/services';
import { formatDate } from '../../lib/format';
import { errorMessage } from '../../lib/api';

/**
 * People who have asked for their account to be closed. Their account is
 * already locked, so nothing more can happen in it. What is left is the part
 * only a person should do: read the reason, then remove the account for good.
 * The promise made on the privacy page is one working week, so the days
 * waiting are shown on every card.
 */
export default function Closures() {
  const { t, lang } = useI18n();
  const toast = useToast();

  const [confirm, setConfirm] = useState(null); // { person, action }
  const [busy, setBusy] = useState(false);

  const { data, loading, error, refetch } = useAsync(() => adminApi.closures(), []);
  const people = data || [];
  const overdue = people.filter((p) => Number(p.days_waiting) >= 7).length;

  const act = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.action === 'delete') {
        await adminApi.remove(confirm.person.id);
        toast.success(`${confirm.person.full_name} has been removed.`);
      } else {
        await adminApi.restore(confirm.person.id);
        toast.success(`${confirm.person.full_name} can log in again.`);
      }
      setConfirm(null);
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
        title="Closed accounts"
        description="These accounts are already locked. Read why the person left, then remove the account within one working week."
        actions={<Button icon="refresh" onClick={refetch}>Refresh</Button>}
      />

      <div className="grid grid--stats mb-6">
        <Stat label="Waiting to be removed" value={loading ? '-' : people.length} icon="inbox" tone={people.length ? 'warning' : 'primary'} />
        <Stat label="Past one week" value={loading ? '-' : overdue} icon="clock" tone={overdue ? 'danger' : 'primary'} />
      </div>

      {error ? (
        <Notice tone="danger" action={<Button size="sm" onClick={refetch}>{t('retry')}</Button>}>{error}</Notice>
      ) : loading ? (
        <SkeletonRows rows={2} height={120} />
      ) : people.length === 0 ? (
        <Card>
          <EmptyState
            icon="checkCircle"
            title="Nothing waiting"
            description="When someone closes their account, it appears here with the reason they gave."
          />
        </Card>
      ) : (
        <div className="stack gap-3">
          {people.map((p) => {
            const days = Number(p.days_waiting || 0);
            return (
              <Card key={p.id}>
                <div className="spread wrap gap-4">
                  <div className="row gap-3 grow">
                    <PersonAvatar id={p.id} name={p.full_name} size={44} />
                    <div className="grow">
                      <div className="row gap-2 wrap">
                        <span className="strong">{p.full_name}</span>
                        <Badge tone="suspended">Locked</Badge>
                        <Badge tone={days >= 7 ? 'rejected' : 'pending'}>
                          {days <= 0 ? 'Asked today' : days === 1 ? '1 day waiting' : `${days} days waiting`}
                        </Badge>
                      </div>
                      <div className="muted text-sm mt-1">
                        {{ patient: 'Patient', doctor: 'Doctor' }[p.role] || p.role}
                        {p.patient_id || p.doctor_id ? ` · ${p.patient_id || p.doctor_id}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="muted text-sm">Asked {formatDate(p.deletion_requested_at, lang)}</div>
                </div>

                <div className="mt-4">
                  <DetailRow label="Email" value={p.email} icon="mail" />
                  <DetailRow label="Why they left" value={p.deletion_reason} icon="clipboard" />
                </div>

                <div className="row gap-2 wrap mt-4">
                  <Button
                    size="sm" variant="danger" icon="trash"
                    onClick={() => setConfirm({ person: p, action: 'delete' })}
                  >
                    Remove for good
                  </Button>
                  <Button
                    size="sm" icon="refresh"
                    onClick={() => setConfirm({ person: p, action: 'restore' })}
                  >
                    Open the account again
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.action === 'delete'
          ? `Remove ${confirm?.person?.full_name}?`
          : `Open ${confirm?.person?.full_name} again?`}
        subtitle={confirm?.action === 'delete'
          ? 'Everything in this account goes with it, and it cannot be brought back.'
          : 'They will be able to log in with the same email address as before.'}
        width={460}
        footer={
          <>
            <Button onClick={() => setConfirm(null)} block>Cancel</Button>
            <Button
              variant={confirm?.action === 'delete' ? 'danger' : 'primary'}
              onClick={act}
              loading={busy}
              block
            >
              {confirm?.action === 'delete' ? 'Yes, remove it' : 'Yes, open it again'}
            </Button>
          </>
        }
      >
        {confirm?.action === 'delete' ? (
          <Notice tone="danger" title="This cannot be undone">
            The account, the visits, the notes, and the messages are all deleted.
            Only do this once you have read the reason and are sure.
          </Notice>
        ) : (
          <Notice tone="info" title="Only when they have asked">
            Open an account again when the person has written to you asking to come
            back, or when the request was clearly a mistake. They are told by message.
          </Notice>
        )}
      </Dialog>
    </>
  );
}
