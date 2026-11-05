import { cookies } from 'next/headers';

import { ADMIN_SESSION_COOKIE } from '@/lib/adminSession';

/** Fetch server-side reutilizando cookies admin para rotas internas. */
export async function adminFetchSSR(path:string, init:RequestInit = {}){
  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  const url = path.startsWith('http')? path : `${base}${path}`;
  // Encaminha somente a sessão HMAC. Cookies legadas não autenticam nada.
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE);
  const headers = new Headers(init.headers||{});
  if(session) headers.set('cookie', `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(session.value)}`);
  return fetch(url, { ...init, headers, cache:'no-store' });
}
