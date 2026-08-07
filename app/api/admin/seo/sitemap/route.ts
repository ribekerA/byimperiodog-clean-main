import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { blogRepo } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_ORIGIN ||
  "https://byimperiodog.com.br";

const STATIC_URLS = [
  { loc: `${ORIGIN}/`, changefreq: "daily", priority: "1.0" },
  { loc: `${ORIGIN}/filhotes`, changefreq: "daily", priority: "0.9" },
  { loc: `${ORIGIN}/blog`, changefreq: "weekly", priority: "0.8" },
  { loc: `${ORIGIN}/contato`, changefreq: "monthly", priority: "0.5" },
  { loc: `${ORIGIN}/sobre`, changefreq: "monthly", priority: "0.4" },
];

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const { items: posts } = await blogRepo.listPosts({ status: "published", limit: 5000 });

  let puppies: Array<{ slug?: string | null; updated_at?: string | null }> = [];
  try {
    const sb = supabaseAdmin();
    const { data } = await sb
      .from("puppies")
      .select("slug,updated_at")
      .eq("status", "available");
    puppies = data || [];
  } catch {}

  const postUrls = posts
    .filter((p) => p.slug)
    .map((p) => ({
      loc: `${ORIGIN}/blog/${p.slug}`,
      lastmod: (p as any).updated_at || (p as any).publishedAt || new Date().toISOString(),
      changefreq: "weekly",
      priority: "0.8",
    }));

  const puppyUrls = puppies
    .filter((p) => p.slug)
    .map((p) => ({
      loc: `${ORIGIN}/filhotes/${p.slug}`,
      lastmod: p.updated_at || new Date().toISOString(),
      changefreq: "daily",
      priority: "0.9",
    }));

  const allUrls = [...STATIC_URLS, ...puppyUrls, ...postUrls];

  return NextResponse.json({
    total: allUrls.length,
    posts: postUrls.length,
    puppies: puppyUrls.length,
    statics: STATIC_URLS.length,
    urls: allUrls.slice(0, 50),
    sitemapUrl: `${ORIGIN}/sitemap.xml`,
  });
}

export async function POST(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const sitemapUrl = `${ORIGIN}/sitemap.xml`;
  try {
    const res = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      { method: "GET", signal: AbortSignal.timeout(8000) },
    );
    return NextResponse.json({ ok: true, pinged: true, status: res.status, sitemapUrl });
  } catch {
    return NextResponse.json({ ok: false, pinged: false, sitemapUrl });
  }
}
