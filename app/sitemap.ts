import type { MetadataRoute } from "next";

import { guides } from "@/content/guides";
import { staticPuppies } from "@/content/puppies-static";
import { lastmodFor } from "@/lib/_generated-lastmod";
import { generatedPosts } from "@/lib/_generated-posts";
import { isPublishableSupabasePost } from "@/lib/blog/publishable";
import { ALL_COLORS, ALL_SEXES } from "@/lib/catalog-utils";
import { supabaseAnon } from "@/lib/supabaseAnon";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");

// `lastModified: new Date()` era o valor de TODAS as páginas estáticas daqui.
// Medido em /sitemap.xml: 60+ URLs com o mesmo <lastmod>, igual ao timestamp do
// build — ou seja, cada deploy declarava que o site inteiro havia sido
// reescrito, inclusive quando só mudou CSS. O Google usa lastmod para priorizar
// recrawl e desconsidera o campo do site inteiro quando ele não bate com o que
// vê na página; o sinal deixava de existir justamente para a página que mudou
// de verdade.
//
// Agora a data vem de src/lib/_generated-lastmod.ts, gerado do histórico do git
// (`npm run gen:lastmod`): último commit que tocou o arquivo da rota ou os
// arquivos de conteúdo que ela importa.
//
// `entrada()` omite lastModified quando não há registro. <lastmod> é opcional no
// protocolo — omitir é melhor do que declarar data inventada.
function entrada(
  rota: string,
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly",
  priority: number,
  chaveDeData: string = rota
): MetadataRoute.Sitemap[number] {
  const lastModified = lastmodFor(chaveDeData);
  return {
    url: `${SITE_URL}${rota}`,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ─── Core pages ──────────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    entrada("/",                    "daily",   1.00),
    entrada("/filhotes",            "daily",   0.95),
    entrada("/sobre",               "monthly", 0.80),
    entrada("/contato",             "monthly", 0.75),
    entrada("/faq-do-tutor",        "monthly", 0.80),
    entrada("/blog",                "daily",   0.90),
    entrada("/guias",               "weekly",  0.85),
    entrada("/reserve-seu-filhote", "monthly", 0.70),
    entrada("/ninhadas",            "weekly",  0.70),
    entrada("/galeria",             "monthly", 0.70),
    // /alimentacao, /cuidados e /temperamento ficam de fora de propósito: são
    // o mesmo corpo de texto de /guias/{slug} e apontam o canonical para lá.
    // Sitemap lista URL canônica, não a cópia.
    //
    // /galeria estava fora daqui porque respondia 301 para /filhotes. O 301
    // era um engano do netlify.toml, não uma decisão: a página existe, tem
    // canonical próprio e é para onde o menu aponta. Voltou para a lista.

    // ─── Raça / informacional ─────────────────────────────────────────────────
    entrada("/spitz-alemao",           "monthly", 0.92),
    entrada("/lulu-da-pomerania",      "monthly", 0.92),
    entrada("/pomeranian",             "monthly", 0.90),
    entrada("/spitz-alemao-preto",     "monthly", 0.88),
    entrada("/spitz-alemao-branco",    "monthly", 0.88),
    entrada("/spitz-alemao-baby-face", "monthly", 0.88),
    entrada("/filhote-de-spitz-alemao","monthly", 0.88),

    // ─── Intenção comercial ───────────────────────────────────────────────────
    entrada("/preco-spitz-anao",       "monthly", 0.92),
    entrada("/comprar-spitz-anao",     "monthly", 0.92),
    entrada("/criador-spitz-confiavel","monthly", 0.90),

    // ─── SEO local ────────────────────────────────────────────────────────────
    entrada("/lulu-da-pomerania-braganca-paulista", "monthly", 0.88),
    entrada("/canil-spitz-alemao-interior-sp",      "monthly", 0.88),
    entrada("/filhotes/sao-paulo",                  "weekly",  0.85),
    entrada("/filhotes/minas-gerais",               "weekly",  0.82),
    entrada("/filhotes/rio-de-janeiro",             "weekly",  0.82),

    // ─── Legais ───────────────────────────────────────────────────────────────
    entrada("/politica-de-privacidade", "yearly", 0.30),
    entrada("/termos-de-uso",           "yearly", 0.30),
    entrada("/politica-editorial",      "yearly", 0.30),
  ];

  // ─── Individual puppy pages ──────────────────────────────────────────────────
  // Filhote não tem data própria: o que muda nessas páginas (disponibilidade,
  // preço, fotos) mora em content/puppies-static.ts, então a data do catálogo é
  // a data real delas. Mesma coisa para cor e sexo, que são recortes do mesmo
  // catálogo.
  const puppyPages: MetadataRoute.Sitemap = staticPuppies.map((p) =>
    entrada(`/filhotes/${p.slug}`, "weekly", p.status === "available" ? 0.85 : 0.45, "@puppy")
  );

  // ─── Color landing pages ─────────────────────────────────────────────────────
  const colorPages: MetadataRoute.Sitemap = ALL_COLORS.map((cor) =>
    entrada(`/filhotes/cor/${cor}`, "weekly", 0.80, "@color")
  );

  // ─── Sex landing pages ───────────────────────────────────────────────────────
  const sexPages: MetadataRoute.Sitemap = ALL_SEXES.map((sexo) =>
    entrada(`/filhotes/sexo/${sexo}`, "weekly", 0.78, "@sex")
  );

  // ─── Guide pages (static) ────────────────────────────────────────────────────
  const guidePages: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${SITE_URL}/guias/${g.slug}`,
    lastModified: g.updatedAt ?? g.publishedAt,
    changeFrequency: "monthly" as const,
    priority: 0.68,
  }));

  // ─── Blog posts ──────────────────────────────────────────────────────────────
  // /blog/[slug] serve o MDX de content/posts e recorre ao Supabase para os
  // slugs que só existem no banco. O sitemap só olhava para o Supabase, então
  // os posts que só existem em MDX — a maioria — ficavam de fora e o Google só
  // chegava neles pelos links internos. As duas fontes entram agora, na mesma
  // precedência da rota: o arquivo manda onde existe arquivo, e o Supabase
  // entra apenas quando o post passa em isPublishableSupabasePost. Sem esse
  // filtro o sitemap declarava 6 URLs que respondiam 404.
  const blogBySlug = new Map<string, MetadataRoute.Sitemap[number]>();

  for (const post of generatedPosts) {
    // Sem `?? NOW`: a data do artigo é a do frontmatter. Quando o artigo não
    // declara data, sai sem <lastmod> em vez de herdar o horário do build.
    const lastModified = post.updated ?? post.date ?? undefined;
    blogBySlug.set(post.slug, {
      url: `${SITE_URL}/blog/${post.slug}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.72,
    });
  }

  try {
    const db = supabaseAnon();
    const { data: posts } = await db
      .from("blog_posts")
      .select("slug, updated_at, published_at, status, content_mdx")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(500);

    if (posts && Array.isArray(posts)) {
      for (const post of posts as any[]) {
        if (blogBySlug.has(post.slug)) continue; // já coberto pelo MDX, que é quem a rota serve
        if (!isPublishableSupabasePost(post)) continue;
        const lastModified = post.updated_at ?? post.published_at ?? undefined;
        blogBySlug.set(post.slug, {
          url: `${SITE_URL}/blog/${post.slug}`,
          ...(lastModified ? { lastModified } : {}),
          changeFrequency: "weekly" as const,
          priority: 0.72,
        });
      }
    }
  } catch {
    // Supabase indisponível no build — os posts MDX já garantem cobertura.
  }

  return [
    ...staticPages,
    ...puppyPages,
    ...colorPages,
    ...sexPages,
    ...guidePages,
    ...blogBySlug.values(),
  ];
}
