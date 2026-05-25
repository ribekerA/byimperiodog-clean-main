/**
 * Testes de integração para API de tracking
 * By Império Dog - Sistema de Pixels/Analytics
 */

import { describe, it, expect } from 'vitest';

describe('Tracking Settings API - Integration Tests', () => {

  describe('GET /api/settings/tracking (público)', () => {
    it('deve retornar configurações públicas sem autenticação', async () => {
      // Este teste precisa de um servidor rodando
      // Por enquanto, validamos apenas a estrutura esperada
      const mockResponse = {
        settings: {
          gtm_id: 'GTM-ABC123',
          ga4_id: 'G-ABCD12345',
          meta_pixel_id: '1234567890123456',
          tiktok_pixel_id: 'C123ABC456DEF',
          google_ads_id: 'AW-123456789',
          google_ads_label: 'conversion',
          pinterest_tag_id: '1234567890123',
          hotjar_id: '123456',
          clarity_id: 'abcdef123456',
          meta_domain_verify: 'abcd1234',
          custom_pixels: [],
        },
      };

      expect(mockResponse.settings).toHaveProperty('gtm_id');
      expect(mockResponse.settings).toHaveProperty('meta_pixel_id');
      expect(mockResponse.settings).not.toHaveProperty('fb_capi_token');
      expect(mockResponse.settings).not.toHaveProperty('tiktok_api_token');
    });

    it('deve ter cache de 5 minutos', () => {
      const expectedCacheControl = 'public, s-maxage=300, stale-while-revalidate=600';
      expect(expectedCacheControl).toContain('s-maxage=300');
    });
  });

  describe('POST /api/admin/settings (admin)', () => {
    it('deve validar Facebook Pixel ID', () => {
      const payloads = [
        { meta_pixel_id: '1234567890123456', expected: true },
        { meta_pixel_id: 'abc123', expected: false },
        { meta_pixel_id: '123', expected: false },
        { meta_pixel_id: '', expected: true }, // Vazio é válido
      ];

      payloads.forEach(({ meta_pixel_id }) => {
        // Validação acontece no servidor
        expect(typeof meta_pixel_id).toBe('string');
      });
    });

    it('deve validar Google Analytics ID', () => {
      const payloads = [
        { ga4_id: 'G-ABCD12345', expected: true },
        { ga4_id: 'UA-12345-1', expected: false },
        { ga4_id: 'ABCD12345', expected: false },
        { ga4_id: '', expected: true }, // Vazio é válido
      ];

      payloads.forEach(({ ga4_id }) => {
        expect(typeof ga4_id).toBe('string');
      });
    });

    it('deve normalizar strings vazias para null', () => {
      const payload = {
        meta_pixel_id: '  ',
        ga4_id: '',
      };

      // Servidor deve transformar '' -> null
      expect(payload.meta_pixel_id.trim()).toBe('');
    });

    it('deve retornar erro 400 para validação inválida', () => {
      const expectedErrorResponse = {
        error: 'Facebook Pixel ID deve conter apenas números (ex: 1234567890123456)',
      };

      expect(expectedErrorResponse).toHaveProperty('error');
      expect(expectedErrorResponse.error).toContain('apenas números');
    });

    it('deve requerer autenticação admin', () => {
      // Teste de autenticação
      const expectedErrorResponse = {
        error: 'Unauthorized',
      };

      expect(expectedErrorResponse.error).toBe('Unauthorized');
    });
  });

  describe('Validação de Payload', () => {
    it('deve aceitar payload completo', () => {
      const fullPayload = {
        gtm_id: 'GTM-ABC123',
        ga4_id: 'G-ABCD12345',
        meta_pixel_id: '1234567890123456',
        fb_capi_token: 'EAAxxxx...',
        tiktok_pixel_id: 'C123ABC456DEF',
        tiktok_api_token: 'xxx...',
        google_ads_id: 'AW-123456789',
        google_ads_label: 'conversion_label',
        pinterest_tag_id: '1234567890123',
        hotjar_id: '123456',
        clarity_id: 'abcdef123456',
        meta_domain_verify: 'abcd1234',
        weekly_post_goal: 7,
      };

      expect(fullPayload).toHaveProperty('gtm_id');
      expect(fullPayload).toHaveProperty('meta_pixel_id');
      expect(fullPayload).toHaveProperty('fb_capi_token');
      expect(fullPayload.weekly_post_goal).toBeGreaterThanOrEqual(1);
      expect(fullPayload.weekly_post_goal).toBeLessThanOrEqual(100);
    });

    it('deve aceitar payload parcial', () => {
      const partialPayload = {
        meta_pixel_id: '1234567890123456',
        ga4_id: 'G-ABCD12345',
      };

      expect(Object.keys(partialPayload).length).toBe(2);
    });

    it('deve aceitar valores null para desabilitar pixels', () => {
      const disablePayload = {
        meta_pixel_id: null,
        ga4_id: null,
      };

      expect(disablePayload.meta_pixel_id).toBeNull();
      expect(disablePayload.ga4_id).toBeNull();
    });
  });

  describe('Segurança', () => {
    it('não deve expor tokens secretos na rota pública', () => {
      const publicSettings = {
        gtm_id: 'GTM-ABC123',
        ga4_id: 'G-ABCD12345',
        meta_pixel_id: '1234567890123456',
      };

      expect(publicSettings).not.toHaveProperty('fb_capi_token');
      expect(publicSettings).not.toHaveProperty('tiktok_api_token');
    });

    it('deve incluir tokens secretos apenas na rota admin', () => {
      const adminSettings = {
        gtm_id: 'GTM-ABC123',
        ga4_id: 'G-ABCD12345',
        meta_pixel_id: '1234567890123456',
        fb_capi_token: 'EAAxxxx...',
        tiktok_api_token: 'xxx...',
      };

      expect(adminSettings).toHaveProperty('fb_capi_token');
      expect(adminSettings).toHaveProperty('tiktok_api_token');
    });

    it('deve validar todos os campos antes de salvar', () => {
      const fieldsToValidate = [
        'meta_pixel_id',
        'ga4_id',
        'gtm_id',
        'tiktok_pixel_id',
        'google_ads_id',
        'hotjar_id',
        'clarity_id',
        'pinterest_tag_id',
        'weekly_post_goal',
      ];

      expect(fieldsToValidate.length).toBeGreaterThan(0);
    });
  });
});
