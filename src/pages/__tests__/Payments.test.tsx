import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    profile: { role: 'landlord' },
    loading: false,
  }),
}));

vi.mock('@/services/payments', () => ({
  getPayments: vi.fn().mockResolvedValue([
    {
      id: 'p1', payment_number: 'PAY-001', amount: 50000, payment_date: '2026-01-15', status: 'completed', method: 'bank_transfer',
      tenant_first_name: 'John', tenant_last_name: 'Doe', unit_name: 'A1', property_name: 'Sunset',
      invoice_number: 'INV-001',
    },
  ]),
  createPayment: vi.fn().mockResolvedValue({ id: 'p2' }),
}));

vi.mock('@/services/tenants', () => ({
  getTenants: vi.fn().mockResolvedValue([
    { id: 't1', first_name: 'John', last_name: 'Doe' },
  ]),
}));

vi.mock('@/services/invoices', () => ({
  getInvoices: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/services/paymentProofs', () => ({
  getProofsForLandlord: vi.fn().mockResolvedValue([]),
  approveProof: vi.fn().mockResolvedValue({}),
  rejectProof: vi.fn().mockResolvedValue({}),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Payments', () => {
  it('renders payment table', async () => {
    const Payments = (await import('../Payments')).default;
    renderWithProviders(<Payments />);

    await waitFor(() => {
      expect(screen.getByText('PAY-001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('opens record payment dialog', async () => {
    const Payments = (await import('../Payments')).default;
    renderWithProviders(<Payments />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('Record Payment')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Record Payment'));

    await waitFor(() => {
      expect(screen.getByText('Amount (JMD)')).toBeInTheDocument();
    });
  });

  it('shows pending proofs tab', async () => {
    const Payments = (await import('../Payments')).default;
    renderWithProviders(<Payments />);

    await waitFor(() => {
      expect(screen.getByText('Pending Proofs')).toBeInTheDocument();
    });
  });
});
