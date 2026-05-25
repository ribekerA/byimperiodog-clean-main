/**
 * Tipos TypeScript para configurações de tracking (pixels e analytics)
 * By Império Dog - Sistema de Pixels/Analytics
 */

/**
 * Configurações de tracking armazenadas no banco (site_settings)
 */
export interface TrackingSettings {
  id: number;
  
  // Google Analytics / Tag Manager
  gtm_id: string | null;
  ga4_id: string | null;
  
  // Meta/Facebook
  meta_pixel_id: string | null;
  fb_capi_token: string | null; // Server-side only, não expor no frontend
  meta_domain_verify: string | null;
  
  // TikTok
  tiktok_pixel_id: string | null;
  tiktok_api_token: string | null; // Server-side only
  
  // Google Ads
  google_ads_id: string | null;
  google_ads_label: string | null;
  
  // Outros pixels
  pinterest_tag_id: string | null;
  hotjar_id: string | null;
  clarity_id: string | null;
  
  // Pixels customizados (array de objetos)
  custom_pixels: CustomPixel[] | null;
  
  // Meta de posts
  weekly_post_goal: number;
  
  // Metadata
  updated_at: string;
}

/**
 * Pixel customizado genérico
 */
export interface CustomPixel {
  name: string;
  script: string;
  enabled: boolean;
}

/**
 * Configurações públicas de tracking (sem tokens secretos)
 * Usadas no frontend para injetar scripts
 */
export interface PublicTrackingSettings {
  gtm_id: string | null;
  ga4_id: string | null;
  meta_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  google_ads_id: string | null;
  google_ads_label: string | null;
  pinterest_tag_id: string | null;
  hotjar_id: string | null;
  clarity_id: string | null;
  meta_domain_verify: string | null;
  custom_pixels: CustomPixel[] | null;
}

/**
 * Payload para atualizar configurações de tracking no admin
 */
export interface UpdateTrackingPayload {
  gtm_id?: string | null;
  ga4_id?: string | null;
  meta_pixel_id?: string | null;
  fb_capi_token?: string | null;
  tiktok_pixel_id?: string | null;
  tiktok_api_token?: string | null;
  google_ads_id?: string | null;
  google_ads_label?: string | null;
  pinterest_tag_id?: string | null;
  hotjar_id?: string | null;
  clarity_id?: string | null;
  meta_domain_verify?: string | null;
  custom_pixels?: CustomPixel[] | null;
  weekly_post_goal?: number;
}

/**
 * Resposta de sucesso das APIs
 */
export interface TrackingAPIResponse {
  settings: TrackingSettings | PublicTrackingSettings;
}

/**
 * Resposta de erro das APIs
 */
export interface TrackingAPIError {
  error: string;
}

/**
 * Resultado de validação
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}
