

export type AdvisorStatusSuggestion = "novo" | "em_conversa" | "followup" | "quase_fechado" | "fechado" | "perdido";
export type AdvisorPriorityLevel = "alta" | "media" | "baixa";
export type AdvisorMessageStyle = "fast" | "polite" | "persuasive";

export type AdvisorPuppy = {
  id: string;
  name: string;
  color?: string | null;
  sex?: string | null;
  reason?: string | null;
};

export type LeadAdvisorInput = {
  id: string;
  name?: string | null;
  status?: string | null;
  city?: string | null;
  state?: string | null;
  preferredColor?: string | null;
  preferredSex?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  message?: string | null;
  aiScore?: number | null;
  aiIntent?: string | null;
  aiUrgency?: string | null;
  matchedPuppy?: AdvisorPuppy | null;
  suggestedPuppies?: AdvisorPuppy[] | null;
};

export type AdvisorCompatibility = {
  score: number;
  label: string;
  summary: string;
  puppyName?: string;
};

export type AdvisorMessage = {
  id: AdvisorMessageStyle;
  label: string;
  text: string;
};

export type AdvisorPriority = {
  level: AdvisorPriorityLevel;
  score: number;
  reason: string;
};

export type AdvisorStatus = {
  suggestion: AdvisorStatusSuggestion;
  label: string;
  reason: string;
};

export type AdvisorLossPrevention = {
  isCold: boolean;
  hoursSinceUpdate: number;
  summary: string;
  reactivationMessage: string;
};

export type LeadAdvisorSnapshot = {
  compatibility: AdvisorCompatibility;
  messages: AdvisorMessage[];
  priority: AdvisorPriority;
  status: AdvisorStatus;
  loss: AdvisorLossPrevention;
};

const STATUS_LABELS: Record<AdvisorStatusSuggestion, string> = {
  novo: "Novo",
  em_conversa: "Em conversa",
  followup: "Follow-up",
  quase_fechado: "Quase fechado",
  fechado: "Fechado",
  perdido: "Perdido",
};

const clampScore = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const HOURS_48 = 48;
const HOURS_24 = 24;
const HOURS_8 = 8;

const diffInHours = (from?: string | null, to = new Date()) => {
  const baseMs = from ? Date.parse(from) : NaN;
  if (Number.isNaN(baseMs)) return HOURS_24;
  const diff = to.getTime() - baseMs;
  return Math.max(0, Math.round(diff / 36e5));
};

const toFirstName = (name?: string | null) => {
  if (!name) return "";
  return name.split(" ")[0] ?? "";
};

