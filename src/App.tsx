import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './contexts/AuthContext';

import AppLayout from './components/AppLayout';

// Routes are lazy-loaded so each page ships as its own chunk — the initial
// bundle stays small and heavy libs (recharts, html2canvas) only load on the
// pages that use them.
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tenants = lazy(() => import('./pages/Tenants'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Payments = lazy(() => import('./pages/Payments'));
const Properties = lazy(() => import('./pages/Properties'));
const Settings = lazy(() => import('./pages/Settings'));
const Reports = lazy(() => import('./pages/Reports'));
const Receipt = lazy(() => import('./pages/Receipt'));
const TenantPayment = lazy(() => import('./pages/TenantPayment'));
const PublicPayment = lazy(() => import('./pages/PublicPayment'));
const Landing = lazy(() => import('./pages/Landing'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const EmailVerified = lazy(() => import('./pages/EmailVerified'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ActivityLog = lazy(() => import('./pages/ActivityLog'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Loans = lazy(() => import('./pages/Loans'));
const Borrowers = lazy(() => import('./pages/Borrowers'));
const BorrowerDetail = lazy(() => import('./pages/BorrowerDetail'));
const Help = lazy(() => import('./pages/Help'));

function PageFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  // Public payment route — no auth required
  if (window.location.pathname.startsWith('/pay/')) {
    return (
      <>
        <Toaster position="top-center" richColors closeButton />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/pay/:token" element={<PublicPayment />} />
          </Routes>
        </Suspense>
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
        <Suspense fallback={<PageFallback />}>
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
        </Suspense>
      </>
    );
  }

  if (isTenant) {
    return (
      <>
        <Toaster position="top-center" richColors closeButton />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/tenant/payment" element={<TenantPayment />} />
            <Route path="/tenant/receipt" element={<Receipt />} />
            <Route path="*" element={<Navigate to="/tenant/payment" replace />} />
          </Routes>
        </Suspense>
      </>
    );
  }

  return (
    <AppLayout>
      <Toaster position="top-center" richColors closeButton />
      <Suspense fallback={<PageFallback />}>
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
          <Route path="/borrowers/:id" element={<BorrowerDetail />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/help" element={<Help />} />
          <Route path="/receipt/:id" element={<Receipt />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

export default App;
