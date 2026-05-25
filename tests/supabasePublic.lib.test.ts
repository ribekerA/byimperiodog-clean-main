import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

const ORIGINAL_ENV = { ...process.env };

type QueryResult = { data: unknown; error: unknown };
interface Chainable<T = QueryResult> extends PromiseLike<T> {
  select(): Chainable<T>;
  eq(..._args: unknown[]): Chainable<T>;
}

async function loadSupabasePublic() {
  vi.resetModules();
  return (await import('../src/lib/supabasePublic')).supabasePublic;
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.clearAllMocks();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('supabasePublic()', () => {
  it('returns stub builder when env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabasePublic = await loadSupabasePublic();
    const client = supabasePublic();

    const { createClient } = await import('@supabase/supabase-js');
    expect(createClient).not.toHaveBeenCalled();

    const result = await client.from('anything').select().eq('x', 1);
    expect(result).toEqual({ data: null, error: null });
  });

  it('creates real client proxy when env vars exist (happy path)', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    const fakeQueryResult: QueryResult = { data: { ok: true }, error: null };

    const builder: Chainable<QueryResult> = {
      select() { return this; },
      eq() { return this; },
      then(onFulfilled, onRejected) { return Promise.resolve(fakeQueryResult).then(onFulfilled, onRejected); },
    } as Chainable<QueryResult>;

    const fromFn = vi.fn().mockImplementation(() => builder);

    const { createClient } = await import('@supabase/supabase-js');
    (createClient as unknown as { mockImplementation: (impl: (...args: unknown[]) => unknown) => void })
      .mockImplementation(() => ({ from: fromFn }));

    const supabasePublic = await loadSupabasePublic();
    const client = supabasePublic();

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
      expect.objectContaining({ auth: { persistSession: false } })
    );

    const result = await client.from('posts').select().eq('id', 123);
    expect(fromFn).toHaveBeenCalledWith('posts');
    expect(result).toEqual(fakeQueryResult);
  });

  it('returns error stub when createClient throws', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://throw.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    const { createClient } = await import('@supabase/supabase-js');
    (createClient as unknown as { mockImplementation: (impl: () => never) => void })
      .mockImplementation(() => { throw new Error('create fail'); });

    const supabasePublic = await loadSupabasePublic();
    const client = supabasePublic();

    const result = await client.from('anything').select();
    expect(result.error).toBeInstanceOf(Error);
    if (result.error instanceof Error) {
      expect(result.error.message).toMatch(/create fail/);
    }
  });

  it('wraps inner from() errors and still returns chainable stub', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://boom.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    const { createClient } = await import('@supabase/supabase-js');
    (createClient as unknown as { mockImplementation: (impl: () => { from: () => never }) => void })
      .mockImplementation(() => ({
        from: () => { throw new Error('inner boom'); },
      }));

    const supabasePublic = await loadSupabasePublic();
    const client = supabasePublic();

    const result = await client.from('table').select();
    expect(result.error).toBeInstanceOf(Error);
    if (result.error instanceof Error) {
      expect(result.error.message).toMatch(/inner boom/);
    }
  });

  it('falls back to stub builder if from() returns non-object', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://weird.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    const { createClient } = await import('@supabase/supabase-js');
    (createClient as unknown as { mockImplementation: (impl: () => { from: () => null }) => void })
      .mockImplementation(() => ({
        from: () => null,
      }));

    const supabasePublic = await loadSupabasePublic();
    const client = supabasePublic();

    const result = await client.from('table').select();
    expect(result).toEqual({ data: null, error: null });
  });
});
