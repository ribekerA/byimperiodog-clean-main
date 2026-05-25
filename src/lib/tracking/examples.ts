/**
 * Exemplos de uso do backend de Tracking Settings
 * By ImpÃ©rio Dog - Sistema de Pixels/Analytics
 * 
 * Este arquivo contÃ©m exemplos de como consumir as APIs de tracking
 * tanto no frontend pÃºblico quanto no painel admin.
 */

import type {
  PublicTrackingSettings,
  TrackingSettings,
  UpdateTrackingPayload,
  TrackingAPIResponse,
  TrackingAPIError,
} from '@/types/tracking';

// ============================================================================
// 1. FRONTEND PÃšBLICO - Buscar configuraÃ§Ãµes de tracking (GET)
// ============================================================================

/**
 * Busca as configuraÃ§Ãµes pÃºblicas de tracking (pixels e analytics)
 * Usado no frontend para injetar scripts dinamicamente
 * 
 * Endpoint: GET /api/settings/tracking
 * Auth: NÃ£o requer autenticaÃ§Ã£o (pÃºblico)
 */
export async function getPublicTrackingSettings(): Promise<PublicTrackingSettings | null> {
  try {
    const response = await fetch('/api/settings/tracking', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Cache por 5 minutos no navegador
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error('Erro ao buscar tracking settings:', response.statusText);
      return null;
    }

    const data: TrackingAPIResponse = await response.json();
    return data.settings as PublicTrackingSettings;
  } catch (error) {
    console.error('Erro ao buscar tracking settings:', error);
    return null;
  }
}

/**
 * Exemplo de uso em componente React (client-side)
 */
export function ExampleUsageInComponent() {
  // Em um useEffect ou Server Component:
  /*
  'use client';
  
  import { useEffect, useState } from 'react';
  import { getPublicTrackingSettings } from '@/lib/tracking/examples';
  
  export function TrackingLoader() {
    const [settings, setSettings] = useState<PublicTrackingSettings | null>(null);
    
    useEffect(() => {
      getPublicTrackingSettings().then(setSettings);
    }, []);
    
    useEffect(() => {
      if (settings?.meta_pixel_id) {
        // Injetar Facebook Pixel
        console.log('Facebook Pixel ID:', settings.meta_pixel_id);
      }
      
      if (settings?.ga4_id) {
        // Injetar Google Analytics
        console.log('GA4 ID:', settings.ga4_id);
      }
    }, [settings]);
    
    return null;
  }
  */
}

// ============================================================================
// 2. PAINEL ADMIN - Buscar todas as configuraÃ§Ãµes (GET)
// ============================================================================

/**
 * Busca todas as configuraÃ§Ãµes (incluindo tokens secretos)
 * Usado apenas no painel admin
 * 
 * Endpoint: GET /api/admin/settings
 * Auth: Requer autenticaÃ§Ã£o de admin
 */
export async function getAdminTrackingSettings(): Promise<TrackingSettings | null> {
  try {
    const response = await fetch('/api/admin/settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Incluir cookies de autenticaÃ§Ã£o
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('NÃ£o autenticado como admin');
        return null;
      }
      console.error('Erro ao buscar settings:', response.statusText);
      return null;
    }

    const data: TrackingAPIResponse = await response.json();
    return data.settings as TrackingSettings;
  } catch (error) {
    console.error('Erro ao buscar admin settings:', error);
    return null;
  }
}

// ============================================================================
// 3. PAINEL ADMIN - Atualizar configuraÃ§Ãµes (POST)
// ============================================================================

/**
 * Atualiza as configuraÃ§Ãµes de tracking no painel admin
 * 
 * Endpoint: POST /api/admin/settings
 * Auth: Requer autenticaÃ§Ã£o de admin
 */
export async function updateTrackingSettings(
  payload: UpdateTrackingPayload
): Promise<{ success: boolean; settings?: TrackingSettings; error?: string }> {
  try {
    const response = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Incluir cookies de autenticaÃ§Ã£o
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Erro ao atualizar configuraÃ§Ãµes',
      };
    }

    return {
      success: true,
      settings: data.settings,
    };
  } catch (error) {
    console.error('Erro ao atualizar tracking settings:', error);
    return {
      success: false,
      error: 'Erro de conexÃ£o com o servidor',
    };
  }
}

// ============================================================================
// 4. EXEMPLOS DE PAYLOADS PARA POST
// ============================================================================

/**
 * Exemplo 1: Atualizar apenas Facebook Pixel
 */
export const exampleUpdateFacebookPixel: UpdateTrackingPayload = {
  meta_pixel_id: '1234567890123456',
};

/**
 * Exemplo 2: Atualizar Facebook Pixel + Google Analytics
 */
export const exampleUpdateMultiplePixels: UpdateTrackingPayload = {
  meta_pixel_id: '1234567890123456',
  ga4_id: 'G-ABCD12345',
};

/**
 * Exemplo 3: ConfiguraÃ§Ã£o completa com todos os pixels
 */
