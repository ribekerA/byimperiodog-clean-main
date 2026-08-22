import { AppError } from "@/lib/errors";

export type AdminRole = "owner" | "editor" | "viewer";

/**
 * Todas as permissoes que existem. E lista, e nao so uniao de tipos, porque o
 * teste estrutural das rotas administrativas precisa conferir em tempo de
 * execucao que a permissao escrita numa rota realmente existe — o compilador
 * nao alcanca string lida de arquivo.
 */
export const ALL_PERMISSIONS = [
  "dashboard:read",
  "blog:read",
  "blog:write",
  "cadastros:read",
  "cadastros:write",
  "media:write",
  // Ler configuracao ja e ver infraestrutura: ID de pixel, URL de webhook,
  // regra de redirect. Por isso settings tem leitura propria em vez de cair
  // em dashboard:read, que o viewer tem.
  "settings:read",
  "settings:write",
] as const;

export type AdminPermission = (typeof ALL_PERMISSIONS)[number];

/** Funcao assumida quando o valor nao e reconhecido: a de menor privilegio. */
export const LEAST_PRIVILEGE_ROLE: AdminRole = "viewer";

/**
 * Mantido pelo nome antigo para nao quebrar importacoes, mas o valor mudou:
 * era "owner", ou seja, qualquer valor irreconhecivel virava dono do painel.
 */
export const DEFAULT_ROLE: AdminRole = LEAST_PRIVILEGE_ROLE;

const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  owner: [
    "dashboard:read",
    "blog:read",
    "blog:write",
    "cadastros:read",
    "cadastros:write",
    "media:write",
    "settings:read",
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

/**
 * `fallback` existe porque ha uma unica origem confiavel que precisa de outro
 * padrao: a linha de admin_users, gravada no servidor. Toda a demais entrada
 * cai no menor privilegio.
 */
export function normalizeRole(role?: string | null, fallback: AdminRole = LEAST_PRIVILEGE_ROLE): AdminRole {
  if (!role) return fallback;
  const normalized = role.trim().toLowerCase();
  if (normalized === "owner" || normalized === "editor" || normalized === "viewer") {
    return normalized;
  }
  return fallback;
}

export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  // O bypass NEXT_PUBLIC_ADMIN_OPEN=1 foi removido. Era uma variavel com prefixo
  // NEXT_PUBLIC_, portanto inlinada no bundle do browser, ligando permissao a um
  // valor que o proprio cliente enxerga. Ambiente de desenvolvimento usa login
  // de verdade, igual a producao.
  if (role === "owner") return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
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

// Removidos deste modulo:
//   ADMIN_ROLE_COOKIE, serializeRoleCookie, getRoleFromCookies,
//   getRoleFromHeaderCookie, getRoleFromHeaders, getClientAdminRole
// Todos derivavam a funcao do usuario de algo que o cliente envia — cookie
// `admin_role` sem assinatura ou header `x-admin-role`. Bastava mandar
// `x-admin-role: owner` no curl para virar dono. A funcao agora sai apenas do
// cookie de sessao assinado (src/lib/adminSession.ts), que carrega o campo
// `role` dentro do payload coberto pelo HMAC.
