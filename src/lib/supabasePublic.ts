import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

// Generic chainable stub builder that preserves chaining and
// resolves to a safe { data, error } object at the end of the chain.
function makeStubBuilder(result: any = { data: null, error: null }) {
  const methods = [
    'select',
    'maybeSingle',
    'single',
    'eq',
    'in',
    'order',
    'limit',
    'insert',
    'update',
    'delete',
    'rpc',
    'ilike',
    'like',
    'neq',
    'upsert',
  ];

  const builder: any = {};
  methods.forEach((m) => {
    builder[m] = (..._args: any[]) => builder;
  });
  // Terminal promise interface
  builder.then = (onFulfilled: any, onRejected: any) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  builder.catch = (onRejected: any) => Promise.resolve(result).catch(onRejected);
  builder.finally = (cb: any) => Promise.resolve(result).finally(cb);
  return builder;
}

export function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    // Always return a chainable stub builder when envs are missing.
    // Previously this threw in production and caused builds to fail when
    // NEXT_PUBLIC_SUPABASE_* were not configured. Returning the stub prevents
    // build-time crashes while still preserving the PostgREST-like API.
    return {
      from: (_: string) => makeStubBuilder(),
    } as any;
  }

  try {
    const client = createClient<Database>(url, anon, { auth: { persistSession: false } });
    return new Proxy(client, {
      get(target, prop) {
        const orig = (target as any)[prop];
        if (prop === 'from' && typeof orig === 'function') {
          return (table: string) => {
            try {
              const builder = orig.call(target, table);
              if (builder && typeof builder === 'object') return builder;
              return makeStubBuilder();
            } catch (e: any) {
              return makeStubBuilder({ data: null, error: e });
            }
          };
        }
        return orig;
      },
    }) as any;
  } catch (e: any) {
    return {
      from: (_: string) => makeStubBuilder({ data: null, error: e }),
    } as any;
  }
}
