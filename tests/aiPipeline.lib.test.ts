import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSessionWithTasks,
  listSessions,
  getSession,
  listSessionTasks,
  recomputeSessionProgress,
  assembleSessionProduct,
} from '../src/lib/aiPipeline';

interface SessionRecord {
  [k: string]: unknown;
  id: string;
  topic: string;
  phase: string;
  progress: number;
  status: string;
  error_message?: string | null;
  post_id?: string | null;
  created_at: string;
}
interface TaskPayload {
  session_id: string;
  phase?: string;
}
interface TaskRecord {
  [k: string]: unknown;
  id: string;
  type: string;
  phase?: string | null;
  status: string;
  progress: number;
  result?: unknown;
  error_message?: string | null;
  payload?: TaskPayload | null;
  created_at: string;
}

const store: { sessions: SessionRecord[]; tasks: TaskRecord[] } = {
  sessions: [],
  tasks: [],
};
function reset() {
  store.sessions.length = 0;
  store.tasks.length = 0;
}

vi.mock('../src/lib/gamification.blog', () => ({
  getOrCreateGamUser: vi.fn(async (anon: string) => ({
    id: `gu_${anon}`,
    xp: 0,
    level: 1,
    streak_days: 0,
  })),
  awardXp: vi.fn(async () => ({ xp: 20, level: 1, streak_days: 1 })),
}));

type Builder<T extends Record<string, unknown>> = {
  data: T[];
  select: (cols?: string) => Builder<T>;
  contains: (col: string, val: Record<string, unknown>) => Builder<T>;
  eq: (col: keyof T & string, val: unknown) => Builder<T>;
  order: (col?: string, opts?: { ascending?: boolean }) => Builder<T>;
  limit: (n: number) => { data: T[]; error: null };
  maybeSingle: () => Promise<{ data: T | null; error: null }>;
  single: () => Promise<{ data: T | null; error: null }>;
};

function makeBuilder<T extends Record<string, unknown>>(data: T[]): Builder<T> {
  return {
    data,
    select: () => makeBuilder(data),
    contains: (col, val) => {
      if (col === 'payload' && 'session_id' in val) {
        const sid = (val as Record<string, unknown>).session_id;
        return makeBuilder(
          data.filter((record) => {
            const payload = record['payload'] as TaskPayload | null | undefined;
            return !!payload && payload.session_id === sid;
          }),
        );
      }
      return makeBuilder(data);
    },
    eq: (col, val) => makeBuilder(data.filter((record) => record[col] === val)),
    order: () => makeBuilder(data),
    limit: (n) => ({ data: data.slice(0, n), error: null }),
    maybeSingle: () => Promise.resolve({ data: data[0] || null, error: null }),
    single: () => Promise.resolve({ data: data[0] || null, error: null }),
  };
}

vi.mock('../src/lib/supabaseAdmin', () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'ai_generation_sessions')
        return {
          insert: (vals: Partial<SessionRecord> | Partial<SessionRecord>[]) => {
            const base = Array.isArray(vals) ? vals[0] : vals;
            const rec: SessionRecord = {
              id: `s${store.sessions.length + 1}`,
              created_at: new Date().toISOString(),
              topic: String(base?.topic || ''),
              phase: String(base?.phase || 'research'),
              progress: Number(base?.progress || 0),
              status: String(base?.status || 'active'),
              error_message: base?.error_message || null,
              post_id: base?.post_id || null,
            };
            store.sessions.push(rec);
            return {
              select: () => ({ maybeSingle: () => Promise.resolve({ data: rec, error: null }) }),
            };
          },
          select: () => makeBuilder(store.sessions),
          update: (patch: Partial<SessionRecord>) => ({
            eq: (_c: string, id: string) => {
              store.sessions = store.sessions.map((session) =>
                session.id === id ? { ...session, ...patch } : session,
              );
              return {};
            },
          }),
        };
      if (table === 'ai_tasks')
        return {
          insert: (vals: Partial<TaskRecord> | Partial<TaskRecord>[]) => {
            const arr = Array.isArray(vals) ? vals : [vals];
            const created: TaskRecord[] = [];
            for (const value of arr) {
              const rec: TaskRecord = {
                id: `t${store.tasks.length + 1}`,
                created_at: new Date().toISOString(),
                type: String(value.type || 'unknown'),
                phase: value.phase || value.type || null,
                status: String(value.status || 'pending'),
                progress: Number(value.progress || 0),
                result: value.result,
                error_message: value.error_message || null,
                payload: (value.payload as TaskPayload) || null,
              };
              store.tasks.push(rec);
              created.push(rec);
            }
            return {
              select: () => ({ single: () => Promise.resolve({ data: created[0], error: null }) }),
            };
          },
          select: () => makeBuilder(store.tasks),
          update: (patch: Partial<TaskRecord>) => ({
            eq: (_c: string, id: string) => {
              store.tasks = store.tasks.map((task) =>
                task.id === id ? { ...task, ...patch } : task,
              );
              return {};
            },
          }),
        };
      return { select: () => makeBuilder([] as SessionRecord[]) };
    },
  }),
}));

beforeEach(() => reset());

