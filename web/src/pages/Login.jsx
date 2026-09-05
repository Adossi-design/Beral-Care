import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Field, Notice } from '../components/ui';
import LanguageToggle from '../components/LanguageToggle';
import AuthAside from './AuthAside';
import { auth as authApi } from '../lib/services';
import { useAuth, homeFor } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { errorMessage } from '../lib/api';

export default function Login() {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Please enter your email address.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Please check your email address.';
    if (!form.password) next.password = 'Please enter your password.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setFailure('');
    if (!validate()) return;

    setBusy(true);
    try {
      const data = await authApi.login(form.email.trim(), form.password);
      signIn(data.user, data.token);
      const from = location.state?.from?.pathname;
      navigate(from || homeFor(data.user.role), { replace: true });
    } catch (err) {
      setFailure(errorMessage(err, 'We could not log you in. Please check your email and password.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <AuthAside />

      <main className="auth__main">
        <div className="auth__form">
          <div className="auth__lang"><LanguageToggle /></div>
          <h1 className="auth__title">{t('welcomeBack')}</h1>
          <p className="auth__sub">{t('signInSub')}</p>

          {failure ? (
            <div className="mb-4"><Notice tone="danger">{failure}</Notice></div>
          ) : null}

          <form onSubmit={submit} noValidate className="stack gap-4">
            <Field
              label={t('email')}
              type="email"
              icon="mail"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
            />

            <Field
              label={t('password')}
              type="password"
              icon="lock"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
            />

            <Button type="submit" variant="primary" size="lg" block loading={busy}>
              {t('signIn')}
            </Button>
          </form>

          <div className="auth__divider">{t('noAccount')}</div>

          <Button to="/register" block>{t('signUp')}</Button>

          <p className="muted text-xs mt-6" style={{ textAlign: 'center' }}>
            <Link to="/">Back to home page</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
