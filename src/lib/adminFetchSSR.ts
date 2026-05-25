import { cookies } from 'next/headers';

/** Fetch server-side reutilizando cookies admin para rotas internas. */
export async function adminFetchSSR(path:string, init:RequestInit = {}){
  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  const url = path.startsWith('http')? path : `${base}${path}`;
  // Encaminha cookies admin
  const cookieStore = cookies();
  const adm = cookieStore.get('adm');
  const legacy = cookieStore.get('admin_auth');
  const headers = new Headers(init.headers||{});
  if(adm) headers.append('cookie', `adm=${adm.value}`);
  if(legacy) headers.append('cookie', `admin_auth=${legacy.value}`);
  return fetch(url, { ...init, headers, cache:'no-store' });
}
