export const dynamic = "force-dynamic";
﻿import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { serializeRoleCookie } from "@/lib/rbac";
import { supabaseAnon } from "@/lib/supabaseAnon";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
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

  const res = NextResponse.json({ ok: true });
  // Cookies de sessao admin
  const displayName =
    (authData.user.user_metadata?.name as string | undefined) ||
    (authData.user.user_metadata?.full_name as string | undefined) ||
    authData.user.email?.split("@")[0] ||
    "Admin";

  cookies().set("admin_auth", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookies().set("adm", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookies().set("admin_email", authData.user.email ?? email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookies().set("admin_name", displayName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookies().set("admin_user_id", authData.user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  const roleCookie = serializeRoleCookie(adminRow.role || "owner");
  cookies().set(roleCookie.name, roleCookie.value, roleCookie.options);
  return res;
}
