import React, { useState } from 'react';
import {
  PageHeader, Card, Badge, Button, Avatar, Tabs, EmptyState,
  SkeletonRows, Notice, useToast,
} from '../../components/ui';
import { useI18n } from '../../lib/i18n';
import { useAsync } from '../../lib/useAsync';
import { clinic as clinicApi } from '../../lib/services';
import { relativeDate } from '../../lib/format';
import { errorMessage } from '../../lib/api';

/**
 * Access requests raised by patients.
 *
 * Accepting a request is what unlocks a patient's record for this clinician, so
 * the consequence is stated on the card rather than left implicit.
 */
export default function Requests({ onChange }) {
  const { t, lang } = useI18n();
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [acting, setActing] = useState(null);

  const { data, loading, error, refetch } = useAsync(() => clinicApi.requests(), []);
  const requests = data || [];

  const pending = requests.filter((r) => r.status === 'pending');
  const resolved = requests.filter((r) => r.status !== 'pending');
  const list = tab === 'pending' ? pending : resolved;

  const decide = async (id, status, name) => {
    setActing(id);
    try {
      await clinicApi.decideRequest(id, status);
      toast.success(
        status === 'accepted'
          ? `You said yes. ${name} has been added to your patients.`
          : `You said no to ${name}.`,
      );
      refetch();
      onChange?.();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setActing(null);
    }
  };

  return (
    <>
      <PageHeader
        title={t('requests')}
        description="Patients who would like you to be their doctor."
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'pending', label: t('pending'), count: pending.length },
          { value: 'resolved', label: 'Answered', count: resolved.length },
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
              icon="inbox"
              title={tab === 'pending' ? 'No requests waiting' : 'Nothing answered yet'}
              description={
                tab === 'pending'
                  ? 'When a patient asks for your help, it will show up here so you can say yes or no.'
                  : 'Requests you have already answered will show up here.'
              }
            />
          </Card>
        ) : (
          <div className="stack gap-3">
            {list.map((r) => (
              <Card key={r.id}>
                <div className="spread wrap gap-4">
                  <div className="row gap-3 grow">
                    <Avatar name={r.patient_name} size={44} />
                    <div className="grow">
                      <div className="strong">{r.patient_name}</div>
                      <div className="muted text-sm">
                        <span className="mono">{r.patient_id}</span> · asked {relativeDate(r.created_at, lang)}
                      </div>
                      {r.reason ? (
                        <p className="text-sm mt-2" style={{ maxWidth: '60ch' }}>“{r.reason}”</p>
                      ) : null}
                    </div>
                  </div>

                  {r.status === 'pending' ? (
                    <div className="row gap-2">
                      <Button
                        variant="primary" icon="check"
                        loading={acting === r.id}
                        onClick={() => decide(r.id, 'accepted', r.patient_name)}
                      >
                        Say yes
                      </Button>
                      <Button
                        variant="danger-quiet" icon="x"
                        disabled={acting === r.id}
                        onClick={() => decide(r.id, 'rejected', r.patient_name)}
                      >
                        {t('decline')}
                      </Button>
                    </div>
                  ) : (
                    <Badge status={r.status} />
                  )}
                </div>

                {r.status === 'pending' ? (
                  <p className="muted text-xs mt-4">
                    If you say yes, this patient joins your list. You can only open their records
                    after they also say yes on their side.
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
