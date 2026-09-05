import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PageHeader, Card, CardHeader, Stat, Button, Avatar, Badge,
  SkeletonRows, Notice, EmptyState,
} from '../../components/ui';
import { useI18n } from '../../lib/i18n';
import { useAsyncAll } from '../../lib/useAsync';
import { admin as adminApi } from '../../lib/services';
import { formatDate, relativeDate } from '../../lib/format';

// Counts and account activity only. There is no route from here into a
// patient's records, and the server enforces that too.
export default function Overview() {
  const { t, lang } = useI18n();

  const { data, loading, error, refetch } = useAsyncAll({
    stats: () => adminApi.stats(),
    users: () => adminApi.users(),
  }, []);

  const stats = data?.stats;
  const users = data?.users || [];

  const { recent, suspended, growth } = useMemo(() => {
    const sorted = [...users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const cutoff = Date.now() - 30 * 86400000;
    return {
      recent: sorted.slice(0, 6),
      suspended: users.filter((u) => u.suspended).length,
      growth: users.filter((u) => new Date(u.created_at).getTime() > cutoff).length,
    };
  }, [users]);

  // Drawn inline rather than adding a charting library for one graph
  const weeks = useMemo(() => {
    const buckets = Array.from({ length: 12 }, () => 0);
    const now = Date.now();
    for (const u of users) {
      const age = Math.floor((now - new Date(u.created_at).getTime()) / (7 * 86400000));
      if (age >= 0 && age < 12) buckets[11 - age] += 1;
    }
    return buckets;
  }, [users]);
  const peak = Math.max(1, ...weeks);

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Accounts and activity on Beral Care."
        actions={<Button icon="refresh" onClick={refetch}>Refresh</Button>}
      />

      {error ? (
        <Notice tone="danger" action={<Button size="sm" onClick={refetch}>{t('retry')}</Button>}>{error}</Notice>
      ) : null}

      <div className="grid grid--stats mb-6">
        <Stat label="Patients" value={loading ? '–' : stats?.total_patients ?? 0} icon="users" />
        <Stat label="Doctors" value={loading ? '–' : stats?.total_doctors ?? 0} icon="stethoscope" tone="accent" />
        <Stat label="Visits" value={loading ? '–' : stats?.total_consultations ?? 0} icon="clipboard" tone="success" />
        <Stat
          label="Blocked"
          value={loading ? '–' : suspended}
          icon="lock"
          tone={suspended ? 'danger' : 'primary'}
          hint={suspended ? 'Please check these' : 'None blocked'}
        />
      </div>

      <div className="grid grid--main">
        <Card>
          <CardHeader
            title="Registrations"
            subtitle="New accounts each week, last 12 weeks"
            icon="chart"
          />
          {loading ? (
            <SkeletonRows rows={1} height={160} />
          ) : (
            <div
              className="row"
              style={{ gap: 6, height: 160, alignItems: 'flex-end' }}
              role="img"
              aria-label={`Registrations over the last 12 weeks, peak ${peak} in one week`}
            >
              {weeks.map((count, i) => (
                <div key={i} className="grow stack gap-2" style={{ alignItems: 'center' }}>
                  <span className="text-xs muted tabular">{count || ''}</span>
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max(3, (count / peak) * 120)}px`,
                      background: count ? 'var(--primary)' : 'var(--slate-200)',
                      borderRadius: 'var(--r-sm) var(--r-sm) 2px 2px',
                      transition: 'height var(--dur) var(--ease)',
                    }}
                  />
                  <span className="text-xs muted">{i === 0 ? '12w' : i === 11 ? 'now' : ''}</span>
                </div>
              ))}
            </div>
          )}
          <p className="muted text-xs mt-4">
            {growth} account{growth === 1 ? '' : 's'} created in the last 30 days.
          </p>
        </Card>

        <Card>
          <CardHeader
            title="Newest accounts"
            icon="users"
            action={<Link className="text-sm" to="/admin/users">{t('viewAll')}</Link>}
          />
          {loading ? (
            <SkeletonRows rows={4} height={44} />
          ) : recent.length === 0 ? (
            <EmptyState compact icon="users" title="No accounts yet" />
          ) : (
            <div className="stack gap-3">
              {recent.map((u) => (
                <div className="row gap-3" key={u.id}>
                  <Avatar name={u.full_name} size={32} />
                  <div className="grow">
                    <div className="text-sm strong truncate">{u.full_name}</div>
                    <div className="muted text-xs">
                      {u.role} · {relativeDate(u.created_at, lang)}
                    </div>
                  </div>
                  {u.suspended ? <Badge status="suspended" /> : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Notice tone="info" title="Admins cannot read health records">
        Admins can manage accounts and see totals only. They can never see anyone's illness,
        medicine, or doctor notes.
      </Notice>
    </>
  );
}
