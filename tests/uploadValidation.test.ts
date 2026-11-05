import { describe, it, expect } from 'vitest';

import { ALLOWED_IMAGE_MIME, MAX_GIF_BYTES, MAX_IMAGE_BYTES, detectMediaMime, isAllowedImage, mediaMimeMatchesClaim, sanitizeFilename, inferExtFromMime } from '../src/lib/uploadValidation';

describe('uploadValidation', () => {
  it('permite mimes válidos e tamanho dentro do limite', () => {
    for (const mime of Array.from(ALLOWED_IMAGE_MIME)) {
      expect(isAllowedImage(mime, 1024)).toBe(true);
      expect(isAllowedImage(mime, MAX_IMAGE_BYTES)).toBe(true);
    }
  });

  it('rejeita mimes inválidos e tamanhos fora do limite', () => {
    // GIF saiu daqui: passou a ser permitido de propósito ("GIF animado
    // permitido", em src/lib/uploadValidation.ts), com limite próprio de
    // MAX_GIF_BYTES. O teste é que estava velho, não o código.
    expect(isAllowedImage('image/bmp', 1024)).toBe(false);
    expect(isAllowedImage('image/svg+xml', 1024)).toBe(false);
    expect(isAllowedImage('image/png', 0)).toBe(false);
    expect(isAllowedImage('image/png', MAX_IMAGE_BYTES + 1)).toBe(false);
    // O limite maior do GIF não é ilimitado.
    expect(isAllowedImage('image/gif', MAX_GIF_BYTES)).toBe(true);
    expect(isAllowedImage('image/gif', MAX_GIF_BYTES + 1)).toBe(false);
  });

  it('sanitiza nomes de arquivo perigosos e longos', () => {
    const s1 = sanitizeFilename('../etc/passwd');
    expect(s1).toMatch(/^[A-Za-z0-9._-]+$/);
    const long = 'a'.repeat(500);
    expect(sanitizeFilename(long).length).toBeLessThanOrEqual(160);
  });

  it('infere extensão a partir do mime', () => {
    expect(inferExtFromMime('image/jpeg')).toBe('jpg');
    expect(inferExtFromMime('image/png')).toBe('png');
    expect(inferExtFromMime('image/webp')).toBe('webp');
    expect(inferExtFromMime('image/avif')).toBe('avif');
    expect(inferExtFromMime('video/mp4')).toBe('mp4');
    expect(inferExtFromMime('video/quicktime')).toBe('mov');
    expect(inferExtFromMime('application/octet-stream')).toBe('bin');
  });

  it('confere a assinatura real do arquivo', () => {
    expect(detectMediaMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(detectMediaMime(new TextEncoder().encode('GIF89a'))).toBe('image/gif');
    expect(mediaMimeMatchesClaim('image/jpeg', 'image/png')).toBe(false);
    expect(mediaMimeMatchesClaim('video/mp4', 'video/quicktime')).toBe(true);
  });
});
