import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to manage mock responses per-call since getTenants makes multiple from() calls
let fromCallResponses: { data: unknown; error: unknown }[] = [];
let fromCallIdx = 0;

const mockChain: Record<string, any> = {};
const chainMethods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'single'];

for (const m of chainMethods) {
  mockChain[m] = vi.fn().mockImplementation(() => {
    // Refresh thenable on each chain call
    return mockChain;
  });
}

// Make chain thenable
function setCurrentResponse(data: unknown, error: unknown = null) {
  Object.defineProperty(mockChain, 'then', {
    value: (resolve: any) => Promise.resolve({ data, error }).then(resolve),
    configurable: true, writable: true,
  });
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      const response = fromCallResponses[fromCallIdx] ?? { data: [], error: null };
      fromCallIdx++;
      setCurrentResponse(response.data, response.error);
      return mockChain;
    }),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  fromCallIdx = 0;
  fromCallResponses = [];
  for (const m of chainMethods) {
    mockChain[m] = vi.fn().mockReturnValue(mockChain);
  }
});

import { getTenants, addTenant, updateTenant, deleteTenant } from '../tenants';

describe('getTenants', () => {
  it('returns mapped tenants with unit and property details', async () => {
    fromCallResponses = [
      // First from() call: fetch tenants
      { data: [{ id: 't1', first_name: 'John', last_name: 'Doe', unit: { name: 'A1', rent_amount: 50000, property: { name: 'Sunset' } } }], error: null },
      // Second from() call: fetch invoices for status
      { data: [{ tenant_id: 't1', status: 'paid' }], error: null },
    ];

    const result = await getTenants('landlord1');
    expect(result).toHaveLength(1);
    expect(result[0].unit_name).toBe('A1');
    expect(result[0].property_name).toBe('Sunset');
    expect(result[0].payment_status).toBe('paid');
  });

  it('throws on supabase error', async () => {
    fromCallResponses = [
      { data: null, error: { message: 'DB error' } },
    ];
    await expect(getTenants('landlord1')).rejects.toEqual({ message: 'DB error' });
  });
});

describe('addTenant', () => {
  it('inserts tenant and returns data', async () => {
    const tenant = { first_name: 'Jane', last_name: 'Doe', email: 'jane@test.com', phone: '555', unit_id: null, lease_start: null, lease_end: null };
    fromCallResponses = [
      { data: { id: 't2', ...tenant }, error: null },
    ];

    const result = await addTenant('landlord1', tenant);
    expect(result).toEqual(expect.objectContaining({ id: 't2' }));
    expect(mockChain.insert).toHaveBeenCalled();
  });
});

describe('updateTenant', () => {
  it('updates tenant and returns data', async () => {
    fromCallResponses = [
      { data: { id: 't1', first_name: 'Updated' }, error: null },
    ];
    const result = await updateTenant('t1', { first_name: 'Updated' });
    expect(result).toEqual(expect.objectContaining({ first_name: 'Updated' }));
    expect(mockChain.update).toHaveBeenCalled();
  });
});

describe('deleteTenant', () => {
  it('deletes without error', async () => {
    fromCallResponses = [
      { data: null, error: null },
    ];
    await expect(deleteTenant('t1')).resolves.toBeUndefined();
    expect(mockChain.delete).toHaveBeenCalled();
  });
});
