import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getInvoices, createInvoice, getInvoicesForTenant, updateInvoice } from '../invoices';

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

describe('getInvoices', () => {
  it('maps tenant details onto invoices', async () => {
    const raw = [{
      id: 'i1', amount: 50000, tenant: { first_name: 'Jane', last_name: 'Doe', unit: { name: 'A1', property: { name: 'Sunset' } } },
    }];
    mockResolve(raw);
    const result = await getInvoices('landlord1');
    expect(result[0].tenant_first_name).toBe('Jane');
    expect(result[0].property_name).toBe('Sunset');
  });

  it('throws on error', async () => {
    mockResolve(null, { message: 'fail' });
    await expect(getInvoices('x')).rejects.toEqual({ message: 'fail' });
  });
});

describe('createInvoice', () => {
  it('inserts invoice and returns data', async () => {
    mockResolve({ id: 'i2', amount: 30000 });
    const result = await createInvoice('landlord1', { tenant_id: 't1', amount: 30000, due_date: '2026-03-01' });
    expect(result).toEqual(expect.objectContaining({ id: 'i2' }));
    expect(mockChain.insert).toHaveBeenCalled();
  });
});

describe('getInvoicesForTenant', () => {
  it('returns invoices for tenant', async () => {
    mockResolve([{ id: 'i3' }]);
    const result = await getInvoicesForTenant('t1');
    expect(result).toHaveLength(1);
  });
});

describe('updateInvoice', () => {
  it('updates invoice', async () => {
    mockResolve({ id: 'i1', status: 'paid' });
    const result = await updateInvoice('i1', { status: 'paid' });
    expect(result).toEqual(expect.objectContaining({ status: 'paid' }));
  });
});
