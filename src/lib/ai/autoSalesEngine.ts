import "server-only";

import { analyzeLead, type LeadIntelResult, type LeadRecord } from "@/lib/leadIntel";
import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateWhatsAppMessage, type WhatsAppMessageTone } from "@/lib/whatsapp";
import type { Database } from "@/types/supabase";

const logger = createLogger("autosales:engine");

export type AutoSalesStepType = "intro" | "follow_up_light" | "follow_up_strong" | "follow_up_final";

type PuppyRow = Database["public"]["Tables"]["puppies"]["Row"];
type SequenceRow = Database["public"]["Tables"]["autosales_sequences"]["Row"];

type AutoSalesPlanStep = {
  type: AutoSalesStepType;
  delayMinutes: number;
  label: string;
  tone: WhatsAppMessageTone;
  reminder?: string;
};

export type AutoSalesStrategy = {
  tone: WhatsAppMessageTone;
  urgency: LeadIntelResult["urgency"];
  score: number;
  steps: AutoSalesPlanStep[];
  fallbackAfterMinutes: number;
  fallbackReason: string;
  objections: string[];
  triggers: string[];
  primaryPuppyId: string | null;
  createdAt: string;
};

type AutoSalesMetrics = {
  conversionByMessage: Record<AutoSalesStepType, { sent: number; converted: number }>;
  preferenceImpact: { color?: string | null; sex?: string | null };
  objections: string[];
  totalMessagesSent: number;
};

const STEP_VARIANT_INDEX: Record<AutoSalesStepType, number | "message"> = {
  intro: "message",
  follow_up_light: 1,
  follow_up_strong: 2,
  follow_up_final: 5,
};

const OBJECTION_PATTERNS: Record<string, RegExp> = {
  price: /(pre[çc]o|valor|investimento|caro|parcel)/i,
  trust: /(golpe|fraude|seguro|confiar|garantia)/i,
  time: /(prazo|tempo|entrega|agenda|urg[êe]ncia)/i,
  logistics: /(frete|envio|transporte|dist[âa]ncia|viagem)/i,
  health: /(vacina|sa[úu]de|doen|teste)/i,
};

const OBJECTION_RESPONSES: Record<string, string> = {
  price: "Detalho o investimento completo, incluindo acompanhamento vitalício e preparo exclusivo.",
  trust: "Enviamos contrato, referências e todo o histórico de cuidado para segurança total.",
  time: "Organizo agenda premium no melhor horário para você e mantenho você atualizada em tempo real.",
  logistics: "Coordenamos transporte com motorista parceiro e checklist de conforto para o filhote.",
  health: "Compartilho exames, vacinas e cronograma veterinário para eliminar qualquer dúvida de saúde.",
};

const LEAD_COLUMNS = [
  "id",
  "nome",
  "first_name",
  "cidade",
  "estado",
  "telefone",
  "phone",
  "mensagem",
  "cor_preferida",
  "sexo_preferido",
  "preferencia",
  "page",
  "page_slug",
  "created_at",
  "updated_at",
].join(",");

export async function createAutoSalesSequence(
  leadId: string,
  options: { bypassHuman?: boolean } = {},
) {
  const sb = supabaseAdmin();
  const { data: lead, error: leadError } = await sb.from("leads").select(LEAD_COLUMNS).eq("id", leadId).maybeSingle();
  if (leadError) throw leadError;
  if (!lead) throw new Error("Lead nao encontrado");

  const { data: puppies } = await sb
    .from("puppies")
    .select("id,name,color,sex,price_cents,status")
    .or("status.eq.available,status.is.null")
    .limit(25);

  const intel = await analyzeLead(lead as LeadRecord, { puppies: (puppies ?? []) as PuppyRow[] });
  const strategy = buildStrategy(lead as LeadRecord, intel);
  const firstStep = strategy.steps[0];
  const now = new Date();
  const nextRunAt = !options.bypassHuman && firstStep ? addMinutes(now, firstStep.delayMinutes).toISOString() : null;

  const payload = {
    lead_id: leadId,
    puppy_id: strategy.primaryPuppyId,
    tone: strategy.tone,
    urgency: strategy.urgency,
    status: options.bypassHuman ? "manual" : firstStep ? "scheduled" : "completed",
    next_step: options.bypassHuman ? null : firstStep?.type ?? null,
    next_run_at: nextRunAt,
    step_index: 0,
    total_steps: strategy.steps.length,
    fallback_required: options.bypassHuman ? true : false,
    fallback_reason: options.bypassHuman ? "Bypass humano solicitado" : strategy.fallbackReason,
    bypass_human: options.bypassHuman ?? false,
    metrics: buildInitialMetrics(intel, strategy.objections),
    strategy,
  } satisfies Database["public"]["Tables"]["autosales_sequences"]["Insert"];

  const { data: sequence, error } = await sb
    .from("autosales_sequences")
    .upsert(payload, { onConflict: "lead_id" })
    .select()
    .maybeSingle();
  if (error) throw error;
  logger.info("autosales_sequence_created", { leadId, sequenceId: sequence?.id, bypass: options.bypassHuman });
  return { sequence, strategy };
}

