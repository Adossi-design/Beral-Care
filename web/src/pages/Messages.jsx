import React from 'react';
import {
  PageHeader, Card, Button, EmptyState, SkeletonRows, Icon, Notice, useToast,
} from '../components/ui';
import { useI18n } from '../lib/i18n';
import { useAsync } from '../lib/useAsync';
import { notifications as notificationsApi } from '../lib/services';
import { relativeDate } from '../lib/format';
import { errorMessage } from '../lib/api';

const ICON_FOR = {
  consultation_request: 'inbox',
  consultation_accepted: 'checkCircle',
  consultation_denied: 'x',
  access_approved: 'checkCircle',
  access_denied: 'x',
  consultation_created: 'clipboard',
  appointment: 'calendar',
  admin_warning: 'alert',
};

// Shared by patients and doctors, so a message from an administrator reaches
// both of them in the same place.
export default function Messages({ onChange }) {
  const { t, lang } = useI18n();
  const toast = useToast();
  const { data, loading, error, refetch, setData } = useAsync(() => notificationsApi.list(), []);

  const items = data || [];
  const unread = items.filter((n) => !n.is_read);

  const markRead = async (id) => {
    setData((list) => list.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    try {
      await notificationsApi.markRead(id);
      onChange?.();
    } catch (err) {
      toast.error(errorMessage(err));
      refetch();
    }
  };

  const markAll = async () => {
    const ids = unread.map((n) => n.id);
    setData((list) => list.map((n) => ({ ...n, is_read: 1 })));
    try {
      await Promise.all(ids.map((id) => notificationsApi.markRead(id)));
      toast.success('All messages marked as read.');
      onChange?.();
    } catch {
      refetch();
    }
  };

  return (
    <>
      <PageHeader
        title={t('notifications')}
        description={unread.length ? `${unread.length} new` : 'You have read everything.'}
        actions={unread.length ? <Button icon="check" onClick={markAll}>Mark all as read</Button> : null}
      />

      {error ? (
        <Notice tone="danger" action={<Button size="sm" onClick={refetch}>{t('retry')}</Button>}>{error}</Notice>
      ) : loading ? (
        <SkeletonRows rows={4} height={72} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="bell"
            title={t('noNotifications')}
            description="News about your visits, your records, and requests will show up here."
          />
        </Card>
      ) : (
        <Card flush>
          <div className="rows">
            {items.map((n) => {
              const fromAdmin = n.type === 'admin_warning';
              return (
                <div
                  className="row-item"
                  key={n.id}
                  style={{ background: n.is_read ? undefined : 'var(--primary-subtle)' }}
                >
                  <span
                    className="card__icon"
                    style={fromAdmin ? { background: 'var(--amber-50)', color: 'var(--amber-600)' } : undefined}
                  >
                    <Icon name={ICON_FOR[n.type] || 'bell'} size={17} />
                  </span>
                  <div className="grow">
                    {fromAdmin ? (
                      <div className="text-xs strong" style={{ color: 'var(--amber-600)' }}>
                        Message from the Beral Care team
                      </div>
                    ) : null}
                    <div className={n.is_read ? '' : 'strong'} style={{ whiteSpace: 'pre-wrap' }}>{n.message}</div>
                    <div className="row-item__meta">
                      {n.related_user_name ? `${n.related_user_name} · ` : ''}
                      {relativeDate(n.created_at, lang)}
                    </div>
                  </div>
                  {!n.is_read ? (
                    <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Mark read</Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}
