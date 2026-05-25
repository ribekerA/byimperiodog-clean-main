import type { NextRequest } from 'next/server';

/** Cria um stub mínimo de NextRequest para testar route handlers sem ambiente Next completo. */
export function makeNextRequestStub(url: string, init: { method?: string; headers?: Record<string,string>; body?: unknown } = {}): NextRequest {
  const req = new Request(url, {
    method: init.method || 'GET',
    headers: init.headers,
  body: init.body == null ? undefined : (typeof init.body === 'string' ? init.body : JSON.stringify(init.body)),
  });
  const parsed = new URL(url);
  const nextUrl = {
    pathname: parsed.pathname,
    searchParams: parsed.searchParams,
    toString: () => parsed.toString(),
  } as unknown as NextRequest['nextUrl'];
  const cookiesStore = new Map<string,string>();
  const cookies = {
    get: (name: string) => cookiesStore.has(name) ? { name, value: cookiesStore.get(name)! } : undefined,
    getAll: () => Array.from(cookiesStore.entries()).map(([name,value]) => ({ name, value })),
    has: (name: string) => cookiesStore.has(name),
    set: (name: string, value: string) => { cookiesStore.set(name,value); },
    delete: (name: string) => { cookiesStore.delete(name); },
    clear: () => { cookiesStore.clear(); },
    [Symbol.iterator]: function* () { for (const [name,value] of cookiesStore.entries()) yield { name, value }; }
  } as unknown as NextRequest['cookies'];
  const stub: Partial<NextRequest> & { [k:string]: unknown } = {
    headers: req.headers,
    method: req.method,
    url: req.url,
    json: () => req.json(),
    text: () => req.text(),
    nextUrl,
    cookies,
  };
  return stub as NextRequest;
}
