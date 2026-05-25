export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { rateLimit as rateLimitEdge } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES } from "@/lib/uploadValidation";

export const runtime = "edge"; // fast uploads when possible

export async function POST(req: Request) {
  try {
  const auth = requireAdmin(req);
  if (auth) return auth;
    // Throttle uploads (Edge): 6/min per IP
    {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? req.headers.get('cf-connecting-ip')
        ?? 'unknown';
      const rl = rateLimitEdge('admin-media-upload:'+ip, 6, 60_000);
      if (!rl.allowed) return NextResponse.json({ error: 'rate-limit' }, { status: 429 });
    }
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Envie multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Campo 'file' é obrigatório" }, { status: 400 });
    if (!ALLOWED_IMAGE_MIME.has(file.type)) {
      return NextResponse.json({ error: "mime-nao-suportado" }, { status: 415 });
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "arquivo-muito-grande", maxBytes: MAX_IMAGE_BYTES }, { status: 413 });
    }
    const role = (form.get("role") as string) || "gallery"; // 'cover'|'gallery'|'inline'
    const postId = (form.get("post_id") as string) || undefined;
    const alt = (form.get("alt") as string) || file.name;

    const sb = supabaseAdmin();
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "media";
    // Garante que o bucket existe (cria se ausente)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: bInfo, error: bErr } = await (sb as any).storage.getBucket(bucket);
      if (bErr || !bInfo) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (sb as any).storage.createBucket(bucket, { public: true }).catch(() => {});
      }
    } catch { /* noop: bucket check best-effort */ }
    const bytes = await file.arrayBuffer();
    const ext = (file.type?.split("/")[1] || "bin").replace("jpeg", "jpg");
    const filename = `${role}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upErr } = await (sb as any).storage.from(bucket).upload(filename, new Uint8Array(bytes), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (upErr) throw upErr;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pub } = (sb as any).storage.from(bucket).getPublicUrl(filename);
    const url = pub.publicUrl as string;

    const { data: m, error: mErr } = await sb
      .from("media_assets")
      .insert([{ file_path: filename, alt, caption: null, tags: null, source:'upload' }])
      .select("id")
      .single();
    if(mErr) throw mErr;

    if (postId) {
      // attach to post
  // garantir tabela pivot
  try { await sb.from("post_media").insert([{ post_id: postId, media_id: m!.id, role }]); } catch { /* noop */ }
      if (role === "cover") {
        await sb.from("blog_posts").update({ cover_url: url, og_image_url: url }).eq("id", postId);
      }
    }

  await logAdminAction({ route:'/api/admin/blog/media/upload', method:'POST', action:'media_upload', payload:{ role, postId, url } });
  return NextResponse.json({ ok: true, url, media_id: m?.id, file_path: filename });
  } catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  await logAdminAction({ route:'/api/admin/blog/media/upload', method:'POST', action:'media_upload_error', payload:{ msg } });
  return NextResponse.json({ error: msg }, { status: 500 });
  }
}
