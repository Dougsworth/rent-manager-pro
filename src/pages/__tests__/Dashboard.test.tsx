import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    profile: { first_name: 'Test', last_name: 'User', role: 'landlord' },
    loading: false,
    isLandlord: true,
  }),
}));

vi.mock('@/services/dashboard', () => ({
  getDashboardStats: vi.fn().mockResolvedValue({
    expected: 200000,
    collected: 150000,
    outstanding: 50000,
    overdue: 2,
    tenantCount: 5,
  }),
  getRecentPayments: vi.fn().mockResolvedValue([
    {
      id: 'p1', amount: 50000, payment_date: '2026-01-15', status: 'completed',
      tenant_first_name: 'John', tenant_last_name: 'Doe', unit_name: 'A1', property_name: 'Sunset',
      invoice_number: 'INV-001', payment_number: 'PAY-001', method: 'bank_transfer',
    },
  ]),
  getOverdueTenants: vi.fn().mockResolvedValue([
    { id: 'i1', tenant_id: 't1', invoice_id: 'i1', name: 'Late Payer', unit: 'B2', amount: 50000, daysOverdue: 5 },
  ]),
}));

vi.mock('@/services/reminders', () => ({
  sendReminder: vi.fn().mockResolvedValue({ success: true }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Dashboard', () => {
  it('renders dashboard stats', async () => {
    const Dashboard = (await import('../Dashboard')).default;
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/J\$200,000/)).toBeInTheDocument();
    });
  });

  it('shows overdue tenants', async () => {
    const Dashboard = (await import('../Dashboard')).default;
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Late Payer')).toBeInTheDocument();
    });
  });
});
