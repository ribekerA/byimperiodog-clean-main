import { NextResponse } from "next/server";
import type { AiExpandRequest, AiExpandResponse, OutlineSection } from "@/types/blog";

/**
 * POST /api/admin/blog/ai/expand
 * Expande um outline em MDX + blocks (determinístico, sem provedor externo).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AiExpandRequest;
    const outline = (body?.outline || []) as OutlineSection[];
    if (!Array.isArray(outline) || outline.length === 0) {
      return NextResponse.json({ ok: false, error: "outline is required" } satisfies AiExpandResponse, { status: 400 });
    }

    const mdx = renderOutlineToMdx(outline);
    const blocks = outline.map((s) => ({ type: "heading", depth: 2, text: s.heading }));

    const payload: AiExpandResponse = {
      ok: true,
      content_mdx: mdx,
      content_blocks_json: blocks,
      recommended_internal_links: [
        { title: "Filhotes de Spitz disponíveis", href: "/filhotes" },
        { title: "Como comprar com segurança", href: "/como-comprar" },
      ],
      suggested_ctas: [
        "Veja os filhotes disponíveis",
        "Fale com um especialista",
        "Peça um vídeo no WhatsApp",
      ],
    };
    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) } satisfies AiExpandResponse, { status: 500 });
  }
}

function renderOutlineToMdx(out: OutlineSection[], depth = 2): string {
  const h = (lvl: number) => Array(Math.max(2, Math.min(6, lvl))).fill('#').join('');
  const lines: string[] = [];
  for (const s of out) {
    lines.push(`${h(depth)} ${s.heading}`);
    if (s.summary) lines.push(`\n${s.summary}\n`);
    if (Array.isArray(s.children) && s.children.length) {
      lines.push(renderOutlineToMdx(s.children, depth + 1));
    }
    lines.push("");
  }
  return lines.join("\n");
}