export async function executeAutoSalesStep(sequenceId: string) {
  const sb = supabaseAdmin();
  const { data: sequence, error } = await sb
    .from("autosales_sequences")
    .select("*")
    .eq("id", sequenceId)
    .maybeSingle();
  if (error) throw error;
  if (!sequence) throw new Error("Sequencia nao encontrada");
  if (sequence.status !== "scheduled") return sequence;

  const strategy = parseStrategy(sequence.strategy);
  const step = strategy.steps[sequence.step_index];
  if (!step) {
    await closeSequence(sequence.id, strategy, { reason: "completed" });
    return sequence;
  }

  const lead = await fetchLead(sequence.lead_id);
  const puppy = sequence.puppy_id ? await fetchPuppy(sequence.puppy_id) : null;

  const message = buildStepMessage({
    step,
    lead,
    puppy,
    strategy,
  });

  await sb.from("autosales_logs").insert({
    sequence_id: sequence.id,
    lead_id: sequence.lead_id,
    puppy_id: sequence.puppy_id,
    message_type: step.type,
    content: message.message,
    cta_link: message.ctaLink,
    metadata: message.metadata,
    objections: strategy.objections,
    sent_at: new Date().toISOString(),
    status: "queued",
  });

  const metrics = updateMetrics(sequence.metrics as AutoSalesMetrics | null, step.type);

  const nextIndex = sequence.step_index + 1;
  const nextStep = strategy.steps[nextIndex];
  const status = nextStep ? "scheduled" : strategy.fallbackAfterMinutes ? "needs_human" : "completed";
  const fallbackRequired = !nextStep && !sequence.bypass_human && strategy.fallbackAfterMinutes > 0;

  await sb
    .from("autosales_sequences")
    .update({
      step_index: nextIndex,
      next_step: nextStep?.type ?? null,
      next_run_at: nextStep ? addMinutes(new Date(), nextStep.delayMinutes).toISOString() : null,
      status,
      fallback_required: fallbackRequired,
      fallback_reason: fallbackRequired ? strategy.fallbackReason : sequence.fallback_reason,
      last_message_type: step.type,
      last_message_sent_at: new Date().toISOString(),
      metrics,
    })
    .eq("id", sequence.id);

  logger.info("autosales_step_executed", { sequenceId: sequence.id, step: step.type, status });
  return { sequenceId: sequence.id, step: step.type, status };
}

export async function processAutoSalesQueue(limit = 10) {
  const sb = supabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("autosales_sequences")
    .select("id")
    .eq("status", "scheduled")
    .lte("next_run_at", now)
    .limit(limit);
  if (error) throw error;
  const sequences = data ?? [];
  for (const seq of sequences) {
    try {
      await executeAutoSalesStep(seq.id);
    } catch (err) {
      logger.error("autosales_step_failed", { sequenceId: seq.id, error: String(err) });
    }
  }
  return sequences.length;
}

export async function markAutoSalesHuman(sequenceId: string) {
  const sb = supabaseAdmin();
  await sb
    .from("autosales_sequences")
    .update({
      status: "manual",
      next_step: null,
      next_run_at: null,
      fallback_required: false,
    })
    .eq("id", sequenceId);
}

function buildStrategy(lead: LeadRecord, intel: LeadIntelResult): AutoSalesStrategy {
  const tone = mapTone(intel.emotional_tone);
  const urgency = intel.urgency ?? "media";
  const primaryPuppyId = intel.matched_puppy_id ?? intel.suggested_puppies[0]?.puppy_id ?? null;
  const delays = urgency === "alta" ? [0, 45, 180, 420] : urgency === "media" ? [0, 120, 360, 720] : [0, 240, 720, 1440];

  const steps: AutoSalesPlanStep[] = [
    { type: "intro", delayMinutes: delays[0], label: "Primeiro contato", tone },
    { type: "follow_up_light", delayMinutes: delays[1], label: "Follow-up leve", tone },
    {
      type: "follow_up_strong",
      delayMinutes: delays[2],
      label: "Follow-up forte",
      tone: tone === "premium" ? "consultivo" : tone,
      reminder: "Reforcar autoridade + prova social",
    },
    {
      type: "follow_up_final",
      delayMinutes: delays[3],
      label: "Follow-up final",
      tone: "objetivo",
      reminder: "Adicionar urgencia real e passo de pagamento",
    },
  ];

  const fallbackAfterMinutes = urgency === "alta" ? 540 : 1440;
  const objections = detectObjections(lead.mensagem);
  const triggers = buildTriggers(intel, objections);

  return {
    tone,
    urgency,
    score: intel.score,
    steps,
    fallbackAfterMinutes,
    fallbackReason: "Sequencia automatizada concluida sem resposta.",
    objections,
    triggers,
    primaryPuppyId,
    createdAt: new Date().toISOString(),
  };
}

