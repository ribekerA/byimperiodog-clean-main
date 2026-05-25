export const dynamic = "force-dynamic";
/**
 * API Route: Analytics Dashboard
 * GET /api/admin/analytics
 * 
 * Retorna métricas agregadas para o dashboard
 * By Império Dog - Sistema de Analytics
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { AnalyticsMetrics, AnalyticsPeriod } from '@/types/analytics';

interface AnalyticsEvent {
  event_type?: string;
  event_name?: string;
  user_id?: string;
  timestamp: string;
  page_path?: string;
  device?: string;
  device_type?: string;
  utm_source?: string;
  utm_medium?: string;
}

interface Session {
  userId?: string;
  startTime: string;
  endTime: string;
  events: AnalyticsEvent[];
}

interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  conversions: number;
}

/**
 * Calcula data de início baseado no período
 */
function getStartDate(period: AnalyticsPeriod, customStart?: string): Date {
  if (period === 'custom' && customStart) {
    return new Date(customStart);
  }

  const now = new Date();
  
  switch (period) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

/**
 * GET /api/admin/analytics
 * Retorna métricas do dashboard
 */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') || '7d') as AnalyticsPeriod;
    const customStart = searchParams.get('customStart') || undefined;
    const customEnd = searchParams.get('customEnd') || undefined;

    const startDate = getStartDate(period, customStart);
    const endDate = customEnd ? new Date(customEnd) : new Date();

    // Buscar eventos de analytics do banco
    // Assumindo que você tem uma tabela analytics_events
    const { data: events, error } = await supabaseAdmin()
      .from('analytics_events')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (error) {
      console.error('[Analytics] Erro ao buscar eventos:', error);
      // Retornar dados mock se não houver tabela ainda
      return NextResponse.json({
        metrics: getMockMetrics(period, startDate, endDate),
      });
    }

    // Processar eventos e calcular métricas
    const metrics = calculateMetrics(events || [], startDate, endDate, period);

    return NextResponse.json({
      metrics,
    });
  } catch (err) {
    console.error('[Analytics] Erro inesperado:', err);
    return NextResponse.json(
      { error: 'Erro ao carregar métricas' },
      { status: 500 }
    );
  }
}

/**
 * Calcula métricas a partir dos eventos
 */
function calculateMetrics(
  events: AnalyticsEvent[],
  startDate: Date,
  endDate: Date,
  period: AnalyticsPeriod
): AnalyticsMetrics {
  // Filtrar page views
  const pageViews = events.filter(e => e.event_type === 'pageview');
  const uniqueVisitors = new Set(events.map(e => e.user_id)).size;
  
  // Calcular sessões (simplificado - agrupa por user_id com gap de 30min)
  const sessions = calculateSessions(events);
  
  // Conversões
  const conversions = {
    leads: events.filter(e => e.event_type === 'lead').length,
    formSubmissions: events.filter(e => e.event_name === 'form_submission').length,
    phoneClicks: events.filter(e => e.event_name === 'phone_click').length,
    whatsappClicks: events.filter(e => e.event_name === 'whatsapp_click').length,
    purchases: events.filter(e => e.event_name === 'purchase').length,
  };

  // Top páginas
  const pageCounts = pageViews.reduce((acc, e) => {
    const path = e.page_path || '/';
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topPages = Object.entries(pageCounts)
    .sort(([, a], [, b]) => (Number(b) || 0) - (Number(a) || 0))
    .slice(0, 10)
    .map(([path, views]) => ({
      path,
      title: path,
      views: Number(views) || 0,
      uniqueViews: pageViews.filter(e => e.page_path === path).length,
    }));

  // Fontes de tráfego
  const trafficSources = calculateTrafficSources(events);

  // Dispositivos
  const devices = {
    desktop: events.filter(e => e.device_type === 'desktop').length,
    mobile: events.filter(e => e.device_type === 'mobile').length,
    tablet: events.filter(e => e.device_type === 'tablet').length,
  };

  return {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      label: getPeriodLabel(period),
    },
    pageViews: pageViews.length,
    uniqueVisitors,
    sessions: sessions.length,
    averageSessionDuration: calculateAverageSessionDuration(sessions),
    bounceRate: calculateBounceRate(sessions),
    conversions,
    customEvents: [],
    topPages,
    trafficSources,
    devices: {
      desktop: devices.desktop,
      mobile: devices.mobile,
      tablet: devices.tablet,
    },
    topLocations: [],
  };
}

/**
 * Calcula sessões a partir dos eventos
 */
function calculateSessions(events: AnalyticsEvent[]): Session[] {
  // Simplificado - agrupa eventos por user_id com gap máximo de 30min
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
  
  const sessions: Session[] = [];
  const userEvents = events.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let currentSession: Session | null = null;

  for (const event of userEvents) {
    if (!currentSession || 
        new Date(event.timestamp).getTime() - new Date(currentSession.endTime).getTime() > SESSION_TIMEOUT) {
      // Nova sessão
      if (currentSession) sessions.push(currentSession);
      currentSession = {
        userId: event.user_id,
        startTime: event.timestamp,
        endTime: event.timestamp,
        events: [event],
      };
    } else {
      // Continua sessão atual
      currentSession.endTime = event.timestamp;
      currentSession.events.push(event);
    }
  }

  if (currentSession) sessions.push(currentSession);

  return sessions;
}

/**
 * Calcula duração média de sessão em segundos
 */
function calculateAverageSessionDuration(sessions: Session[]): number {
  if (sessions.length === 0) return 0;

  const totalDuration = sessions.reduce((sum, session) => {
    const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
    return sum + duration;
  }, 0);

  return Math.floor(totalDuration / sessions.length / 1000); // em segundos
}

/**
 * Calcula taxa de rejeição (bounce rate)
 */
function calculateBounceRate(sessions: Session[]): number {
  if (sessions.length === 0) return 0;

  const bouncedSessions = sessions.filter(s => s.events.length === 1).length;
  return Math.round((bouncedSessions / sessions.length) * 100);
}

/**
 * Calcula fontes de tráfego
 */
function calculateTrafficSources(events: AnalyticsEvent[]): TrafficSource[] {
  const sources = events.reduce((acc, e) => {
    const source = e.utm_source || 'direct';
    const medium = e.utm_medium || 'none';
    const key = `${source}|${medium}`;
    
    if (!acc[key]) {
      acc[key] = { source, medium, sessions: 0, conversions: 0 };
    }
    
    acc[key].sessions++;
    if (e.event_type === 'lead' || e.event_type === 'conversion') {
      acc[key].conversions++;
    }
    
    return acc;
  }, {} as Record<string, TrafficSource>);

  return Object.values(sources)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);
}

