import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, verifyAdminSession, type AdminSessionPayload } from "@/lib/adminSession";
import { comparaConstante, lerCookieDeSessao, verifyAdminSessionSync } from "@/lib/adminSessionNode";
import { createLogger } from "@/lib/logger";
import {
  DEFAULT_ROLE,
  getRoleFromCookies,
  getRoleFromHeaders,
  hasPermission,
  type AdminPermission,
  type AdminRole,
} from "@/lib/rbac";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LayoutGuardOptions = {
  permission?: AdminPermission;
};

type ApiGuardOptions = {
  permission?: AdminPermission;
};

async function getVerifiedSession(
  store?: Awaited<ReturnType<typeof cookies>>,
): Promise<AdminSessionPayload | null> {
  const cookieStore = store ?? await cookies();
  return verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

function resolveRoleFromRequest(req: Request | NextRequest): AdminRole {
  if (req instanceof NextRequest) {
    return getRoleFromCookies(req.cookies);
  }
  return getRoleFromHeaders(req.headers);
}

export type AdminIdentity = {
  name: string;
  email?: string | null;
  role: AdminRole;
};

const adminAuthLogger = createLogger("admin:auth");

function identityFromSession(payload: AdminSessionPayload): AdminIdentity {
  return { role: payload.role, email: payload.email, name: payload.name };
}

export async function requireAdminLayout(options: LayoutGuardOptions = {}) {
  const store = await cookies();
  const session = await getVerifiedSession(store);
  if (!session) {
    adminAuthLogger.warn("Admin layout guard bloqueou acesso sem sessao valida");
    redirect("/admin/login");
  }

  const identity = identityFromSession(session);
  if (options.permission && !hasPermission(identity.role, options.permission)) {
    adminAuthLogger.warn("Admin sem permissao tentou acessar recurso", {
      role: identity.role,
      permission: options.permission,
    });
    redirect("/admin?permission=denied");
  }

  return identity;
}

export async function redirectIfAuthed() {
  const session = await getVerifiedSession();
  if (session) redirect("/admin/dashboard");
}

export function requireAdminApi(req: Request | NextRequest, options: ApiGuardOptions = {}) {
  // Este guard verifica a assinatura HMAC do admin_session -- de forma sincrona,
  // via node:crypto (ver src/lib/adminSessionNode.ts), porque os ~97 call sites
  // sao sincronos.
  //
  // O que mudou e por que: antes bastava a cookie NAO assinada `admin_auth=1`
  // (ou `adm=true`) para passar. Em /api/admin/* isso nao virava invasao porque
  // o proxy conferia a assinatura antes. Mas cinco rotas administrativas nao
  // moram sob /api/admin/*: /api/ai/captions, /api/ai/seo, /api/tracking/select,
  // /api/settings/tracking (POST) e /api/integrations/[provider]/resources. Nelas
  // o proxy nao olhava, e um `curl -H "Cookie: admin_auth=1"` respondia 200 em
  // producao. As duas cookies legadas deixaram de ser aceitas aqui.
  const checarPermissao = (papel: AdminRole): NextResponse | null => {
    if (!options.permission) return null;
    if (!hasPermission(papel, options.permission)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
    return null;
  };

  const sessao = verifyAdminSessionSync(lerCookieDeSessao(req, ADMIN_SESSION_COOKIE));
  if (sessao) {
    // O papel vem do payload assinado, nao da cookie de papel (gravada sem
    // assinatura, e portanto trocavel por "owner" a mao).
    return checarPermissao(sessao.role);
  }

  // Apenas ADMIN_PASS: NEXT_PUBLIC_* vai para o bundle do browser.
  if (comparaConstante(process.env.ADMIN_PASS, req.headers.get("x-admin-pass"))) {
    return checarPermissao(resolveRoleFromRequest(req));
  }

  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export function requireAdmin(req: Request | NextRequest, options: ApiGuardOptions = {}) {
  return requireAdminApi(req, options);
}

export async function logAdminAction(params: {
  route: string;
  method: string;
  action?: string;
  payload?: unknown;
  actor?: string;
  ip?: string;
}) {
  try {
    const sb = supabaseAdmin();
    await sb.from("admin_actions").insert([
      {
        route: params.route,
        method: params.method,
        action: params.action ?? null,
        payload: params.payload ?? null,
        actor: params.actor ?? null,
        ip: params.ip ?? null,
      },
    ]);
  } catch (error) {
    createLogger("admin:actions").warn("Falha ao registrar acao administrativa", {
      route: params.route,
      method: params.method,
      error: String(error),
    });
  }
}

export function resolveAdminContext(req: Request | NextRequest) {
  const role = resolveRoleFromRequest(req) ?? DEFAULT_ROLE;
  return { role };
}
