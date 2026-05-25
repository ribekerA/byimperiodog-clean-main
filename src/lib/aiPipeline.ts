import { createAiTask } from "./aiTasks";
import { awardXp, getOrCreateGamUser } from "./gamification.blog";
import { supabaseAdmin } from "./supabaseAdmin";

export interface AiSession {
  id: string;
  topic: string;
  phase: string;
  progress: number;
  status: string;
  error_message?: string | null;
  post_id?: string | null;
}

export interface AiTaskMeta {
  id: string;
  type: string;
  phase?: string | null;
  status: string;
  progress: number;
  result?: unknown;
  error_message?: string | null;
}

export type AiPhase =
  | "research"
  | "outline"
  | "draft"
  | "optimize"
  | "assets";

const DEFAULT_PHASES: AiPhase[] = [
  "research",
  "outline",
  "draft",
  "optimize",
  "assets",
];

export interface ResearchResult {
  topic: string;
  search_intent: string;
  primary_keyword: string;
  secondary_keywords: string[];
  audience: string;
  angle: string;
  competitor_urls: string[];
  related_questions: string[];
  internal_links: { href: string; anchor: string }[];
}

export interface OutlineResult {
  headline: string;
  summary: string;
  sections: { id: string; heading: string; goal: string; key_points: string[] }[];
}

export interface DraftResult {
  title: string;
  excerpt: string;
  mdx: string;
  faq: { question: string; answer: string }[];
  word_count: number;
}

export interface OptimizeResult {
  seo_title: string;
  seo_description: string;
  slug: string;
  h1: string;
  cta: string;
  alt_texts: string[];
  internal_links: { href: string; anchor: string; reason?: string }[];
  meta: Record<string, string>;
}

export interface AssetsResult {
  cover_prompt: string;
  cover_alt: string;
  gallery_prompts: string[];
}

export interface AiSessionBundle {
  session: AiSession;
  tasks: AiTaskMeta[];
  research?: ResearchResult;
  outline?: OutlineResult;
  draft?: DraftResult;
  optimize?: OptimizeResult;
  assets?: AssetsResult;
}

export async function createSessionWithTasks(params: {
  topic: string;
  phases?: string[];
  anonGamId?: string;
}) {
  const phases = (params.phases && params.phases.length
    ? params.phases
    : DEFAULT_PHASES
  ) as string[];

  const sb = supabaseAdmin();
  const { data: sessionInsert, error: sErr } = await sb
    .from("ai_generation_sessions")
    .insert({
      topic: params.topic,
      phase: phases[0],
      progress: 0,
      status: "active",
    })
    .select("id,topic,phase,progress,status")
    .maybeSingle();
  if (sErr) throw sErr;
  const sessionId = sessionInsert!.id as string;

  for (const phase of phases) {
    await createAiTask({
      type: phase,
      phase,
      topic: params.topic,
      payload: { session_id: sessionId, phase },
    });
  }

  if (params.anonGamId) {
    try {
      const gamUser = await getOrCreateGamUser(params.anonGamId);
      await awardXp(gamUser.id, "gam_ai_session_create", 20, {
        session_id: sessionId,
        topic: params.topic,
      });
    } catch (error) {
      console.warn("[aiPipeline] gamification award falhou", error);
    }
  }

  return { session_id: sessionId, phases };
}

export async function listSessions(limit = 20): Promise<AiSession[]> {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("ai_generation_sessions")
    .select("id,topic,phase,progress,status,error_message,post_id")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data || []) as AiSession[];
}

export async function getSession(id: string): Promise<AiSession | null> {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("ai_generation_sessions")
    .select("id,topic,phase,progress,status,error_message,post_id")
    .eq("id", id)
    .maybeSingle();
  return (data as AiSession) || null;
}

export async function listSessionTasks(sessionId: string): Promise<AiTaskMeta[]> {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("ai_tasks")
    .select(
      "id,type,phase,status,progress,result,error_message,payload",
    )
    .contains("payload", { session_id: sessionId })
    .order("created_at", { ascending: true });
  type RawTask = {
    id: string;
    type: string;
    phase?: string | null;
    status: string;
    progress: number;
    result?: unknown;
    error_message?: string | null;
  };
  return ((data || []) as RawTask[]).map((task) => ({
    id: task.id,
    type: task.type,
    phase: task.phase || task.type || null,
    status: task.status,
    progress: task.progress,
    result: task.result,
    error_message: task.error_message || null,
  }));
}

export async function recomputeSessionProgress(sessionId: string) {
  const tasks = await listSessionTasks(sessionId);
  if (!tasks.length) return;
  const progress = Math.round(
    tasks.reduce((acc, task) => acc + (task.progress || 0), 0) / tasks.length,
  );
  const nextPhase =
    tasks.find(
      (task) => task.status === "pending" || task.status === "running",
    )?.type || tasks[tasks.length - 1].type;
  const allDone = tasks.every((task) => task.status === "done");
  const anyError = tasks.some((task) => task.status === "error");
  const status = anyError ? "error" : allDone ? "completed" : "active";
  const sb = supabaseAdmin();
  await sb
    .from("ai_generation_sessions")
    .update({ progress, phase: nextPhase, status })
    .eq("id", sessionId);
}

