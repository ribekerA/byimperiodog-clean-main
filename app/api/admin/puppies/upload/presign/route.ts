export const dynamic = "force-dynamic";
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/limiter';
import { supabaseAdmin, hasServiceRoleKey } from '@/lib/supabaseAdmin';
import { ALLOWED_IMAGE_MIME, ALLOWED_VIDEO_MIME, MAX_IMAGE_BYTES, MAX_GIF_BYTES, MAX_VIDEO_BYTES, inferExtFromMime, sanitizeFilename } from '@/lib/uploadValidation';

const bodySchema = z.object({
  filename: z.string().min(1),
  mime: z.string().min(1),
  upsert: z.boolean().optional(),
});

export async function POST(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  try { await rateLimit(req as unknown as Request, { identifier: 'admin-puppies-presign', limit: 12, windowMs: 60_000 }); } catch {
    return NextResponse.json({ error:'rate-limit' },{ status:429 });
  }

  if (!hasServiceRoleKey()) {
    return NextResponse.json({ error: 'offline-sem-service-key' }, { status: 503 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e: unknown) {
    return NextResponse.json({ error: 'payload-invalido' }, { status: 400 });
  }

  const { filename, mime, upsert } = body;
  const isVid = ALLOWED_VIDEO_MIME.has(mime);
  const isImg = ALLOWED_IMAGE_MIME.has(mime);
  if(!isVid && !isImg){
    return NextResponse.json({ error: 'mime-nao-suportado', supported: 'images (jpg,png,webp,avif,gif) e videos (mp4,webm,mov)' }, { status: 415 });
  }

  // A checagem de tamanho deve ser feita no cliente; aqui aplicamos um limite básico preventivo via header Content-Length quando disponível.
  const sizeHeader = req.headers.get('x-file-size');
  if (sizeHeader) {
    const sz = Number(sizeHeader);
    const lim = isVid ? MAX_VIDEO_BYTES : (mime === 'image/gif' ? MAX_GIF_BYTES : MAX_IMAGE_BYTES);
    if (!Number.isNaN(sz) && (sz <= 0 || sz > lim)) {
      return NextResponse.json({ error: 'arquivo-muito-grande', maxBytes: lim, tipo: isVid? 'video':'imagem' }, { status: 413 });
    }
  }

  const ext = inferExtFromMime(mime);
  const originalBase = sanitizeFilename(filename || 'upload');
  const original = originalBase.includes('.') ? originalBase : `${originalBase}.${ext}`;
  let fileName: string;
  if (upsert) {
    fileName = original.endsWith(`.${ext}`) ? original : `${original}.${ext}`;
  } else {
    const stamp = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    const base = original.replace(/\.[^.]+$/, '');
    fileName = `${base}-${stamp}-${rand}.${ext}`;
  }
  const folder = new Date().toISOString().slice(0, 10);
  const path = `${folder}/${fileName}`;

  const s = supabaseAdmin();
  const { data, error } = await s.storage.from('puppies').createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, path, signedUrl: data?.signedUrl, token: data?.token, upsert: !!upsert });
}
