import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from './ui/Icon';
import { Avatar, Count, IconButton } from './ui/primitives';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { assetUrl } from '../lib/api';

/**
 * Authenticated application shell.
 *
 * One component, three chromes, switched entirely in CSS by width:
 *   >=1101px  full sidebar with labelled navigation
 *   768–1100  collapsed icon rail
 *   <768      top bar plus a bottom tab bar
 *
 * Doing this in CSS rather than JavaScript means there is no layout flash on
 * load and no resize listener re-rendering the tree.
 */
export default function AppShell({ nav, profileTo, notifyTo, notifyCount = 0, title, children }) {
  const { user, signOut } = useAuth();
  const { t, lang, toggle } = useI18n();
  const navigate = useNavigate();

  const name = user?.full_name || user?.name || 'User';
  const roleLabel = { patient: 'Patient', doctor: 'Doctor', admin: 'Admin' }[user?.role] || '';
  const avatar = assetUrl(user?.profile_image_url);

  // Profile is reached through the account button rather than the main menu:
  // the user chip in the sidebar on wider screens, the avatar in the top bar on
  // phones, where the sidebar is hidden.
  const profileHref = profileTo || nav.find((n) => n.profile)?.to;

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>

      {/* ------------------------------------------------------- sidebar */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="brand-mark"><Icon name="heart" size={18} /></span>
          <span>
            <span className="sidebar__name">Beral Care</span>
            <span className="sidebar__tag" style={{ display: 'block' }}>Africa</span>
          </span>
        </div>

        <nav className="sidebar__nav" aria-label="Main">
          <div className="sidebar__group">
            <p className="sidebar__grouplabel">Menu</p>
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `navlink ${isActive ? 'navlink--active' : ''}`}
                title={item.label}
              >
                <Icon name={item.icon} size={19} />
                <span className="navlink__label">{item.label}</span>
                {item.badge ? <Count value={item.badge} /> : null}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="sidebar__foot">
          {profileHref ? (
            <NavLink to={profileHref} className="userchip">
              <Avatar name={name} src={avatar} size={34} />
              <span className="grow userchip__meta">
                <span className="userchip__name truncate" style={{ display: 'block' }}>{name}</span>
                <span className="userchip__role">{roleLabel}</span>
              </span>
            </NavLink>
          ) : null}

          <div className="sidebar__actions">
            <button type="button" className="sidebar__btn" onClick={toggle} title={t('language')}>
              <Icon name="globe" size={15} />
              {lang.toUpperCase()}
            </button>
            <button type="button" className="sidebar__btn" onClick={handleSignOut} title={t('signOut')}>
              <Icon name="logout" size={15} />
              <span className="navlink__label">{t('signOut')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------------- main */}
      <div className="main">
        <header className="topbar">
          <span className="topbar__title">{title}</span>
          <span className="topbar__spacer" />
          {notifyTo ? (
            <NavLink to={notifyTo} className="iconbtn" aria-label={t('notifications')} title={t('notifications')}>
              <Icon name="bell" size={19} />
              {notifyCount ? <span className="iconbtn__count"><Count value={notifyCount} /></span> : null}
            </NavLink>
          ) : null}
        </header>

        {/* Mobile header — the sidebar is hidden at this width */}
        <header className="mobile-top">
          <span className="brand-mark" style={{ width: 30, height: 30 }}><Icon name="heart" size={15} /></span>
          <span className="grow strong truncate">{title}</span>
          <button type="button" className="iconbtn" onClick={toggle} aria-label={t('language')}>
            <span className="text-xs strong">{lang.toUpperCase()}</span>
          </button>
          {notifyTo ? (
            <NavLink to={notifyTo} className="iconbtn" aria-label={t('notifications')}>
              <Icon name="bell" size={19} />
              {notifyCount ? <span className="iconbtn__count"><Count value={notifyCount} /></span> : null}
            </NavLink>
          ) : null}
          {profileHref ? (
            <NavLink to={profileHref} className="iconbtn" aria-label={t('profile')} title={t('profile')}>
              <Avatar name={name} src={avatar} size={28} />
            </NavLink>
          ) : null}
          <IconButton icon="logout" label={t('signOut')} onClick={handleSignOut} />
        </header>

        <main className="content" id="main">
          <div className="content__inner">{children}</div>
        </main>
      </div>

      {/* ------------------------------------------------- mobile tab bar */}
      <nav className="tabbar" aria-label="Main">
        {nav.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `tabbar__item ${isActive ? 'tabbar__item--active' : ''}`}
          >
            <span style={{ position: 'relative' }}>
              <Icon name={item.icon} size={21} />
              {item.badge ? <span className="tabbar__count"><Count value={item.badge} /></span> : null}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
