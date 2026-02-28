import { describe, it, expect, vi, beforeEach } from 'vitest';

let fromCallResponses: { data: unknown; error: unknown; count?: number }[] = [];
let fromCallIdx = 0;

const mockChain: Record<string, any> = {};
const chainMethods = ['select', 'eq', 'gte', 'lte', 'order', 'limit'];

for (const m of chainMethods) {
  mockChain[m] = vi.fn().mockReturnValue(mockChain);
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      const response = fromCallResponses[fromCallIdx] ?? { data: [], error: null };
      fromCallIdx++;
      Object.defineProperty(mockChain, 'then', {
        value: (resolve: any) => Promise.resolve({ data: response.data, error: response.error, count: response.count }).then(resolve),
        configurable: true, writable: true,
      });
      return mockChain;
    }),
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

import { getDashboardStats, getRecentPayments, getOverdueTenants } from '../dashboard';

describe('getDashboardStats', () => {
  it('calculates stats correctly', async () => {
    fromCallResponses = [
      // tenant count query (uses { count: 'exact', head: true })
      { data: null, error: null, count: 5 },
      // invoices query
      {
        data: [
          { amount: 50000, status: 'paid' },
          { amount: 50000, status: 'overdue' },
          { amount: 30000, status: 'pending' },
        ],
        error: null,
      },
    ];

    const stats = await getDashboardStats('landlord1');
    expect(stats.expected).toBe(130000);
    expect(stats.collected).toBe(50000);
    expect(stats.outstanding).toBe(80000);
    expect(stats.overdue).toBe(1);
    expect(stats.tenantCount).toBe(5);
  });
});

describe('getRecentPayments', () => {
  it('returns mapped payments', async () => {
    fromCallResponses = [
      {
        data: [{
          id: 'p1', amount: 50000, payment_date: '2026-01-15',
          tenant: { first_name: 'John', last_name: 'Doe', unit: { name: 'A1', property: { name: 'Sunset' } } },
          invoice: { invoice_number: 'INV-001' },
        }],
        error: null,
      },
    ];

    const result = await getRecentPayments('landlord1');
    expect(result[0].tenant_first_name).toBe('John');
    expect(result[0].property_name).toBe('Sunset');
  });
});

describe('getOverdueTenants', () => {
  it('returns overdue tenants with days calculation', async () => {
    const pastDate = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
    fromCallResponses = [
      {
        data: [{
          id: 'i1', tenant_id: 't1', amount: 50000, due_date: pastDate,
          tenant: { first_name: 'Late', last_name: 'Payer', unit: { name: 'B2' } },
        }],
        error: null,
      },
    ];

    const result = await getOverdueTenants('landlord1');
    expect(result[0].name).toBe('Late Payer');
    expect(result[0].daysOverdue).toBeGreaterThanOrEqual(4);
  });
});
