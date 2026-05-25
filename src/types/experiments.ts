/**
 * Tipos para Sistema de A/B Testing de Pixels
 * By Império Dog - Testes de diferentes configurações de tracking
 */

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed';

export interface PixelVariant {
  id: string;
  name: string;
  meta_pixel_id?: string;
  ga4_id?: string;
  gtm_id?: string;
  tiktok_pixel_id?: string;
  google_ads_id?: string;
  linkedin_partner_id?: string;
  twitter_pixel_id?: string;
  pinterest_tag_id?: string;
  snapchat_pixel_id?: string;
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  status: ExperimentStatus;
  traffic_split: number; // 0-100 (% de tráfego que participa do experimento)
  control_variant: PixelVariant;
  test_variant: PixelVariant;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  winner_variant_id?: string;
}

export interface ExperimentMetrics {
  experiment_id: string;
  variant_id: string;
  visitors: number;
  page_views: number;
  conversions: number;
  conversion_rate: number;
  revenue?: number;
  avg_time_on_site?: number;
  bounce_rate?: number;
}

export interface ExperimentAssignment {
  user_id: string;
  experiment_id: string;
  variant_id: string;
  assigned_at: string;
}

export interface CreateExperimentPayload {
  name: string;
  description?: string;
  traffic_split: number;
  control_variant: Omit<PixelVariant, 'id'>;
  test_variant: Omit<PixelVariant, 'id'>;
}

export interface UpdateExperimentPayload {
  name?: string;
  description?: string;
  status?: ExperimentStatus;
  traffic_split?: number;
  end_date?: string;
  winner_variant_id?: string;
}

export interface ExperimentResults {
  experiment: Experiment;
  control_metrics: ExperimentMetrics;
  test_metrics: ExperimentMetrics;
  statistical_significance?: number;
  recommendation?: 'control' | 'test' | 'inconclusive';
}
