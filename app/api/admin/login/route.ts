export const dynamic = "force-dynamic";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, signAdminSession } from "@/lib/adminSession";
import { rateLimit } from "@/lib/rateLimit";
import { normalizeRole, serializeRoleCookie } from "@/lib/rbac";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseAnon } from "@/lib/supabaseAnon";

export async function POST(req: Request) {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`admin-login:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um minuto e tente novamente." }, { status: 429 });
  }

  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ error: "Credenciais obrigatorias" }, { status: 400 });
  }

  // Login via Supabase Auth (email/senha)
  const anon = supabaseAnon();
  const { data: authData, error: authError } = await (anon.auth as any).signInWithPassword({
    email: email.trim(),
    password,
  });
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 });
  }

  // Verifica se usuario esta na tabela admin_users
  const { data: adminRow, error: adminError } = await supabaseAdmin()
    .from("admin_users")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (adminError) {
    return NextResponse.json({ error: "Erro ao validar permissoes" }, { status: 500 });
  }
  if (!adminRow) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Cookies de sessao admin
  const displayName =
    (authData.user.user_metadata?.name as string | undefined) ||
    (authData.user.user_metadata?.full_name as string | undefined) ||
    authData.user.email?.split("@")[0] ||
    "Admin";
  const role = normalizeRole(adminRow.role);

  let sessionToken: string;
  try {
    sessionToken = await signAdminSession({
      userId: authData.user.id,
      email: authData.user.email ?? email,
      name: displayName,
      role,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Configuracao de sessao admin ausente (ADMIN_SESSION_SECRET)" },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  cookieStore.set("admin_auth", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookieStore.set("adm", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookieStore.set("admin_email", authData.user.email ?? email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookieStore.set("admin_name", displayName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookieStore.set("admin_user_id", authData.user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  const roleCookie = serializeRoleCookie(role);
  cookieStore.set(roleCookie.name, roleCookie.value, roleCookie.options);
  return res;
}
