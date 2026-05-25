/**
 * OperationGuardAI
 * Verifica consistência de dados (filhotes e leads) e sugere ações corretivas.
 */

type PuppyGuardInput = {
  id: string;
  name: string;
  price_cents?: number | null;
  images?: string[] | null;
  status?: string | null; // available|reserved|sold|coming_soon
  lead_count?: number | null;
};

type LeadGuardInput = {
  id: string;
  nome?: string | null;
  telefone?: string | null;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  slug?: string | null; // filhote relacionado, se houver
};

type GuardIssue = {
  type: "alert" | "auto" | "block";
  message: string;
  target: "puppy" | "lead";
  id: string;
  action?: string;
};

export type GuardReport = {
  issues: GuardIssue[];
  hasBlocking: boolean;
};

export function runOperationGuard(puppies: PuppyGuardInput[], leads: LeadGuardInput[]): GuardReport {
  const issues: GuardIssue[] = [];

  // Filhote sem preço
  puppies.forEach((p) => {
    if (!p.price_cents || p.price_cents <= 0) {
      issues.push({
        type: "block",
        target: "puppy",
        id: p.id,
        message: `Filhote "${p.name}" sem preço definido.`,
        action: "Definir preço antes de publicar.",
      });
    }
    // Filhote sem foto
    const hasImage = p.images && p.images.length > 0;
    if (!hasImage) {
      issues.push({
        type: "alert",
        target: "puppy",
        id: p.id,
        message: `Filhote "${p.name}" sem foto.`,
        action: "Adicionar pelo menos 1 foto.",
      });
    }
    // Status inconsistente
    if (!p.status || !["available", "reserved", "sold", "coming_soon"].includes(p.status)) {
      issues.push({
        type: "alert",
        target: "puppy",
        id: p.id,
        message: `Status inconsistente para "${p.name}".`,
        action: "Ajustar para available/reserved/sold/coming_soon.",
      });
    }
  });

  // Lead duplicado (mesmo telefone) e sem cor/sexo
  const phoneMap = new Map<string, string[]>();
  leads.forEach((l) => {
    const phone = (l.telefone || "").replace(/\D/g, "");
    if (phone) {
      const arr = phoneMap.get(phone) ?? [];
      arr.push(l.id);
      phoneMap.set(phone, arr);
      if (arr.length > 1) {
        issues.push({
          type: "alert",
          target: "lead",
          id: l.id,
          message: `Lead duplicado pelo telefone (${phone}).`,
          action: "Consolidar ou marcar como duplicado.",
        });
      }
    }
    if (!l.cor_preferida) {
      issues.push({
        type: "auto",
        target: "lead",
        id: l.id,
        message: `Lead sem cor informada.`,
        action: "Tentar inferir cor via IA ou perguntar no follow-up.",
      });
    }
    if (!l.sexo_preferido) {
      issues.push({
        type: "auto",
        target: "lead",
        id: l.id,
        message: `Lead sem sexo desejado.`,
        action: "Tentar inferir via IA ou perguntar no follow-up.",
      });
    }
  });

  // Overbooking: muitos leads para o mesmo filhote
  const slugCount = new Map<string, number>();
  leads.forEach((l) => {
    if (l.slug) {
      slugCount.set(l.slug, (slugCount.get(l.slug) ?? 0) + 1);
    }
  });
  slugCount.forEach((count, slug) => {
    if (count >= 5) {
      issues.push({
        type: "alert",
        target: "puppy",
        id: slug,
        message: `Possível overbooking: ${count} leads associados ao mesmo filhote (${slug}).`,
        action: "Revisar disponibilidade ou criar lista de espera.",
      });
    }
  });

  const hasBlocking = issues.some((i) => i.type === "block");
  return { issues, hasBlocking };
}
