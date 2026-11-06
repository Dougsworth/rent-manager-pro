import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/lib/supabase', () => ({ supabase: { from: () => ({}), auth: {}, functions: {} } }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    profile: { first_name: 'Test', last_name: 'User', role: 'landlord' },
    loading: false,
    isLandlord: true,
  }),
}));

vi.mock('@/services/collections', () => ({
  summarizeHistory: () => 'No payment history yet.',
  isoDate: () => '2026-01-20',
  getCollections: vi.fn().mockResolvedValue({
    owed: 200000,
    late: 50000,
    comingUp: 150000,
    collected: 150000,
    lateCount: 1,
    isEmpty: false,
    recent: [{ id: 'p1', name: 'John Doe', amount: 50000, date: '2026-01-15' }],
    items: [
      { key: 'invoice-i1', kind: 'rent', personId: 't1', name: 'Late Payer', what: 'B2', amount: 50000, dueDate: '2026-01-15', daysLate: 5, daysUntilDue: 0, history: [], invoiceId: 'i1', paymentToken: 'x' },
    ],
  }),
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
