import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const clear = (name: string) => cookies().set(name, "", { httpOnly: true, expires: new Date(0), path: "/" });
  clear("admin_auth");
  clear("adm");
  clear("admin_role");
  clear("admin_email");
  clear("admin_name");
  clear("admin_user_id");
  return NextResponse.json({ ok: true });
}
