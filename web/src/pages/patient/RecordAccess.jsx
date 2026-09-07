import React from 'react';
import {
  PageHeader, Card, Button, EmptyState, SkeletonRows, Notice, Icon,
} from '../../components/ui';
import PersonAvatar from '../../components/PersonCard';
import { useI18n } from '../../lib/i18n';
import { useAsync } from '../../lib/useAsync';
import { patient as patientApi } from '../../lib/services';
import { formatLongDate, relativeDate } from '../../lib/format';
import { assetUrl } from '../../lib/api';

const WHAT_HAPPENED = {
  opened_profile: 'Opened your page and saw your profile',
  opened_records: 'Read your health records',
  assistant_context: 'Used your health records with the assistant',
};

/**
 * Saying who may read your records is only half of it. This page is the other
 * half: it shows the patient every time a doctor actually did.
 */
export default function RecordAccess() {
  const { t, lang } = useI18n();
  const { data, loading, error, refetch } = useAsync(() => patientApi.recordAccess(), []);
  const entries = data || [];

  return (
    <>
      <PageHeader
        title="Who opened my records"
        description="Every time one of your doctors opened your page or read your records, it is written down here."
        actions={<Button icon="refresh" onClick={refetch}>Refresh</Button>}
      />

      {error ? (
        <Notice tone="danger" action={<Button size="sm" onClick={refetch}>{t('retry')}</Button>}>{error}</Notice>
      ) : loading ? (
        <SkeletonRows rows={4} height={68} />
      ) : entries.length === 0 ? (
        <Card>
          <EmptyState
            icon="lock"
            title="Nobody has opened your records"
            description="When a doctor you allowed opens your page, you will see it here with the date and time."
          />
        </Card>
      ) : (
        <Card flush>
          <div className="rows">
            {entries.map((e) => (
              <div className="row-item" key={e.id}>
                <PersonAvatar
                  id={e.doctor_id}
                  name={e.doctor_name}
                  src={assetUrl(e.profile_image_url)}
                  size={36}
                />
                <div className="grow">
                  <div className="row-item__title">{e.doctor_name || 'A deleted account'}</div>
                  <div className="row-item__meta">
                    {WHAT_HAPPENED[e.action] || e.action}
                    {e.detail ? ` · ${e.detail}` : ''}
                  </div>
                </div>
                <div className="text-sm muted" style={{ textAlign: 'right' }}>
                  <div>{formatLongDate(e.created_at, lang)}</div>
                  <div className="text-xs">{relativeDate(e.created_at, lang)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Notice tone="info" title="If something here looks wrong">
        You can close your records to a doctor at any time on the My doctors page, and
        you can report an account that opened something it should not have.
      </Notice>
    </>
  );
}
