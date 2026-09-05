import React from 'react';
import {
  PageHeader, Card, CardHeader, DetailRow, Notice, Button, Icon, useToast,
} from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { API_URL } from '../../lib/api';
import { formatDate } from '../../lib/format';

/**
 * Administrator settings.
 *
 * Deliberately informational. Configuration that affects security — CORS
 * origins, rate limits, provider keys — lives in the deployment environment,
 * not behind a web form where a mistake takes the platform down.
 */
export default function Settings() {
  const { user, signOut } = useAuth();
  const { t, lang, setLang } = useI18n();
  const toast = useToast();

  return (
    <>
      <PageHeader
        title={t('settings')}
        description="Your administrator account and platform configuration."
      />

      <div className="grid grid--2">
        <Card>
          <CardHeader title="Your account" icon="user" />
          <DetailRow label="Name" value={user?.full_name} icon="user" />
          <DetailRow label="Email" value={user?.email} icon="mail" />
          <DetailRow label="Role" value="Administrator" icon="shield" />
          <DetailRow label="Member since" value={formatDate(user?.created_at, lang)} icon="clock" />

          <div className="row gap-2 mt-4">
            <Button variant="danger-quiet" icon="logout" onClick={signOut}>{t('signOut')}</Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Preferences" icon="settings" />
          <div className="stack gap-4">
            <div>
              <div className="strong text-sm mb-2">{t('language')}</div>
              <div className="chips">
                {[{ v: 'en', l: 'English' }, { v: 'fr', l: 'Français' }].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    className="chip"
                    aria-pressed={lang === o.v}
                    onClick={() => { setLang(o.v); toast.success('Language updated.'); }}
                  >
                    {lang === o.v ? <Icon name="check" size={14} /> : null}
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Platform" icon="activity" />
          <DetailRow label="API endpoint" value={API_URL || 'Same origin'} icon="globe" />
          <DetailRow label="Interface version" value="2.0.0" icon="info" />
          <p className="muted text-xs mt-4">
            Database credentials, allowed origins, rate limits, and AI provider keys are configured
            through environment variables on the server.
          </p>
        </Card>

        <Card>
          <CardHeader title="Privacy boundary" icon="lock" />
          <Notice tone="info" title="Records are not accessible to this role">
            The API does not expose diagnoses, prescriptions, or consultation notes to administrator
            accounts. This is enforced server-side by role middleware, so it cannot be bypassed by
            modifying the interface.
          </Notice>
          <p className="muted text-xs mt-4">
            Patients grant and revoke clinician access themselves. Administrators can suspend an
            account, which blocks sign-in, but cannot read what it contains.
          </p>
        </Card>
      </div>
    </>
  );
}
