import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProperties, createProperty, getUnits, createUnit } from '../properties';

const mockChain = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
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

describe('getProperties', () => {
  it('returns properties with units', async () => {
    mockResolve([{ id: 'p1', name: 'Sunset', units: [{ id: 'u1', name: 'A1' }] }]);
    const result = await getProperties('landlord1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Sunset');
  });

  it('throws on error', async () => {
    mockResolve(null, { message: 'fail' });
    await expect(getProperties('x')).rejects.toEqual({ message: 'fail' });
  });
});

describe('createProperty', () => {
  it('creates a property', async () => {
    mockResolve({ id: 'p2', name: 'Palm View' });
    const result = await createProperty('landlord1', 'Palm View', '123 Main St');
    expect(result).toEqual(expect.objectContaining({ name: 'Palm View' }));
  });
});

describe('getUnits', () => {
  it('returns units for a property', async () => {
    mockResolve([{ id: 'u1', name: 'A1' }]);
    const result = await getUnits('p1');
    expect(result).toHaveLength(1);
  });
});

describe('createUnit', () => {
  it('creates a unit', async () => {
    mockResolve({ id: 'u2', name: 'B1', rent_amount: 45000 });
    const result = await createUnit('p1', 'B1', 45000);
    expect(result).toEqual(expect.objectContaining({ name: 'B1' }));
  });
});
