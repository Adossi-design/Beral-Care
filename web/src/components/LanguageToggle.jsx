import React from 'react';
import Icon from './ui/Icon';
import { useI18n } from '../lib/i18n';

// Language switch for the public pages, where there is no app sidebar to hold it
export default function LanguageToggle({ className = '' }) {
  const { lang, toggle, t } = useI18n();

  return (
    <button
      type="button"
      className={`langswitch ${className}`}
      onClick={toggle}
      aria-label={`${t('language')}: ${lang === 'en' ? 'English' : 'Français'}`}
      title={lang === 'en' ? 'Passer en français' : 'Switch to English'}
    >
      <Icon name="globe" size={16} />
      <span>{lang === 'en' ? 'EN' : 'FR'}</span>
    </button>
  );
}
