import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, verifyAdminSession, type AdminSessionPayload } from "@/lib/adminSession";
import {
  autenticadoPorSegredoDeMaquina,
  lerCookieDoHeader,
  origemSuspeita,
} from "@/lib/adminRequestGuard";
import { createLogger } from "@/lib/logger";
import { hasPermission, type AdminPermission, type AdminRole } from "@/lib/rbac";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LayoutGuardOptions = {
  permission?: AdminPermission;
};

type ApiGuardOptions = {
  permission?: AdminPermission;
  /** Rotas que legitimamente aceitam POST de outra origem (nenhuma, hoje). */
  allowCrossOrigin?: boolean;
};

const adminAuthLogger = createLogger("admin:auth");

async function getVerifiedSession(store = cookies()): Promise<AdminSessionPayload | null> {
  return verifyAdminSession(store.get(ADMIN_SESSION_COOKIE)?.value);
}

export type AdminIdentity = {
  name: string;
  email?: string | null;
  role: AdminRole;
};

function identityFromSession(payload: AdminSessionPayload): AdminIdentity {
  return { role: payload.role, email: payload.email, name: payload.name };
}

export async function requireAdminLayout(options: LayoutGuardOptions = {}) {
  const store = cookies();
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

/**
 * Portao unico das rotas administrativas.
 *
 * O que existia antes aceitava `admin_auth=1` ou `adm=true` — cookies sem
 * assinatura nenhuma, que qualquer cliente monta a mao — e lia a funcao do
 * usuario do header `x-admin-role`, tambem enviado pelo cliente. Na pratica a
 * autorizacao era um pedido gentil. Agora funcao e identidade saem so do
 * cookie assinado (HMAC, ver src/lib/adminSession.ts) ou do segredo de maquina.
 *
 * Devolve null quando pode seguir, ou a resposta de erro quando nao pode.
 */
export async function requireAdminApi(
  req: Request,
  options: ApiGuardOptions = {}
): Promise<NextResponse | null> {
  if (!options.allowCrossOrigin && origemSuspeita(req)) {
    adminAuthLogger.warn("Acao administrativa recusada por origem cruzada", {
      metodo: req.method,
    });
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const sessao = await verifyAdminSession(lerCookieDoHeader(req, ADMIN_SESSION_COOKIE));

  if (sessao) {
    if (options.permission && !hasPermission(sessao.role, options.permission)) {
      adminAuthLogger.warn("Admin sem permissao chamou rota", {
        role: sessao.role,
        permission: options.permission,
      });
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
    return null;
  }

  // Sem sessao valida sobra o segredo de maquina, que vale como owner porque e
  // um segredo server-only e rotacionavel.
  const porSegredo = autenticadoPorSegredoDeMaquina(req, (minimo) => {
    adminAuthLogger.warn("ADMIN_PASS curto demais para servir de segredo de maquina", { minimo });
  });
  if (porSegredo) return null;

  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export function requireAdmin(req: Request, options: ApiGuardOptions = {}) {
  return requireAdminApi(req, options);
}

/**
 * Sessao completa dentro de um route handler, ou null.
 *
 * Existe porque AdminIdentity nao carrega o userId, e ha caso — gravar token
 * de integracao no nome de quem autorizou — em que o id e justamente o dado
 * que importa.
 */
export async function adminSessionFromRequest(req: Request): Promise<AdminSessionPayload | null> {
  return verifyAdminSession(lerCookieDoHeader(req, ADMIN_SESSION_COOKIE));
}

/** Identidade da sessao dentro de um route handler, ou null. */
export async function adminIdentityFromRequest(req: Request): Promise<AdminIdentity | null> {
  const sessao = await adminSessionFromRequest(req);
  return sessao ? identityFromSession(sessao) : null;
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
