export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { BodyTooLargeError, readBoundedFormData } from "@/lib/bounded-body";
import { InvalidPublicImage, validatePublicImage } from "@/lib/image-upload-security";
import { rateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ALLOWED_IMAGE_MIME, MAX_GIF_BYTES, inferExtFromMime } from "@/lib/uploadValidation";

const metadataSchema = z.object({
  role: z.enum(["cover", "gallery", "inline"]),
  postId: z.string().uuid().optional(),
  alt: z.string().trim().max(500),
});

export async function POST(req: Request) {
  const auth = requireAdmin(req, { permission: "media:write" });
  if (auth) return auth;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit("admin-media-upload:" + ip, 6, 60_000).allowed) {
    return NextResponse.json({ error: "rate-limit" }, { status: 429 });
  }
  if (!req.headers.get("content-type")?.startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "Envie multipart/form-data" }, { status: 400 });
  }
  try {
    const form = await readBoundedFormData(req, MAX_GIF_BYTES + 64 * 1024);
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Campo file obrigatório" }, { status: 400 });
    if (!ALLOWED_IMAGE_MIME.has(file.type)) return NextResponse.json({ error: "mime-nao-suportado" }, { status: 415 });
    const { role, postId, alt } = metadataSchema.parse({
      role: form.get("role") || "gallery",
      postId: form.get("post_id") || undefined,
      alt: form.get("alt") || file.name,
    });
    const bytes = Buffer.from(await file.arrayBuffer());
    await validatePublicImage(bytes, file.type);
    const sb = supabaseAdmin();
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "media";
    // Bucket deve estar provisionado; um upload não cria nem torna bucket público.
    const filename = role + "/" + randomUUID() + "." + inferExtFromMime(file.type);
    const { error: upErr } = await sb.storage.from(bucket).upload(filename, bytes, {
      contentType: file.type, upsert: false,
    });
    if (upErr) throw upErr;
    const { data: pub } = sb.storage.from(bucket).getPublicUrl(filename);
    const url = pub.publicUrl as string;
    const { data: media, error: mediaError } = await sb.from("media_assets")
      .insert([{ file_path: filename, alt, caption: null, tags: null, source: "upload" }])
      .select("id").single();
    if (mediaError || !media?.id) throw new Error("media-record-failed");
    if (postId) {
      const { error: attachError } = await sb.from("post_media").insert([{ post_id: postId, media_id: media.id, role }]);
      if (attachError) throw attachError;
      if (role === "cover") {
        const { error: coverError } = await sb.from("blog_posts").update({ cover_url: url, og_image_url: url }).eq("id", postId);
        if (coverError) throw coverError;
      }
    }
    await logAdminAction({ route: "/api/admin/blog/media/upload", method: "POST", action: "media_upload", payload: { role, postId, mediaId: media.id } });
    return NextResponse.json({ ok: true, url, media_id: media.id, file_path: filename });
  } catch (error) {
    if (error instanceof BodyTooLargeError) return NextResponse.json({ error: error.message }, { status: 413 });
    if (error instanceof InvalidPublicImage || error instanceof z.ZodError) {
      return NextResponse.json({ error: "Imagem ou metadados inválidos" }, { status: 400 });
    }
    await logAdminAction({ route: "/api/admin/blog/media/upload", method: "POST", action: "media_upload_error" });
    return NextResponse.json({ error: "Não foi possível concluir o upload. Verifique a configuração e tente novamente." }, { status: 500 });
  }
}
