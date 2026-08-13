import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/adminSession";

/**
 * Middleware para proteção de rotas /admin e regras globais
 *
 * Rules:
 * 1. Força www em produção se configurado
 * 2. Protege /admin/* com cookie assinado "admin_session" (HMAC, ver src/lib/adminSession.ts)
 * 3. Protege /api/admin/* com o mesmo cookie assinado ou header "x-admin-pass"
 * 4. Remove indexação SEO de /admin (X-Robots-Tag)
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const url = req.nextUrl.clone();

  // ============================================================================
  // 1) REGRA: Forçar www em produção
  // ============================================================================
  const targetBase = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  const shouldForceWww = targetBase.startsWith("https://www.");
  
  if (!pathname.startsWith("/api") && shouldForceWww) {
    const nakedHost = targetBase.replace(/^https?:\/\//, "").replace(/^www\./, "");
    if (url.hostname === nakedHost) {
      url.hostname = `www.${url.hostname}`;
      return NextResponse.redirect(url, 308);
    }
  }

  // O redirect /authors → /autores foi removido. /autores nunca existiu como
  // rota (ver o comentário em src/lib/seo.core.ts, buildAuthorJsonLd), então a
  // regra fazia 308 permanente para uma URL que responde 404 — cadeia de
  // redirecionamento terminando em erro, que é pior para o crawler do que um
  // 404 direto, e rodava em toda requisição do site.

  // ============================================================================
  // 3) REGRA: Proteção de rotas /admin/* (exigir cookie assinado "admin_session" valido)
  // ============================================================================
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminApiPath = pathname.startsWith("/api/admin");
  const isAdminLogin = pathname === "/admin/login";

  let hasSession = false;
  if (isAdminPath || isAdminApiPath) {
    const sessionToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const verified = await verifyAdminSession(sessionToken);
    hasSession = verified !== null;
  }

  if (isAdminPath) {
    // Se é /admin/login e JÁ tem sessão, redirecionar para dashboard
    if (isAdminLogin && hasSession) {
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }

    // Se NÃO é /admin/login e NÃO tem sessão, redirecionar para login
    if (!isAdminLogin && !hasSession) {
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // ============================================================================
  // 4) REGRA: Proteção de /api/admin/* (cookie OU header "x-admin-pass")
  // ============================================================================
  if (isAdminApiPath && pathname !== "/api/admin/login") {
    // Só ADMIN_PASS. NEXT_PUBLIC_* é inlinado no bundle do browser pelo Next,
    // então aceitar NEXT_PUBLIC_ADMIN_PASS aqui tornava possível autenticar com
    // uma senha que fica legível no JS público. Se precisar de acesso por
    // script, use o header x-admin-pass com o valor de ADMIN_PASS.
    const expectedPass = process.env.ADMIN_PASS;
    const headerPass = req.headers.get("x-admin-pass");
    const authedByHeader = !!expectedPass && headerPass === expectedPass;

    // Rejeita se não tem sessão E não tem header válido
    if (!hasSession && !authedByHeader) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  // ============================================================================
  // 5) REGRA: SEO + pathname propagation para Server Components
  // x-next-pathname injeta o path atual nos headers de request para que o
  // root layout possa detectar isAdminRoute sem depender de headers instáveis.
  // ============================================================================
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-next-pathname", pathname);

  if (isAdminPath || isAdminApiPath) {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    return res;
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Aplica em tudo, exceto assets estáticos comuns
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)).*)",
  ],
};
