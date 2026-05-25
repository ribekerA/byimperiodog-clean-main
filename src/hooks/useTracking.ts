/**
 * Hook React para gerenciar configurações de tracking
 * By Império Dog - Sistema de Pixels/Analytics
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

import type { PublicTrackingSettings, TrackingSettings, UpdateTrackingPayload } from '@/types/tracking';

interface UseTrackingOptions {
  /**
   * Se true, carrega as configurações admin completas (com tokens secretos)
   * Requer autenticação de admin
   */
  admin?: boolean;
  
  /**
   * Se true, carrega automaticamente as configurações ao montar o componente
   */
  autoLoad?: boolean;
}

interface UseTrackingReturn {
  settings: PublicTrackingSettings | TrackingSettings | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateSettings: (payload: UpdateTrackingPayload) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Hook para gerenciar configurações de tracking (pixels e analytics)
 * 
 * @example
 * // Frontend público
 * const { settings, loading } = useTracking();
 * 
 * @example
 * // Painel admin
 * const { settings, updateSettings } = useTracking({ admin: true });
 * await updateSettings({ meta_pixel_id: '123456' });
 */
export function useTracking(options: UseTrackingOptions = {}): UseTrackingReturn {
  const { admin = false, autoLoad = true } = options;
  
  const [settings, setSettings] = useState<PublicTrackingSettings | TrackingSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = admin ? '/api/admin/settings' : '/api/settings/tracking';
      
      const response = await fetch(endpoint, {
        credentials: admin ? 'include' : 'same-origin',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não autenticado como admin');
        }
        throw new Error('Erro ao carregar configurações');
      }

      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('[useTracking] Erro ao carregar settings:', err);
    } finally {
      setLoading(false);
    }
  }, [admin]);

  const updateSettings = useCallback(async (payload: UpdateTrackingPayload) => {
    if (!admin) {
      return {
        success: false,
        error: 'Atualização requer modo admin',
      };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Erro ao atualizar configurações',
        };
      }

      // Atualiza o estado local
      setSettings(data.settings);

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro de conexão';
      setError(message);
      return {
        success: false,
        error: message,
      };
    } finally {
      setLoading(false);
    }
  }, [admin]);

  // Auto-load ao montar
  useEffect(() => {
    if (autoLoad) {
      refetch();
    }
  }, [autoLoad, refetch]);

  return {
    settings,
    loading,
    error,
    refetch,
    updateSettings,
  };
}