export const exampleFullConfiguration: UpdateTrackingPayload = {
  gtm_id: 'GTM-ABC123',
  ga4_id: 'G-ABCD12345',
  meta_pixel_id: '1234567890123456',
  fb_capi_token: 'EAAxxxx...', // Token secreto para Conversions API
  tiktok_pixel_id: 'C123ABC456DEF',
  google_ads_id: 'AW-123456789',
  google_ads_label: 'conversion_label_here',
  pinterest_tag_id: '1234567890123',
  hotjar_id: '123456',
  clarity_id: 'abcdef123456',
  meta_domain_verify: 'abcd1234efgh5678',
  weekly_post_goal: 7,
};

/**
 * Exemplo 4: Desabilitar um pixel (setando como null)
 */
export const exampleDisablePixel: UpdateTrackingPayload = {
  meta_pixel_id: null, // Desabilita o Facebook Pixel
};

/**
 * Exemplo 5: Atualizar pixels customizados
 */
export const exampleCustomPixels: UpdateTrackingPayload = {
  custom_pixels: [
    {
      name: 'LinkedIn Insight Tag',
      script: '<script>_linkedin_partner_id = "12345";</script>',
      enabled: true,
    },
    {
      name: 'Custom Analytics',
      script: '<script src="https://example.com/analytics.js"></script>',
      enabled: false,
    },
  ],
};

// ============================================================================
// 5. EXEMPLO DE USO EM COMPONENTE ADMIN
// ============================================================================

/**
 * Exemplo de formulÃ¡rio de configuraÃ§Ã£o no painel admin
 */
export function ExampleAdminForm() {
  /*
  'use client';
  
  import { useState, useEffect } from 'react';
  import { getAdminTrackingSettings, updateTrackingSettings } from '@/lib/tracking/examples';
  
  export function TrackingSettingsForm() {
    const [loading, setLoading] = useState(false);
    const [facebookPixelId, setFacebookPixelId] = useState('');
    const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    // Carregar configuraÃ§Ãµes atuais
    useEffect(() => {
      getAdminTrackingSettings().then((settings) => {
        if (settings) {
          setFacebookPixelId(settings.meta_pixel_id || '');
          setGoogleAnalyticsId(settings.ga4_id || '');
        }
      });
    }, []);
    
    // Salvar configuraÃ§Ãµes
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      setSuccess(false);
      
      const result = await updateTrackingSettings({
        meta_pixel_id: facebookPixelId || null,
        ga4_id: googleAnalyticsId || null,
      });
      
      setLoading(false);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Erro ao salvar');
      }
    };
    
    return (
      <form onSubmit={handleSubmit}>
        <div>
          <label>Facebook Pixel ID</label>
          <input
            type="text"
            value={facebookPixelId}
            onChange={(e) => setFacebookPixelId(e.target.value)}
            placeholder="1234567890123456"
          />
        </div>
        
        <div>
          <label>Google Analytics ID (GA4)</label>
          <input
            type="text"
            value={googleAnalyticsId}
            onChange={(e) => setGoogleAnalyticsId(e.target.value)}
            placeholder="G-ABCD12345"
          />
        </div>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">Salvo com sucesso!</div>}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar ConfiguraÃ§Ãµes'}
        </button>
      </form>
    );
  }
  */
}

// ============================================================================
// 6. EXEMPLO DE TESTE DE PIXEL (EVENTO DE TESTE)
// ============================================================================

/**
 * Dispara um evento de teste no Facebook Pixel
 * Usado no botão "Testar Pixel" do painel admin
 */
export function testFacebookPixel(_pixelId: string) {
  if (typeof window === 'undefined') return;

  // Verifica se o fbq está disponível
  const win = window as unknown as { fbq?: (...args: unknown[]) => void };
  if (typeof win.fbq === 'function') {
    win.fbq('track', 'Lead', {
      content_name: 'Teste de Pixel - Admin',
      source: 'admin_test_button',
      test_event: true,
    });
    alert('Evento de teste enviado! Verifique no Event Manager do Facebook.');
  } else {
    alert('Facebook Pixel nÃ£o estÃ¡ carregado na pÃ¡gina. Certifique-se de que o ID estÃ¡ configurado e o script foi injetado.');
  }
}

/**
 * Dispara um evento de teste no Google Analytics
 */
export function testGoogleAnalytics(_measurementId: string) {
  if (typeof window === 'undefined') return;

  // Verifica se o gtag está disponível
  const win = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof win.gtag === 'function') {
    win.gtag('event', 'test_event', {
      event_category: 'admin_test',
      event_label: 'Teste de Analytics - Admin',
      value: 1,
    });
    alert('Evento de teste enviado! Verifique no Google Analytics em Tempo Real.');
  } else {
    alert('Google Analytics nÃ£o estÃ¡ carregado na pÃ¡gina. Certifique-se de que o ID estÃ¡ configurado e o script foi injetado.');
  }
}

// ============================================================================
// 7. POST /api/settings/tracking (Pixel/GA apenas) - exemplo de chamada
// ============================================================================
export async function updatePublicTrackingIds(payload: {
  facebookPixelId?: string | null;
  googleAnalyticsId?: string | null;
}): Promise<{ success: boolean; settings?: PublicTrackingSettings; error?: string }> {
  try {
    const response = await fetch('/api/settings/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: (data as TrackingAPIError)?.error || 'Erro ao salvar configurações de tracking',
      };
    }

    return {
      success: true,
      settings: (data as TrackingAPIResponse).settings as PublicTrackingSettings,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || 'Erro inesperado',
    };
  }
}
