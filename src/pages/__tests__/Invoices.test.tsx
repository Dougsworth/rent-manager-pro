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

vi.mock('@/services/invoices', () => ({
  getInvoices: vi.fn().mockResolvedValue([
    {
      id: 'i1', invoice_number: 'INV-001', amount: 50000, due_date: '2026-03-01', status: 'pending',
      tenant_first_name: 'John', tenant_last_name: 'Doe', unit_name: 'A1', property_name: 'Sunset',
      payment_token: 'abc123',
    },
  ]),
  createInvoice: vi.fn().mockResolvedValue({ id: 'i2' }),
}));

vi.mock('@/services/tenants', () => ({
  getTenants: vi.fn().mockResolvedValue([
    { id: 't1', first_name: 'John', last_name: 'Doe', unit_name: 'A1' },
  ]),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Invoices', () => {
  it('renders invoice table', async () => {
    const Invoices = (await import('../Invoices')).default;
    renderWithProviders(<Invoices />);

    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('opens create invoice dialog', async () => {
    const Invoices = (await import('../Invoices')).default;
    renderWithProviders(<Invoices />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('Create Invoice')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Create Invoice'));

    await waitFor(() => {
      expect(screen.getByText('Amount (JMD)')).toBeInTheDocument();
    });
  });

  it('filters invoices by search', async () => {
    const Invoices = (await import('../Invoices')).default;
    renderWithProviders(<Invoices />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search invoices...');
    await user.type(searchInput, 'zzz');

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });
});
