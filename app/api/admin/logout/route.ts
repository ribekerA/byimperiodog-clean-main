import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  const clear = (name: string) => response.cookies.set(name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });
  clear("admin_session");
  // Limpa resíduos de versões anteriores; nenhum deles autentica mais.
  clear("admin_auth");
  clear("adm");
  clear("admin_role");
  clear("admin_email");
  clear("admin_name");
  clear("admin_user_id");
  return response;
}
