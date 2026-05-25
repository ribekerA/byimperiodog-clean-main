import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Cookie de autenticação (fluxo principal do Admin)
  const adm = req.cookies.get("adm")?.value || "";
  const authedCookie = adm === "true" || adm === "1";

  // Protege rotas de páginas do admin
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!authedCookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Evita exibir a tela de login quando já autenticado
  if (pathname === "/admin/login" && authedCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  // Protege também os endpoints da API do admin
  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/login") {
    const expected = process.env.NEXT_PUBLIC_ADMIN_PASS || process.env.ADMIN_PASS;
    const headerPass = req.headers.get("x-admin-pass");
    const authedHeader = !!expected && headerPass === expected;
    if (!(authedCookie || authedHeader)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };

