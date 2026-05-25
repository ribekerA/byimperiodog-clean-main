import { supabaseAdmin } from './supabaseAdmin';

interface CreateAiTaskInput {
  type: string;
  topic?: string;
  post_id?: string;
  phase?: string;
  payload?: unknown;
}

export async function createAiTask(input: CreateAiTaskInput) {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('ai_tasks')
    .insert([
      {
        type: input.type,
        topic: input.topic || null,
        post_id: input.post_id || null,
        phase: input.phase || input.type || null,
        payload: input.payload || null,
        status: 'pending',
        progress: 0,
      },
    ])
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateAiTask(
  id: string,
  patch: Partial<{
    phase: string;
    status: string;
    progress: number;
    result: unknown;
    error_message: string;
    started_at: string;
    finished_at: string;
  }>,
) {
  const sb = supabaseAdmin();
  const { error } = await sb.from('ai_tasks').update(patch).eq('id', id);
  if (error) throw error;
}
