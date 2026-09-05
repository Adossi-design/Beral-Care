import React, { useState, useMemo } from 'react';
import {
  PageHeader, Card, Badge, Button, Avatar, SearchInput, ChipGroup,
  EmptyState, SkeletonRows, Notice, ConfirmDialog, useToast, Icon,
} from '../../components/ui';
import { useI18n } from '../../lib/i18n';
import { useAsync } from '../../lib/useAsync';
import { admin as adminApi } from '../../lib/services';
import { formatDate } from '../../lib/format';
import { errorMessage } from '../../lib/api';

export default function Users() {
  const { t, lang } = useI18n();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [confirm, setConfirm] = useState(null); // { kind, user }
  const [busy, setBusy] = useState(false);

  const { data, loading, error, refetch, setData } = useAsync(() => adminApi.users(), []);
  const users = data || [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (role !== 'all' && u.role !== role) return false;
      if (!q) return true;
      return [u.full_name, u.email, u.phone, u.patient_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [users, query, role]);

  const runAction = async () => {
    if (!confirm) return;
    const { kind, user } = confirm;
    setBusy(true);
    try {
      if (kind === 'delete') {
        await adminApi.remove(user.id);
        setData((list) => list.filter((u) => u.id !== user.id));
        toast.success(`${user.full_name} was deleted.`);
      } else {
        const next = user.suspended ? 0 : 1;
        await adminApi.setSuspended(user.id, next);
        setData((list) => list.map((u) => (u.id === user.id ? { ...u, suspended: next } : u)));
        toast.success(next ? `${user.full_name} is now blocked.` : `${user.full_name} can log in again.`);
      }
      setConfirm(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t('users')}
        description="Every account on Beral Care. Blocking stops someone logging in, but keeps their records."
        actions={<Button icon="refresh" onClick={refetch}>Refresh</Button>}
      />

      <div className="toolbar">
        <div className="toolbar__search">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, phone, or health ID"
          />
        </div>
        <ChipGroup
          value={role}
          onChange={setRole}
          options={[
            { value: 'all', label: 'All' },
            { value: 'patient', label: 'Patients' },
            { value: 'doctor', label: 'Doctors' },
            { value: 'admin', label: 'Admins' },
          ]}
        />
        <span className="muted text-sm">{filtered.length} of {users.length}</span>
      </div>

      {error ? (
        <Notice tone="danger" action={<Button size="sm" onClick={refetch}>{t('retry')}</Button>}>{error}</Notice>
      ) : loading ? (
        <SkeletonRows rows={5} height={56} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="users"
            title="No accounts found"
            description="Try another word, or change the filter."
            action={<Button onClick={() => { setQuery(''); setRole('all'); }}>Clear filters</Button>}
          />
        </Card>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="table table--responsive">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Identifier</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td data-label="Name">
                      <span className="row gap-3">
                        <Avatar name={u.full_name} size={32} />
                        <span className="strong">{u.full_name}</span>
                      </span>
                    </td>
                    <td data-label="Role">
                      <Badge tone={u.role === 'admin' ? 'info' : u.role === 'doctor' ? 'brand' : 'neutral'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td data-label="Contact">
                      <div className="text-sm">{u.email}</div>
                      {u.phone ? <div className="muted text-xs">{u.phone}</div> : null}
                    </td>
                    <td data-label="Identifier">
                      <span className="mono text-sm">{u.patient_id || '-'}</span>
                    </td>
                    <td data-label="Joined">{formatDate(u.created_at, lang)}</td>
                    <td data-label="Status">
                      {u.suspended ? <Badge status="suspended" /> : <Badge tone="accepted">Active</Badge>}
                    </td>
                    <td data-label="">
                      <span className="table__actions">
                        <Button
                          size="sm"
                          icon={u.suspended ? 'check' : 'lock'}
                          onClick={() => setConfirm({ kind: 'suspend', user: u })}
                        >
                          {u.suspended ? 'Unblock' : 'Block'}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger-quiet"
                          icon="trash"
                          aria-label={`Delete ${u.full_name}`}
                          onClick={() => setConfirm({ kind: 'delete', user: u })}
                        />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runAction}
        loading={busy}
        tone={confirm?.kind === 'delete' ? 'danger' : 'primary'}
        title={
          confirm?.kind === 'delete'
            ? `Delete ${confirm?.user?.full_name}?`
            : confirm?.user?.suspended
              ? `Unblock ${confirm?.user?.full_name}?`
              : `Block ${confirm?.user?.full_name}?`
        }
        message={
          confirm?.kind === 'delete'
            ? 'This deletes the account and everything in it: visits, requests, and messages. This cannot be undone.'
            : confirm?.user?.suspended
              ? 'They will be able to log in again straight away.'
              : 'They will be logged out and cannot log in again. Their records are kept.'
        }
        confirmLabel={
          confirm?.kind === 'delete' ? 'Yes, delete'
            : confirm?.user?.suspended ? 'Yes, unblock' : 'Yes, block'
        }
      />
    </>
  );
}
