import React, { useState, useMemo } from 'react';
import {
  PageHeader, Card, Badge, Button, Avatar, Stat, SearchInput, ChipGroup,
  SelectField, EmptyState, SkeletonRows, Notice, Icon,
} from '../../components/ui';
import ReportDetail from './ReportDetail';
import { useI18n } from '../../lib/i18n';
import { useAsync } from '../../lib/useAsync';
import { moderation } from '../../lib/services';
import { formatDate } from '../../lib/format';
import { REPORT_REASONS } from '../../components/ReportDialog';

const STATUS_TONE = {
  pending: 'pending', under_review: 'info', resolved: 'accepted', dismissed: 'neutral',
};

const STATUS_LABEL = {
  pending: 'Waiting', under_review: 'Being checked', resolved: 'Resolved', dismissed: 'Dismissed',
};

const reasonLabel = (v) => REPORT_REASONS.find((r) => r.value === v)?.label || v;

export default function Reports() {
  const { t, lang } = useI18n();

  const [status, setStatus] = useState('pending');
  const [role, setRole] = useState('all');
  const [reason, setReason] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);

  const { data, loading, error, refetch } = useAsync(
    () => moderation.list({
      status: status === 'all' ? undefined : status,
      role: role === 'all' ? undefined : role,
      from: from || undefined,
      to: to || undefined,
    }),
    [status, role, from, to],
  );

  const counts = data?.counts || {};

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.reports || []).filter((r) => {
      if (reason !== 'all' && r.reason !== reason) return false;
      if (!q) return true;
      return [r.reported_name, r.reporter_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [data, reason, query]);

  const clearFilters = () => {
    setStatus('all'); setRole('all'); setReason('all');
    setFrom(''); setTo(''); setQuery('');
  };

  return (
    <>
      <PageHeader
        title="Reports"
        description="People report an account when something goes wrong. A report is only a claim until you have read it, so nothing happens to anyone before you decide."
        actions={<Button icon="refresh" onClick={refetch}>Refresh</Button>}
      />

      <div className="grid grid--stats mb-6">
        <Stat label="Waiting" value={loading ? '-' : Number(counts.pending || 0)} icon="inbox"
          tone={Number(counts.pending) ? 'warning' : 'primary'} />
        <Stat label="Being checked" value={loading ? '-' : Number(counts.under_review || 0)} icon="clock" tone="accent" />
        <Stat label="Resolved" value={loading ? '-' : Number(counts.resolved || 0)} icon="checkCircle" tone="success" />
        <Stat label="Dismissed" value={loading ? '-' : Number(counts.dismissed || 0)} icon="check" tone="primary" />
      </div>

      <div className="toolbar">
        <ChipGroup
          value={status}
          onChange={setStatus}
          options={[
            { value: 'pending', label: 'Waiting' },
            { value: 'under_review', label: 'Being checked' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'dismissed', label: 'Dismissed' },
            { value: 'all', label: 'All' },
          ]}
        />
        <ChipGroup
          value={role}
          onChange={setRole}
          options={[
            { value: 'all', label: 'Everyone' },
            { value: 'patient', label: 'Patients' },
            { value: 'doctor', label: 'Doctors' },
          ]}
        />
        <span className="muted text-sm">{list.length} report{list.length === 1 ? '' : 's'}</span>
      </div>

      <div className="filter-row mb-5">
        <div className="filter-row__search">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by the name of either person"
          />
        </div>
        <SelectField
          options={[{ value: 'all', label: 'Any reason' }, ...REPORT_REASONS]}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          aria-label="Reason"
        />
        <label className="filter-row__date">
          <span className="muted text-xs">From</span>
          <span className="input-wrap">
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </span>
        </label>
        <label className="filter-row__date">
          <span className="muted text-xs">To</span>
          <span className="input-wrap">
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </span>
        </label>
      </div>

      {error ? (
        <Notice tone="danger" action={<Button size="sm" onClick={refetch}>{t('retry')}</Button>}>{error}</Notice>
      ) : loading ? (
        <SkeletonRows rows={3} height={80} />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon="shield"
            title={status === 'pending' ? 'Nothing is waiting for you' : 'No reports match these filters'}
            description={
              status === 'pending'
                ? 'When someone reports an account, it will appear here for you to read.'
                : 'Try a different filter or clear them all.'
            }
            action={status === 'pending' ? null : <Button onClick={clearFilters}>Clear filters</Button>}
          />
        </Card>
      ) : (
        <div className="stack gap-3">
          {list.map((r) => (
            <Card key={r.id}>
              <div className="spread wrap gap-4">
                <div className="row gap-3 grow">
                  <Avatar name={r.reported_name} size={40} />
                  <div className="grow">
                    <div className="row gap-2 wrap">
                      <span className="strong">{r.reported_name || 'Deleted account'}</span>
                      <Badge tone={r.reported_role === 'doctor' ? 'brand' : 'neutral'}>
                        {r.reported_role === 'doctor' ? 'Doctor' : 'Patient'}
                      </Badge>
                      {r.suspended ? (
                        <Badge tone="suspended">{r.suspended_until ? 'Blocked for a time' : 'Blocked'}</Badge>
                      ) : null}
                    </div>
                    <div className="muted text-sm mt-2">
                      {reasonLabel(r.reason)} · reported by {r.reporter_name || 'a deleted account'}
                      {' · '}{formatDate(r.created_at, lang)}
                    </div>
                  </div>
                </div>

                <div className="row gap-3">
                  {Number(r.has_evidence) ? (
                    <span className="row gap-1 muted text-xs">
                      <Icon name="clipboard" size={14} /> Evidence
                    </span>
                  ) : null}
                  <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  <Button size="sm" iconRight="chevronRight" onClick={() => setOpenId(r.id)}>Read it</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ReportDetail
        id={openId}
        onClose={() => setOpenId(null)}
        onChanged={refetch}
      />
    </>
  );
}
