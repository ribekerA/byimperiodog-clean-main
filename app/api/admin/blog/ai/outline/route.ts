import { NextResponse } from "next/server";
import type { AiOutlineRequest, AiOutlineResponse } from "@/types/blog";

/**
 * POST /api/admin/blog/ai/outline
 * Request: { topic: string; keywords?: string[] }
 * Response: { ok: true, outline: OutlineSection[] } | { ok: false, error }
 *
 * Deterministic outline with Spitz focus if topic is generic.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AiOutlineRequest;
    const topic = (body?.topic || "").toString().trim();
    if (!topic) return NextResponse.json({ ok: false, error: "topic is required" } satisfies AiOutlineResponse, { status: 400 });

    const isSpitz = /spitz|lulu|pomer/iu.test(topic);
    const suffix = isSpitz ? "" : " (Spitz Alemão / Lulu da Pomerânia)";
    const outline = [
      { heading: `Introdução: ${topic}${suffix}`, summary: "Contextualiza o leitor e define a proposta." },
      { heading: `Benefícios para filhotes${suffix}`, children: [
        { heading: "Saúde e bem-estar" },
        { heading: "Comportamento e socialização" },
      ]},
      { heading: `Cuidados essenciais${suffix}`, children: [
        { heading: "Alimentação" },
        { heading: "Higiene e tosa" },
        { heading: "Atividade física" },
      ]},
      { heading: "Perguntas frequentes (FAQ)" },
      { heading: "Conclusão e próximos passos" },
    ];

    return NextResponse.json({ ok: true, outline } satisfies AiOutlineResponse);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) } satisfies AiOutlineResponse, { status: 500 });
  }
}

