import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Icon } from '../components/ui';
import LanguageToggle from '../components/LanguageToggle';
import { useI18n } from '../lib/i18n';

const FEATURES = [
  { icon: 'idCard', key: 'f1' },
  { icon: 'lock', key: 'f2' },
  { icon: 'stethoscope', key: 'f3' },
  { icon: 'heart', key: 'f4' },
  { icon: 'qr', key: 'f5' },
  { icon: 'signal', key: 'f6' },
];

const CHANNELS = [
  { n: '01', key: 'c1' },
  { n: '02', key: 'c2' },
  { n: '03', key: 'c3' },
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
          <a className="pubnav__link" href="#how">{t('nav.what')}</a>
          <a className="pubnav__link" href="#channels">{t('nav.ways')}</a>
          <Link className="pubnav__link" to="/about">{t('nav.why')}</Link>
          <LanguageToggle />
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
                {t('hero.badge')}
              </span>

              <h1 className="hero__title">
                {t('hero.titleA')} <em>{t('hero.titleB')}</em>.
              </h1>

              <p className="hero__lede">{t('hero.lede')}</p>

              <div className="hero__cta">
                <Button to="/register" variant="primary" size="lg" iconRight="arrowRight">
                  {t('hero.cta')}
                </Button>
                <Button to="/login" size="lg">{t('signIn')}</Button>
              </div>

              <div className="hero__proof">
                <div>
                  <div className="proof__value">3</div>
                  <div className="proof__label">{t('hero.proof1')}</div>
                </div>
                <div>
                  <div className="proof__value">2</div>
                  <div className="proof__label">{t('hero.proof2')}</div>
                </div>
                <div>
                  <div className="proof__value">100%</div>
                  <div className="proof__label">{t('hero.proof3')}</div>
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
            <h2 className="section-title">{t('features.title')}</h2>
            <p className="section-lede">
              {t('features.lede1')} <Link to="/about">{t('features.readStory')}</Link>.
            </p>

            <div className="grid grid--three">
              {FEATURES.map((f) => (
                <article className="feature" key={f.key}>
                  <div className="feature__icon"><Icon name={f.icon} size={20} /></div>
                  <h3 className="feature__title">{t(`${f.key}.title`)}</h3>
                  <p className="feature__body">{t(`${f.key}.body`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- channels */}
        <section className="section-pad section-pad--tint" id="channels">
          <div className="section-inner">
            <h2 className="section-title">{t('channels.title')}</h2>
            <p className="section-lede">{t('channels.lede')}</p>

            <div className="grid grid--2">
              {CHANNELS.map((c) => (
                <div className="channel" key={c.n}>
                  <span className="channel__num">{c.n}</span>
                  <div>
                    <h3 className="feature__title">{t(`${c.key}.title`)}</h3>
                    <p className="feature__body">{t(`${c.key}.body`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- cta */}
        <section className="section-pad">
          <div className="section-inner" style={{ textAlign: 'center', maxWidth: 640 }}>
            <h2 className="section-title section-title--center">{t('cta.title')}</h2>
            <p className="section-lede" style={{ margin: '0 auto var(--sp-7)' }}>
              {t('cta.lede')}
            </p>
            <Button to="/register" variant="primary" size="lg" iconRight="arrowRight">
              {t('hero.cta')}
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
              <div className="text-xs">{t('footer.tagline')}</div>
            </div>
          </div>
          <div className="text-xs">{t('footer.built')}</div>
        </div>
      </footer>
    </div>
  );
}
