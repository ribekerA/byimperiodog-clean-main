export const dynamic = "force-dynamic";

/**
 * API Admin - Experiment Results
 * By Império Dog - Resultados e métricas de experimentos
 *
 * GET /api/admin/experiments/[id]/results - Busca resultados do experimento
 */

import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';
import type { ExperimentResults, ExperimentMetrics } from '@/types/experiments';

// Guard: createClient throws if URL is empty — during `next build` env vars are
// not available, so we skip construction and let handlers fail gracefully at runtime.
const supabaseAdmin = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    )
  : (null as any);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    // Buscar experimento
    const { data: experiment, error: expError } = await supabaseAdmin
      .from('pixel_experiments')
      .select(`
        *,
        control_variant:pixel_variants!control_variant_id(*),
        test_variant:pixel_variants!test_variant_id(*)
      `)
      .eq('id', params.id)
      .single();

    if (expError || !experiment) {
      return NextResponse.json(
        { error: 'Experimento não encontrado' },
        { status: 404 }
      );
    }

    // Buscar métricas das variantes
    const controlMetrics = await getVariantMetrics(
      params.id,
      experiment.control_variant_id
    );
    const testMetrics = await getVariantMetrics(
      params.id,
      experiment.test_variant_id
    );

    // Calcular significância estatística
    const significance = calculateStatisticalSignificance(
      controlMetrics,
      testMetrics
    );

    // Gerar recomendação
    const recommendation = getRecommendation(
      controlMetrics,
      testMetrics,
      significance
    );

    const results: ExperimentResults = {
      experiment,
      control_metrics: controlMetrics,
      test_metrics: testMetrics,
      statistical_significance: significance,
      recommendation,
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in GET /api/admin/experiments/[id]/results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getVariantMetrics(
  experimentId: string,
  variantId: string
): Promise<ExperimentMetrics> {
  // Buscar eventos de analytics para esta variante
  const { data: events, error } = await supabaseAdmin
    .from('analytics_events')
    .select('*')
    .eq('experiment_id', experimentId)
    .eq('variant_id', variantId);

  if (error || !events) {
    return {
      experiment_id: experimentId,
      variant_id: variantId,
      visitors: 0,
      page_views: 0,
      conversions: 0,
      conversion_rate: 0,
    };
  }

  // Calcular métricas
  const visitors = new Set(events.map((e) => e.user_id)).size;
  const pageViews = events.filter((e) => e.event_name === 'page_view').length;
  const conversions = events.filter((e) =>
    ['lead_form_submit', 'puppy_reservation', 'purchase'].includes(e.event_name)
  ).length;

  const conversionRate = visitors > 0 ? (conversions / visitors) * 100 : 0;

  // Calcular tempo médio no site
  const sessionTimes = events
    .filter((e) => e.session_duration)
    .map((e) => e.session_duration);
  const avgTimeOnSite =
    sessionTimes.length > 0
      ? sessionTimes.reduce((a, b) => a + b, 0) / sessionTimes.length
      : 0;

  // Calcular bounce rate
  const sessions = new Set(events.map((e) => e.session_id));
  const bouncedSessions = Array.from(sessions).filter((sessionId) => {
    const sessionEvents = events.filter((e) => e.session_id === sessionId);
    return sessionEvents.length === 1;
  });
  const bounceRate =
    sessions.size > 0 ? (bouncedSessions.length / sessions.size) * 100 : 0;

  return {
    experiment_id: experimentId,
    variant_id: variantId,
    visitors,
    page_views: pageViews,
    conversions,
    conversion_rate: conversionRate,
    avg_time_on_site: avgTimeOnSite,
    bounce_rate: bounceRate,
  };
}

function calculateStatisticalSignificance(
  control: ExperimentMetrics,
  test: ExperimentMetrics
): number {
  // Implementação simplificada do teste Z para proporções
  const p1 = control.conversion_rate / 100;
  const p2 = test.conversion_rate / 100;
  const n1 = control.visitors;
  const n2 = test.visitors;

  if (n1 === 0 || n2 === 0) return 0;

  const p = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));

  if (se === 0) return 0;

  const z = Math.abs((p1 - p2) / se);

  // Converter Z-score para p-value (simplificado)
  // Z > 1.96 = 95% de confiança
  // Z > 2.58 = 99% de confiança
  if (z > 2.58) return 99;
  if (z > 1.96) return 95;
  if (z > 1.65) return 90;
  return Math.round((1 - Math.exp(-0.717 * z - 0.416 * z * z)) * 100);
}

function getRecommendation(
  control: ExperimentMetrics,
  test: ExperimentMetrics,
  significance: number
): 'control' | 'test' | 'inconclusive' {
  // Precisa de pelo menos 95% de confiança
  if (significance < 95) {
    return 'inconclusive';
  }

  // Comparar taxa de conversão
  if (test.conversion_rate > control.conversion_rate) {
    return 'test';
  } else if (control.conversion_rate > test.conversion_rate) {
    return 'control';
  }

  return 'inconclusive';
}
