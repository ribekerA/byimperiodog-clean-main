// Clusters estratégicos de conteúdo do blog.
// Usado para medir cobertura real comparando títulos/slug publicados.

export interface TopicCluster {
  key: string;            // identificador curto
  title: string;          // nome amigável
  keywords: string[];     // palavras para matching simples (lowercase)
  scope?: "filhote" | "adulto" | "guia-completo";
  weight?: number;        // peso opcional para priorização
}

export const TOPIC_CLUSTERS: TopicCluster[] = [
  { key: "introducao", title: "Introdução à Raça", keywords: ["introducao","overview","sobre a raca","guia spitz"] },
  { key: "historia", title: "História & Origem", keywords: ["historia","origem"] },
  { key: "caracteristicas", title: "Características Físicas", keywords: ["caracteristicas","fisicas","pelagem","tamanho"] },
  { key: "temperamento", title: "Temperamento", keywords: ["temperamento","comportamento"] },
  { key: "desenvolvimento-filhote", title: "Desenvolvimento do Filhote", keywords: ["desenvolvimento","0-2","2-6","6-12","filhote"] },
  { key: "cuidados-essenciais", title: "Cuidados Essenciais", keywords: ["cuidados","rotina","essenciais"] },
  { key: "socializacao", title: "Socialização", keywords: ["socializacao","socialização"] },
  { key: "alimentacao-filhote", title: "Alimentação Filhote", keywords: ["alimentacao filhote","ração filhote","alimentacao filhotes"] },
  { key: "alimentacao-adulto", title: "Alimentação Adulto", keywords: ["alimentacao adulto","racao adulto"] },
  { key: "saude-preventiva", title: "Saúde Preventiva", keywords: ["saude preventiva","vacinas","vermifugacao","verificar saude"] },
  { key: "grooming", title: "Grooming & Pelagem", keywords: ["grooming","pelagem","tosa","escovacao","escovação"] },
  { key: "exercicios", title: "Exercícios & Enriquecimento", keywords: ["exercicios","enriquecimento","mental"] },
  { key: "treinamento", title: "Treinamento Básico", keywords: ["treinamento","adestramento","comandos"] },
  { key: "problemas-comuns", title: "Problemas Comportamentais", keywords: ["latidos","ansiedade","mordidas","problemas comportamentais"] },
  { key: "faq", title: "FAQ", keywords: ["faq","perguntas frequentes"] },
  { key: "recursos-cta", title: "Recursos & CTA", keywords: ["recursos","cta","links internos"] },
  { key: "reproducao", title: "Reprodução & Maturidade", keywords: ["reproducao","cio","maturidade"] },
  { key: "saude-dentaria", title: "Saúde Bucal", keywords: ["dente","dentaria","tartaro","bucal"] },
  { key: "controle-peso", title: "Controle de Peso", keywords: ["peso","obesidade","controle de peso"] },
  { key: "enriquecimento-avancado", title: "Enriquecimento Avançado", keywords: ["puzzle","brinquedos","olfativo"] },
  { key: "cuidados-estacao", title: "Cuidados Sazonais", keywords: ["inverno","verao","verão","calor","frio"] },
  { key: "ansiedade-separacao", title: "Ansiedade de Separação", keywords: ["ansiedade","separacao","separação"] },
  { key: "latidos-excessivos", title: "Latidos Excessivos", keywords: ["latidos","latir","excessivo"] },
  { key: "alimentacao-natural", title: "Alimentação Natural / Dietas", keywords: ["alimentacao natural","dieta","dieta natural","raw"] },
  { key: "saude-articular", title: "Saúde Articular", keywords: ["patela","articular","articulacao","articulação"] },
  { key: "envelhecimento", title: "Envelhecimento & Cuidados Sênior", keywords: ["idoso","senior","envelhecimento"] },
  { key: "viajar", title: "Viagens & Transporte", keywords: ["viagem","transporte","carro"] },
  { key: "seguranca-casa", title: "Segurança em Casa", keywords: ["seguranca","segurança","casa segura"] },
  { key: "primeiros-socorros", title: "Primeiros Socorros", keywords: ["primeiros socorros","emergencia","emergência"] },
  { key: "checklist-escolha", title: "Checklist Escolha/Compra", keywords: ["checklist","escolha","processo","compra"] },
];

export function computeCoverage(posts: { slug?: string; title?: string; status?: string }[]) {
  const published = posts.filter((p) => p.status === "published");
  const coveredKeys = new Set<string>();
  for (const c of TOPIC_CLUSTERS) {
    const kw = c.keywords.map((k) => k.toLowerCase());
    const hit = published.find((p) => {
      const base = `${p.slug ?? ""} ${p.title ?? ""}`;
      const lower = base.toLowerCase();
      return kw.some((k) => lower.includes(k));
    });
    if (hit) coveredKeys.add(c.key);
  }
  const total = TOPIC_CLUSTERS.length;
  const covered = coveredKeys.size;
  const percent = total ? Math.round((covered / total) * 100) : 0;
  return {
    total,
    covered,
    percent,
    missing: TOPIC_CLUSTERS.filter((c) => !coveredKeys.has(c.key)).map((c) => c.title),
  };
}
