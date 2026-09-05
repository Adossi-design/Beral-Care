import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Icon } from '../components/ui';
import { useI18n } from '../lib/i18n';

const FEATURES = [
  {
    icon: 'idCard',
    title: 'Your own health ID',
    body: 'You get one health ID that is yours for life. Your visits, diagnoses, and medicines stay with you, even when you change clinic or move to a new town.',
  },
  {
    icon: 'lock',
    title: 'You choose who can see your records',
    body: 'A doctor must ask before they can open your file. You say yes or no. Until you say yes, nobody can read it.',
  },
  {
    icon: 'stethoscope',
    title: 'Help for doctors during a visit',
    body: 'MedAssist helps doctors check possible causes, spot drug reactions, and follow WHO Africa treatment steps, using medicines that are available nearby.',
  },
  {
    icon: 'heart',
    title: 'Health answers in simple words',
    body: 'HealthGuide explains your diagnosis and your medicine in words that are easy to follow. For anything serious, it tells you to speak with your doctor.',
  },
  {
    icon: 'qr',
    title: 'Scan instead of writing',
    body: 'Show your code and the doctor opens your file at once. No spelling your name, no long forms, no repeated files for the same person.',
  },
  {
    icon: 'signal',
    title: 'Works with or without internet',
    body: 'Use the full website on any phone or computer. If you have no internet, you can still use the main services by dialling a short code.',
  },
];

const CHANNELS = [
  { n: '01', title: 'On a computer', body: 'The full website on a laptop or tablet. Nothing to download or install.' },
  { n: '02', title: 'On a smartphone', body: 'The same website, made to fit a small screen. You can add it to your home screen.' },
  { n: '03', title: 'On a basic phone', body: 'No internet needed. Dial a short code to sign up, log in, ask for a visit, and check your last visits.' },
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
          <a className="pubnav__link" href="#how">What you get</a>
          <a className="pubnav__link" href="#channels">Ways to use it</a>
          <Link className="pubnav__link" to="/about">Why we built this</Link>
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
                Your records. Your choice.
              </span>

              <h1 className="hero__title">
                Your health records go <em>wherever you go</em>.
              </h1>

              <p className="hero__lede">
                Beral Care brings patients and doctors together, on a computer, a
                smartphone, or a basic phone. You keep your own health records, and you decide
                which doctor can see them.
              </p>

              <div className="hero__cta">
                <Button to="/register" variant="primary" size="lg" iconRight="arrowRight">
                  Create a free account
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
                  <div className="proof__label">Health assistants</div>
                </div>
                <div>
                  <div className="proof__value">100%</div>
                  <div className="proof__label">You control access</div>
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
            <h2 className="section-title">What you can do here</h2>
            <p className="section-lede">
              This started with a simple problem. When you are sick and need to
              know what happened during your last treatment, that information is
              often held by one hospital or one doctor, and if you cannot reach
              them, you cannot reach it either. Everything below grew out of
              trying to fix that. <Link to="/about">Read the full story</Link>.
            </p>

            <div className="grid grid--three">
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
            <h2 className="section-title">Three ways to use it, one health record</h2>
            <p className="section-lede">
              It does not matter what phone you have. New or old, you reach the same health record
              and get the same care.
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
            <h2 className="section-title section-title--center">Ready to start?</h2>
            <p className="section-lede" style={{ margin: '0 auto var(--sp-7)' }}>
              Signing up takes about one minute and costs nothing. You get your health ID straight
              away, and you can use it at any clinic on Beral Care.
            </p>
            <Button to="/register" variant="primary" size="lg" iconRight="arrowRight">
              Create a free account
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
              <div className="text-xs">Health care and health records for everyone</div>
            </div>
          </div>
          <div className="text-xs">Built by Adossi Fred William</div>
        </div>
      </footer>
    </div>
  );
}
