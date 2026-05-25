/**
 * Tipos para Analytics Dashboard
 * By Império Dog - Sistema de Analytics
 */

/**
 * Métricas de analytics agregadas
 */
export interface AnalyticsMetrics {
  // Período
  period: {
    start: string;
    end: string;
    label: string; // "Últimas 24h", "Últimos 7 dias", etc.
  };

  // Métricas gerais
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  averageSessionDuration: number; // em segundos
  bounceRate: number; // porcentagem

  // Conversões
  conversions: {
    leads: number;
    formSubmissions: number;
    phoneClicks: number;
    whatsappClicks: number;
    purchases: number;
  };

  // Eventos customizados
  customEvents: {
    name: string;
    count: number;
  }[];

  // Top páginas
  topPages: {
    path: string;
    title: string;
    views: number;
    uniqueViews: number;
  }[];

  // Fontes de tráfego
  trafficSources: {
    source: string;
    medium: string;
    sessions: number;
    conversions: number;
  }[];

  // Dispositivos
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };

  // Localização (top 5)
  topLocations: {
    country: string;
    city?: string;
    sessions: number;
  }[];
}

/**
 * Evento de analytics em tempo real
 */
export interface AnalyticsEvent {
  id: string;
  timestamp: string;
  type: 'pageview' | 'conversion' | 'custom_event';
  
  // Dados do evento
  event: {
    name: string;
    category?: string;
    label?: string;
    value?: number;
  };

  // Dados da página
  page: {
    url: string;
    title: string;
    path: string;
  };

  // Dados do usuário
  user: {
    id?: string;
    isNew: boolean;
    device: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
    os?: string;
    location?: {
      country: string;
      city?: string;
    };
  };

  // Dados de campanha (UTM)
  campaign?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

/**
 * Configuração de período para dashboard
 */
export type AnalyticsPeriod = '24h' | '7d' | '30d' | '90d' | 'custom';

/**
 * Filtros para dashboard
 */
export interface AnalyticsFilters {
  period: AnalyticsPeriod;
  customStart?: string;
  customEnd?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  source?: string;
  medium?: string;
  page?: string;
}

/**
 * Resposta da API de analytics
 */
export interface AnalyticsAPIResponse {
  metrics: AnalyticsMetrics;
  realtimeEvents?: AnalyticsEvent[];
  comparisonData?: {
    previousPeriod: AnalyticsMetrics;
    change: {
      pageViews: number; // % de mudança
      conversions: number;
      bounceRate: number;
    };
  };
}

/**
 * Dados para gráfico de série temporal
 */
export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

/**
 * Configuração de gráfico
 */
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: TimeSeriesData[] | { name: string; value: number }[];
  xAxis?: string;
  yAxis?: string;
  colors?: string[];
}
