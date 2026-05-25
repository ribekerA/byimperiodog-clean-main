import { buildArticleLD } from "@/lib/schemas/article";
import { buildBreadcrumbLD } from "@/lib/schemas/breadcrumb";
import { buildFAQPageLD } from "@/lib/schemas/faq";
import { buildProductLD } from "@/lib/schemas/product";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type BlogRow = {
  id: string;
  slug?: string | null;
  title?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  meta_description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  faq?: any;
};

type PuppyRow = {
  id: string;
  name?: string | null;
  slug?: string | null;
  color?: string | null;
  gender?: string | null;
  status?: string | null;
  price_cents?: number | null;
  descricao?: string | null;
  city?: string | null;
  state?: string | null;
};

type LeadRow = {
  id: string;
  page_slug?: string | null;
  page?: string | null;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  created_at?: string | null;
};

export type SeoIssue = {
  severity: "low" | "medium" | "high";
  kind: "meta" | "content" | "technical" | "opportunity";
  page: {
    slug: string;
    label: string;
    type: "blog" | "puppy" | "catalog" | "other";
  };
  message: string;
  suggestion?: string;
};

export type AutopilotSeoResult = {
  issues: SeoIssue[];
  keywordOpportunities: string[];
  pagesRankedByInterest: { slug: string; label: string; hits: number }[];
  generatedMeta: {
    slug: string;
    title: string;
    description: string;
    kind: "blog" | "puppy";
  }[];
  generatedHeadings: { slug: string; headings: string[]; kind: "blog" | "puppy" }[];
  generatedFaqs: { slug: string; faqs: { question: string; answer: string }[]; kind: "blog" | "city" | "puppy" }[];
  suggestedPosts: { title: string; description: string; keywords: string[] }[];
  actions: string[];
  manualRecommendations: string[];
  jsonld: { slug: string; kind: "article" | "product" | "breadcrumb" | "faq"; payload: Record<string, unknown> }[];
};

async function safeSelect<T>(table: string, columns: string) {
  try {
    const { data } = await supabaseAdmin().from(table).select(columns);
    return (data ?? []) as T[];
  } catch {
    return [] as T[];
  }
}

