import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { LandingPage } from '../../features/landing-page/frontend';
import { Login, Signup, ForgotPassword } from '../../features/authentication/frontend';
import { Dashboard } from '../../features/dashboard/frontend';
import { OrganizationSetup } from '../../features/organization-setup/frontend';
import { Assets } from '../../features/assets/frontend';
import { AllocationTransfer } from '../../features/allocation-transfer/frontend';
import { ResourceBooking } from '../../features/resource-booking/frontend';
import { Maintenance } from '../../features/maintenance/frontend';
import { Audit } from '../../features/audit/frontend';
import { ReportsAnalytics } from '../../features/reports-analytics/frontend';
import { Notifications } from '../../features/notifications/frontend';
import { Layout } from '../../shared/ui-components';

function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem('assetflow_token');
  const rawUser = localStorage.getItem('assetflow_user');

  if (!token || !rawUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(rawUser);

    if (roles && !roles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  } catch {
    localStorage.removeItem('assetflow_token');
    localStorage.removeItem('assetflow_user');
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AuthRoute({ children }) {
  const token = localStorage.getItem('assetflow_token');
  const user = localStorage.getItem('assetflow_user');

  if (token && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<AuthRoute><LandingPage /></AuthRoute>} />
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
        <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
        
        {/* Protected Layout wrapper */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/organization" element={<ProtectedRoute roles={['ADMIN']}><OrganizationSetup /></ProtectedRoute>} />
          <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
          <Route path="/allocations" element={<ProtectedRoute><AllocationTransfer /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><ResourceBooking /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
          <Route path="/audits" element={<ProtectedRoute roles={['ADMIN']}><Audit /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsAnalytics /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
