// Wrapper central para chamadas autenticadas do painel. A única credencial do
// navegador é a cookie HttpOnly assinada; senha administrativa nunca vai para
// localStorage, prompt, bundle ou header montado por JavaScript.
export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const res = await fetch(input, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: init.cache ?? "no-store",
  });
  if (typeof window !== "undefined" && res.status === 401 && window.location.pathname !== "/admin/login") {
    window.location.replace(new URL("/admin/login?reason=session-expired", window.location.origin).href);
  }
  return res;
}

export async function adminPostJSON<T=any>(url: string, data: any, extraInit: RequestInit = {}): Promise<T> {
  const res = await adminFetch(url, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json', ...(extraInit.headers||{}) }, ...extraInit });
  const json = await res.json().catch(()=>null);
  if(!res.ok) throw new Error(json?.error || 'Erro');
  return json as T;
}
