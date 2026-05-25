import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

function makeStubBuilder(result: any = { data: null, error: null }) {
  const methods = [
    "select",
    "maybeSingle",
    "single",
    "eq",
    "neq",
    "lte",
    "gte",
    "lt",
    "gt",
    "in",
    "or",
    "order",
    "limit",
    "range",
    "insert",
    "update",
    "delete",
    "upsert",
    "rpc",
    "ilike",
    "like"
  ];
  const builder: any = {};
  methods.forEach((m) => {
    builder[m] = (..._args: any[]) => builder;
  });
  builder.then = (onFulfilled: any, onRejected: any) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  builder.catch = (onRejected: any) =>
    Promise.resolve(result).catch(onRejected);
  builder.finally = (cb: any) =>
    Promise.resolve(result).finally(cb);
  return builder;
}

export function hasServiceRoleKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    if (!process.env.__SUPABASE_MISSING_LOGGED) {
      console.warn(
        "[supabaseAdmin] Credenciais Supabase ausentes; retornando stub. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para habilitar recursos administrativos."
      );
      process.env.__SUPABASE_MISSING_LOGGED = "1";
    }
    return { from: (_: string) => makeStubBuilder({ data: [], error: null }) } as any;
  }

  try {
    const client = createClient<Database>(url, key, { auth: { persistSession: false } });
    return new Proxy(client, {
      get(target, prop) {
        const orig = (target as any)[prop];
        if (prop === "from" && typeof orig === "function") {
          return (table: string) => {
            try {
              const builder = orig.call(target, table);
              if (builder && typeof builder === "object") return builder;
              return makeStubBuilder();
            } catch (e: any) {
              return makeStubBuilder({ data: null, error: e });
            }
          };
        }
        return orig;
      }
    }) as any;
  } catch (e: any) {
    if (process.env.NODE_ENV !== "production") {
      return { from: (_: string) => makeStubBuilder({ data: [], error: null }) } as any;
    }
    throw e;
  }
}