export async function assembleSessionProduct(
  sessionId: string,
): Promise<AiSessionBundle | null> {
  const session = await getSession(sessionId);
  if (!session) return null;
  const tasks = await listSessionTasks(sessionId);

  const researchTask = tasks.find((task) => task.type === "research");
  const outlineTask = tasks.find((task) => task.type === "outline");
  const draftTask = tasks.find((task) => task.type === "draft");
  const optimizeTask = tasks.find((task) => task.type === "optimize");
  const assetsTask = tasks.find((task) => task.type === "assets");

  return {
    session,
    tasks,
    research: researchTask ? coerceResearchResult(researchTask.result) : undefined,
    outline: outlineTask ? coerceOutlineResult(outlineTask.result) : undefined,
    draft: draftTask ? coerceDraftResult(draftTask.result) : undefined,
    optimize: optimizeTask
      ? coerceOptimizeResult(optimizeTask.result)
      : undefined,
    assets: assetsTask ? coerceAssetsResult(assetsTask.result) : undefined,
  };
}

function coerceResearchResult(payload: unknown): ResearchResult {
  const base: ResearchResult = {
    topic: "",
    search_intent: "",
    primary_keyword: "",
    secondary_keywords: [],
    audience: "",
    angle: "",
    competitor_urls: [],
    related_questions: [],
    internal_links: [],
  };
  if (!payload || typeof payload !== "object") return base;
  const source = payload as Record<string, unknown>;
  return {
    topic: String(source.topic || ""),
    search_intent: String(source.search_intent || ""),
    primary_keyword: String(source.primary_keyword || ""),
    secondary_keywords: arrayOfStrings(source.secondary_keywords),
    audience: String(source.audience || ""),
    angle: String(source.angle || ""),
    competitor_urls: arrayOfStrings(source.competitor_urls),
    related_questions: arrayOfStrings(source.related_questions),
    internal_links: arrayOfLinks(source.internal_links),
  };
}

function coerceOutlineResult(payload: unknown): OutlineResult {
  const base: OutlineResult = {
    headline: "",
    summary: "",
    sections: [],
  };
  if (!payload || typeof payload !== "object") return base;
  const source = payload as Record<string, unknown>;
  return {
    headline: String(source.headline || ""),
    summary: String(source.summary || ""),
    sections: arrayOfSections(source.sections),
  };
}

function coerceDraftResult(payload: unknown): DraftResult {
  const base: DraftResult = {
    title: "",
    excerpt: "",
    mdx: "",
    faq: [],
    word_count: 0,
  };
  if (!payload || typeof payload !== "object") return base;
  const source = payload as Record<string, unknown>;
  return {
    title: String(source.title || ""),
    excerpt: String(source.excerpt || ""),
    mdx: String(source.mdx || ""),
    faq: arrayOfFaq(source.faq),
    word_count: Number(source.word_count || 0),
  };
}

function coerceOptimizeResult(payload: unknown): OptimizeResult {
  const base: OptimizeResult = {
    seo_title: "",
    seo_description: "",
    slug: "",
    h1: "",
    cta: "",
    alt_texts: [],
    internal_links: [],
    meta: {},
  };
  if (!payload || typeof payload !== "object") return base;
  const source = payload as Record<string, unknown>;
  return {
    seo_title: String(source.seo_title || ""),
    seo_description: String(source.seo_description || ""),
    slug: String(source.slug || ""),
    h1: String(source.h1 || ""),
    cta: String(source.cta || ""),
    alt_texts: arrayOfStrings(source.alt_texts),
    internal_links: arrayOfLinks(source.internal_links),
    meta: typeof source.meta === "object" && source.meta !== null
      ? (source.meta as Record<string, string>)
      : {},
  };
}

function coerceAssetsResult(payload: unknown): AssetsResult {
  const base: AssetsResult = {
    cover_prompt: "",
    cover_alt: "",
    gallery_prompts: [],
  };
  if (!payload || typeof payload !== "object") return base;
  const source = payload as Record<string, unknown>;
  return {
    cover_prompt: String(source.cover_prompt || ""),
    cover_alt: String(source.cover_alt || ""),
    gallery_prompts: arrayOfStrings(source.gallery_prompts),
  };
}

function arrayOfStrings(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

function arrayOfLinks(
  input: unknown,
): { href: string; anchor: string; reason?: string }[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const entry = value as Record<string, unknown>;
      const href = String(entry.href || "").trim();
      const anchor = String(entry.anchor || "").trim();
      if (!href || !anchor) return null;
      return {
        href,
        anchor,
        reason: entry.reason ? String(entry.reason) : undefined,
      };
    })
    .filter(Boolean) as { href: string; anchor: string; reason?: string }[];
}

function arrayOfSections(
  input: unknown,
): { id: string; heading: string; goal: string; key_points: string[] }[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((value, index) => {
      if (!value || typeof value !== "object") return null;
      const entry = value as Record<string, unknown>;
      const id = String(entry.id || `section-${index}`);
      const heading = String(entry.heading || "");
      const goal = String(entry.goal || "");
      const key_points = arrayOfStrings(entry.key_points);
      if (!heading) return null;
      return { id, heading, goal, key_points };
    })
    .filter(Boolean) as {
    id: string;
    heading: string;
    goal: string;
    key_points: string[];
  }[];
}

function arrayOfFaq(
  input: unknown,
): { question: string; answer: string }[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const entry = value as Record<string, unknown>;
      const question = String(entry.question || entry.q || "");
      const answer = String(entry.answer || entry.a || "");
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter(Boolean) as { question: string; answer: string }[];
}
