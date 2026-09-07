import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import Brand, { BrandMark } from '../components/Brand';
import LanguageToggle from '../components/LanguageToggle';
import { useI18n } from '../lib/i18n';
import { DOCS, UPDATED, CONTACT } from '../lib/legal';
import { formatDate } from '../lib/format';

/**
 * The privacy notice and the terms of use. Both are the same page with a
 * different document, because they share the public header, the footer, and
 * the reading width.
 */
export default function Legal({ doc }) {
  const { t, lang } = useI18n();
  const content = DOCS[doc][lang] || DOCS[doc].en;

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
          <h1 className="about__title">{content.title}</h1>
          <p className="about__lede">{content.lede}</p>

          {content.blocks.map((block, i) => {
            if (block.kind === 'h') return <h2 className="about__h2" key={i}>{block.x}</h2>;
            if (block.kind === 'li') return <p className="legal__li" key={i}>{block.x}</p>;
            return <p key={i}>{block.x}</p>;
          })}

          <p className="muted text-sm mt-6">
            {lang === 'fr' ? 'Dernière mise à jour' : 'Last updated'} {formatDate(UPDATED, lang)}
            {' · '}
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
          </p>

          <div className="about__cta">
            <Button to={doc === 'privacy' ? '/terms' : '/privacy'} size="lg">
              {doc === 'privacy' ? DOCS.terms[lang].title : DOCS.privacy[lang].title}
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
          <div className="footer__legal">
            <Link className="footer__link" to="/privacy">{t('footer.privacy')}</Link>
            <Link className="footer__link" to="/terms">{t('footer.terms')}</Link>
            <span className="text-xs">{t('footer.built')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
