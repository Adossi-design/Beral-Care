import React, { useState } from 'react';
import {
  PageHeader, Card, Badge, Button, Stat, ChipGroup, EmptyState,
  SkeletonRows, Notice, Icon, ConfirmDialog, useToast,
} from '../../components/ui';
import PersonAvatar from '../../components/PersonCard';
import { Stars } from '../../components/Rating';
import { useI18n } from '../../lib/i18n';
import { useAsync } from '../../lib/useAsync';
import { admin as adminApi, reviews as reviewsApi } from '../../lib/services';
import { formatDate } from '../../lib/format';
import { errorMessage } from '../../lib/api';

// A file attached to a rating, opened with the token rather than linked
function Attachment({ review }) {
  const [state, setState] = useState({ url: null, loading: false, error: null });

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const blob = await reviewsApi.evidence(review.id);
      setState({ url: URL.createObjectURL(blob), loading: false, error: null });
    } catch (err) {
      setState({ url: null, loading: false, error: errorMessage(err) });
    }
  };

  const isImage = (review.evidence_name || '').match(/\.(png|jpe?g|gif|webp)$/i);

  return (
    <div className="stack gap-3 mt-3">
      <div className="row gap-3 evidence-picked">
        <Icon name="clipboard" size={17} />
        <span className="grow truncate text-sm">{review.evidence_name || 'Attached file'}</span>
        {!state.url ? (
          <Button size="sm" icon="eye" loading={state.loading} onClick={load}>Open</Button>
        ) : null}
      </div>
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      {state.url ? (
        isImage ? (
          <div className="evidence-view"><img src={state.url} alt="Attached to the rating" /></div>
        ) : (
          <Button icon="external" href={state.url} target="_blank" rel="noreferrer">
            Open the file in a new tab
          </Button>
        )
      ) : null}
    </div>
  );
}

export default function Ratings() {
  const { t, lang } = useI18n();
  const toast = useToast();

  const [filter, setFilter] = useState('all');
  const [confirm, setConfirm] = useState(null); // { kind, review }
  const [busy, setBusy] = useState(false);

  const { data, loading, error, refetch } = useAsync(
    () => adminApi.reviews({
      rating: filter === 'low' ? 'low' : undefined,
      withFile: filter === 'file' ? true : undefined,
    }),
    [filter],
  );

  const list = data?.reviews || [];
  const counts = data?.counts || {};

  const act = async () => {
    if (!confirm) return;
    const { kind, review } = confirm;
    setBusy(true);
    try {
      if (kind === 'delete') {
        await reviewsApi.remove(review.id);
        toast.success('That rating was removed.');
      } else {
        const next = review.doctor_blocked ? 0 : 1;
        await adminApi.setSuspended(review.doctor_id, next);
        toast.success(next
          ? `${review.doctor_name} is now blocked.`
          : `${review.doctor_name} can log in again.`);
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
        title="Ratings"
        description="What patients wrote about doctors. Read the low ones first, and open anything a patient attached before deciding."
        actions={<Button icon="refresh" onClick={refetch}>Refresh</Button>}
      />

      <div className="grid grid--stats mb-6">
        <Stat label="Ratings" value={loading ? '-' : Number(counts.total || 0)} icon="star" />
        <Stat
          label="Low ratings"
          value={loading ? '-' : Number(counts.low || 0)}
          icon="alert"
          tone={Number(counts.low) ? 'warning' : 'primary'}
        />
        <Stat label="With a file" value={loading ? '-' : Number(counts.with_file || 0)} icon="clipboard" tone="accent" />
      </div>

      <div className="toolbar">
        <ChipGroup
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'low', label: 'One and two stars' },
            { value: 'file', label: 'With a file' },
          ]}
        />
        <span className="muted text-sm">{list.length} shown</span>
      </div>

      {error ? (
        <Notice tone="danger" action={<Button size="sm" onClick={refetch}>{t('retry')}</Button>}>{error}</Notice>
      ) : loading ? (
        <SkeletonRows rows={3} height={92} />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon="star"
            title="Nothing to read here"
            description={
              filter === 'all'
                ? 'When a patient rates a doctor, what they wrote appears here.'
                : 'No ratings match this filter.'
            }
          />
        </Card>
      ) : (
        <div className="stack gap-3">
          {list.map((r) => (
            <Card key={r.id}>
              <div className="spread wrap gap-4">
                <div className="row gap-3 grow">
                  <PersonAvatar id={r.doctor_id} name={r.doctor_name} size={40} />
                  <div className="grow">
                    <div className="row gap-2 wrap">
                      <span className="strong">{r.doctor_name}</span>
                      {r.doctor_blocked ? <Badge tone="suspended">Blocked</Badge> : null}
                    </div>
                    <div className="muted text-sm mt-1">
                      {[r.specialization, r.hospital].filter(Boolean).join(' · ') || 'Doctor'}
                    </div>
                  </div>
                </div>
                <div className="row gap-2">
                  <Stars value={r.rating} size={15} />
                  <span className="muted text-sm">{formatDate(r.updated_at, lang)}</span>
                </div>
              </div>

              <p className="text-sm mt-4" style={{ whiteSpace: 'pre-wrap' }}>{r.comment}</p>
              <div className="muted text-xs mt-2">
                Written by {r.patient_name || 'a deleted account'}. Their name is not shown
                on the doctor's profile.
              </div>

              {Number(r.has_evidence) ? <Attachment review={r} /> : null}

              <div className="row gap-2 wrap mt-4">
                <Button
                  size="sm"
                  icon={r.doctor_blocked ? 'check' : 'lock'}
                  variant={r.doctor_blocked ? 'secondary' : 'danger-quiet'}
                  onClick={() => setConfirm({ kind: 'block', review: r })}
                >
                  {r.doctor_blocked ? 'Unblock this doctor' : 'Block this doctor'}
                </Button>
                <Button size="sm" variant="ghost" icon="trash" onClick={() => setConfirm({ kind: 'delete', review: r })}>
                  Remove this rating
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={act}
        loading={busy}
        tone={confirm?.kind === 'delete' || !confirm?.review?.doctor_blocked ? 'danger' : 'primary'}
        title={
          confirm?.kind === 'delete'
            ? 'Remove this rating?'
            : confirm?.review?.doctor_blocked
              ? `Unblock ${confirm?.review?.doctor_name}?`
              : `Block ${confirm?.review?.doctor_name}?`
        }
        message={
          confirm?.kind === 'delete'
            ? 'It disappears from the doctor profile and from the average. Do this when a rating breaks the rules, not because a doctor dislikes it.'
            : confirm?.review?.doctor_blocked
              ? 'They will be able to log in again straight away.'
              : 'They will be logged out and cannot log in again. Their records and their patients are kept.'
        }
        confirmLabel={
          confirm?.kind === 'delete' ? 'Yes, remove it'
            : confirm?.review?.doctor_blocked ? 'Yes, unblock' : 'Yes, block'
        }
      />
    </>
  );
}
