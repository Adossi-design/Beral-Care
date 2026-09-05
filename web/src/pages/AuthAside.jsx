import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/ui';

const POINTS = [
  { icon: 'idCard', title: 'One health ID for life', body: 'Your records follow you to any clinic.' },
  { icon: 'lock', title: 'You decide who can look', body: 'A doctor sees your file only if you say yes.' },
  { icon: 'signal', title: 'Works without internet', body: 'Dial a short code from any phone.' },
];

/** Shared brand panel for the sign-in and registration screens. */
export default function AuthAside() {
  return (
    <aside className="auth__aside">
      <Link to="/" className="row gap-3" style={{ color: '#fff' }}>
        <span className="brand-mark"><Icon name="heart" size={18} /></span>
        <span style={{ fontWeight: 650 }}>Beral Care</span>
      </Link>

      <div>
        <p className="auth__quote">Your health records go wherever you go.</p>

        <div className="auth__points">
          {POINTS.map((p) => (
            <div className="auth__point" key={p.title}>
              <span className="auth__point-icon"><Icon name={p.icon} size={16} /></span>
              <div>
                <div className="auth__point-title">{p.title}</div>
                <div className="auth__point-body">{p.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--pine-300)' }}>
        Your information is kept private and is only shared with people you allow.
      </p>
    </aside>
  );
}
