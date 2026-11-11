/**
 * Status de lead — fonte unica.
 *
 * O banco de producao guarda o status num tipo enumerado (lead_status) que so
 * aceita estes cinco valores. Qualquer outro valor numa consulta ou gravacao
 * devolve erro 22P02 e derruba a tela inteira, entao quem filtra ou grava
 * status de lead passa por aqui.
 *
 * O painel antigo usava "em_contato" e "fechado", que nunca existiram em
 * producao. Eles ficam so como apelidos de leitura, para links antigos nao
 * quebrarem.
 */

export const LEAD_STATUS = ["novo", "contatado", "qualificado", "convertido", "perdido"] as const;

export type LeadStatus = (typeof LEAD_STATUS)[number];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  qualificado: "Qualificado",
  convertido: "Convertido",
  perdido: "Perdido",
};

const APELIDOS: Record<string, LeadStatus> = {
  em_contato: "contatado",
  "em contato": "contatado",
  contato: "contatado",
  fechado: "convertido",
  ganho: "convertido",
  venda: "convertido",
  descartado: "perdido",
};

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUS as readonly string[]).includes(value);
}

/** Le qualquer grafia e devolve um dos cinco valores. Vazio ou desconhecido vira "novo". */
export function normalizeLeadStatus(value?: string | null): LeadStatus {
  const limpo = (value ?? "").trim().toLowerCase();
  if (!limpo) return "novo";
  if (isLeadStatus(limpo)) return limpo;
  return APELIDOS[limpo] ?? "novo";
}

/** Converte para um valor que o banco aceita, ou null quando a entrada nao e um status. */
export function toDbLeadStatus(value?: string | null): LeadStatus | null {
  const limpo = (value ?? "").trim().toLowerCase();
  if (!limpo) return null;
  if (isLeadStatus(limpo)) return limpo;
  return APELIDOS[limpo] ?? null;
}

/** Um lead "aguarda primeiro contato" enquanto o status for Novo. */
export function isAwaitingFirstContact(value?: string | null): boolean {
  return normalizeLeadStatus(value) === "novo";
}