const normalize = (value?: string | null) => (value ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();

const contains = (value: string, tokens: string[]) => tokens.some((token) => value.includes(token));

function buildCompatibility(input: LeadAdvisorInput, baseScore: number): AdvisorCompatibility {
  const puppy = input.matchedPuppy ?? input.suggestedPuppies?.[0] ?? null;
  const puppyName = puppy?.name;
  const summary = puppyName
    ? `Este lead tem maior chance de fechar com ${puppyName}.`
    : "Este lead tem compatibilidade alta com os filhotes disponiveis.";
  const label = baseScore >= 80 ? "Alta chance" : baseScore >= 55 ? "Boa chance" : "Baixa chance";
  return { score: baseScore, summary, label, puppyName };
}

function buildMessages(input: LeadAdvisorInput, compatibility: AdvisorCompatibility): AdvisorMessage[] {
  const firstName = toFirstName(input.name) || "tudo bem";
  const contextColor = input.preferredColor ? ` na cor ${input.preferredColor}` : "";
  const puppyName = compatibility.puppyName ? ` o ${compatibility.puppyName}` : " um Spitz da nossa ninhada";
  const cityLine = input.city ? ` Entregamos em ${input.city} sem burocracia.` : " Temos entrega segura para todo Brasil.";
  const base = `Somos da By Imperio Dog e separamos${puppyName}${contextColor}.`;

  return [
    {
      id: "fast",
      label: "Rapido",
      text: `Oi ${firstName}! ${base} Consigo te mandar fotos em minutos, pode ser?`,
    },
    {
      id: "polite",
      label: "Educado",
      text: `Ola ${firstName}, tudo bem? Aqui e a By Imperio Dog. Vi seu interesse em um Spitz${contextColor} e reservei${puppyName} para voce.${cityLine} Posso te enviar detalhes agora?`,
    },
    {
      id: "persuasive",
      label: "Persuasivo",
      text: `Oi ${firstName}! Separei${puppyName} que combina muito com o que voce buscou${contextColor}. Ele(a) esta disponivel hoje e posso garantir condicoes especiais se avancarmos ainda esta semana. Te envio video e valores?`,
    },
  ];
}

function buildPriority(input: LeadAdvisorInput, baseScore: number): AdvisorPriority {
  const urgency = (input.aiUrgency ?? "media").toLowerCase();
  let score = baseScore;
  if (urgency === "alta") score += 10;
  if (contains(normalize(input.message), ["urgente", "hoje", "agora"])) score += 5;
  const hoursSinceCreated = diffInHours(input.createdAt);
  if (hoursSinceCreated < HOURS_8) score += 5;

  let level: AdvisorPriorityLevel = "media";
  if (score >= 80) level = "alta";
  else if (score < 55) level = "baixa";

  const reasonParts = [
    `Score ${score}%`,
    urgency === "alta" ? "urgencia alta" : undefined,
    hoursSinceCreated < HOURS_8 ? "lead recente" : undefined,
  ].filter(Boolean);

  return {
    level,
    score,
    reason: reasonParts.join(" | ") || "Prioridade automatica",
  };
}

function buildStatusSuggestion(input: LeadAdvisorInput, priority: AdvisorPriority): AdvisorStatus {
  const normalizedStatus = normalize(input.status);
  if (normalizedStatus === "fechado") {
    return { suggestion: "fechado", label: STATUS_LABELS.fechado, reason: "Status ja finalizado." };
  }
  if (normalizedStatus === "perdido") {
    return { suggestion: "perdido", label: STATUS_LABELS.perdido, reason: "Lead marcado como perdido." };
  }

  const hoursSinceUpdate = diffInHours(input.updatedAt ?? input.createdAt);
  if (priority.level === "alta" && (input.matchedPuppy || priority.score >= 85)) {
    return {
      suggestion: "quase_fechado",
      label: STATUS_LABELS.quase_fechado,
      reason: "Score alto e filhote reservado.",
    };
  }
  if (hoursSinceUpdate <= HOURS_8) {
    return {
      suggestion: "em_conversa",
      label: STATUS_LABELS.em_conversa,
      reason: "Contato recente (menos de 8h).",
    };
  }
  if (hoursSinceUpdate > HOURS_24) {
    return {
      suggestion: "followup",
      label: STATUS_LABELS.followup,
      reason: `Sem resposta ha ${hoursSinceUpdate}h.`,
    };
  }
  return {
    suggestion: "novo",
    label: STATUS_LABELS.novo,
    reason: "Lead aguardando primeiro contato.",
  };
}

function buildLossPrevention(input: LeadAdvisorInput, status: AdvisorStatus): AdvisorLossPrevention {
  const hoursSinceUpdate = diffInHours(input.updatedAt ?? input.createdAt);
  const isCold = hoursSinceUpdate >= HOURS_48 && status.suggestion !== "fechado" && status.suggestion !== "perdido";
  const summary = isCold ? `Lead sem resposta ha ${hoursSinceUpdate}h.` : "Lead ainda dentro da janela esperada.";
  const reactivationMessage = `Oi ${toFirstName(input.name)}! Temos ${input.preferredColor ? `um Spitz ${input.preferredColor}` : "o filhote ideal"} reservado para voce e posso garantir as mesmas condicoes por mais 24h. Me da um ok para te enviar novidades?`;
  return { isCold, hoursSinceUpdate, summary, reactivationMessage };
}

export function buildLeadAdvisor(input: LeadAdvisorInput): LeadAdvisorSnapshot {
  const baseScore = clampScore(input.aiScore ?? 50);
  const compatibility = buildCompatibility(input, baseScore);
  const messages = buildMessages(input, compatibility);
  const priority = buildPriority(input, compatibility.score);
  const status = buildStatusSuggestion(input, priority);
  const loss = buildLossPrevention(input, status);

  return {
    compatibility,
    messages,
    priority,
    status,
    loss,
  };
}

export type PrioritySummaryEntry = {
  count: number;
  leads: { id: string; name: string; score: number; summary: string }[];
};

export type LeadPrioritySummary = Record<AdvisorPriorityLevel, PrioritySummaryEntry>;

export function summarizePriorities(items: { id: string; name: string; advisor: LeadAdvisorSnapshot }[]): LeadPrioritySummary {
  const summary: LeadPrioritySummary = {
    alta: { count: 0, leads: [] },
    media: { count: 0, leads: [] },
    baixa: { count: 0, leads: [] },
  };

  items.forEach(({ id, name, advisor }) => {
    const bucket = summary[advisor.priority.level];
    bucket.count += 1;
    bucket.leads.push({ id, name: name || "Lead", score: advisor.compatibility.score, summary: advisor.compatibility.summary });
  });

  Object.values(summary).forEach((entry) => {
    entry.leads = entry.leads
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  });

  return summary;
}
