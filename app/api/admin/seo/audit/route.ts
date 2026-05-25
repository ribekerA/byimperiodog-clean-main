import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { blogRepo } from "@/lib/db";

type AuditIssue = {
  type: "error" | "warning";
  page: string;
  issue: string;
  priority: "Alta" | "Média" | "Baixa";
};

function computeScore(errors: number, warnings: number): number {
  // Heurística simples: penaliza mais erros do que avisos
  const raw = 100 - errors * 12 - warnings * 2;
  return Math.max(0, Math.min(100, raw));
}

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  // Carrega posts publicados (limite generoso para sites pequenos/médios)
  const { items: posts } = await blogRepo.listPosts({ status: "published", limit: 1000 });

  const issues: AuditIssue[] = [];
  const titleMap: Record<string, number> = {};

  for (const p of posts) {
    const page = `/blog/${p.slug}`;
    const title = (p.title || "").trim();
    if (title) titleMap[title] = (titleMap[title] ?? 0) + 1;

    // Meta description faltando/curta
    const desc = p.seo?.description?.trim() || p.excerpt?.trim() || "";
    if (!desc) {
      issues.push({ type: "error", page, issue: "Meta description faltando", priority: "Alta" });
    } else if (desc.length < 50) {
      issues.push({ type: "warning", page, issue: "Meta description muito curta", priority: "Baixa" });
    }

    // Alt da capa ausente
    if (p.coverUrl && !p.coverAlt) {
      issues.push({ type: "warning", page, issue: "Alt text da imagem de capa faltando", priority: "Média" });
    }

    // H1 ausente (heurística em MDX: procurar início com '# ' ou presença de '<h1')
    const content = (p.content || "") as string;
    const hasH1 = /^#\s+.+/m.test(content) || /<h1[\s>]/i.test(content);
    if (!hasH1) {
      issues.push({ type: "warning", page, issue: "Heading H1 faltando", priority: "Média" });
    }
  }

  // Títulos duplicados
  for (const p of posts) {
    const title = (p.title || "").trim();
    if (title && titleMap[title] > 1) {
      issues.push({ type: "error", page: `/blog/${p.slug}`, issue: "Title tag duplicado", priority: "Alta" });
    }
  }

  const errors = issues.filter((i) => i.type === "error").length;
  const warnings = issues.filter((i) => i.type === "warning").length;
  const metrics = {
    score: computeScore(errors, warnings),
    indexed: posts.length,
    errors,
    warnings,
  };

  return NextResponse.json({ metrics, issues });
}
