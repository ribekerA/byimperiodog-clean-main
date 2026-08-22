import { cookies } from 'next/headers';

import { ADMIN_SESSION_COOKIE } from '@/lib/adminSession';

/** Fetch server-side reutilizando cookies admin para rotas internas. */
export async function adminFetchSSR(path:string, init:RequestInit = {}){
  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  const url = path.startsWith('http')? path : `${base}${path}`;
  // Encaminha a sessao assinada. Antes encaminhava adm/admin_auth, que eram os
  // cookies sem assinatura — a chamada interna reproduzia o mesmo caminho fraco.
  const cookieStore = cookies();
  const sessao = cookieStore.get(ADMIN_SESSION_COOKIE);
  const headers = new Headers(init.headers||{});
  if(sessao) headers.append('cookie', `${ADMIN_SESSION_COOKIE}=${sessao.value}`);
  return fetch(url, { ...init, headers, cache:'no-store' });
}
