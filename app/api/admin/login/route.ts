export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { clearAdminLoginAttempts, consumeAdminLoginAttempt } from "@/lib/adminLoginThrottle";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, signAdminSession } from "@/lib/adminSession";
import { createLogger } from "@/lib/logger";
import { isAdminRole } from "@/lib/rbac";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseAuthClient } from "@/lib/supabaseAnon";

const logger = createLogger("admin:login");
const GENERIC_AUTH_ERROR = "Credenciais inválidas";

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  const response = NextResponse.json(body, { status, headers });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function allowedAdminEmails(): Set<string> {
  const configured = process.env.ADMIN_ALLOWED_EMAILS || "byimperiodog@gmail.com";
  return new Set(configured.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
}

export async function POST(req: Request) {
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > 4096) {
    return json({ error: "Requisição inválida" }, 413);
  }
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "Conteúdo inválido" }, 415);
  }

  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail || normalizedEmail.length > 254 || typeof password !== "string" || !password || password.length > 1024) {
    return json({ error: GENERIC_AUTH_ERROR }, 401);
  }

  const throttle = await consumeAdminLoginAttempt(req, normalizedEmail);
  if (!throttle.allowed) {
    return json(
      { error: "Muitas tentativas. Aguarde e tente novamente." },
      429,
      { "Retry-After": String(throttle.retryAfterSeconds) },
    );
  }

  let authData: Awaited<ReturnType<NonNullable<ReturnType<typeof createSupabaseAuthClient>>["auth"]["signInWithPassword"]>>["data"];
  try {
    const anon = createSupabaseAuthClient();
    if (!anon) {
      return json({ error: "Autenticação indisponível" }, 503);
    }
    const result = await anon.auth.signInWithPassword({ email: normalizedEmail, password });
    if (result.error || !result.data?.user) return json({ error: GENERIC_AUTH_ERROR }, 401);
    authData = result.data;
  } catch (error) {
    logger.error("Falha ao consultar o provedor de autenticacao", { error: String(error) });
    return json({ error: "Autenticação indisponível" }, 503);
  }

  const authenticatedEmail = String(authData.user.email || "").trim().toLowerCase();
  const emailConfirmed = Boolean(authData.user.email_confirmed_at || authData.user.confirmed_at);
  if (!emailConfirmed || authenticatedEmail !== normalizedEmail || !allowedAdminEmails().has(authenticatedEmail)) {
    return json({ error: GENERIC_AUTH_ERROR }, 401);
  }

  const { data: adminRow, error: adminError } = await supabaseAdmin()
    .from("admin_users")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (adminError) {
    logger.error("Falha ao validar admin_users", { error: adminError.message });
    return json({ error: "Autenticação indisponível" }, 503);
  }
  if (!adminRow || !isAdminRole(adminRow.role)) {
    return json({ error: GENERIC_AUTH_ERROR }, 401);
  }

  // Cookies de sessao admin
  const displayName =
    (authData.user.user_metadata?.name as string | undefined) ||
    (authData.user.user_metadata?.full_name as string | undefined) ||
    authData.user.email?.split("@")[0] ||
    "Admin";
  const role = adminRow.role;

  let sessionToken: string;
  try {
    sessionToken = await signAdminSession({
      userId: authData.user.id,
      email: authenticatedEmail,
      name: displayName,
      role,
    });
  } catch (error) {
    logger.error("ADMIN_SESSION_SECRET ausente ou fraco", { error: String(error) });
    return json({ error: "Autenticação indisponível" }, 503);
  }

  await clearAdminLoginAttempts(req, normalizedEmail);

  const res = json({ ok: true }, 200);
  res.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax é necessário para o retorno GET do OAuth do Google; mutações do
    // painel têm validação de Origin/Sec-Fetch-Site no proxy.
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
    priority: "high",
  });
  return res;
}
