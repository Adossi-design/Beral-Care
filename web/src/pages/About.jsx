import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Icon } from '../components/ui';
import Brand, { BrandMark } from '../components/Brand';
import LanguageToggle from '../components/LanguageToggle';
import { useI18n } from '../lib/i18n';

// The story is a list of blocks so it can be translated like the rest of the site
const BLOCKS = [
  'p1', 'p2', 'p3', 'p4',
  'h1', 'p5', 'p6',
  'h2', 'p7', 'p8',
  'h3', 'p9',
  'h4', 'p10', 'p11',
  'h5', 'p12', 'p13', 'p14',
];

export default function About() {
  const { t } = useI18n();

  return (
    <div className="public">
      <header className="pubnav">
        <Link to="/" className="pubnav__brand">
          <Brand size={32} />
        </Link>
        <nav className="pubnav__links">
          <Link className="pubnav__link" to="/">{t('nav.home')}</Link>
          <LanguageToggle />
          <Button to="/login" size="sm">{t('signIn')}</Button>
          <Button to="/register" variant="primary" size="sm">{t('signUp')}</Button>
        </nav>
      </header>

      <main className="section-pad">
        <div className="section-inner prose">
          <h1 className="about__title">{t('about.title')}</h1>

          <div className="byline">
            <span className="byline__photo">
              <img src="/author.jpg" alt="Adossi Fred William" />
            </span>
            <div>
              <div className="byline__name">Adossi Fred William</div>
              <div className="byline__role">{t('about.role')}</div>
              <div className="byline__place">{t('about.place')}</div>
            </div>
          </div>

          <p className="about__lede">{t('about.lede')}</p>

          {BLOCKS.map((key) => (
            key.startsWith('h')
              ? <h2 className="about__h2" key={key}>{t(`about.${key}`)}</h2>
              : <p key={key}>{t(`about.${key}`)}</p>
          ))}

          <div className="about__cta">
            <Button to="/register" variant="primary" size="lg" iconRight="arrowRight">
              {t('hero.cta')}
            </Button>
            <Button to="/" size="lg">{t('about.back')}</Button>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="row gap-3">
            <BrandMark size={30} tone="light" />
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
