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
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_');
  return base.slice(0, 160) || 'file';
}

export function inferExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
  };
  return map[mime] || 'bin';
}