describe('aiPipeline lib', () => {
  it('createSessionWithTasks cria sessão default com fases estendidas', async () => {
    const { session_id, phases } = await createSessionWithTasks({ topic: 'Filhotes saudáveis' });
    expect(phases).toEqual(['research', 'outline', 'draft', 'optimize', 'assets']);
    expect(store.sessions.length).toBe(1);
    expect(store.tasks.filter((task) => task.payload?.session_id === session_id).length).toBe(5);
  });

  it('createSessionWithTasks aceita fases customizadas e gamificação opcional', async () => {
    const { session_id, phases } = await createSessionWithTasks({ topic: 'Adestramento', phases: ['research', 'draft'], anonGamId: 'anon123' });
    expect(phases).toEqual(['research', 'draft']);
    expect(store.tasks.filter((task) => task.payload?.session_id === session_id).length).toBe(2);
  });

  it('listSessions e getSession retornam dados inseridos', async () => {
    const { session_id } = await createSessionWithTasks({ topic: 'Nutrição canina' });
    const list = await listSessions();
    expect(list.length).toBeGreaterThanOrEqual(1);
    const session = await getSession(session_id);
    expect(session?.topic).toBe('Nutrição canina');
  });

  it('listSessionTasks retorna tarefas associadas', async () => {
    const { session_id } = await createSessionWithTasks({ topic: 'Higiene pet' });
    const tasks = await listSessionTasks(session_id);
    expect(tasks.length).toBe(5);
    expect(tasks[0].phase).toBeDefined();
  });

  it('recomputeSessionProgress atualiza progresso, fase e status agregados', async () => {
    const { session_id } = await createSessionWithTasks({ topic: 'Socialização' });
    const related = store.tasks.filter((task) => task.payload?.session_id === session_id);
    store.tasks = store.tasks.map((task) =>
      task.id === related[0].id ? { ...task, status: 'done', progress: 100 } : task,
    );
    store.tasks = store.tasks.map((task) =>
      task.id === related[1].id ? { ...task, status: 'running', progress: 40 } : task,
    );
    await recomputeSessionProgress(session_id);
    const sessionAfter1 = store.sessions.find((s) => s.id === session_id)!;
    expect(sessionAfter1.progress).toBeGreaterThan(0);
    expect(sessionAfter1.status).toBe('active');
    expect(['research', 'outline', 'draft', 'optimize', 'assets']).toContain(sessionAfter1.phase);
    store.tasks = store.tasks.map((task) =>
      task.payload?.session_id === session_id ? { ...task, status: 'done', progress: 100 } : task,
    );
    await recomputeSessionProgress(session_id);
    const sessionAfter2 = store.sessions.find((s) => s.id === session_id)!;
    expect(sessionAfter2.status).toBe('completed');
    expect(sessionAfter2.progress).toBe(100);
    const errorTask = store.tasks.find((task) => task.payload?.session_id === session_id)!;
    errorTask.status = 'error';
    await recomputeSessionProgress(session_id);
    const sessionAfter3 = store.sessions.find((s) => s.id === session_id)!;
    expect(sessionAfter3.status).toBe('error');
  });

  it('assembleSessionProduct agrega resultados estruturados', async () => {
    const { session_id } = await createSessionWithTasks({ topic: 'Hidratação de Spitz' });
    const tasks = store.tasks.filter((task) => task.payload?.session_id === session_id);
    const [research, outline, draft, optimize, assets] = tasks;
    research.result = {
      topic: 'Hidratação de Spitz',
      search_intent: 'informational',
      primary_keyword: 'hidratar spitz',
      secondary_keywords: ['hidratação de cães pequenos'],
      audience: 'tutores de lulu da pomerânia',
      angle: 'guia completo',
      competitor_urls: ['https://example.com/1'],
      related_questions: ['Como hidratar?'],
      internal_links: [{ href: '/blog/cuidados', anchor: 'Cuidados gerais' }],
    };
    outline.result = {
      headline: 'Guia de hidratação para Spitz',
      summary: 'Resumo',
      sections: [{ id: 'intro', heading: 'Introdução', goal: 'Contexto', key_points: ['Importância'] }],
    };
    draft.result = {
      title: 'Guia de hidratação',
      excerpt: 'Como hidratar seu spitz',
      mdx: '# Guia\nConteúdo',
      faq: [{ question: 'Quantas tigelas?', answer: 'Duas' }],
      word_count: 800,
    };
    optimize.result = {
      seo_title: 'Hidratar Spitz Alemão',
      seo_description: 'Passo a passo',
      slug: 'hidratar-spitz',
      h1: 'Hidratação do Spitz',
      cta: 'Fale com a equipe',
      alt_texts: ['Cachorro bebendo água'],
      internal_links: [{ href: '/blog/agua', anchor: 'Água fresca' }],
      meta: { 'article:section': 'Cuidados' },
    };
    assets.result = {
      cover_prompt: 'foto 16:9 spitz bebendo água',
      cover_alt: 'Spitz com tigela de água',
      gallery_prompts: ['close das vasilhas'],
    };

    const bundle = await assembleSessionProduct(session_id);
    expect(bundle?.research?.primary_keyword).toBe('hidratar spitz');
    expect(bundle?.draft?.word_count).toBe(800);
    expect(bundle?.optimize?.slug).toBe('hidratar-spitz');
    expect(bundle?.assets?.gallery_prompts).toHaveLength(1);
  });
});
