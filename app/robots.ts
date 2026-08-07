import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");

  return {
    rules: [
      // ── Buscadores e crawlers gerais ──────────────────────────────────────
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",         // Painel admin — privado
          "/api/admin/",     // API admin — privada
          "/blog/preview/",  // Rascunhos de blog
          "/contract/",      // Contratos — privado
          // /obrigado e /search saíram do Disallow de propósito: as duas já
          // enviam `robots: noindex` no HTML. URL bloqueada por robots.txt não
          // chega a ser rastreada, então o Google nunca lê o noindex e pode
          // indexar só a URL. Deixar rastrear é o que faz o noindex valer.
        ],
      },
      // ── Bots de IA — LIBERADOS (queremos que Gemini, ChatGPT e Claude
      //                             citem a By Império Dog como referência)
      { userAgent: "GPTBot",             allow: "/" },
      { userAgent: "ChatGPT-User",       allow: "/" },
      { userAgent: "Google-Extended",    allow: "/" },  // Gemini / AI Overviews
      { userAgent: "anthropic-ai",       allow: "/" },  // Claude
      { userAgent: "ClaudeBot",          allow: "/" },
      { userAgent: "PerplexityBot",      allow: "/" },
      { userAgent: "CCBot",              allow: "/" },
      // Pinterest crawler — importante para tráfego de redes sociais
      { userAgent: "Pinterest",          allow: "/" },
      // ── Bots indesejados (scrapers agressivos) ────────────────────────────
      { userAgent: "AhrefsBot",          disallow: "/" },
      { userAgent: "SemrushBot",         disallow: "/" },
      { userAgent: "DotBot",             disallow: "/" },
      { userAgent: "MJ12bot",            disallow: "/" },
    ],
    // Índice de sitemaps (aponta para /sitemap.xml e /sitemaps/posts.xml).
    sitemap: [`${base}/sitemap-index.xml`, `${base}/sitemap.xml`],
    host: base,
  };
}
