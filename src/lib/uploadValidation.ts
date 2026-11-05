// Upload validation helpers (edge-safe)
// Keep this file free of Node-only imports (fs, sharp, etc.) so it can be used on Edge/runtime.

export const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif', // GIF animado permitido
]);

export const ALLOWED_VIDEO_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
]);

export const MAX_IMAGE_BYTES = 5_000_000; // 5 MB (imagens estáticas)
export const MAX_GIF_BYTES = 10_000_000; // 10 MB (GIF animado)
export const MAX_VIDEO_BYTES = 50_000_000; // 50 MB para vídeos

export function isAllowedImage(mime: string, sizeBytes: number): boolean {
  if (!ALLOWED_IMAGE_MIME.has(mime) || sizeBytes <= 0) return false;
  const limit = mime === 'image/gif' ? MAX_GIF_BYTES : MAX_IMAGE_BYTES;
  return sizeBytes <= limit;
}

export function isAllowedVideo(mime: string, sizeBytes: number): boolean {
  return ALLOWED_VIDEO_MIME.has(mime) && sizeBytes > 0 && sizeBytes <= MAX_VIDEO_BYTES;
}

export function isAllowedMedia(mime: string, sizeBytes: number): boolean {
  return isAllowedImage(mime, sizeBytes) || isAllowedVideo(mime, sizeBytes);
}

export function sanitizeFilename(name: string): string {
  // keep only safe chars; avoid path traversal; normalize spaces
  const base = name
    .replace(/\\/g, '/')
    .split('/')
    .pop()!
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^\.+/, '');
  return base.slice(0, 160) || 'file';
}

export function inferExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  };
  return map[mime] || 'bin';
}

/** Confere os bytes reais; o Content-Type enviado pelo navegador não é prova. */
export function detectMediaMime(input: ArrayBuffer | Uint8Array): string | null {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.slice(start, start + length));

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.slice(0, 8).every((b, i) => b === [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a][i])) return 'image/png';
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'image/webp';
  if (bytes.length >= 6 && (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a')) return 'image/gif';
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return 'video/webm';

  if (bytes.length >= 12 && ascii(4, 4) === 'ftyp') {
    const brand = ascii(8, 4).toLowerCase();
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
    if (brand.trim() === 'qt') return 'video/quicktime';
    return 'video/mp4';
  }
  return null;
}

export function mediaMimeMatchesClaim(detected: string | null, claimed: string): boolean {
  if (!detected) return false;
  if (detected === claimed) return true;
  // Alguns navegadores rotulam .mov como MP4 e vice-versa; ambos usam ISO BMFF.
  return (detected === 'video/mp4' && claimed === 'video/quicktime') ||
    (detected === 'video/quicktime' && claimed === 'video/mp4');
}
