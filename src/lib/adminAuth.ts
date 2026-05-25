import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

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

function isAuthenticatedCookie(store = cookies()) {
  const adm = store.get("adm")?.value;
  const legacy = store.get("admin_auth")?.value;
  return adm === "true" || adm === "1" || legacy === "1";
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

function resolveIdentityFromCookies(store = cookies()): AdminIdentity {
  const role = getRoleFromCookies(store);
  const email = store.get("admin_email")?.value ?? null;
  const nameFromCookie = store.get("admin_name")?.value ?? null;
  const fallbackName = email ? email.split("@")[0] ?? "Admin" : "Admin";
  return { role, email, name: nameFromCookie || fallbackName };
}

export function requireAdminLayout(options: LayoutGuardOptions = {}) {
  const store = cookies();
  const authenticated = isAuthenticatedCookie(store);
  if (!authenticated) {
    adminAuthLogger.warn("Admin layout guard bloqueou acesso sem cookie de sessao");
    redirect("/admin/login");
  }

  const identity = resolveIdentityFromCookies(store);
  if (options.permission && !hasPermission(identity.role, options.permission)) {
    adminAuthLogger.warn("Admin sem permissao tentou acessar recurso", {
      role: identity.role,
      permission: options.permission,
    });
    redirect("/admin?permission=denied");
  }

  return identity;
}

export function redirectIfAuthed() {
  if (isAuthenticatedCookie()) redirect("/admin/dashboard");
}

export function requireAdminApi(req: Request | NextRequest, options: ApiGuardOptions = {}) {
  const expected = process.env.NEXT_PUBLIC_ADMIN_PASS || process.env.ADMIN_PASS;
  if (!expected) {
    if (options.permission) {
      const role = resolveRoleFromRequest(req);
      if (!hasPermission(role, options.permission)) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
    }
    return null;
  }

  try {
    const nreq = req as NextRequest;
    const cookieAuth =
      (nreq.cookies?.get?.("admin_auth")?.value) === "1" ||
      (nreq.cookies?.get?.("adm")?.value) === "true";
    if (cookieAuth) {
      if (options.permission) {
        const role = resolveRoleFromRequest(req);
        if (!hasPermission(role, options.permission)) {
          return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
        }
      }
      return null;
    }
  } catch {
    // ignore cookie access failures on generic Request
  }

  const pass = req.headers.get("x-admin-pass");
  if (pass === expected) {
    if (options.permission) {
      const role = resolveRoleFromRequest(req);
      if (!hasPermission(role, options.permission)) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
    }
    return null;
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
