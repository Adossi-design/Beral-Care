import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth, homeFor } from './lib/auth';
import { Skeleton } from './components/ui';

// Public surfaces load eagerly — they are the first paint for a new visitor.
import Landing from './pages/Landing';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Authenticated areas are split per role, so a patient never downloads the
// clinician or administrator bundles.
const PatientArea = lazy(() => import('./pages/patient/PatientArea'));
const ClinicArea  = lazy(() => import('./pages/clinic/ClinicArea'));
const AdminArea   = lazy(() => import('./pages/admin/AdminArea'));

function FullPageLoader() {
  return (
    <div style={{ padding: 'var(--sp-7)', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <Skeleton height={34} width="240px" />
      <div className="grid grid--stats mt-6">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={98} radius="var(--r-lg)" />)}
      </div>
      <div className="mt-6"><Skeleton height={320} radius="var(--r-lg)" /></div>
    </div>
  );
}

/** Blocks a route until the session is known, then checks the role. */
function Protected({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) return <Navigate to={homeFor(user.role)} replace />;

  return children;
}

/** Keeps signed-in users out of the auth pages. */
function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

        <Route path="/app/*" element={<Protected role="patient"><PatientArea /></Protected>} />
        <Route path="/clinic/*" element={<Protected role="doctor"><ClinicArea /></Protected>} />
        <Route path="/admin/*" element={<Protected role="admin"><AdminArea /></Protected>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
