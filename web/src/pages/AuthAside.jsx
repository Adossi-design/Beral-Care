import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/ui';
import Brand from '../components/Brand';

const POINTS = [
  { icon: 'idCard', title: 'One health ID for life', body: 'Your records follow you to any clinic.' },
  { icon: 'lock', title: 'You decide who can look', body: 'A doctor sees your file only if you say yes.' },
  { icon: 'signal', title: 'Works without internet', body: 'Dial a short code from any phone.' },
];

/** Shared brand panel for the sign-in and registration screens. */
export default function AuthAside() {
  return (
    <aside className="auth__aside">
      <Link to="/" style={{ color: '#fff' }}>
        <Brand tone="light" size={32} />
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
