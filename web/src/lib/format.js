/** Shared formatting helpers, so dates never render differently across pages. */

const localeFor = (lang) => (lang === 'fr' ? 'fr-FR' : 'en-GB');

export function formatDate(value, lang = 'en', opts) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(localeFor(lang), opts || { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatLongDate(value, lang = 'en') {
  return formatDate(value, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** "in 3 days" / "2 weeks ago", used on activity feeds and visit lists. */
export function relativeDate(value, lang = 'en') {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';

  const diffDays = Math.round((d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);

  const rtf = new Intl.RelativeTimeFormat(localeFor(lang), { numeric: 'auto' });
  if (Math.abs(diffDays) < 1) return rtf.format(0, 'day');
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, 'day');
  if (Math.abs(diffDays) < 31) return rtf.format(Math.round(diffDays / 7), 'week');
  if (Math.abs(diffDays) < 365) return rtf.format(Math.round(diffDays / 30), 'month');
  return rtf.format(Math.round(diffDays / 365), 'year');
}

export const isUpcoming = (value) => {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && d.setHours(23, 59, 59) >= Date.now();
};

export function greetingKey(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'goodMorning';
  if (h < 17) return 'goodAfternoon';
  return 'goodEvening';
}

export function initials(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();
}

/** Groups a list into buckets keyed by the result of `keyFn`, preserving order. */
export function groupBy(list, keyFn) {
  const out = new Map();
  for (const item of list) {
    const k = keyFn(item);
    if (!out.has(k)) out.set(k, []);
    out.get(k).push(item);
  }
  return out;
}

export const titleCase = (s) =>
  String(s || '').replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
