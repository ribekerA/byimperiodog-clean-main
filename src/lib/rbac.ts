import { AppError } from "@/lib/errors";

export type AdminRole = "owner" | "editor" | "viewer";

export type AdminPermission =
  | "dashboard:read"
  | "blog:read"
  | "blog:write"
  | "cadastros:read"
  | "cadastros:write"
  | "media:write"
  | "settings:write";

export const ADMIN_ROLE_COOKIE = "admin_role";

// Falha segura: ausência, erro de digitação ou valor forjado nunca concede
// privilégios de proprietário.
export const DEFAULT_ROLE: AdminRole = "viewer";

const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  owner: [
    "dashboard:read",
    "blog:read",
    "blog:write",
    "cadastros:read",
    "cadastros:write",
    "media:write",
    "settings:write",
  ],
  editor: [
    "dashboard:read",
    "blog:read",
    "blog:write",
    "cadastros:read",
    "cadastros:write",
    "media:write",
  ],
  viewer: ["dashboard:read", "blog:read", "cadastros:read"],
};

export function normalizeRole(role?: string | null): AdminRole {
  if (!role) return DEFAULT_ROLE;
  const normalized = role.trim().toLowerCase();
  if (normalized === "owner" || normalized === "editor" || normalized === "viewer") {
    return normalized;
  }
  return DEFAULT_ROLE;
}

export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  if (role === "owner") return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isAdminRole(role: unknown): role is AdminRole {
  return role === "owner" || role === "editor" || role === "viewer";
}

/** Permissão mínima inferida da rota e do método. O guard continua aceitando
 * uma permissão explícita, mas nenhuma rota mutável fica liberada só porque o
 * desenvolvedor esqueceu de informá-la. */
export function permissionForAdminRequest(pathname: string, method: string): AdminPermission {
  if (
    pathname.includes("/settings") ||
    pathname.includes("/config") ||
    pathname.includes("/tracking") ||
    pathname.includes("/webhooks") ||
    pathname.includes("/integrations") ||
    pathname.includes("/migrations") ||
    pathname.includes("/system") ||
    pathname.includes("/pixel-experiments")
  ) {
    return "settings:write";
  }

  const readOnly = method === "GET" || method === "HEAD" || method === "OPTIONS";
  if (readOnly) {
    if (pathname.includes("/blog")) return "blog:read";
    if (pathname.includes("/cadastros") || pathname.includes("/leads") || pathname.includes("/puppies")) {
      return "cadastros:read";
    }
    return "dashboard:read";
  }

  if (pathname.includes("/blog") || pathname.includes("/seo")) return "blog:write";
  if (pathname.includes("/media")) return "media:write";
  return "cadastros:write";
}

export function assertPermission(role: AdminRole, permission: AdminPermission) {
  if (!hasPermission(role, permission)) {
    throw new AppError({
      code: "AUTH",
      message: "Permissão insuficiente para executar esta ação.",
      details: { role, permission },
    });
  }
}

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

export function getRoleFromCookies(cookies: CookieReader): AdminRole {
  const stored = cookies.get(ADMIN_ROLE_COOKIE)?.value ?? null;
  return normalizeRole(stored);
}

export function getRoleFromHeaderCookie(cookieHeader: string | null): AdminRole {
  if (!cookieHeader) return DEFAULT_ROLE;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_ROLE_COOKIE}=`));
  if (!match) return DEFAULT_ROLE;
  const value = match.split("=")[1] ?? "";
  return normalizeRole(decodeURIComponent(value));
}

export function getRoleFromHeaders(headers: Headers): AdminRole {
  const explicit = headers.get("x-admin-role");
  if (explicit) return normalizeRole(explicit);
  return getRoleFromHeaderCookie(headers.get("cookie"));
}

export function getClientAdminRole(): AdminRole {
  if (typeof document === "undefined") return DEFAULT_ROLE;
  const cookies = document.cookie.split(";").map((part) => part.trim());
  const entry = cookies.find((part) => part.startsWith(`${ADMIN_ROLE_COOKIE}=`));
  if (!entry) return DEFAULT_ROLE;
  return normalizeRole(decodeURIComponent(entry.split("=")[1] ?? ""));
}

export function serializeRoleCookie(role: AdminRole) {
  return {
    name: ADMIN_ROLE_COOKIE,
    value: role,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  };
}
