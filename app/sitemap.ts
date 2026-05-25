import type { MetadataRoute } from "next";

import { staticPuppies } from "@/content/puppies-static";
import { guides } from "@/content/guides";
import { ALL_COLORS, ALL_SEXES } from "@/lib/catalog-utils";
import { supabaseAnon } from "@/lib/supabaseAnon";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
const NOW = new Date().toISOString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ─── Core pages ──────────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,                       lastModified: NOW, changeFrequency: "daily",   priority: 1.00 },
    { url: `${SITE_URL}/filhotes`,               lastModified: NOW, changeFrequency: "daily",   priority: 0.95 },
    { url: `${SITE_URL}/sobre`,                  lastModified: NOW, changeFrequency: "monthly", priority: 0.80 },
    { url: `${SITE_URL}/contato`,                lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },
    { url: `${SITE_URL}/faq-do-tutor`,           lastModified: NOW, changeFrequency: "monthly", priority: 0.80 },
    { url: `${SITE_URL}/blog`,                   lastModified: NOW, changeFrequency: "daily",   priority: 0.90 },
    { url: `${SITE_URL}/guias`,                  lastModified: NOW, changeFrequency: "weekly",  priority: 0.85 },
    { url: `${SITE_URL}/reserve-seu-filhote`,    lastModified: NOW, changeFrequency: "monthly", priority: 0.70 },

    // ─── Raça / informacional ─────────────────────────────────────────────────
    { url: `${SITE_URL}/spitz-alemao`,           lastModified: NOW, changeFrequency: "monthly", priority: 0.92 },
    { url: `${SITE_URL}/lulu-da-pomerania`,      lastModified: NOW, changeFrequency: "monthly", priority: 0.92 },
    { url: `${SITE_URL}/spitz-alemao-preto`,     lastModified: NOW, changeFrequency: "monthly", priority: 0.88 },
    { url: `${SITE_URL}/spitz-alemao-baby-face`, lastModified: NOW, changeFrequency: "monthly", priority: 0.88 },
    { url: `${SITE_URL}/filhote-de-spitz-alemao`,lastModified: NOW, changeFrequency: "monthly", priority: 0.88 },

    // ─── Intenção comercial ───────────────────────────────────────────────────
    { url: `${SITE_URL}/preco-spitz-anao`,                  lastModified: NOW, changeFrequency: "monthly", priority: 0.92 },
    { url: `${SITE_URL}/comprar-spitz-anao`,                lastModified: NOW, changeFrequency: "monthly", priority: 0.92 },
    { url: `${SITE_URL}/criador-spitz-confiavel`,           lastModified: NOW, changeFrequency: "monthly", priority: 0.90 },

    // ─── SEO local ────────────────────────────────────────────────────────────
    { url: `${SITE_URL}/lulu-da-pomerania-braganca-paulista`,  lastModified: NOW, changeFrequency: "monthly", priority: 0.88 },
    { url: `${SITE_URL}/canil-spitz-alemao-interior-sp`,       lastModified: NOW, changeFrequency: "monthly", priority: 0.88 },
    { url: `${SITE_URL}/filhotes/sao-paulo`,                   lastModified: NOW, changeFrequency: "weekly",  priority: 0.85 },
    { url: `${SITE_URL}/filhotes/minas-gerais`,                lastModified: NOW, changeFrequency: "weekly",  priority: 0.82 },
    { url: `${SITE_URL}/filhotes/rio-de-janeiro`,              lastModified: NOW, changeFrequency: "weekly",  priority: 0.82 },

    // ─── Legais ───────────────────────────────────────────────────────────────
    { url: `${SITE_URL}/politica-de-privacidade`, lastModified: NOW, changeFrequency: "yearly",  priority: 0.30 },
    { url: `${SITE_URL}/termos-de-uso`,           lastModified: NOW, changeFrequency: "yearly",  priority: 0.30 },
  ];

  // ─── Individual puppy pages ──────────────────────────────────────────────────
  const puppyPages: MetadataRoute.Sitemap = staticPuppies.map((p) => ({
    url: `${SITE_URL}/filhotes/${p.slug}`,
    lastModified: NOW,
    changeFrequency: "weekly" as const,
    priority: p.status === "available" ? 0.85 : 0.45,
  }));

  // ─── Color landing pages ─────────────────────────────────────────────────────
  const colorPages: MetadataRoute.Sitemap = ALL_COLORS.map((cor) => ({
    url: `${SITE_URL}/filhotes/cor/${cor}`,
    lastModified: NOW,
    changeFrequency: "weekly" as const,
    priority: 0.80,
  }));

  // ─── Sex landing pages ───────────────────────────────────────────────────────
  const sexPages: MetadataRoute.Sitemap = ALL_SEXES.map((sexo) => ({
    url: `${SITE_URL}/filhotes/sexo/${sexo}`,
    lastModified: NOW,
    changeFrequency: "weekly" as const,
    priority: 0.78,
  }));

  // ─── Guide pages (static) ────────────────────────────────────────────────────
  const guidePages: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${SITE_URL}/guias/${g.slug}`,
    lastModified: g.updatedAt ?? g.publishedAt,
    changeFrequency: "monthly" as const,
    priority: 0.68,
  }));

  // ─── Blog posts from Supabase (dynamic) ──────────────────────────────────────
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const db = supabaseAnon();
    const { data: posts } = await db
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(500);

    if (posts && Array.isArray(posts)) {
      blogPages = posts.map((post: any) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updated_at ?? post.published_at ?? NOW,
        changeFrequency: "weekly" as const,
        priority: 0.72,
      }));
    }
  } catch {
    // Supabase unavailable at build time — blog posts omitted from sitemap
    // Sitemap is regenerated on each request so this is transient
  }

  return [
    ...staticPages,
    ...puppyPages,
    ...colorPages,
    ...sexPages,
    ...guidePages,
    ...blogPages,
  ];
}
