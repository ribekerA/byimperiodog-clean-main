import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LeadRow = {
  id: string;
  created_at: string;
  nome?: string | null;
  telefone?: string | null;
  cidade?: string | null;
  estado?: string | null;
  mensagem?: string | null;
  page?: string | null;
  page_slug?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  referer?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
};

export type FraudAssessment = {
  leadId: string;
  score: number; // 0-100
  reason: string;
  actions: string[];
  badge: "low" | "medium" | "high";
};

function isPhoneSuspicious(phone?: string | null) {
  if (!phone) return true;
  const digits = phone.replace(/\D/g, "");
  return digits.length < 10;
}

function similarity(a: string, b: string) {
  const sa = a.toLowerCase();
  const sb = b.toLowerCase();
  if (!sa || !sb) return 0;
  let match = 0;
  const set = new Set(sb.split(" "));
  sa.split(" ").forEach((w) => {
    if (set.has(w)) match++;
  });
  return match / Math.max(sa.split(" ").length, 1);
}

export async function assessLeadFraud(leadId: string): Promise<FraudAssessment> {
  const sb = supabaseAdmin();
  const { data: lead } = await sb
    .from("leads")
    .select(
      "id,created_at,nome,telefone,cidade,estado,mensagem,page,page_slug,utm_source,utm_medium,referer,ip_address,user_agent"
    )
    .eq("id", leadId)
    .single();

  if (!lead) {
    return { leadId, score: 0, reason: "Lead não encontrado", actions: [], badge: "low" };
  }

  let score = 0;
  const actions: string[] = [];
  const text = (lead.mensagem || "").toLowerCase();

  if (isPhoneSuspicious(lead.telefone)) {
    score += 25;
    actions.push("Telefone incompleto: validar antes de contato.");
  }

  if (lead.utm_source && /competidor|concorrente|scraper/.test(lead.utm_source.toLowerCase())) {
    score += 30;
    actions.push("Fonte suspeita: possível concorrente monitorando preços.");
  }

  if (/teste|curioso|vendo preco|preço/.test(text)) {
    score += 20;
    actions.push("Mensagem sugere curiosidade sem intenção de compra.");
  }

  if (lead.referer && /bot|crawler|preview|localhost/.test(lead.referer.toLowerCase())) {
    score += 15;
    actions.push("Referer indica tráfego não humano ou interno.");
  }

  if (lead.user_agent && /bot|crawler|headless/.test(lead.user_agent.toLowerCase())) {
    score += 20;
    actions.push("User-agent de possível automação.");
  }

  // comportamento repetido do mesmo IP
  if (lead.ip_address) {
    const { data: dup } = await sb
      .from("leads")
      .select("id")
      .eq("ip_address", lead.ip_address)
      .neq("id", lead.id)
      .gte("created_at", new Date(Date.now() - 7 * 86400 * 1000).toISOString());
    if (dup && dup.length > 3) {
      score += 20;
      actions.push(`IP ${lead.ip_address} com múltiplos leads na semana; considerar bloqueio/recaptcha.`);
    }
  }

  // mensagem igual a outras (spam)
  if (lead.mensagem) {
    const { data: similar } = await sb
      .from("leads")
      .select("mensagem")
      .neq("id", lead.id)
      .limit(20);
    const dupMsg = (similar ?? []).some((s: { mensagem?: string | null }) => similarity(s.mensagem || "", lead.mensagem || "") > 0.8);
    if (dupMsg) {
      score += 25;
      actions.push("Mensagem repetida indica spam.");
    }
  }

  const badge: FraudAssessment["badge"] = score >= 60 ? "high" : score >= 30 ? "medium" : "low";

  if (badge === "high") {
    actions.push("Marcar lead como suspeito e ocultar páginas sensíveis.");
    if (lead.ip_address) actions.push(`Avaliar bloqueio do IP ${lead.ip_address}.`);
  }

  return {
    leadId: lead.id,
    score,
    reason: badge === "high" ? "Risco elevado de lead falso/concorrência." : "Risco baixo/médio.",
    actions,
    badge,
  };
}
