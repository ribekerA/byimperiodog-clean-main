export const dynamic = "force-dynamic";

/**
 * API Admin - Experiments [ID]
 * By Império Dog - Gerenciamento individual de experimentos
 *
 * GET /api/admin/experiments/[id] - Busca experimento específico
 * PATCH /api/admin/experiments/[id] - Atualiza experimento
 * DELETE /api/admin/experiments/[id] - Remove experimento
 */

import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';
import type { Experiment, UpdateExperimentPayload } from '@/types/experiments';

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

    const { data, error } = await supabaseAdmin
      .from('pixel_experiments')
      .select(`
        *,
        control_variant:pixel_variants!control_variant_id(*),
        test_variant:pixel_variants!test_variant_id(*)
      `)
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Experimento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ experiment: data as Experiment });
  } catch (error) {
    console.error('Error in GET /api/admin/experiments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    const body: UpdateExperimentPayload = await request.json();

    // Validações
    if (body.traffic_split !== undefined) {
      if (body.traffic_split < 0 || body.traffic_split > 100) {
        return NextResponse.json(
          { error: 'Traffic split deve estar entre 0 e 100' },
          { status: 400 }
        );
      }
    }

    // Se mudando para "running", definir start_date
    if (body.status === 'running') {
      body.end_date = undefined; // Limpar end_date ao reiniciar
    }

    // Se mudando para "completed", definir end_date
    if (body.status === 'completed' && !body.end_date) {
      body.end_date = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('pixel_experiments')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
        ...(body.status === 'running' && { start_date: new Date().toISOString() }),
      })
      .eq('id', params.id)
      .select(`
        *,
        control_variant:pixel_variants!control_variant_id(*),
        test_variant:pixel_variants!test_variant_id(*)
      `)
      .single();

    if (error) {
      console.error('Error updating experiment:', error);
      return NextResponse.json(
        { error: 'Failed to update experiment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      experiment: data as Experiment,
      message: 'Experimento atualizado com sucesso',
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/experiments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    // Buscar experimento para pegar IDs das variantes
    const { data: experiment } = await supabaseAdmin
      .from('pixel_experiments')
      .select('control_variant_id, test_variant_id')
      .eq('id', params.id)
      .single();

    if (!experiment) {
      return NextResponse.json(
        { error: 'Experimento não encontrado' },
        { status: 404 }
      );
    }

    // Remover experimento
    const { error: expError } = await supabaseAdmin
      .from('pixel_experiments')
      .delete()
      .eq('id', params.id);

    if (expError) {
      console.error('Error deleting experiment:', expError);
      return NextResponse.json(
        { error: 'Failed to delete experiment' },
        { status: 500 }
      );
    }

    // Remover variantes
    await supabaseAdmin
      .from('pixel_variants')
      .delete()
      .in('id', [experiment.control_variant_id, experiment.test_variant_id]);

    return NextResponse.json({
      message: 'Experimento removido com sucesso',
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/experiments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
