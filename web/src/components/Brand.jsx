import React from 'react';

/**
 * The Beral Care mark: two people, one leaning towards the other, drawn as
 * soft leaf shapes. Two greens so it reads as care rather than a medical
 * cross. Inline SVG, so it stays sharp and costs no extra request.
 */
export function BrandMark({ size = 32, tone = 'colour' }) {
  // On the dark sidebar the two greens have to lift off the background
  const front = tone === 'light' ? '#ffffff' : 'var(--pine-700, #1a4f41)';
  const back = tone === 'light' ? 'var(--pine-300, #7fb9a5)' : 'var(--pine-400, #4e9880)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* the smaller figure, standing behind */}
      <circle cx="21.6" cy="10.2" r="3.5" fill={back} />
      <path
        d="M21.6 15.1c4.1 0 6.9 3 6.9 7.1 0 2.2-1.4 3.6-3.5 3.6h-6.8c-2.1 0-3.5-1.4-3.5-3.6 0-4.1 2.8-7.1 6.9-7.1Z"
        fill={back}
      />
      {/* the taller figure, in front */}
      <circle cx="11.2" cy="8.4" r="4.4" fill={front} />
      <path
        d="M11.2 14.6c5 0 8.4 3.7 8.4 8.7 0 2.7-1.8 4.5-4.4 4.5H7.2c-2.6 0-4.4-1.8-4.4-4.5 0-5 3.4-8.7 8.4-8.7Z"
        fill={front}
      />
    </svg>
  );
}

/**
 * The mark with the name beside it. `tone="light"` is for dark backgrounds,
 * where the whole wordmark turns white.
 */
export default function Brand({ size = 30, tone = 'colour', className = '' }) {
  const light = tone === 'light';
  return (
    <span className={`brand ${className}`}>
      <BrandMark size={size} tone={tone} />
      <span className="brand__name">
        <span style={{ color: light ? '#fff' : 'var(--navy-900)' }}>Beral</span>
        <span style={{ color: light ? 'var(--pine-200)' : 'var(--pine-600)' }}> Care</span>
      </span>
    </span>
  );
}
