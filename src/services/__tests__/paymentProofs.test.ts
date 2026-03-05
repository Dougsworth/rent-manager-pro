import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitPaymentProof, getProofsForLandlord, rejectProof } from '../paymentProofs';

const mockChain = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
};

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockChain),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/test.jpg' } }),
      })),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
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

describe('submitPaymentProof', () => {
  it('inserts a payment proof record', async () => {
    mockResolve({ id: 'pp1' });
    const result = await submitPaymentProof('i1', 't1', 'l1', 'https://img.com/proof.jpg');
    expect(result).toEqual(expect.objectContaining({ id: 'pp1' }));
    expect(mockChain.insert).toHaveBeenCalled();
  });
});

describe('getProofsForLandlord', () => {
  it('maps tenant and invoice details', async () => {
    const raw = [{
      id: 'pp1', tenant: { first_name: 'Jane', last_name: 'Doe' },
      invoice: { invoice_number: 'INV-001', amount: 50000 },
    }];
    mockResolve(raw);
    const result = await getProofsForLandlord('landlord1');
    expect(result[0].tenant_first_name).toBe('Jane');
    expect(result[0].invoice_number).toBe('INV-001');
    expect(result[0].invoice_amount).toBe(50000);
  });
});

describe('rejectProof', () => {
  it('updates proof status to rejected', async () => {
    mockResolve(null, null);
    await expect(rejectProof('pp1', 'landlord1', 'Bad image')).resolves.toBeUndefined();
    expect(mockChain.update).toHaveBeenCalled();
  });
});
