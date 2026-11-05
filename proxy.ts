import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/adminSession";
import { hasPermission, permissionForAdminRequest } from "@/lib/rbac";

/**
 * Middleware para proteção de rotas /admin e regras globais
 *
 * Rules:
 * 1. Força www em produção se configurado
 * 2. Protege /admin/* com cookie assinado "admin_session" (HMAC, ver src/lib/adminSession.ts)
 * 3. Protege /api/admin/* com o mesmo cookie assinado ou header "x-admin-pass"
 * 4. Remove indexação SEO de /admin (X-Robots-Tag)
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const url = req.nextUrl.clone();
  const requestId = req.headers.get("x-request-id")?.slice(0, 100) || crypto.randomUUID();

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
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApiPath = pathname === "/api/admin" || pathname.startsWith("/api/admin/");
  const isAdminLogin = pathname === "/admin/login";
  const isRotaAdminForaDoPrefixo = ehRotaAdministrativaForaDoPrefixo(pathname, req.method);

  let verifiedSession = null as Awaited<ReturnType<typeof verifyAdminSession>>;
  if (isAdminPath || isAdminApiPath || isRotaAdminForaDoPrefixo) {
    const sessionToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    verifiedSession = await verifyAdminSession(sessionToken);
  }
  const hasSession = verifiedSession !== null;

  if ((isAdminApiPath || isRotaAdminForaDoPrefixo) && metodoMutavel(req.method) && !origemPermitida(req)) {
    return NextResponse.json({ ok: false, error: "forbidden-origin" }, { status: 403 });
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

    if (!isAdminLogin && verifiedSession) {
      const permission = permissionForAdminRequest(pathname, "GET");
      if (!hasPermission(verifiedSession.role, permission)) {
        url.pathname = "/admin/dashboard";
        url.search = "?permission=denied";
        return NextResponse.redirect(url);
      }
    }
  }

  // ============================================================================
  // 4) REGRA: Proteção de /api/admin/* (cookie OU header "x-admin-pass")
  // ============================================================================
  if ((isAdminApiPath && pathname !== "/api/admin/login") || isRotaAdminForaDoPrefixo) {
    // Só ADMIN_PASS. NEXT_PUBLIC_* é inlinado no bundle do browser pelo Next,
    // então aceitar NEXT_PUBLIC_ADMIN_PASS aqui tornava possível autenticar com
    // uma senha que fica legível no JS público. Se precisar de acesso por
    // script, use o header x-admin-pass com o valor de ADMIN_PASS.
    const authedByHeader = await comparaConstanteEdge(
      process.env.ADMIN_PASS,
      req.headers.get("x-admin-pass"),
    );

    // Rejeita se não tem sessão E não tem header válido
    if (!hasSession && !authedByHeader) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (verifiedSession) {
      const permission = permissionForAdminRequest(pathname, req.method);
      if (!hasPermission(verifiedSession.role, permission)) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
    }
  }

  // ============================================================================
  // 5) REGRA: SEO + pathname propagation para Server Components
  // x-next-pathname injeta o path atual nos headers de request para que o
  // root layout possa detectar isAdminRoute sem depender de headers instáveis.
  // ============================================================================
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-next-pathname", pathname);
  requestHeaders.set("x-request-id", requestId);

  if (isAdminPath || isAdminApiPath) {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    res.headers.set("X-Request-ID", requestId);
    return res;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("X-Request-ID", requestId);
  return response;
}

function metodoMutavel(method: string): boolean {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}

function origemPermitida(req: NextRequest): boolean {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === req.nextUrl.origin;
  } catch {
    return false;
  }
}

async function comparaConstanteEdge(
  expected: string | undefined,
  received: string | null,
): Promise<boolean> {
  if (!expected || !received) return false;
  const encoder = new TextEncoder();
  const [expectedHash, receivedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
    crypto.subtle.digest("SHA-256", encoder.encode(received)),
  ]);
  const a = new Uint8Array(expectedHash);
  const b = new Uint8Array(receivedHash);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

/**
 * Rotas administrativas que NAO moram sob /admin nem sob /api/admin.
 *
 * Existiam cinco delas confiando so no guard sincrono `requireAdmin`, que ate
 * esta rodada aceitava a cookie nao assinada `admin_auth=1`. O guard foi
 * corrigido (src/lib/adminAuth.ts), mas o proxy passa a cobri-las tambem: e a
 * mesma logica de defesa em profundidade que ja protege /api/admin/*, e vale
 * para as rotas de integracao (`login` e `callback`), que nao tinham guard
 * nenhum e gravam access_token de provedor com a chave de servico.
 *
 * /api/settings/tracking e o unico caso com metodo: o GET alimenta o site
 * publico (hooks de tracking) e continua aberto; so a escrita exige sessao.
 */
const ROTAS_ADMIN_EXATAS = new Set([
  "/api/ai/captions",
  "/api/ai/seo",
  "/api/tracking/select",
  "/api/tracking/settings",
  "/api/blog/import",
  "/api/blog/generate",
]);

const ROTAS_ADMIN_SOMENTE_GET = new Set(["/api/analytics", "/api/rum"]);

const PREFIXOS_ADMIN = ["/api/integrations/"];

function ehRotaAdministrativaForaDoPrefixo(pathname: string, metodo: string): boolean {
  if (ROTAS_ADMIN_EXATAS.has(pathname)) return true;
  if (ROTAS_ADMIN_SOMENTE_GET.has(pathname) && (metodo === "GET" || metodo === "HEAD")) return true;
  if (PREFIXOS_ADMIN.some((prefixo) => pathname.startsWith(prefixo))) return true;
  if (pathname === "/api/settings/tracking" && metodo !== "GET" && metodo !== "HEAD") return true;
  return false;
}

export const config = {
  // Aplica em tudo, exceto assets estáticos comuns
  matcher: [
    // llms.txt entra na lista pelo mesmo motivo de robots.txt e sitemap.xml:
    // e arquivo estatico lido por robo, nao tem sessao para verificar, e o
    // middleware so encareceria a resposta.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|llms.txt|sitemap.xml|assets/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)).*)",
  ],
};
