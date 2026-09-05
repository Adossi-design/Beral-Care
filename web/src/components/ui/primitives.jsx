import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { initials } from '../../lib/format';

/* ------------------------------------------------------------------ button */

export function Button({
  children, variant = 'secondary', size, icon, iconRight, loading,
  disabled, block, as, to, href, className = '', ...rest
}) {
  const cls = [
    'btn',
    variant !== 'secondary' && `btn--${variant}`,
    size && `btn--${size}`,
    block && 'btn--block',
    className,
  ].filter(Boolean).join(' ');

  const inner = (
    <>
      {loading ? <span className="btn__spinner" aria-hidden="true" /> : icon ? <Icon name={icon} size={17} /> : null}
      {children}
      {iconRight && !loading ? <Icon name={iconRight} size={17} /> : null}
    </>
  );

  if (to) return <Link to={to} className={cls} {...rest}>{inner}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{inner}</a>;

  const Tag = as || 'button';
  return (
    <Tag className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {inner}
    </Tag>
  );
}

export function IconButton({ icon, label, size = 18, className = '', ...rest }) {
  return (
    <button type="button" className={`iconbtn ${className}`} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  );
}

/* -------------------------------------------------------------------- card */

export function Card({ children, pad = true, flush, link, className = '', ...rest }) {
  const cls = ['card', pad && !flush && 'card--pad', flush && 'card--flush', link && 'card--link', className]
    .filter(Boolean).join(' ');
  return <div className={cls} {...rest}>{children}</div>;
}

export function CardHeader({ title, subtitle, icon, action }) {
  return (
    <div className="card__header">
      <div className="row gap-3 grow">
        {icon ? <div className="card__icon"><Icon name={icon} size={18} /></div> : null}
        <div className="grow">
          <h3 className="card__title">{title}</h3>
          {subtitle ? <p className="card__sub">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ badges */

export function Badge({ status, children, tone }) {
  const key = String(tone || status || 'neutral').toLowerCase();
  return <span className={`badge badge--${key}`}>{children || status}</span>;
}

export function Count({ value }) {
  if (!value) return null;
  return <span className="count">{value > 99 ? '99+' : value}</span>;
}

export function Avatar({ name, src, size = 36, square }) {
  return (
    <span
      className={`avatar ${square ? 'avatar--square' : ''}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" loading="lazy" /> : initials(name)}
    </span>
  );
}

/* -------------------------------------------------------------------- stat */

const STAT_TONES = {
  primary: { background: 'var(--primary-subtle)', color: 'var(--primary)' },
  accent:  { background: 'var(--azure-50)', color: 'var(--accent)' },
  success: { background: 'var(--green-50)', color: 'var(--green-600)' },
  warning: { background: 'var(--amber-50)', color: 'var(--amber-600)' },
  danger:  { background: 'var(--red-50)', color: 'var(--red-600)' },
};

export function Stat({ label, value, icon, tone = 'primary', hint }) {
  return (
    <div className="stat">
      <div className="stat__top">
        <span className="stat__label">{label}</span>
        {icon ? (
          <span className="stat__icon" style={STAT_TONES[tone] || STAT_TONES.primary}>
            <Icon name={icon} size={16} />
          </span>
        ) : null}
      </div>
      <span className="stat__value">{value}</span>
      {hint ? <span className="stat__hint">{hint}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ notice */

const NOTICE_ICON = { info: 'info', success: 'checkCircle', warning: 'alert', danger: 'alert' };

export function Notice({ tone = 'info', title, children, action }) {
  return (
    <div className={`notice notice--${tone}`} role={tone === 'danger' ? 'alert' : undefined}>
      <Icon name={NOTICE_ICON[tone]} size={18} />
      <div className="grow">
        {title ? <div className="notice__title">{title}</div> : null}
        {children}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------- empty/loading */

export function EmptyState({ icon = 'inbox', title, description, action, compact }) {
  return (
    <div className={`empty ${compact ? 'empty--compact' : ''}`}>
      <div className="empty__icon"><Icon name={icon} size={22} /></div>
      <p className="empty__title">{title}</p>
      {description ? <p className="empty__desc">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ height = 16, width = '100%', radius = 'var(--r-sm)', style }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius, ...style }} />;
}

export function SkeletonRows({ rows = 3, height = 64 }) {
  return (
    <div className="stack gap-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={height} radius="var(--r-lg)" />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- page header */

export function PageHeader({ title, description, actions, children }) {
  return (
    <header className="page-head">
      <div className="grow">
        <h1 className="page-head__title">{title}</h1>
        {description ? <p className="page-head__desc">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="page-head__actions">{actions}</div> : null}
    </header>
  );
}

export function Section({ title, action, children, className = '' }) {
  return (
    <section className={`section ${className}`}>
      {(title || action) && (
        <div className="section__head">
          {title ? <h2 className="section__title">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------- tabs */

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          className="tab"
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.count ? <span className="muted"> ({tab.count})</span> : null}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- detail rows */

export function DetailRow({ label, value, icon }) {
  return (
    <div className="spread" style={{ padding: 'var(--sp-3) 0', borderBottom: '1px solid var(--divider)' }}>
      <span className="row gap-2 muted text-sm">
        {icon ? <Icon name={icon} size={16} /> : null}
        {label}
      </span>
      <span className="strong" style={{ textAlign: 'right' }}>{value || '-'}</span>
    </div>
  );
}
