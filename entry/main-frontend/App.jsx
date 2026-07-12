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

function ProtectedRoute({ children }) {
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/organization"
          element={(
            <ProtectedRoute>
              <OrganizationSetup />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/assets"
          element={(
            <ProtectedRoute>
              <Assets />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/allocations"
          element={(
            <ProtectedRoute>
              <AllocationTransfer />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/bookings"
          element={(
            <ProtectedRoute>
              <ResourceBooking />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/maintenance"
          element={(
            <ProtectedRoute>
              <Maintenance />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/audits"
          element={(
            <ProtectedRoute>
              <Audit />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/reports"
          element={(
            <ProtectedRoute>
              <ReportsAnalytics />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/notifications"
          element={(
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
