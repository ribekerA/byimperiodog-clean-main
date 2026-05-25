/**
 * Botão para testar pixels (dispara eventos de teste)
 * By Império Dog - Sistema de Pixels/Analytics
 */

'use client';

import { useState } from 'react';

type PixelType = 'facebook' | 'google-analytics' | 'tiktok' | 'pinterest';

interface TestPixelButtonProps {
  pixelType: PixelType;
  pixelId: string;
  className?: string;
}

/**
 * Dispara um evento de teste no pixel especificado
 */
interface WindowWithPixels extends Window {
  fbq?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
  ttq?: { track?: (...args: unknown[]) => void; page?: () => void };
  pintrk?: (...args: unknown[]) => void;
}

function testPixel(type: PixelType, pixelId: string): { success: boolean; message: string } {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Janela não disponível' };
  }

  const win = window as WindowWithPixels;

  switch (type) {
    case 'facebook': {
      if (typeof win.fbq !== 'function') {
        return {
          success: false,
          message: 'Facebook Pixel não está carregado. Verifique se o ID está configurado.',
        };
      }

      win.fbq('track', 'Lead', {
        content_name: 'Teste de Pixel - Admin',
        source: 'admin_test_button',
        test_event: true,
        value: 1,
        currency: 'BRL',
      });

      // eslint-disable-next-line no-console
      console.log('[TEST] Facebook Pixel evento enviado:', pixelId);
      return {
        success: true,
        message: 'Evento de teste enviado! Verifique no Event Manager do Facebook em Tempo Real.',
      };
    }

    case 'google-analytics': {
      if (typeof win.gtag !== 'function') {
        return {
          success: false,
          message: 'Google Analytics não está carregado. Verifique se o ID está configurado.',
        };
      }

      win.gtag('event', 'test_tracking', {
        event_category: 'admin_test',
        event_label: 'Teste de Analytics - Admin',
        value: 1,
        send_to: pixelId,
      });

      // eslint-disable-next-line no-console
      console.log('[TEST] Google Analytics evento enviado:', pixelId);
      return {
        success: true,
        message: 'Evento de teste enviado! Verifique no Google Analytics em Tempo Real > Eventos.',
      };
    }

    case 'tiktok': {
      if (!win.ttq || typeof win.ttq.track !== 'function') {
        return {
          success: false,
          message: 'TikTok Pixel não está carregado. Verifique se o ID está configurado.',
        };
      }

      win.ttq.track('SubmitForm', {
        content_type: 'test_event',
        content_name: 'Teste de Pixel - Admin',
        value: 1,
        currency: 'BRL',
      });

      // eslint-disable-next-line no-console
      console.log('[TEST] TikTok Pixel evento enviado:', pixelId);
      return {
        success: true,
        message: 'Evento de teste enviado! Verifique no TikTok Events Manager.',
      };
    }

    case 'pinterest': {
      if (typeof win.pintrk !== 'function') {
        return {
          success: false,
          message: 'Pinterest Tag não está carregado. Verifique se o ID está configurado.',
        };
      }

      win.pintrk('track', 'lead', {
        lead_type: 'test_event',
        value: 1,
        currency: 'BRL',
      });

      // eslint-disable-next-line no-console
      console.log('[TEST] Pinterest Tag evento enviado:', pixelId);
      return {
        success: true,
        message: 'Evento de teste enviado! Verifique no Pinterest Tag Manager.',
      };
    }

    default:
      return {
        success: false,
        message: `Tipo de pixel não suportado: ${type}`,
      };
  }
}

/**
 * Botão para testar pixels
 * Dispara um evento de teste e mostra feedback ao usuário
 */
export function TestPixelButton({ pixelType, pixelId, className = '' }: TestPixelButtonProps) {
  const [testing, setTesting] = useState(false);

  const handleTest = () => {
    setTesting(true);

    // Pequeno delay para feedback visual
    setTimeout(() => {
      const result = testPixel(pixelType, pixelId);
      setTesting(false);
      
      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    }, 300);
  };

  const labels: Record<PixelType, string> = {
    facebook: '🧪 Testar Facebook Pixel',
    'google-analytics': '🧪 Testar Google Analytics',
    tiktok: '🧪 Testar TikTok Pixel',
    pinterest: '🧪 Testar Pinterest Tag',
  };

  return (
    <button
      type="button"
      onClick={handleTest}
      disabled={testing || !pixelId}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-md
        bg-purple-600 text-white font-medium
        hover:bg-purple-700 active:bg-purple-800
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
      title={!pixelId ? 'Configure o ID do pixel primeiro' : undefined}
    >
      {testing ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Testando...
        </>
      ) : (
        labels[pixelType]
      )}
    </button>
  );
}

export default TestPixelButton;
