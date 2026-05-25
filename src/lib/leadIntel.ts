import "server-only";

import { createHash } from "node:crypto";

import { z } from "zod";

import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

import type { Database } from "@/types/supabase";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type PuppyRow = Database["public"]["Tables"]["puppies"]["Row"];
// type InsightRow = Database["public"]["Tables"]["lead_ai_insights"]["Row"]; // Removido temporariamente

export type LeadRecord = LeadRow & {
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  estado?: string | null;
  page_slug?: string | null;
};

const logger = createLogger("lead:intel");

export type LeadIntelResult = {
  intent: "alta" | "media" | "baixa";
  urgency: "alta" | "media" | "baixa";
  risk: "alto" | "medio" | "baixo";
  score: number;
  desired_color?: string | null;
  desired_sex?: string | null;
  desired_city?: string | null;
  desired_timeframe?: string | null;
  budget_inferred?: string | null;
  emotional_tone?: string | null;
  suggested_puppies: { puppy_id: string; name: string; reason: string }[];
  matched_puppy_id?: string | null;
  alerts: string[];
  next_step: string;
  insights: Record<string, unknown>;
};

type PuppySuggestion = { puppy_id: string; name: string; reason: string };

const AI_RESPONSE_SCHEMA = z.object({
  intent: z.enum(["alta", "media", "baixa"]).optional(),
  urgency: z.enum(["alta", "media", "baixa"]).optional(),
  desired_color: z.string().max(120).optional(),
  desired_sex: z.string().max(60).optional(),
  desired_city: z.string().max(120).optional(),
  desired_timeframe: z.string().max(120).optional(),
  budget_inferred: z.string().max(120).optional(),
  emotional_tone: z.string().max(60).optional(),
  alerts: z.array(z.string().max(240)).optional().default([]),
  next_step: z.string().max(300).optional(),
  score: z.number().min(0).max(100).optional(),
  recommendations: z
    .array(
      z.object({
        name: z.string().max(120).optional(),
        traits: z.string().max(200).optional(),
        reason: z.string().max(240).optional(),
      }),
    )
    .optional(),
});

const COLORS = ["branco", "creme", "preto", "laranja", "particolor", "sable", "chocolate", "azul"];
const SEX_MAP: Record<string, string> = { macho: "macho", machos: "macho", fêmea: "femea", femea: "femea", femeas: "femea" };
const CACHE_TTL_MS = 5 * 60 * 1000;
const runtimeCache = new Map<string, { expiresAt: number; data: any }>();

const OPENAI_ENDPOINT = process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_LEAD_MODEL?.trim() || "gpt-4o-mini";

