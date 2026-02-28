import { describe, it, expect, vi, beforeEach } from 'vitest';
import { matchLocalIntent, processMessage } from '../aiChat';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      };
      Object.defineProperty(chain, 'then', {
        value: (resolve: any) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve),
        configurable: true, writable: true,
      });
      return chain;
    }),
    auth: {
      refreshSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test' } } }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: { reply: 'AI response', usage: { request_count: 1, limit: 5, remaining: 4 } },
        error: null,
      }),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('matchLocalIntent', () => {
  it('matches overdue intent', () => {
    expect(matchLocalIntent('who is overdue?')).toBe('overdue');
    expect(matchLocalIntent('which tenants are late')).toBe('overdue');
  });

  it('matches outstanding intent', () => {
    expect(matchLocalIntent('how much is outstanding')).toBe('outstanding');
  });

  it('matches tenant_count intent', () => {
    expect(matchLocalIntent('how many tenants do I have')).toBe('tenant_count');
  });

  it('matches collected intent', () => {
    expect(matchLocalIntent('how much rent collected')).toBe('collected');
  });

  it('matches recent_payments intent', () => {
    expect(matchLocalIntent('show recent payments')).toBe('recent_payments');
  });

  it('matches dashboard_stats intent', () => {
    expect(matchLocalIntent('give me a summary')).toBe('dashboard_stats');
  });

  it('returns null for unrecognized input', () => {
    expect(matchLocalIntent('what is the weather today')).toBeNull();
  });
});

describe('processMessage', () => {
  it('routes to local handler for matching intents', async () => {
    const result = await processMessage('who is overdue?', 'landlord1');
    expect(result.source).toBe('local');
    expect(result.reply).toContain('No tenants are currently overdue');
  });

  it('falls back to AI for non-matching messages', async () => {
    const result = await processMessage('write a polite message to my tenants', 'landlord1');
    expect(result.source).toBe('ai');
    expect(result.reply).toBe('AI response');
  });
});
