export const dynamic = "force-dynamic";
/**
 * API Admin - Pixel Experiments (A/B Testing)
 * By Império Dog - Gerenciamento de experimentos de pixels
 * 
 * GET /api/admin/pixel-experiments - Lista todos os experimentos
 * POST /api/admin/pixel-experiments - Cria novo experimento
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/adminAuth';
import type { Experiment, CreateExperimentPayload } from '@/types/experiments';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { data, error } = await supabaseAdmin
      .from('pixel_experiments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching experiments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch experiments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ experiments: data as Experiment[] });
  } catch (error) {
    console.error('Error in GET /api/admin/pixel-experiments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    const body: CreateExperimentPayload = await request.json();

    // Validações
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    if (body.traffic_split < 0 || body.traffic_split > 100) {
      return NextResponse.json(
        { error: 'Traffic split deve estar entre 0 e 100' },
        { status: 400 }
      );
    }

    // Criar variantes
    const { data: controlVariant, error: controlError } = await supabaseAdmin
      .from('pixel_variants')
      .insert(body.control_variant)
      .select()
      .single();

    if (controlError) {
      console.error('Error creating control variant:', controlError);
      return NextResponse.json(
        { error: 'Failed to create control variant' },
        { status: 500 }
      );
    }

    const { data: testVariant, error: testError } = await supabaseAdmin
      .from('pixel_variants')
      .insert(body.test_variant)
      .select()
      .single();

    if (testError) {
      console.error('Error creating test variant:', testError);
      return NextResponse.json(
        { error: 'Failed to create test variant' },
        { status: 500 }
      );
    }

    // Criar experimento
    const { data: experiment, error: expError } = await supabaseAdmin
      .from('pixel_experiments')
      .insert({
        name: body.name,
        description: body.description,
        status: 'draft',
        traffic_split: body.traffic_split,
        control_variant_id: controlVariant.id,
        test_variant_id: testVariant.id,
      })
      .select(`
        *,
        control_variant:pixel_variants!control_variant_id(*),
        test_variant:pixel_variants!test_variant_id(*)
      `)
      .single();

    if (expError) {
      console.error('Error creating experiment:', expError);
      return NextResponse.json(
        { error: 'Failed to create experiment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      experiment: experiment as Experiment,
      message: 'Experimento criado com sucesso',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/pixel-experiments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
