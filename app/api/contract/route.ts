import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const code = form.get("code");
  const payload = form.get("payload");
  const hemograma = form.get("hemograma");
  const laudo = form.get("laudo");

  console.log("[contract] code:", code, "payload:", payload ? JSON.parse(String(payload)) : null);
  // TODO: upload files to Supabase storage, persist record, trigger signature workflow

  return NextResponse.json({ ok: true });
}
