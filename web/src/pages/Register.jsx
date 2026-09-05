import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Field, Notice, Icon } from '../components/ui';
import AuthAside from './AuthAside';
import { auth as authApi } from '../lib/services';
import { useAuth, homeFor } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { errorMessage } from '../lib/api';

/**
 * Registration.
 *
 * Two steps rather than one long form: choosing a role first means a patient
 * never sees clinician fields, and the second step stays short enough to finish
 * on a phone. The prototype asked for everything at once on a single screen.
 */
export default function Register() {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState('patient');
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', specialization: '', hospital: '',
  });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.full_name.trim()) next.full_name = 'Please enter your full name.';
    if (!form.email.trim()) next.email = 'Please enter your email address.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Please check your email address.';
    if (!form.phone.trim()) next.phone = 'Please enter your phone number.';
    if (!form.password) next.password = 'Please choose a password.';
    else if (form.password.length < 8) next.password = 'Please use 8 letters or numbers or more.';
    if (role === 'doctor' && !form.specialization.trim()) {
      next.specialization = 'Please say what you treat.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setFailure('');
    if (!validate()) return;

    setBusy(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role,
        ...(role === 'doctor'
          ? { specialization: form.specialization.trim(), hospital: form.hospital.trim() }
          : {}),
      };
      const data = await authApi.register(payload);
      signIn(data.user, data.token);
      navigate(homeFor(data.user.role), { replace: true });
    } catch (err) {
      setFailure(errorMessage(err, 'We could not create your account. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <AuthAside />

      <main className="auth__main">
        <div className="auth__form">
          {step === 1 ? (
            <>
              <h1 className="auth__title">{t('createAccountTitle')}</h1>
              <p className="auth__sub">First, tell us who you are.</p>

              <div className="rolepick">
                <button
                  type="button"
                  className="rolecard"
                  aria-pressed={role === 'patient'}
                  onClick={() => setRole('patient')}
                >
                  <span className="rolecard__icon"><Icon name="user" size={22} /></span>
                  <span className="rolecard__title" style={{ display: 'block' }}>{t('iAmPatient')}</span>
                  <span className="rolecard__desc">{t('patientRoleDesc')}</span>
                </button>

                <button
                  type="button"
                  className="rolecard"
                  aria-pressed={role === 'doctor'}
                  onClick={() => setRole('doctor')}
                >
                  <span className="rolecard__icon"><Icon name="stethoscope" size={22} /></span>
                  <span className="rolecard__title" style={{ display: 'block' }}>{t('iAmDoctor')}</span>
                  <span className="rolecard__desc">{t('doctorRoleDesc')}</span>
                </button>
              </div>

              <Button
                variant="primary"
                size="lg"
                block
                className="mt-6"
                iconRight="arrowRight"
                onClick={() => setStep(2)}
              >
                Continue
              </Button>

              <div className="auth__divider">{t('haveAccount')}</div>
              <Button to="/login" block>{t('signIn')}</Button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="row gap-2 muted text-sm mb-4"
                onClick={() => setStep(1)}
                style={{ background: 'none' }}
              >
                <Icon name="arrowLeft" size={15} />
                {role === 'patient' ? t('iAmPatient') : t('iAmDoctor')} · change this
              </button>

              <h1 className="auth__title">
                {role === 'doctor' ? 'Your doctor details' : 'Your details'}
              </h1>
              <p className="auth__sub">{t('createAccountSub')}</p>

              {failure ? <div className="mb-4"><Notice tone="danger">{failure}</Notice></div> : null}

              <form onSubmit={submit} noValidate className="stack gap-4">
                <Field
                  label={t('fullName')} icon="user" required autoComplete="name"
                  placeholder={role === 'doctor' ? 'Dr Amina Kone' : 'Amina Kone'}
                  value={form.full_name} onChange={set('full_name')} error={errors.full_name}
                />
                <Field
                  label={t('email')} type="email" icon="mail" required autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email} onChange={set('email')} error={errors.email}
                />
                <Field
                  label={t('phone')} type="tel" icon="phone" required autoComplete="tel"
                  placeholder="+250 788 000 000" hint="We use this to send you messages, and to log in from a basic phone."
                  value={form.phone} onChange={set('phone')} error={errors.phone}
                />

                {role === 'doctor' ? (
                  <>
                    <Field
                      label={t('specialization')} icon="stethoscope" required
                      placeholder="General Practice"
                      value={form.specialization} onChange={set('specialization')}
                      error={errors.specialization}
                    />
                    <Field
                      label={t('hospital')} icon="hospital"
                      placeholder="Kigali Central Hospital"
                      value={form.hospital} onChange={set('hospital')}
                    />
                  </>
                ) : null}

                <Field
                  label={t('password')} type="password" icon="lock" required
                  autoComplete="new-password" placeholder="At least 8 letters or numbers"
                  value={form.password} onChange={set('password')} error={errors.password}
                />

                <Button type="submit" variant="primary" size="lg" block loading={busy}>
                  {t('signUp')}
                </Button>
              </form>

              <p className="muted text-xs mt-6" style={{ textAlign: 'center' }}>
                When you create an account, your records stay private. They are only shared with
                doctors you say yes to. <Link to="/">Back to home page</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
