import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");

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
          "/obrigado",       // Página pós-formulário (sem valor SEO)
          "/search",         // Resultados de busca interna
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
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
