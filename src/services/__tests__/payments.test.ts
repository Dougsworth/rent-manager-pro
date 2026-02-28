import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPayments, createPayment, getPaymentsForTenant } from '../payments';

const mockChain = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
};

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn(() => mockChain) },
}));

function mockResolve(data: unknown, error: unknown = null) {
  Object.defineProperty(mockChain, 'then', {
    value: (resolve: any) => Promise.resolve({ data, error }).then(resolve),
    configurable: true, writable: true,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(mockChain)) {
    if (typeof (mockChain as any)[key]?.mockReturnThis === 'function') {
      (mockChain as any)[key].mockReturnThis();
    }
  }
});

describe('getPayments', () => {
  it('maps payment details', async () => {
    const raw = [{
      id: 'p1', amount: 50000, tenant: { first_name: 'John', last_name: 'Doe', unit: { name: 'A1', property: { name: 'Sunset' } } },
      invoice: { invoice_number: 'INV-001' },
    }];
    mockResolve(raw);
    const result = await getPayments('landlord1');
    expect(result[0].tenant_first_name).toBe('John');
    expect(result[0].invoice_number).toBe('INV-001');
  });
});

describe('createPayment', () => {
  it('inserts payment and marks invoice as paid when linked', async () => {
    mockResolve({ id: 'p2', amount: 40000 });
    const { supabase } = await import('@/lib/supabase');

    await createPayment('landlord1', {
      tenant_id: 't1', invoice_id: 'i1', amount: 40000, method: 'bank_transfer',
    });

    expect(mockChain.insert).toHaveBeenCalled();
    // Second from() call updates invoice status
    expect(supabase.from).toHaveBeenCalledWith('invoices');
  });

  it('does not update invoice when no invoice_id', async () => {
    mockResolve({ id: 'p3', amount: 40000 });
    const { supabase } = await import('@/lib/supabase');
    const callsBefore = (supabase.from as ReturnType<typeof vi.fn>).mock.calls.length;

    await createPayment('landlord1', { tenant_id: 't1', amount: 40000 });

    // Only one from() call (for payments insert), not two
    const callsAfter = (supabase.from as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(callsAfter - callsBefore).toBe(1);
  });
});

describe('getPaymentsForTenant', () => {
  it('returns payments for a tenant', async () => {
    mockResolve([{ id: 'p4' }]);
    const result = await getPaymentsForTenant('t1');
    expect(result).toHaveLength(1);
  });
});
