import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProfile, updateCompanyInfo, updateBankDetails, updateNotificationPreferences } from '../profile';

const mockChain = {
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
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

describe('updateProfile', () => {
  it('updates profile fields', async () => {
    mockResolve({ id: 'u1', first_name: 'New' });
    const result = await updateProfile('u1', { first_name: 'New' });
    expect(result).toEqual(expect.objectContaining({ first_name: 'New' }));
    expect(mockChain.update).toHaveBeenCalled();
  });

  it('throws on error', async () => {
    mockResolve(null, { message: 'fail' });
    await expect(updateProfile('u1', {})).rejects.toEqual({ message: 'fail' });
  });
});

describe('updateCompanyInfo', () => {
  it('updates company info', async () => {
    mockResolve({ id: 'u1', company_name: 'ACME' });
    const result = await updateCompanyInfo('u1', { company_name: 'ACME' });
    expect(result).toEqual(expect.objectContaining({ company_name: 'ACME' }));
  });
});

describe('updateBankDetails', () => {
  it('updates bank details', async () => {
    mockResolve({ id: 'u1', bank_name: 'NCB' });
    const result = await updateBankDetails('u1', { bank_name: 'NCB' });
    expect(result).toEqual(expect.objectContaining({ bank_name: 'NCB' }));
  });
});

describe('updateNotificationPreferences', () => {
  it('updates notification preferences', async () => {
    const prefs = { payments: true, overdue: false, invoices: true };
    mockResolve({ id: 'u1', notification_preferences: prefs });
    const result = await updateNotificationPreferences('u1', prefs);
    expect(result).toEqual(expect.objectContaining({ notification_preferences: prefs }));
  });
});
