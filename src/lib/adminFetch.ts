// Wrapper central para chamadas a endpoints admin garantindo header x-admin-pass.

export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const compiledPass = process.env.NEXT_PUBLIC_ADMIN_PASS; // substituído em build
  const headers = new Headers(init.headers || {});
  // 1) Usa variável de build
  if (compiledPass && !headers.has('x-admin-pass')) headers.set('x-admin-pass', compiledPass);
  // 2) Fallback localStorage (runtime)
  if (typeof window !== 'undefined' && !headers.has('x-admin-pass')) {
    const stored = localStorage.getItem('adminPass');
    if (stored) headers.set('x-admin-pass', stored);
  }

  // Detecta ambiente Netlify e redireciona POST de /api/admin/puppies para a function
  let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : '';
  const isNetlify = typeof window !== 'undefined' && window.location.hostname.endsWith('.netlify.app');
  if (isNetlify && url.endsWith('/api/admin/puppies') && (init.method === 'POST' || init.method === 'PUT')) {
    // Netlify function endpoint
    url = '/.netlify/functions/add-puppy';
  }

  let res = await fetch(url || input, { ...init, headers });
  // 3) Se 401 no browser: perguntar uma vez e refazer
  if (typeof window !== 'undefined' && res.status === 401) {
    try {
      const trying = (window as any).__adminPassRetrying;
      if (!trying) {
        (window as any).__adminPassRetrying = true;
        const entered = window.prompt('Senha admin (x-admin-pass):');
        if (entered) {
          localStorage.setItem('adminPass', entered);
          headers.set('x-admin-pass', entered);
          res = await fetch(url || input, { ...init, headers });
        }
        (window as any).__adminPassRetrying = false;
      }
    } catch {}
  }
  return res;
}

export async function adminPostJSON<T=any>(url: string, data: any, extraInit: RequestInit = {}): Promise<T> {
  const res = await adminFetch(url, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json', ...(extraInit.headers||{}) }, ...extraInit });
  const json = await res.json().catch(()=>null);
  if(!res.ok) throw new Error(json?.error || 'Erro');
  return json as T;
}
