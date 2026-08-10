import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, verifyAdminSession, type AdminSessionPayload } from "@/lib/adminSession";
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

async function getVerifiedSession(store = cookies()): Promise<AdminSessionPayload | null> {
  return verifyAdminSession(store.get(ADMIN_SESSION_COOKIE)?.value);
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

export function requireAdminApi(req: Request | NextRequest, options: ApiGuardOptions = {}) {
  // Nota: este guard e sincrono e nao verifica a assinatura do admin_session (isso exigiria
  // async em ~90 call sites). A defesa real contra forjar cookies vive no middleware.ts,
  // que verifica a assinatura HMAC antes de qualquer /api/admin/* chegar aqui. Este guard
  // e uma segunda camada e, por isso, precisa falhar fechado quando nada bate.
  const checkPermission = (): NextResponse | null => {
    if (!options.permission) return null;
    const role = resolveRoleFromRequest(req);
    if (!hasPermission(role, options.permission)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
    return null;
  };

  try {
    const nreq = req as NextRequest;
    const cookieAuth =
      (nreq.cookies?.get?.("admin_auth")?.value) === "1" ||
      (nreq.cookies?.get?.("adm")?.value) === "true";
    if (cookieAuth) {
      return checkPermission();
    }
  } catch {
    // ignore cookie access failures on generic Request
  }

  // Apenas ADMIN_PASS: NEXT_PUBLIC_* vai para o bundle do browser.
  const expected = process.env.ADMIN_PASS;
  const pass = req.headers.get("x-admin-pass");
  if (expected && pass === expected) {
    return checkPermission();
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
