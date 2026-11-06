import { describe, it, expect, vi } from 'vitest';
vi.mock('@/lib/supabase', () => ({ supabase: { from: () => ({}), auth: {}, functions: {} } }));
import { buildHistory, summarizeHistory } from '../collections';

const now = new Date(2026, 10, 6); // Nov 6, 2026

describe('buildHistory', () => {
  it('returns twelve months ending this month', () => {
    const h = buildHistory([], now);
    expect(h).toHaveLength(12);
    expect(h[0].key).toBe('2025-12');
    expect(h[11].key).toBe('2026-11');
    expect(h.every((m) => m.state === 'none')).toBe(true);
  });

  it('marks on time, late paid, late now and due', () => {
    const h = buildHistory([
      { dueDate: '2026-08-01', paid: true, paidDate: '2026-08-01' },
      { dueDate: '2026-09-01', paid: true, paidDate: '2026-09-07' },
      { dueDate: '2026-10-01', paid: true },
      { dueDate: '2026-11-01', paid: false },
    ], now);
    const by = Object.fromEntries(h.map((m) => [m.key, m.state]));
    expect(by['2026-08']).toBe('paid');
    expect(by['2026-09']).toBe('paid-late');
    expect(by['2026-10']).toBe('paid');
    expect(by['2026-11']).toBe('late');
    expect(buildHistory([{ dueDate: '2026-11-20', paid: false }], now)[11].state).toBe('due');
  });

  it('lets the worst state win within a month', () => {
    const h = buildHistory([
      { dueDate: '2026-10-01', paid: true, paidDate: '2026-10-01' },
      { dueDate: '2026-10-15', paid: false },
    ], now);
    expect(h[10].state).toBe('late');
  });
});

describe('summarizeHistory', () => {
  it('describes history in a plain sentence', () => {
    const h = buildHistory([
      { dueDate: '2026-09-01', paid: true, paidDate: '2026-09-09' },
      { dueDate: '2026-10-01', paid: true, paidDate: '2026-10-01' },
      { dueDate: '2026-11-01', paid: false },
    ], now);
    expect(summarizeHistory(h)).toBe('Paid 2 of the last 3 months. 1 was late.');
    expect(summarizeHistory(buildHistory([], now))).toBe('No payment history yet.');
  });
});
