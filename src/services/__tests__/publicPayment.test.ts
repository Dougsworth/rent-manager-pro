import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getInvoiceByToken, submitProofByToken } from '../publicPayment';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/test.jpg' } }),
      })),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getInvoiceByToken', () => {
  it('returns invoice data from RPC', async () => {
    const { supabase } = await import('@/lib/supabase');
    const invoiceData = { id: 'i1', amount: 50000, tenant_name: 'John Doe' };
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: invoiceData, error: null });

    const result = await getInvoiceByToken('abc123');
    expect(result).toEqual(invoiceData);
    expect(supabase.rpc).toHaveBeenCalledWith('get_invoice_by_token', { p_token: 'abc123' });
  });

  it('throws on error', async () => {
    const { supabase } = await import('@/lib/supabase');
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: { message: 'fail' } });
    await expect(getInvoiceByToken('bad')).rejects.toEqual({ message: 'fail' });
  });
});

describe('submitProofByToken', () => {
  it('calls RPC with token and image URL', async () => {
    const { supabase } = await import('@/lib/supabase');
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { success: true }, error: null });

    const result = await submitProofByToken('abc123', 'https://img.com/proof.jpg');
    expect(result).toEqual({ success: true });
    expect(supabase.rpc).toHaveBeenCalledWith('submit_proof_by_token', {
      p_token: 'abc123',
      p_image_url: 'https://img.com/proof.jpg',
    });
  });
});
