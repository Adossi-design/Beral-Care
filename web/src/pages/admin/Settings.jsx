import React from 'react';
import {
  PageHeader, Card, CardHeader, DetailRow, Notice, Button, Icon, useToast,
} from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { API_URL } from '../../lib/api';
import { formatDate } from '../../lib/format';

// Informational only. Anything affecting security stays in the server
// environment rather than behind a web form.
export default function Settings() {
  const { user, signOut } = useAuth();
  const { t, lang, setLang } = useI18n();
  const toast = useToast();

  return (
    <>
      <PageHeader
        title={t('settings')}
        description="Your admin account and how Beral Care is set up."
      />

      <div className="grid grid--2">
        <Card>
          <CardHeader title="Your account" icon="user" />
          <DetailRow label="Name" value={user?.full_name} icon="user" />
          <DetailRow label="Email" value={user?.email} icon="mail" />
          <DetailRow label="Role" value="Admin" icon="shield" />
          <DetailRow label="Joined" value={formatDate(user?.created_at, lang)} icon="clock" />

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
                    onClick={() => { setLang(o.v); toast.success('Language changed.'); }}
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
          <DetailRow label="Website version" value="2.0.0" icon="info" />
          <p className="muted text-xs mt-4">
            Settings such as database access and AI keys are changed on the server, not here.
          </p>
        </Card>

        <Card>
          <CardHeader title="Privacy rules" icon="lock" />
          <Notice tone="info" title="Admins cannot read health records">
            Admin accounts never receive anyone's illness, medicine, or doctor notes. This is
            blocked on the server, so it cannot be worked around from the website.
          </Notice>
          <p className="muted text-xs mt-4">
            Patients decide for themselves which doctors can see their records. An admin can block
            an account, which stops that person logging in, but cannot read what is inside it.
          </p>
        </Card>
      </div>
    </>
  );
}