function buildInitialMetrics(intel: LeadIntelResult, objections: string[]): AutoSalesMetrics {
  return {
    conversionByMessage: emptyMetrics().conversionByMessage,
    preferenceImpact: {
      color: intel.desired_color ?? null,
      sex: intel.desired_sex ?? null,
    },
    objections,
    totalMessagesSent: 0,
  };
}

function buildStepMessage({
  step,
  lead,
  puppy,
  strategy,
}: {
  step: AutoSalesPlanStep;
  lead: LeadRecord;
  puppy: PuppyRow | null;
  strategy: AutoSalesStrategy;
}) {
  const waPayload = generateWhatsAppMessage(
    { nome: lead.nome, first_name: lead.first_name, cidade: lead.cidade, estado: lead.estado },
    {
      name: puppy?.name ?? "Spitz exclusivo",
      color: puppy?.color ?? strategy.triggers.find((t) => t.startsWith("cor:"))?.split(":")[1] ?? lead.cor_preferida ?? null,
      sex: puppy?.sexo ?? strategy.triggers.find((t) => t.startsWith("sexo:"))?.split(":")[1] ?? lead.sexo_preferido ?? null,
      price_cents: puppy?.price_cents ?? undefined,
    },
    step.tone,
  );

  const variant = pickVariant(waPayload.message, waPayload.variations, step.type);
  const objectionKey = strategy.objections[0];
  const objectionSnippet = objectionKey ? OBJECTION_RESPONSES[objectionKey] : null;
  const message = objectionSnippet ? `${variant} ${objectionSnippet}` : variant;

  return {
    message,
    ctaLink: waPayload.ctaLink,
    metadata: {
      baseStrategy: waPayload.strategy,
      variationType: step.type,
      reminder: step.reminder,
      triggers: strategy.triggers,
    },
  };
}

function pickVariant(defaultMessage: string, variations: string[], step: AutoSalesStepType) {
  const index = STEP_VARIANT_INDEX[step];
  if (index === "message") return defaultMessage;
  return variations[index] ?? defaultMessage;
}

function detectObjections(message?: string | null) {
  if (!message) return [];
  const found = new Set<string>();
  for (const [key, pattern] of Object.entries(OBJECTION_PATTERNS)) {
    if (pattern.test(message)) found.add(key);
  }
  return Array.from(found);
}

function buildTriggers(intel: LeadIntelResult, objections: string[]) {
  return [
    intel.urgency === "alta" ? "urgencia:alta" : null,
    intel.desired_color ? `cor:${intel.desired_color}` : null,
    intel.desired_sex ? `sexo:${intel.desired_sex}` : null,
    intel.score >= 70 ? "prioridade:vip" : "prioridade:nutrir",
    objections.length ? `objection:${objections[0]}` : null,
  ].filter(Boolean) as string[];
}

function mapTone(emotionalTone?: string | null): WhatsAppMessageTone {
  if (!emotionalTone) return "premium";
  if (emotionalTone === "entusiasmado") return "premium";
  if (emotionalTone === "indeciso") return "consultivo";
  if (emotionalTone === "cético") return "objetivo";
  return "premium";
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function parseStrategy(strategy: unknown): AutoSalesStrategy {
  if (strategy && typeof strategy === "object" && "steps" in (strategy as Record<string, unknown>)) {
    return strategy as AutoSalesStrategy;
  }
  throw new Error("Strategy nao configurada para AutoSalesEngine");
}

function updateMetrics(current: AutoSalesMetrics | null, step: AutoSalesStepType): AutoSalesMetrics {
  const next = current ? structuredClone(current) : emptyMetrics();
  next.conversionByMessage[step].sent += 1;
  next.totalMessagesSent += 1;
  return next;
}

function emptyMetrics(): AutoSalesMetrics {
  return {
    conversionByMessage: {
      intro: { sent: 0, converted: 0 },
      follow_up_light: { sent: 0, converted: 0 },
      follow_up_strong: { sent: 0, converted: 0 },
      follow_up_final: { sent: 0, converted: 0 },
    },
    preferenceImpact: {},
    objections: [],
    totalMessagesSent: 0,
  };
}

async function fetchLead(leadId: string) {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("leads").select(LEAD_COLUMNS).eq("id", leadId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Lead nao encontrado");
  return data as LeadRecord;
}

async function fetchPuppy(puppyId: string) {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("puppies")
    .select("id,name,color,sex,price_cents,status")
    .eq("id", puppyId)
    .maybeSingle();
  return (data as PuppyRow) ?? null;
}

async function closeSequence(sequenceId: string, strategy: AutoSalesStrategy, meta: { reason: string }) {
  const sb = supabaseAdmin();
  await sb
    .from("autosales_sequences")
    .update({
      status: meta.reason === "completed" ? "completed" : "needs_human",
      next_step: null,
      next_run_at: null,
      fallback_required: meta.reason !== "completed",
      fallback_reason: meta.reason !== "completed" ? strategy.fallbackReason : null,
    })
    .eq("id", sequenceId);
}
