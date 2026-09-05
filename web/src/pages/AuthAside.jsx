import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/ui';

const POINTS = [
  { icon: 'idCard', title: 'One permanent Health ID', body: 'Your record follows you between clinics.' },
  { icon: 'lock', title: 'You approve every access', body: 'Clinicians see your history only once you allow it.' },
  { icon: 'signal', title: 'Works without internet', body: 'Core services run over USSD on any handset.' },
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
        <p className="auth__quote">Care that follows the patient, not the building.</p>

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
        Protected by role-based access control and patient-granted permissions.
      </p>
    </aside>
  );
}
