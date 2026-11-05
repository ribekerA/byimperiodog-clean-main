export const dynamic = "force-dynamic";
// import { randomUUID } from 'crypto';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { z } from 'zod';

import { requireAdmin } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/limiter';
import { safeAction } from '@/lib/safeAction';
import { supabaseAdmin, hasServiceRoleKey } from '@/lib/supabaseAdmin';
import {
  ALLOWED_IMAGE_MIME,
  ALLOWED_VIDEO_MIME,
  MAX_IMAGE_BYTES,
  MAX_GIF_BYTES,
  MAX_VIDEO_BYTES,
  detectMediaMime,
  inferExtFromMime,
  mediaMimeMatchesClaim,
  sanitizeFilename
} from '@/lib/uploadValidation';

// Upload simples (base64 ou multipart futura). Por hora aceita JSON { filename, dataBase64 }
const bodySchema = z.object({
  dataBase64: z.string().min(1, 'dataBase64 requerido'),
  filename: z.string().min(1).optional(),
  upsert: z.boolean().optional(),
});

async function processUpload({ buf, mime, filename, wantUpsert }:{ buf:Buffer; mime:string; filename?:string; wantUpsert:boolean; }){
  // Determinar se é imagem ou vídeo
  const isVideo = ALLOWED_VIDEO_MIME.has(mime);
  const isImage = ALLOWED_IMAGE_MIME.has(mime);
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : (mime === 'image/gif' ? MAX_GIF_BYTES : MAX_IMAGE_BYTES);

  // Basic security validation
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: 'mime-nao-suportado', supported: 'images (jpg,png,webp,avif,gif) e videos (mp4,webm,mov)' }, { status: 415 });
  }
  if (buf.byteLength <= 0 || buf.byteLength > maxBytes) {
    return NextResponse.json({ error: 'arquivo-muito-grande', maxBytes, tipo: isVideo ? 'video' : 'imagem' }, { status: 413 });
  }
  const detectedMime = detectMediaMime(buf);
  if (!mediaMimeMatchesClaim(detectedMime, mime)) {
    return NextResponse.json({ error: 'conteudo-do-arquivo-invalido' }, { status: 415 });
  }

  const ext = inferExtFromMime(mime);
  const originalBase = sanitizeFilename(filename || 'upload');
  const original = originalBase.includes('.') ? originalBase : `${originalBase}.${ext}`;
  let fileName: string;
  if (wantUpsert) {
    // mantém nome original para overwrite explícito
    fileName = original.endsWith(`.${ext}`) ? original : `${original}.${ext}`;
  } else {
    // nome único para evitar conflito
    const stamp = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    const base = original.replace(/\.[^.]+$/, '');
    fileName = `${base}-${stamp}-${rand}.${ext}`;
  }
  const folder = new Date().toISOString().slice(0, 10);
  const path = `${folder}/${fileName}`;

  // Preparar thumbnail apenas para imagens (não para vídeos)
  let thumbBuf: Buffer | null = null;
  const thumbName = fileName.replace(/\.[^.]+$/, '') + '-thumb.webp';
  const thumbPath = `${folder}/thumbs/${thumbName}`;

  if (isImage && !mime.includes('gif')) {
    // Gerar thumbnail apenas para imagens estáticas (não GIF animado)
    try {
      thumbBuf = await sharp(buf).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
    } catch (err) {
      // se falhar, ignora thumbnail
      thumbBuf = null;
    }
  }
  if (!hasServiceRoleKey()) {
    return NextResponse.json({ error: 'armazenamento-indisponivel' }, { status: 503 });
  }

  const s = supabaseAdmin();
  const { error } = await s.storage.from('puppies').upload(path, buf, { contentType: mime, upsert: wantUpsert });
  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('supabase_offline_stub')) return NextResponse.json({ error: 'armazenamento-indisponivel' }, { status: 503 });
    return NextResponse.json({ error: 'falha-no-armazenamento' }, { status: 500 });
  }
  let thumbUrl: string | null = null;
  if (thumbBuf) {
    // cria pasta thumbs/ se necessário (Supabase cria automaticamente ao upload do arquivo)
    const { error: thumbErr } = await s.storage.from('puppies').upload(thumbPath, thumbBuf, { contentType: 'image/webp', upsert: wantUpsert });
    if (!thumbErr) {
      const { data: thumbPub } = s.storage.from('puppies').getPublicUrl(thumbPath);
      thumbUrl = thumbPub.publicUrl;
    }
  }
  const { data: pub } = s.storage.from('puppies').getPublicUrl(path);
  return NextResponse.json({ ok: true, url: pub.publicUrl, thumb: thumbUrl, upsert: wantUpsert });
}

const execute = safeAction({
  schema: bodySchema,
  handler: async (body, { req }) => {
    const urlObj = new URL(req.url);
    const wantUpsert = urlObj.searchParams.get('upsert') === '1' || body.upsert === true;
    const b64 = body.dataBase64;
    const match = /^data:(.*?);base64,(.*)$/.exec(b64) || [null, null, b64];
    const mime = match[1] || 'image/png';
    const buf = Buffer.from(match[2]!, 'base64');
    return processUpload({ buf, mime, filename: body.filename, wantUpsert });
  },
});

export async function POST(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  const contentLength = Number(req.headers.get('content-length') || '0');
  const maxRequestBytes = Math.ceil(MAX_VIDEO_BYTES * 4 / 3) + 4096;
  if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
    return NextResponse.json({ error: 'arquivo-muito-grande' }, { status: 413 });
  }
  // Limit uploads to prevent abuse: 6/min per IP
  try { await rateLimit(req as unknown as Request, { identifier: 'admin-puppies-upload', limit: 6, windowMs: 60_000 }); } catch {
    return NextResponse.json({ error:'rate-limit' },{ status:429 });
  }

  // Suporte a multipart/form-data (evita overhead do JSON base64 e ajuda a evitar 413)
  const ct = req.headers.get('content-type') || '';
  if (ct.startsWith('multipart/form-data')) {
    try {
      const form = await req.formData();
      const file = form.get('file');
      const upsert = form.get('upsert');
      const wantUpsert = String(upsert) === '1' || String(upsert).toLowerCase() === 'true';
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'arquivo-nao-enviado' }, { status: 400 });
      }
      const arr = Buffer.from(await file.arrayBuffer());
      const mime = file.type || 'application/octet-stream';
      const filename = (form.get('filename') as string) || file.name || 'upload';
      return await processUpload({ buf: arr, mime, filename, wantUpsert });
    } catch {
      return NextResponse.json({ error: 'falha-ao-processar-formdata' }, { status: 400 });
    }
  }

  // Fallback para JSON (compatibilidade)
  return execute(req as unknown as Request);
}
