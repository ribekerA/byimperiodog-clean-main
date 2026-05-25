import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LeadRow = {
  id: string;
  created_at: string;
  status?: string | null;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
};

type PuppyRow = {
  id: string;
  name?: string | null;
  slug?: string | null;
  status?: string | null;
  created_at?: string | null;
  price_cents?: number | null;
  midia?: { url: string }[] | null;
};

export type PriorityTask = {
  title: string;
  detail: string;
  priority: number;
  type: "lead" | "puppy" | "upsell" | "routine";
};

function daysBetween(created?: string | null) {
  if (!created) return 0;
  return (Date.now() - new Date(created).getTime()) / (1000 * 60 * 60 * 24);
}

export async function generatePriorityTasks(): Promise<PriorityTask[]> {
  const sb = supabaseAdmin();

  const [leads, puppies] = await Promise.all([
    sb
      .from("leads")
      .select("id,created_at,status,cor_preferida,sexo_preferido")
      .gte("created_at", new Date(Date.now() - 90 * 86400 * 1000).toISOString()),
    sb.from("puppies").select("id,name,slug,status,created_at,price_cents,midia"),
  ]);

  const tasks: PriorityTask[] = [];

  const leadsArr = (leads.data ?? []) as LeadRow[];
  const puppiesArr = (puppies.data ?? []) as PuppyRow[];

  // 1) Leads com risco de perda: status novo/pendente
  leadsArr
    .filter((l) => !l.status || l.status === "novo" || l.status === "pendente")
    .slice(0, 20)
    .forEach((l) => {
      tasks.push({
        title: `Responder lead ${l.id}`,
        detail: `Lead novo em ${new Date(l.created_at).toLocaleString("pt-BR")}. Cor/sexo: ${l.cor_preferida || "—"}/${l.sexo_preferido || "—"}.`,
        priority: 100,
        type: "lead",
      });
    });

  // 2) Filhotes com risco de encalhar: >45d disponíveis ou sem foto/preço
  puppiesArr
    .filter((p) => (p.status || "available") === "available")
    .forEach((p) => {
      const ageDays = daysBetween(p.created_at);
      const noPhoto = !p.midia || p.midia.length === 0;
      const noPrice = !p.price_cents || p.price_cents <= 0;
      let priority = 0;
      if (ageDays > 90) priority = 95;
      else if (ageDays > 60) priority = 85;
      else if (ageDays > 45) priority = 75;
      if (noPhoto || noPrice) priority = Math.max(priority, 80);
      if (priority > 0) {
        tasks.push({
          title: `Destravar filhote ${p.name || p.slug || p.id}`,
          detail: `Disponível há ${Math.round(ageDays)}d${noPhoto ? " sem foto" : ""}${noPrice ? " sem preço" : ""}.`,
          priority,
          type: "puppy",
        });
      }
    });

  // 3) Filhotes mais buscados (pelos leads)
  const leadCountBySlug = new Map<string, number>();
  leadsArr.forEach((l) => {
    const slug = l.id; // fallback: if not available we skip
    if (!slug) return;
  });
  // se houver page_slug/page seria melhor; aqui usamos leads totais para ranking de follow-up
  const topLeads = leadsArr.slice(0, 10);
  topLeads.forEach((l) =>
    tasks.push({
      title: `Priorizar follow-up lead ${l.id}`,
      detail: `Lead recente com interesse em ${l.cor_preferida || "cor indefinida"}.`,
      priority: 60,
      type: "lead",
    }),
  );

  // 4) Oportunidades de upsell: filhotes premium (preço > mediana)
  const prices = puppiesArr.map((p) => p.price_cents || 0).filter(Boolean).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)] || 0;
  puppiesArr
    .filter((p) => (p.status || "available") === "available" && (p.price_cents || 0) > median * 1.2)
    .forEach((p) => {
      tasks.push({
        title: `Oferecer upsell: ${p.name || p.slug || p.id}`,
        detail: `Preço premium. Apresentar benefícios extras (garantia, entrega, pedigree).`,
        priority: 55,
        type: "upsell",
      });
    });

  // 5) Tarefas de rotina
  tasks.push({
    title: "Revisar tracking/pixels",
    detail: "Checar eventos de conversão e page_view diários.",
    priority: 20,
    type: "routine",
  });
  tasks.push({
    title: "Atualizar blog/SEO",
    detail: "Publicar conteúdo de cor em alta e cidade em alta.",
    priority: 25,
    type: "routine",
  });

  // Ordena por prioridade desc
  return tasks.sort((a, b) => b.priority - a.priority);
}