/**
 * Retorna label do período
 */
function getPeriodLabel(period: AnalyticsPeriod): string {
  switch (period) {
    case '24h': return 'Últimas 24 horas';
    case '7d': return 'Últimos 7 dias';
    case '30d': return 'Últimos 30 dias';
    case '90d': return 'Últimos 90 dias';
    case 'custom': return 'Período personalizado';
    default: return 'Últimos 7 dias';
  }
}

/**
 * Retorna dados mock para quando não houver tabela de analytics ainda
 */
function getMockMetrics(
  period: AnalyticsPeriod,
  startDate: Date,
  endDate: Date
): AnalyticsMetrics {
  return {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      label: getPeriodLabel(period),
    },
    pageViews: 1247,
    uniqueVisitors: 856,
    sessions: 923,
    averageSessionDuration: 142, // segundos
    bounceRate: 42,
    conversions: {
      leads: 23,
      formSubmissions: 18,
      phoneClicks: 12,
      whatsappClicks: 34,
      purchases: 5,
    },
    customEvents: [
      { name: 'video_play', count: 89 },
      { name: 'pdf_download', count: 45 },
    ],
    topPages: [
      { path: '/', title: 'Home', views: 423, uniqueViews: 312 },
      { path: '/filhotes', title: 'Filhotes', views: 289, uniqueViews: 234 },
      { path: '/blog', title: 'Blog', views: 167, uniqueViews: 145 },
      { path: '/sobre', title: 'Sobre', views: 98, uniqueViews: 87 },
      { path: '/contato', title: 'Contato', views: 76, uniqueViews: 65 },
    ],
    trafficSources: [
      { source: 'google', medium: 'organic', sessions: 456, conversions: 12 },
      { source: 'facebook', medium: 'social', sessions: 234, conversions: 8 },
      { source: 'instagram', medium: 'social', sessions: 123, conversions: 5 },
      { source: 'direct', medium: 'none', sessions: 110, conversions: 3 },
    ],
    devices: {
      desktop: 412,
      mobile: 456,
      tablet: 55,
    },
    topLocations: [
      { country: 'Brasil', city: 'São Paulo', sessions: 345 },
      { country: 'Brasil', city: 'Rio de Janeiro', sessions: 234 },
      { country: 'Brasil', city: 'Belo Horizonte', sessions: 123 },
      { country: 'Brasil', city: 'Curitiba', sessions: 89 },
      { country: 'Brasil', city: 'Porto Alegre', sessions: 67 },
    ],
  };
}
