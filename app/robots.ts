import type { MetadataRoute } from "next";

/**
 * Áreas privadas. Precisa ser repetido em CADA grupo — não é redundância.
 *
 * Pelo RFC 9309, o robô obedece a UM único grupo: o do user-agent mais
 * específico que casa com ele, e ignora `*` por completo. Os grupos de IA aqui
 * tinham só `Allow: /`, sem disallow nenhum, então GPTBot, ClaudeBot,
 * PerplexityBot, CCBot e Pinterest estavam explicitamente autorizados a
 * rastrear /contract/ (contratos de clientes), /admin/ e /blog/preview/ —
 * justamente o que o grupo `*` bloqueia. Liberar o site para IA nunca quis
 * dizer liberar os contratos.
 */
const AREAS_PRIVADAS = [
  "/admin/",         // Painel admin — privado
  "/api/admin/",     // API admin — privada
  "/blog/preview/",  // Rascunhos de blog
  "/contract/",      // Contratos — privado
  // /obrigado e /search saíram do Disallow de propósito: as duas já
  // enviam `robots: noindex` no HTML. URL bloqueada por robots.txt não
  // chega a ser rastreada, então o Google nunca lê o noindex e pode
  // indexar só a URL. Deixar rastrear é o que faz o noindex valer.
];

/** Grupo padrão: rastreia o site público, não entra nas áreas privadas. */
function liberado(userAgent: string) {
  return { userAgent, allow: "/", disallow: AREAS_PRIVADAS };
}

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");

  return {
    rules: [
      // ── Buscadores e crawlers gerais ──────────────────────────────────────
      // Vale para todo robô que não tenha grupo próprio abaixo, incluindo os
      // crawlers de IA que ainda não existem hoje: o padrão é rastrear o site
      // público e ficar fora das áreas privadas.
      liberado("*"),

      // ── Busca tradicional ─────────────────────────────────────────────────
      // Explícitos porque `*` também casaria, mas deixar Googlebot e Bingbot
      // declarados torna a regra legível para quem audita o arquivo — e o Bing
      // é a base do índice usado pelo Copilot.
      liberado("Googlebot"),
      liberado("Googlebot-Image"),
      liberado("Bingbot"),

      // ── Crawlers de BUSCA com IA ──────────────────────────────────────────
      // Estes alimentam resposta com citação e link. São o que interessa para
      // aparecer como fonte.
      liberado("OAI-SearchBot"),     // índice de busca do ChatGPT
      liberado("ChatGPT-User"),      // busca disparada pelo usuário no ChatGPT
      liberado("PerplexityBot"),     // índice de busca da Perplexity
      liberado("Perplexity-User"),   // busca disparada pelo usuário
      liberado("Claude-SearchBot"),  // índice de busca do Claude
      liberado("Claude-User"),       // busca disparada pelo usuário no Claude

      // ── Crawlers de TREINAMENTO / grounding ───────────────────────────────
      // Separados de propósito: são outra decisão de negócio. Hoje estão
      // liberados porque conteúdo do canil em base de modelo ajuda a marca a
      // ser lembrada; bloquear qualquer um destes NÃO tira o site da busca com
      // IA, que depende dos grupos de cima.
      liberado("GPTBot"),            // treinamento OpenAI
      liberado("Google-Extended"),   // Gemini / grounding do AI Overviews
      liberado("ClaudeBot"),         // treinamento Anthropic
      liberado("anthropic-ai"),
      liberado("CCBot"),             // Common Crawl — insumo de vários modelos
      liberado("Applebot-Extended"),

      // Pinterest crawler — importante para tráfego de redes sociais
      liberado("Pinterest"),

      // ── Bots indesejados (scrapers agressivos) ────────────────────────────
      { userAgent: "AhrefsBot",          disallow: "/" },
      { userAgent: "SemrushBot",         disallow: "/" },
      { userAgent: "DotBot",             disallow: "/" },
      { userAgent: "MJ12bot",            disallow: "/" },
    ],
    // Índice de sitemaps (aponta para /sitemap.xml, /sitemaps/posts.xml,
    // /sitemaps/images.xml e /sitemaps/videos.xml).
    sitemap: [`${base}/sitemap-index.xml`, `${base}/sitemap.xml`],
    host: base,
  };
}
