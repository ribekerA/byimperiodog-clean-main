type LeadMinimal = {
  id: string;
  status?: string | null;
  created_at?: string | null;
  cor_preferida?: string | null;
  color?: string | null;
};

type IntelMinimal = {
  risk?: string | null;
};

const RARE_COLORS = ["particolor", "sable", "blue merle", "exotic"];

function normalize(text?: string | null) {
  return (text ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
}

export function computeLeadRisk(
  lead: LeadMinimal,
  intel?: IntelMinimal | null,
): { score: number; level: "baixo" | "medio" | "alto"; reason: string; action: string } {
  let score = 40;
  const reasons: string[] = [];

  // Idade do lead
  if (lead.created_at) {
    const created = new Date(lead.created_at).getTime();
    const hours = (Date.now() - created) / 3_600_000;
    if (hours > 72) {
      score += 40;
      reasons.push("Sem resposta há >72h");
    } else if (hours > 48) {
      score += 25;
      reasons.push("Sem resposta há >48h");
    } else if (hours > 24) {
      score += 15;
      reasons.push("Sem resposta há >24h");
    } else if (hours > 12) {
      score += 8;
      reasons.push("Sem resposta há >12h");
    }
  }

  // Status
  const status = lead.status ?? "novo";
  if (status === "fechado") {
    score = 5;
    reasons.push("Lead fechado");
  } else if (status === "em_contato") {
    score -= 5;
    reasons.push("Em contato");
  } else if (status === "perdido") {
    score = 80;
    reasons.push("Marcado como perdido");
  } else if (status === "novo") {
    score += 5;
    reasons.push("Lead novo sem contato");
  }

  // Cor rara aumenta risco de perda por escassez
  const color = normalize(lead.cor_preferida) || normalize(lead.color);
  if (color && RARE_COLORS.some((c) => color.includes(c))) {
    score += 8;
    reasons.push("Cor rara: atenção rápida");
  }

  // Sinal da IA (se existir)
  if (intel?.risk === "alto") {
    score += 15;
    reasons.push("IA sinalizou risco alto");
  } else if (intel?.risk === "medio") {
    score += 5;
    reasons.push("IA sinalizou risco médio");
  } else if (intel?.risk === "baixo") {
    score -= 5;
    reasons.push("IA sinalizou risco baixo");
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  let level: "baixo" | "medio" | "alto" = "baixo";
  if (score >= 70) level = "alto";
  else if (score >= 40) level = "medio";

  const action =
    level === "alto"
      ? "Responder agora com fotos/vídeo e proposta objetiva."
      : level === "medio"
        ? "Enviar follow-up em 30–60 min e perguntar prazo."
        : "Continuar fluxo normal.";

  const reasonText = reasons.join(" • ") || "Sem fatores de risco relevantes";

  return { score, level, reason: reasonText, action };
}
