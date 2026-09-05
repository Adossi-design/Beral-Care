import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Icon } from '../components/ui';
import { useI18n } from '../lib/i18n';

const FEATURES = [
  {
    icon: 'idCard',
    title: 'Records that belong to the patient',
    body: 'Every patient carries a permanent Health ID. Their full consultation history travels with them between clinics instead of being trapped in one building’s filing cabinet.',
  },
  {
    icon: 'lock',
    title: 'Access granted, never assumed',
    body: 'A clinician requests access; the patient approves or declines it. Records stay sealed until that decision is made, and it is enforced on the server, not in the interface.',
  },
  {
    icon: 'stethoscope',
    title: 'Clinical support at the point of care',
    body: 'MedAssist offers differential diagnoses, drug interaction checks, and treatment protocols calibrated to WHO Africa guidance and locally available medicines.',
  },
  {
    icon: 'heart',
    title: 'Answers in plain language',
    body: 'HealthGuide explains a diagnosis, a prescription, and what to watch for, in words a patient can act on — and always points serious questions back to their clinician.',
  },
  {
    icon: 'qr',
    title: 'Identification without paperwork',
    body: 'A scannable code replaces spelling out names and dates of birth at every desk. Faster intake, fewer transcription errors, no duplicate files.',
  },
  {
    icon: 'signal',
    title: 'Built for real connectivity',
    body: 'The full platform runs in any browser, and the essentials run over USSD on a basic handset with no internet connection at all.',
  },
];

const CHANNELS = [
  { n: '01', title: 'Any browser', body: 'The complete platform on a laptop, tablet, or smartphone. Nothing to install.' },
  { n: '02', title: 'Any smartphone', body: 'The same interface, laid out for a small screen and installable to the home screen.' },
  { n: '03', title: 'Any phone at all', body: 'Register, log in, request a consultation, and read recent history by dialling a short code.' },
];

export default function Landing() {
  const { t } = useI18n();

  return (
    <div className="public">
      <header className="pubnav">
        <Link to="/" className="pubnav__brand">
          <span className="brand-mark"><Icon name="heart" size={18} /></span>
          <span className="pubnav__name">Beral Care</span>
        </Link>
        <nav className="pubnav__links">
          <a className="pubnav__link" href="#how">How it works</a>
          <a className="pubnav__link" href="#channels">Access</a>
          <Button to="/login" size="sm">{t('signIn')}</Button>
          <Button to="/register" variant="primary" size="sm">{t('signUp')}</Button>
        </nav>
      </header>

      <main>
        {/* ------------------------------------------------------------ hero */}
        <section className="hero">
          <div className="hero__inner">
            <div>
              <span className="eyebrow">
                <Icon name="shield" size={14} />
                Patient-controlled medical records
              </span>

              <h1 className="hero__title">
                Healthcare that follows the patient, <em>not the building</em>.
              </h1>

              <p className="hero__lede">
                Beral Care connects patients and clinicians across the continent — on a
                laptop, on a smartphone, or on a basic handset over USSD. Patients hold their own
                records and decide who may read them.
              </p>

              <div className="hero__cta">
                <Button to="/register" variant="primary" size="lg" iconRight="arrowRight">
                  Create your account
                </Button>
                <Button to="/login" size="lg">{t('signIn')}</Button>
              </div>

              <div className="hero__proof">
                <div>
                  <div className="proof__value">3</div>
                  <div className="proof__label">Ways to connect</div>
                </div>
                <div>
                  <div className="proof__value">2</div>
                  <div className="proof__label">Clinical AI assistants</div>
                </div>
                <div>
                  <div className="proof__value">100%</div>
                  <div className="proof__label">Patient-approved access</div>
                </div>
              </div>
            </div>

            {/* A structural preview rather than a screenshot: it stays sharp at
                any resolution and cannot go stale as the product changes. */}
            <div className="preview" aria-hidden="true">
              <div className="preview__bar">
                <span className="preview__dot" /><span className="preview__dot" /><span className="preview__dot" />
              </div>
              <div className="preview__body">
                <div className="idcard">
                  <div className="idcard__label">Health ID</div>
                  <div className="idcard__value">BC-2026-00042</div>
                  <div className="idcard__actions">
                    <span className="idcard__btn"><Icon name="copy" size={14} /> Copy</span>
                    <span className="idcard__btn"><Icon name="qr" size={14} /> Show code</span>
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
                  <div className="stat">
                    <span className="stat__label">Consultations</span>
                    <span className="stat__value">12</span>
                  </div>
                  <div className="stat">
                    <span className="stat__label">Prescriptions</span>
                    <span className="stat__value">8</span>
                  </div>
                </div>

                <div className="card card--pad">
                  <div className="row gap-3">
                    <span className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>AK</span>
                    <div className="grow">
                      <div className="preview__bar-line" style={{ width: '65%' }} />
                      <div className="preview__bar-line" style={{ width: '40%', marginTop: 6, height: 6 }} />
                    </div>
                    <span className="badge badge--completed">Completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- features */}
        <section className="section-pad" id="how">
          <div className="section-inner">
            <h2 className="section-title">What the platform does</h2>
            <p className="section-lede">
              Six capabilities, each aimed at a specific failure in how care is currently
              coordinated — not a feature list assembled for its own sake.
            </p>

            <div className="grid grid--cards">
              {FEATURES.map((f) => (
                <article className="feature" key={f.title}>
                  <div className="feature__icon"><Icon name={f.icon} size={20} /></div>
                  <h3 className="feature__title">{f.title}</h3>
                  <p className="feature__body">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- channels */}
        <section className="section-pad section-pad--tint" id="channels">
          <div className="section-inner">
            <h2 className="section-title">Three ways in, one medical record</h2>
            <p className="section-lede">
              A patient with a smartphone and a patient with a ten-year-old handset reach the same
              record. Connectivity determines the interface, never the standard of care.
            </p>

            <div className="grid grid--2">
              {CHANNELS.map((c) => (
                <div className="channel" key={c.n}>
                  <span className="channel__num">{c.n}</span>
                  <div>
                    <h3 className="feature__title">{c.title}</h3>
                    <p className="feature__body">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- cta */}
        <section className="section-pad">
          <div className="section-inner" style={{ textAlign: 'center', maxWidth: 640 }}>
            <h2 className="section-title">Start with a Health ID</h2>
            <p className="section-lede" style={{ margin: '0 auto var(--sp-7)' }}>
              Creating an account takes under a minute and gives you a permanent identifier you can
              carry to any clinic on the platform.
            </p>
            <Button to="/register" variant="primary" size="lg" iconRight="arrowRight">
              Create your account
            </Button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="row gap-3">
            <span className="brand-mark"><Icon name="heart" size={16} /></span>
            <div>
              <div style={{ color: '#fff', fontWeight: 650 }}>Beral Care</div>
              <div className="text-xs">Telemedicine and health records for the continent</div>
            </div>
          </div>
          <div className="text-xs">Built by Adossi Fred William</div>
        </div>
      </footer>
    </div>
  );
}
