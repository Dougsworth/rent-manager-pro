import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import Receipt from './pages/Receipt';
import TenantPayment from './pages/TenantPayment';
import PublicPayment from './pages/PublicPayment';
import Landing from './pages/Landing';

function App() {
  // Public payment route — no auth required
  if (window.location.pathname.startsWith('/pay/')) {
    return (
      <Routes>
        <Route path="/pay/:token" element={<PublicPayment />} />
      </Routes>
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
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    );
  }

  if (isTenant) {
    return (
      <Routes>
        <Route path="/tenant/payment" element={<TenantPayment />} />
        <Route path="/tenant/receipt" element={<Receipt />} />
        <Route path="*" element={<Navigate to="/tenant/payment" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/receipt/:id" element={<Receipt />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