function normalize(text?: string | null) {
  return (text ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
}

function detectIntent(message: string): "alta" | "media" | "baixa" {
  if (/comprar|fechar|quanto|pre[cç]o|dispon[ií]vel|fechando/.test(message)) return "alta";
  if (/ver|saber|info|informac|video|detalhe/.test(message)) return "media";
  return "baixa";
}

function detectUrgency(message: string): "alta" | "media" | "baixa" {
  if (/hoje|agora|imediat|urgente|essa semana/.test(message)) return "alta";
  if (/30 dias|mes|pr[óo]ximo mes|duas semanas/.test(message)) return "media";
  return "baixa";
}

function detectBudget(message: string) {
  const match = message.match(/(\d{3,6})/);
  return match ? `~R$ ${match[1]}` : null;
}

function detectEmotion(message: string) {
  if (/amei|lindo|perfeito|quero|ansioso/.test(message)) return "entusiasmado";
  if (/duvida|pensando|avaliando|talvez/.test(message)) return "indeciso";
  if (/caro|receio|medo|preocupado/.test(message)) return "cético";
  return "neutro";
}

function extractColor(message: string) {
  return COLORS.find((color) => message.includes(color)) ?? null;
}

function extractSex(message: string) {
  return Object.entries(SEX_MAP).find(([key]) => message.includes(key))?.[1] ?? null;
}

function extractCity(message: string) {
  const match = message.match(/(sao paulo|sp|campinas|braganca|rio de janeiro|rj|bh|belo horizonte)/);
  return match?.[0] ?? null;
}

function extractTimeframe(message: string) {
  if (/imediat|agora|hoje/.test(message)) return "imediato";
  if (/(30|45|60) dias|pr[óo]ximo mes/.test(message)) return "30-60 dias";
  if (/ano que vem|futuro|sem pressa/.test(message)) return "longo prazo";
  return null;
}

function clampScore(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function parseBudget(value?: string | null) {
  if (!value) return null;
  const numeric = Number(value.replace(/\D/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric;
}

function riskFromScore(score: number): "alto" | "medio" | "baixo" {
  if (score >= 70) return "baixo";
  if (score >= 50) return "medio";
  return "alto";
}

function normalizeStatus(status?: string | null) {
  const value = normalize(status);
  if (["available", "disponivel"].includes(value)) return "available";
  if (["reserved", "reservado"].includes(value)) return "reserved";
  if (["sold", "vendido"].includes(value)) return "sold";
  return value || "available";
}

function recommendPuppies(puppies: PuppyRow[], prefs: { color?: string | null; sex?: string | null; city?: string | null; budget?: number | null }): {
  suggestions: PuppySuggestion[];
  matched: string | null;
} {
  const scored = puppies
    .filter((p) => normalizeStatus(p.status) === "available")
    .map((p) => {
      let score = 0;
      const reasons: string[] = [];

      if (prefs.color && normalize(p.color) === normalize(prefs.color)) {
        score += 30;
        reasons.push("Cor desejada");
      }
      if (prefs.sex && normalize(p.sexo) === normalize(prefs.sex)) {
        score += 20;
        reasons.push("Sexo desejado");
      }
      if (prefs.city && normalize(p.city) === normalize(prefs.city)) {
        score += 15;
        reasons.push("Cidade próxima");
      }
      if (prefs.budget && typeof p.price_cents === "number") {
        const total = p.price_cents / 100;
        const diff = Math.abs(total - prefs.budget);
        if (diff <= prefs.budget * 0.1) {
          score += 15;
          reasons.push("Preço alinhado");
        } else if (total > (prefs.budget ?? 0)) {
          score += 5;
          reasons.push("Possível upsell");
        }
      }
      if (reasons.length === 0) {
        score += 10;
        reasons.push("Compatibilidade geral");
      }

      return { puppy: p, score, reason: reasons.join(", ") };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const suggestions = scored.map((entry) => ({ puppy_id: entry.puppy.id, name: entry.puppy.name ?? "Filhote", reason: entry.reason }));
  return { suggestions, matched: suggestions[0]?.puppy_id ?? null };
}

function buildPrompt(lead: LeadRecord) {
  const summary = [lead.nome, lead.cidade, lead.estado, lead.cor_preferida, lead.sexo_preferido].filter(Boolean).join(" • ");
  return `Você é um especialista de vendas B2C. Analise o lead abaixo e responda em JSON puro.
Lead:
Nome: ${lead.nome ?? ""}
Resumo: ${summary}
Mensagem: ${lead.mensagem ?? ""}
Página: ${lead.page ?? lead.page_slug ?? "desconhecida"}

Responda seguindo este formato:
{"intent":"alta|media|baixa","urgency":"alta|media|baixa","desired_color":"...","desired_sex":"...","desired_city":"...","desired_timeframe":"...","budget_inferred":"...","emotional_tone":"...","alerts":["..."],"next_step":"...","score":0-100}`;
}

async function callOpenAi(lead: LeadRecord) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Você ajuda o time comercial a priorizar leads." },
          { role: "user", content: buildPrompt(lead) },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      logger.warn("openai_lead_intel_failed", { status: res.status, detail });
      return null;
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return null;
    let raw: unknown;
    try {
      raw = JSON.parse(content);
    } catch (error) {
      logger.warn("openai_lead_intel_invalid_json", { error: String(error), content });
      return null;
    }
    const parsed = AI_RESPONSE_SCHEMA.safeParse(raw);
    if (!parsed.success) {
      logger.warn("openai_lead_intel_invalid_payload", { issues: parsed.error.flatten() });
      return null;
    }
    return parsed.data;
  } catch (error) {
    logger.warn("openai_lead_intel_error", { error: String(error) });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function heuristicsFromLead(lead: LeadRecord) {
  const text = normalize(
    [lead.nome, lead.cor_preferida, lead.sexo_preferido, lead.cidade, lead.estado, lead.mensagem, lead.page, lead.page_slug]
      .filter(Boolean)
      .join(" "),
  );

  const intent = detectIntent(text);
  const urgency = detectUrgency(text);
  const desired_color = extractColor(text);
  const desired_sex = extractSex(text);
  const desired_city = extractCity(text);
  const desired_timeframe = extractTimeframe(text);
  const budget_inferred = detectBudget(text);
  const emotional_tone = detectEmotion(text);
  const score = clampScore(intent === "alta" ? 70 : intent === "media" ? 50 : 30) + (urgency === "alta" ? 20 : urgency === "media" ? 10 : 0);

  return {
    intent,
    urgency,
    desired_color,
    desired_sex,
    desired_city,
    desired_timeframe,
    budget_inferred,
    emotional_tone,
    score: clampScore(score),
  };
}

export async function analyzeLead(
  lead: LeadRecord,
  options: { puppies?: PuppyRow[] } = {},
): Promise<LeadIntelResult> {
  const heuristics = heuristicsFromLead(lead);
  const ai = await callOpenAi(lead);

  const mergedScore = clampScore(ai?.score ?? heuristics.score);
  const risk = riskFromScore(mergedScore);
  const alerts = new Set<string>(ai?.alerts ?? []);
  if (risk === "alto") alerts.add("Risco de perda alto: tente contato imediato.");
  if (heuristics.urgency === "alta") alerts.add("Alta urgência: responder em minutos.");

  const nextStep = ai?.next_step ?? "Responder em até 30 minutos com fotos/vídeo do melhor match.";

  const prefs = {
    color: ai?.desired_color ?? heuristics.desired_color ?? lead.cor_preferida ?? null,
    sex: ai?.desired_sex ?? heuristics.desired_sex ?? lead.sexo_preferido ?? null,
    city: ai?.desired_city ?? heuristics.desired_city ?? lead.cidade ?? null,
    budget: parseBudget(ai?.budget_inferred ?? heuristics.budget_inferred ?? lead.preferencia ?? null),
  };

  const puppies = options.puppies ?? [];
  const recommendation = recommendPuppies(puppies, prefs);

  return {
    intent: ai?.intent ?? heuristics.intent,
    urgency: ai?.urgency ?? heuristics.urgency,
    risk,
    score: mergedScore,
    desired_color: ai?.desired_color ?? heuristics.desired_color ?? lead.cor_preferida ?? null,
    desired_sex: ai?.desired_sex ?? heuristics.desired_sex ?? lead.sexo_preferido ?? null,
    desired_city: ai?.desired_city ?? heuristics.desired_city ?? lead.cidade ?? null,
    desired_timeframe: ai?.desired_timeframe ?? heuristics.desired_timeframe ?? null,
    budget_inferred: ai?.budget_inferred ?? heuristics.budget_inferred ?? lead.preferencia ?? null,
    emotional_tone: ai?.emotional_tone ?? heuristics.emotional_tone ?? null,
    suggested_puppies: recommendation.suggestions,
    matched_puppy_id: recommendation.matched,
    alerts: Array.from(alerts),
    next_step: nextStep,
    insights: {
      mensagem_resumida: lead.mensagem,
      origem: lead.page ?? lead.page_slug ?? null,
      ai_provider: ai ? "openai" : "heuristic",
    },
  };
}

function cacheKeyFromLead(lead: LeadRecord) {
  const hash = createHash("sha1").update(`${lead.id}:${lead.updated_at ?? lead.created_at ?? ""}:${lead.mensagem ?? ""}`).digest("hex");
  return `lead-intel:${lead.id}:${hash}`;
}

function getRuntimeCache(key: string) {
  const entry = runtimeCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    runtimeCache.delete(key);
    return null;
  }
  return entry.data;
}

function setRuntimeCache(key: string, data: any) {
  runtimeCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function processLeadIntel(leadId: string, force = false) {
  const sb = supabaseAdmin();

  const { data: existing } = await sb.from("lead_ai_insights").select("*").eq("lead_id", leadId).maybeSingle();
  if (existing && !force) {
    setRuntimeCache(`lead-intel:${leadId}`, existing);
    return existing;
  }

  const { data: lead } = await sb
    .from("leads")
    .select("id,nome,telefone,cidade,estado,cor_preferida,sexo_preferido,mensagem,created_at,updated_at,page,page_slug")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) throw new Error("Lead não encontrado");

  const leadRecord = lead as LeadRecord;
  const runtimeKey = cacheKeyFromLead(leadRecord);
  if (!force) {
    const cached = getRuntimeCache(runtimeKey);
    if (cached) return cached;
  }

  const { data: puppies } = await sb
    .from("puppies")
    .select("id,name,color,sex,price_cents,city,state,status")
    .limit(100);

  const intel = await analyzeLead(leadRecord, { puppies: (puppies ?? []) as PuppyRow[] });

  const payload = {
    lead_id: leadId,
    intent: intel.intent,
    urgency: intel.urgency,
    risk: intel.risk,
    score: intel.score,
    desired_color: intel.desired_color,
    desired_sex: intel.desired_sex,
    desired_city: intel.desired_city,
    desired_timeframe: intel.desired_timeframe,
    budget_inferred: intel.budget_inferred,
    emotional_tone: intel.emotional_tone,
    matched_puppy_id: intel.matched_puppy_id,
    suggested_puppies: intel.suggested_puppies,
    alerts: intel.alerts,
    next_step: intel.next_step,
    insights: intel.insights,
    processed_at: new Date().toISOString(),
  };

  const { data: upserted, error } = await sb.from("lead_ai_insights").upsert(payload, { onConflict: "lead_id" }).select().maybeSingle();
  if (error) {
    logger.error("lead_intel_persist_failed", { leadId, error: error.message });
    throw error;
  }

  const stored = upserted ?? (payload as any);
  setRuntimeCache(runtimeKey, stored);
  logger.info("lead_intel_generated", { leadId, score: stored.score, intent: stored.intent, matched: stored.matched_puppy_id });
  return stored;
}
