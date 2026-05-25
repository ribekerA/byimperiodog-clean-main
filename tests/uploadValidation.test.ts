import { describe, it, expect } from 'vitest';

import { ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES, isAllowedImage, sanitizeFilename, inferExtFromMime } from '../src/lib/uploadValidation';

describe('uploadValidation', () => {
  it('permite mimes válidos e tamanho dentro do limite', () => {
    for (const mime of Array.from(ALLOWED_IMAGE_MIME)) {
      expect(isAllowedImage(mime, 1024)).toBe(true);
      expect(isAllowedImage(mime, MAX_IMAGE_BYTES)).toBe(true);
    }
  });

  it('rejeita mimes inválidos e tamanhos fora do limite', () => {
    expect(isAllowedImage('image/gif', 1024)).toBe(false);
    expect(isAllowedImage('image/png', 0)).toBe(false);
    expect(isAllowedImage('image/png', MAX_IMAGE_BYTES + 1)).toBe(false);
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
    expect(inferExtFromMime('application/octet-stream')).toBe('bin');
  });
});
