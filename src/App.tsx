import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './contexts/AuthContext';

import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Properties from './pages/Properties';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Receipt from './pages/Receipt';
import TenantPayment from './pages/TenantPayment';
import PublicPayment from './pages/PublicPayment';
import Landing from './pages/Landing';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import EmailVerified from './pages/EmailVerified';
import Notifications from './pages/Notifications';
import ActivityLog from './pages/ActivityLog';
import Calendar from './pages/Calendar';
import Loans from './pages/Loans';
import Borrowers from './pages/Borrowers';

function App() {
  // Public payment route — no auth required
  if (window.location.pathname.startsWith('/pay/')) {
    return (
      <>
        <Toaster position="top-center" richColors closeButton />
        <Routes>
          <Route path="/pay/:token" element={<PublicPayment />} />
        </Routes>
      </>
    );
  }

  const { user, loading, isTenant } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-center" richColors closeButton />
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/email-verified" element={<EmailVerified />} />
        <Route path="*" element={<Landing />} />
      </Routes>
      </>
    );
  }

  if (isTenant) {
    return (
      <>
        <Toaster position="top-center" richColors closeButton />
        <Routes>
          <Route path="/tenant/payment" element={<TenantPayment />} />
          <Route path="/tenant/receipt" element={<Receipt />} />
          <Route path="*" element={<Navigate to="/tenant/payment" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <AppLayout>
      <Toaster position="top-center" richColors closeButton />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/activity-log" element={<ActivityLog />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/borrowers" element={<Borrowers />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/receipt/:id" element={<Receipt />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
