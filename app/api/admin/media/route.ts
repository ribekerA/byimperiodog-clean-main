import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { mediaRepo } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || "50");
  const tag = searchParams.get("tag") || undefined;
  const data = await mediaRepo.listAssets({ tag: tag || undefined, limit: isFinite(limit) ? limit : 50 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  try {
    const body = await req.json().catch(() => null);
    const id = body?.id as string | undefined;
    const filePath = body?.file_path as string | undefined;
    if (!id) return NextResponse.json({ error: "missing-id" }, { status: 400 });
    const admin = supabaseAdmin();
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "media";
    if (admin && filePath) {
      await admin.storage.from(bucket).remove([filePath]).catch(() => {});
    }
    await (supabaseAdmin()).from("media_assets").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
