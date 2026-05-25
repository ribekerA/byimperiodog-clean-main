/**
 * Testes unitários para validadores de tracking
 * By Império Dog - Sistema de Pixels/Analytics
 */

import { describe, it, expect } from 'vitest';

import {
  validateFacebookPixelId,
  validateGoogleAnalyticsId,
  validateGTMId,
  validateTikTokPixelId,
  validateGoogleAdsId,
  validateHotjarId,
  validateClarityId,
  validatePinterestTagId,
  validateWeeklyPostGoal,
} from '@/lib/tracking/validators';

describe('Tracking Validators', () => {
  describe('validateFacebookPixelId', () => {
    it('aceita ID numérico válido', () => {
      const result = validateFacebookPixelId('1234567890123456');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('aceita ID com 10 dígitos', () => {
      expect(validateFacebookPixelId('1234567890').valid).toBe(true);
    });

    it('aceita ID com 20 dígitos', () => {
      expect(validateFacebookPixelId('12345678901234567890').valid).toBe(true);
    });

    it('aceita valor vazio', () => {
      expect(validateFacebookPixelId('').valid).toBe(true);
      expect(validateFacebookPixelId(null).valid).toBe(true);
      expect(validateFacebookPixelId(undefined).valid).toBe(true);
    });

    it('rejeita ID com letras', () => {
      const result = validateFacebookPixelId('abc123456');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('apenas números');
    });

    it('rejeita ID muito curto', () => {
      const result = validateFacebookPixelId('123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10 e 20 dígitos');
    });

    it('rejeita ID muito longo', () => {
      const result = validateFacebookPixelId('123456789012345678901');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10 e 20 dígitos');
    });

    it('remove espaços em branco antes de validar', () => {
      expect(validateFacebookPixelId('  1234567890123456  ').valid).toBe(true);
    });
  });

  describe('validateGoogleAnalyticsId', () => {
    it('aceita ID GA4 válido', () => {
      const result = validateGoogleAnalyticsId('G-ABCD12345');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('aceita ID com letras minúsculas', () => {
      expect(validateGoogleAnalyticsId('G-abcd12345').valid).toBe(true);
    });

    it('aceita ID com vários tamanhos (8-15 caracteres)', () => {
      expect(validateGoogleAnalyticsId('G-ABC12345').valid).toBe(true);
      expect(validateGoogleAnalyticsId('G-ABCDEFGHIJKLMN').valid).toBe(true);
    });

    it('aceita valor vazio', () => {
      expect(validateGoogleAnalyticsId('').valid).toBe(true);
      expect(validateGoogleAnalyticsId(null).valid).toBe(true);
      expect(validateGoogleAnalyticsId(undefined).valid).toBe(true);
    });

    it('rejeita ID sem prefixo G-', () => {
      const result = validateGoogleAnalyticsId('ABCD12345');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('começar com "G-"');
    });

    it('rejeita formato antigo UA-', () => {
      const result = validateGoogleAnalyticsId('UA-12345-1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('começar com "G-"');
    });

    it('rejeita ID muito curto', () => {
      const result = validateGoogleAnalyticsId('G-ABC');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('G-XXXXXXXXXX');
    });

    it('rejeita caracteres especiais', () => {
      const result = validateGoogleAnalyticsId('G-ABC@123');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateGTMId', () => {
    it('aceita ID GTM válido', () => {
      const result = validateGTMId('GTM-ABC123');
      expect(result.valid).toBe(true);
    });

    it('aceita ID com letras minúsculas', () => {
      expect(validateGTMId('GTM-abc123').valid).toBe(true);
    });

    it('aceita valor vazio', () => {
      expect(validateGTMId('').valid).toBe(true);
      expect(validateGTMId(null).valid).toBe(true);
    });

    it('rejeita ID sem prefixo GTM-', () => {
      const result = validateGTMId('ABC123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('GTM-');
    });

    it('rejeita ID muito curto', () => {
      const result = validateGTMId('GTM-AB');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTikTokPixelId', () => {
    it('aceita ID TikTok válido', () => {
      const result = validateTikTokPixelId('C123ABC456DEF');
      expect(result.valid).toBe(true);
    });

    it('aceita ID alfanumérico', () => {
      expect(validateTikTokPixelId('ABCD1234567890').valid).toBe(true);
    });

    it('aceita valor vazio', () => {
      expect(validateTikTokPixelId('').valid).toBe(true);
      expect(validateTikTokPixelId(null).valid).toBe(true);
    });

    it('rejeita ID muito curto', () => {
      const result = validateTikTokPixelId('ABC123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10-20 caracteres');
    });

    it('rejeita caracteres especiais', () => {
      const result = validateTikTokPixelId('ABC@123456789');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateGoogleAdsId', () => {
    it('aceita ID Google Ads válido', () => {
      const result = validateGoogleAdsId('AW-123456789');
      expect(result.valid).toBe(true);
    });

    it('aceita valor vazio', () => {
      expect(validateGoogleAdsId('').valid).toBe(true);
      expect(validateGoogleAdsId(null).valid).toBe(true);
    });

    it('rejeita ID sem prefixo AW-', () => {
      const result = validateGoogleAdsId('123456789');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('AW-');
    });

    it('rejeita ID com letras após AW-', () => {
      const result = validateGoogleAdsId('AW-ABC123');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateHotjarId', () => {
    it('aceita ID Hotjar válido', () => {
      const result = validateHotjarId('123456');
      expect(result.valid).toBe(true);
    });

    it('aceita ID com 6 dígitos', () => {
      expect(validateHotjarId('123456').valid).toBe(true);
    });

    it('aceita ID com 10 dígitos', () => {
      expect(validateHotjarId('1234567890').valid).toBe(true);
    });

    it('aceita valor vazio', () => {
      expect(validateHotjarId('').valid).toBe(true);
      expect(validateHotjarId(null).valid).toBe(true);
    });

    it('rejeita ID com letras', () => {
      const result = validateHotjarId('abc123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('apenas números');
    });

    it('rejeita ID muito curto', () => {
      const result = validateHotjarId('12345');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateClarityId', () => {
    it('aceita ID Clarity válido', () => {
      const result = validateClarityId('abcdef123456');
      expect(result.valid).toBe(true);
    });

    it('aceita ID alfanumérico', () => {
      expect(validateClarityId('abc123def456').valid).toBe(true);
    });

    it('aceita valor vazio', () => {
      expect(validateClarityId('').valid).toBe(true);
      expect(validateClarityId(null).valid).toBe(true);
    });

    it('rejeita ID muito curto', () => {
      const result = validateClarityId('abc123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10-15 caracteres');
    });

    it('rejeita caracteres especiais', () => {
      const result = validateClarityId('abc@123456789');
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePinterestTagId', () => {
    it('aceita ID Pinterest válido', () => {
      const result = validatePinterestTagId('1234567890123');
      expect(result.valid).toBe(true);
    });

    it('aceita ID com 13 dígitos', () => {
      expect(validatePinterestTagId('1234567890123').valid).toBe(true);
    });

    it('aceita ID com 16 dígitos', () => {
      expect(validatePinterestTagId('1234567890123456').valid).toBe(true);
    });

    it('aceita valor vazio', () => {
      expect(validatePinterestTagId('').valid).toBe(true);
      expect(validatePinterestTagId(null).valid).toBe(true);
    });

    it('rejeita ID com letras', () => {
      const result = validatePinterestTagId('abc1234567890');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('apenas números');
    });

    it('rejeita ID muito curto', () => {
      const result = validatePinterestTagId('123456789012');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateWeeklyPostGoal', () => {
    it('aceita valor válido', () => {
      expect(validateWeeklyPostGoal(7).valid).toBe(true);
      expect(validateWeeklyPostGoal(1).valid).toBe(true);
      expect(validateWeeklyPostGoal(100).valid).toBe(true);
    });

    it('aceita null/undefined', () => {
      expect(validateWeeklyPostGoal(null).valid).toBe(true);
      expect(validateWeeklyPostGoal(undefined).valid).toBe(true);
    });

    it('rejeita valor menor que 1', () => {
      const result = validateWeeklyPostGoal(0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('1 e 100');
    });

    it('rejeita valor maior que 100', () => {
      const result = validateWeeklyPostGoal(101);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('1 e 100');
    });

    it('rejeita valor não-inteiro', () => {
      const result = validateWeeklyPostGoal(7.5);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('número inteiro');
    });

    it('rejeita valor não-numérico', () => {
      const result = validateWeeklyPostGoal(NaN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('número inteiro');
    });
  });
});
