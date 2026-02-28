import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendReminder } from '../reminders';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendReminder', () => {
  it('invokes the send-reminder edge function', async () => {
    const { supabase } = await import('@/lib/supabase');
    const result = await sendReminder('t1', 'i1');
    expect(result).toEqual({ success: true });
    expect(supabase.functions.invoke).toHaveBeenCalledWith('send-reminder', {
      body: { tenant_id: 't1', invoice_id: 'i1' },
      headers: { Authorization: 'Bearer test-token' },
    });
  });

  it('throws when not authenticated', async () => {
    const { supabase } = await import('@/lib/supabase');
    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { session: null },
    });
    await expect(sendReminder('t1', 'i1')).rejects.toThrow('Not authenticated');
  });
});
