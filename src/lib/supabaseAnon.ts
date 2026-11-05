import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

function makeStubBuilder(result: any = { data: null, error: null }) {
  const methods = [
    'select', 'maybeSingle', 'single', 'eq', 'in', 'order', 'limit',
    'insert', 'update', 'delete', 'rpc', 'ilike', 'like', 'neq', 'upsert'
  ];
  const builder: any = {};
  methods.forEach((m) => { builder[m] = (..._args: any[]) => builder; });
  builder.then = (onFulfilled: any, onRejected: any) => Promise.resolve(result).then(onFulfilled, onRejected);
  builder.catch = (onRejected: any) => Promise.resolve(result).catch(onRejected);
  builder.finally = (cb: any) => Promise.resolve(result).finally(cb);
  return builder;
}

let client: ReturnType<typeof createClient<Database>> | null = null;

/** Cliente efêmero para autenticação de servidor. Não compartilha access token
 * entre requisições concorrentes e não inicia refresh em segundo plano. */
export function createSupabaseAuthClient(): ReturnType<typeof createClient<Database>> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function supabaseAnon(){
  if(client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if(!url || !key){
    return { from: (_: string) => makeStubBuilder({ data: [], error: null }) } as any;
  }

  try{
    client = createClient<Database>(url, key, { auth: { persistSession:false } });
    return client;
  }catch(e){
    return { from: (_: string) => makeStubBuilder({ data: [], error: null }) } as any;
  }
}
