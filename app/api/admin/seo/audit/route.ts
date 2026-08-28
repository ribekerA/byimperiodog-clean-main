import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { blogRepo } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AuditIssue = {
  type: "error" | "warning";
  page: string;
  issue: string;
  priority: "Alta" | "Média" | "Baixa";
  fix?: string;
};

function computeScore(errors: number, warnings: number): number {
  const raw = 100 - errors * 12 - warnings * 2;
  return Math.max(0, Math.min(100, raw));
}

function estimateWordCount(text: string): number {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*`_~[\]()>]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const { items: posts } = await blogRepo.listPosts({ status: "published", limit: 1000 });

  // Load redirect map for chain detection
  const redirectMap = new Map<string, string>();
  try {
    const sb = supabaseAdmin();
    const { data: redirects } = await sb
      .from("redirects")
      .select("from_path,to_url")
      .eq("active", true);
    (redirects || []).forEach((r: { from_path: string; to_url: string }) => {
      redirectMap.set(r.from_path, r.to_url);
    });
  } catch {}

  const issues: AuditIssue[] = [];
  const titleMap: Record<string, number> = {};
  const descMap: Record<string, number> = {};

  for (const p of posts) {
    const page = `/blog/${p.slug}`;
    const seoTitle = ((p as any).seo_title || p.title || "").trim();
    const desc = ((p as any).seo?.description || (p as any).seo_description || p.excerpt || "").trim();
    const content = ((p as any).content || "") as string;

    if (seoTitle) titleMap[seoTitle] = (titleMap[seoTitle] ?? 0) + 1;
    if (desc) descMap[desc] = (descMap[desc] ?? 0) + 1;

    // ── Meta description ────────────────────────────────────────────────────────
    if (!desc) {
      issues.push({ type: "error", page, issue: "Meta description faltando", priority: "Alta", fix: "meta" });
    } else if (desc.length < 50) {
      issues.push({ type: "warning", page, issue: `Meta description muito curta (${desc.length} chars — ideal ≥50)`, priority: "Baixa" });
    } else if (desc.length > 160) {
      issues.push({ type: "warning", page, issue: `Meta description muito longa (${desc.length} chars — ideal ≤160)`, priority: "Média" });
    }

    // ── SEO Title length ────────────────────────────────────────────────────────
    if (seoTitle.length > 0 && seoTitle.length < 30) {
      issues.push({ type: "warning", page, issue: `SEO title muito curto (${seoTitle.length} chars — ideal 30-70)`, priority: "Média" });
    } else if (seoTitle.length > 70) {
      issues.push({ type: "warning", page, issue: `SEO title muito longo (${seoTitle.length} chars — ideal ≤70)`, priority: "Média" });
    }

    // ── Alt text da capa ────────────────────────────────────────────────────────
    if ((p as any).coverUrl && !(p as any).coverAlt) {
      issues.push({ type: "warning", page, issue: "Alt text da imagem de capa faltando", priority: "Média", fix: "alt" });
    }

    // ── H1 ──────────────────────────────────────────────────────────────────────
    const hasH1 = /^#\s+.+/m.test(content) || /<h1[\s>]/i.test(content);
    if (!hasH1) {
      issues.push({ type: "warning", page, issue: "Heading H1 faltando no conteúdo", priority: "Média" });
    }

    // ── Word count ──────────────────────────────────────────────────────────────
    const wc = estimateWordCount(content);
    if (content.length > 0 && wc < 300) {
      issues.push({ type: "warning", page, issue: `Conteúdo raso (${wc} palavras — ideal >300)`, priority: "Baixa" });
    }

    // ── OG Image ────────────────────────────────────────────────────────────────
    const hasImage = (p as any).coverUrl || (p as any).og_image_url || (p as any).ogImage;
    if (!hasImage) {
      issues.push({ type: "warning", page, issue: "Sem imagem OG/capa — prejudica CTR em compartilhamentos", priority: "Média" });
    }

    // ── Structured data / FAQ ───────────────────────────────────────────────────
    if (!(p as any).faq) {
      issues.push({ type: "warning", page, issue: "Sem FAQ estruturado — perde rich snippets no Google", priority: "Baixa" });
    }

    // ── Redirect chain ──────────────────────────────────────────────────────────
    const target = redirectMap.get(page);
    if (target && redirectMap.has(target)) {
      issues.push({
        type: "error",
        page,
        issue: `Cadeia de redirect: ${page} → ${target} → ${redirectMap.get(target)}`,
        priority: "Alta",
      });
    }
  }

  // ── Duplicate titles ─────────────────────────────────────────────────────────
  for (const p of posts) {
    const t = ((p as any).seo_title || p.title || "").trim();
    if (t && titleMap[t] > 1) {
      issues.push({ type: "error", page: `/blog/${p.slug}`, issue: "Title tag duplicado em múltiplos posts", priority: "Alta" });
    }
  }

  // ── Duplicate meta descriptions ──────────────────────────────────────────────
  for (const p of posts) {
    const d = ((p as any).seo?.description || (p as any).seo_description || p.excerpt || "").trim();
    if (d && descMap[d] > 1) {
      issues.push({ type: "warning", page: `/blog/${p.slug}`, issue: "Meta description duplicada em múltiplos posts", priority: "Média" });
    }
  }

  const errors = issues.filter((i) => i.type === "error").length;
  const warnings = issues.filter((i) => i.type === "warning").length;
  const score = computeScore(errors, warnings);
  const metrics = { score, indexed: posts.length, errors, warnings };

  // Persist score snapshot for trend history
  try {
    const sb = supabaseAdmin();
    await sb.from("seo_history").insert({
      action: "audit",
      route: "seo-hub",
      after: { score, errors, warnings, indexed: posts.length },
      created_at: new Date().toISOString(),
    });
  } catch {}

  return NextResponse.json({ metrics, issues });
}