export async function runAutopilotSeo(): Promise<AutopilotSeoResult> {
  const [posts, puppies, leads] = await Promise.all([
    safeSelect<BlogRow>("blog_posts", "id,slug,title,seo_title,seo_description,meta_description,category,tags,faq"),
    safeSelect<PuppyRow>("puppies", "id,name,slug,color,gender,status,price_cents,descricao,city,state"),
    safeSelect<LeadRow>("leads", "id,page_slug,page,cor_preferida,sexo_preferido,created_at").then((rows) =>
      rows.filter((l) => !!l.page || !!l.page_slug),
    ),
  ]);

  const issues: SeoIssue[] = [];
  const generatedMeta: AutopilotSeoResult["generatedMeta"] = [];
  const generatedHeadings: AutopilotSeoResult["generatedHeadings"] = [];
  const generatedFaqs: AutopilotSeoResult["generatedFaqs"] = [];
  const suggestedPosts: AutopilotSeoResult["suggestedPosts"] = [];
  const actions: string[] = [];
  const manualRecommendations: string[] = [];
  const jsonld: AutopilotSeoResult["jsonld"] = [];

  posts.forEach((p) => {
    const slug = p.slug || `blog-${p.id}`;
    const label = p.title || slug;
    if (!p.seo_title || p.seo_title.trim().length < 30) {
      issues.push({
        severity: "high",
        kind: "meta",
        page: { slug, label, type: "blog" },
        message: "Falta title otimizado no post.",
        suggestion: `Use um title mais específico: "${label} | By Império Dog"`,
      });
      generatedMeta.push({
        slug,
        title: `${label} | By Império Dog`,
        description: p.seo_description || p.meta_description || `Guia completo sobre ${label}.`,
        kind: "blog",
      });
    }
    const desc = p.seo_description || p.meta_description;
    if (!desc || desc.length < 80) {
      issues.push({
        severity: "medium",
        kind: "meta",
        page: { slug, label, type: "blog" },
        message: "Meta description ausente ou curta.",
        suggestion: `Explique benefício + CTA em 150-160 chars para "${label}".`,
      });
    }

    const headings = [
      `Guia completo sobre ${label}`,
      `Como escolher ${label}`,
      `Preços, entrega e garantia de ${label}`,
    ];
    generatedHeadings.push({ slug, headings, kind: "blog" });
    const faqs = [
      { question: `Qual o valor médio de ${label}?`, answer: "Depende de cor, linhagem e disponibilidade atual." },
      { question: `Como comprar ${label}?`, answer: "Fale no WhatsApp, receba vídeo ao vivo e feche com contrato digital." },
    ];
    generatedFaqs.push({ slug, faqs, kind: "blog" });

    jsonld.push({
      slug,
      kind: "article",
      payload: buildArticleLD({
        title: p.seo_title || p.title || label,
        description: desc || `Tudo sobre ${label}`,
        url: `https://www.byimperiodog.com.br/blog/${slug}`,
        datePublished: new Date().toISOString(),
        authorName: "By Império Dog",
      }),
    });
  });

  puppies.forEach((p) => {
    const slug = p.slug || `puppy-${p.id}`;
    const label = p.name || slug;
    if (!p.descricao || p.descricao.trim().length < 60) {
      issues.push({
        severity: "medium",
        kind: "content",
        page: { slug, label, type: "puppy" },
        message: "Descrição do filhote curta ou ausente.",
        suggestion: "Inclua temperamento, cor, entrega e garantia para melhorar CTR.",
      });
    }
    if (!p.slug) {
      issues.push({
        severity: "high",
        kind: "technical",
        page: { slug, label, type: "puppy" },
        message: "Slug ausente impede indexação correta.",
        suggestion: "Defina um slug único (ex.: spitz-cream-macho-sp) e atualize o sitemap.",
      });
    }
    if (!p.price_cents) {
      issues.push({
        severity: "medium",
        kind: "opportunity",
        page: { slug, label, type: "puppy" },
        message: "Preço não informado reduz intenção de compra.",
        suggestion: "Adicione preço ou faixa para melhorar CTR e conversão.",
      });
    }

    generatedHeadings.push({
      slug,
      headings: [
        `${label}: detalhes, saúde e entrega`,
        `Condições para ${p.city || "sua região"}`,
        `Por que escolher este ${p.color ?? ""} (${p.gender ?? ""})`,
      ],
      kind: "puppy",
    });
    const faqs = [
      { question: "Como funciona a entrega?", answer: "Entrega combinada com acompanhamento e contrato digital." },
      { question: "Quais vacinas estão em dia?", answer: "Vacinas e vermífugo conforme carteira enviada na compra." },
    ];
    generatedFaqs.push({ slug, faqs, kind: "puppy" });

    jsonld.push({
      slug,
      kind: "product",
      payload: buildProductLD({
        // Campos obrigatórios de Puppy
        id: p.id,
        slug: p.slug ?? p.id,
        name: p.name ?? "Filhote",
        breed: "Spitz Alemão Anão",
        color: (p.color as any) ?? "creme",
        sex: (p.gender as "male" | "female") ?? "male",
        birthDate: new Date(),
        size: "mini",
        title: p.name ?? "Filhote",
        description: p.descricao ?? "",
        priceCents: p.price_cents ?? 0,
        currency: "BRL",
        status: (p.status as any) ?? "available",
        isHighlighted: false,
        isFeatured: false,
        isBestSeller: false,
        isNewArrival: false,
        seoKeywords: [],
        hasPedigree: false,
        vaccinationStatus: "up-to-date",
        hasMicrochip: false,
        reviewCount: 0,
        averageRating: 0,
        viewCount: 0,
        favoriteCount: 0,
        shareCount: 0,
        inquiryCount: 0,
        source: "own-breeding",
        createdAt: new Date(),
        updatedAt: new Date(),
        // Campos opcionais
        availableForShipping: true,
        city: (p.city as any) ?? "sao-paulo",
        state: p.state ?? "SP",
        images: [],
      }),
    });
    jsonld.push({
      slug,
      kind: "breadcrumb",
      payload: buildBreadcrumbLD([
        { name: "Home", href: "/" },
        { name: "Filhotes", href: "/filhotes" },
        { name: label, href: `/filhotes/${slug}` },
      ]) || {},
    });
    jsonld.push({
      slug,
      kind: "faq",
      payload: buildFAQPageLD(faqs.map((f) => ({ question: f.question, answer: f.answer }))) || {},
    });
  });

  const leadsBySlug = new Map<string, number>();
  leads.forEach((l) => {
    const key = (l.page_slug || l.page || "desconhecido").toString();
    leadsBySlug.set(key, (leadsBySlug.get(key) ?? 0) + 1);
  });
  const pagesRankedByInterest = Array.from(leadsBySlug.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([slug, hits]) => {
      const label =
        posts.find((p) => p.slug === slug)?.title ||
        puppies.find((p) => p.slug === slug)?.name ||
        slug;
      return { slug, label, hits };
    });

  if (pagesRankedByInterest.length === 0) {
    issues.push({
      severity: "low",
      kind: "opportunity",
      page: { slug: "catalog", label: "Catálogo", type: "catalog" },
      message: "Nenhum lead mapeado por slug; verifique captura de page_slug no funil.",
      suggestion: "Persistir page_slug/page nos leads para alimentar SEO automático.",
    });
  }

  const keywords = new Map<string, number>();
  leads.forEach((l) => {
    const color = l.cor_preferida?.toLowerCase().trim();
    const sex = l.sexo_preferido?.toLowerCase().trim();
    if (color) keywords.set(`spitz ${color}`, (keywords.get(`spitz ${color}`) ?? 0) + 1);
    if (sex) keywords.set(`spitz ${sex}`, (keywords.get(`spitz ${sex}`) ?? 0) + 1);
  });
  const keywordOpportunities = Array.from(keywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k]) => k);

  pagesRankedByInterest.forEach((p) => {
    if ((leadsBySlug.get(p.slug) ?? 0) < 2) {
      issues.push({
        severity: "low",
        kind: "opportunity",
        page: { slug: p.slug, label: p.label, type: "blog" },
        message: "Página recebe poucos leads; reescreva persona/benefício.",
      });
    }
  });

  const postSuggestions = keywordOpportunities.slice(0, 5).map((kw) => ({
    title: `Spitz ${kw}: guia completo`,
    description: `Tudo sobre Spitz ${kw}: preço, entrega e cuidados. Conteúdo otimizado para intenção de compra.`,
    keywords: [kw, "spitz anão", "lulu da pomerânia"],
  }));
  suggestedPosts.push(...postSuggestions);

  actions.push("Gerar e aplicar titles/meta em posts sem otimização.");
  actions.push("Gerar FAQ e JSON-LD em páginas de filhotes com descrição curta.");
  if (keywordOpportunities.length > 0) {
    actions.push(`Criar posts para keywords: ${keywordOpportunities.slice(0, 3).join(", ")}.`);
  }
  manualRecommendations.push("Validar persona/tom nas páginas com poucos leads antes de publicar mudanças.");
  manualRecommendations.push("Revisar preço e disponibilidade nos produtos antes de reaplicar JSON-LD.");

  return {
    issues,
    keywordOpportunities,
    pagesRankedByInterest,
    generatedMeta,
    generatedHeadings,
    generatedFaqs,
    suggestedPosts,
    actions,
    manualRecommendations,
    jsonld,
  };
}

export async function applyAutopilotSeo() {
  const result = await runAutopilotSeo();
  const sb = supabaseAdmin();

  for (const meta of result.generatedMeta) {
    if (meta.kind === "blog") {
      await sb
        .from("blog_posts")
        .update({
          seo_title: meta.title,
          seo_description: meta.description,
          meta_description: meta.description,
        })
        .eq("slug", meta.slug);
    } else {
      await sb.from("puppies").update({ seo_title: meta.title, seo_description: meta.description }).eq("slug", meta.slug);
    }
  }

  for (const faq of result.generatedFaqs) {
    if (faq.kind === "blog") {
      await sb.from("blog_posts").update({ faq: faq.faqs }).eq("slug", faq.slug);
    } else if (faq.kind === "puppy") {
      await sb.from("puppies").update({ faq: faq.faqs }).eq("slug", faq.slug);
    }
  }

  try {
    await sb.from("seo_history").insert({
      action: "autopilot_apply",
      details: result,
      created_at: new Date().toISOString(),
    });
  } catch {
    // tabela pode não existir; ignore
  }

  return result;
}
