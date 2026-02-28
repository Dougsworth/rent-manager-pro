import { vi } from 'vitest';

type ChainableQuery = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
};

export function createMockSupabaseClient(resolvedData: unknown = [], resolvedError: unknown = null) {
  const result = { data: resolvedData, error: resolvedError };

  const chain: ChainableQuery = {} as ChainableQuery;

  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gte', 'lte', 'order', 'limit', 'single',
    'maybeSingle', 'in',
  ] as const;

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal methods resolve the promise
  chain.then = vi.fn((resolve: (val: typeof result) => void) => resolve(result));

  // Make the chain thenable (awaitable)
  Object.defineProperty(chain, 'then', {
    value: (resolve: (val: typeof result) => void) => Promise.resolve(result).then(resolve),
    configurable: true,
  });

  const from = vi.fn().mockReturnValue(chain);
  const storage = {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/test.jpg' } }),
    }),
  };
  const functions = {
    invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
  };
  const auth = {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
  };

  return {
    from,
    storage,
    functions,
    auth,
    _chain: chain,
    _setResult: (data: unknown, error: unknown = null) => {
      Object.defineProperty(chain, 'then', {
        value: (resolve: (val: { data: unknown; error: unknown }) => void) =>
          Promise.resolve({ data, error }).then(resolve),
        configurable: true,
      });
    },
  };
}
