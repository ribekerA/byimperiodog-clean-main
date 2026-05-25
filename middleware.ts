import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware para proteção de rotas /admin e regras globais
 * 
 * Rules:
 * 1. Força www em produção se configurado
 * 2. Protege /admin/* com cookie "admin_session"
 * 3. Protege /api/admin/* com cookie ou header "x-admin-pass"
 * 4. Remove indexação SEO de /admin (X-Robots-Tag)
 */
export function middleware(req: NextRequest) {
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

  // ============================================================================
  // 2) REGRA: Redirect /authors → /autores (unificar idioma)
  // ============================================================================
  if (pathname.startsWith("/authors")) {
    url.pathname = pathname.replace(/^\/authors/, "/autores");
    return NextResponse.redirect(url, 308);
  }

  // ============================================================================
  // 3) REGRA: Proteção de rotas /admin/* (exigir cookie "admin_session")
  // ============================================================================
  const adminSession = req.cookies.get("admin_session")?.value || "";
  const hasSession = adminSession.length > 0;
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminLogin = pathname === "/admin/login";

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
  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/login") {
    const expectedPass = process.env.NEXT_PUBLIC_ADMIN_PASS || process.env.ADMIN_PASS;
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
  // 5) REGRA: SEO - Adicionar X-Robots-Tag para /admin (noindex, nofollow)
  // ============================================================================
  if (isAdminPath || pathname.startsWith("/api/admin")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Aplica em tudo, exceto assets estáticos comuns
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)).*)",
  ],
};
