import React from 'react';
import { Button, Icon } from '../components/ui';
import { useAuth, homeFor } from '../lib/auth';

export default function NotFound() {
  const { user } = useAuth();

  return (
    <div className="center" style={{ minHeight: '100dvh', padding: 'var(--sp-6)' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div className="empty__icon" style={{ margin: '0 auto var(--sp-5)' }}>
          <Icon name="search" size={22} />
        </div>
        <h1 style={{ fontSize: 'var(--fs-xl)', marginBottom: 'var(--sp-2)' }}>Page not found</h1>
        <p className="muted mb-6">
          This page does not exist, or you may not be allowed to open it.
        </p>
        <Button to={user ? homeFor(user.role) : '/'} variant="primary" icon="arrowLeft">
          {user ? 'Back to my home page' : 'Back to home page'}
        </Button>
      </div>
    </div>
  );
}
