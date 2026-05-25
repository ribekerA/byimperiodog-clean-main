export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin, hasServiceRoleKey } from "../../../../../src/lib/supabaseAdmin";

type SuggestPayload = {
  title?: string;
  excerpt?: string;
  content_mdx?: string;
  slug?: string;
};

async function generateStub(payload: SuggestPayload) {
  // deterministic, safe suggestions when no OpenAI key provided
  const base = payload.title || payload.excerpt || payload.slug || "Post";
  return {
    seo_title: `${base} — Dicas By Imperio`,
    seo_description: (payload.excerpt && payload.excerpt.slice(0, 140)) || `Leia sobre ${base} no blog By Imperio.`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SuggestPayload;

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      const suggestions = await generateStub(body);
      return NextResponse.json({ ok: true, suggestions });
    }

  // Advanced SEO: consider search intent, generate 3 title variants (short, long-tail, local) and 2 meta descriptions
  const promptTitle = `Você é um especialista em SEO. Gere 3 variações de título (1 curto <=60 chars, 1 longo focado em long-tail, 1 com intenção transacional/local) para este conteúdo:\nTitle: ${body.title || ""}\nExcerpt: ${body.excerpt || ""}\nSlug: ${body.slug || ""}`;
  const promptDesc = `Gere 2 meta descriptions persuasivas (<=155 chars) com foco em CTR e em captar intenção de busca. Use o conteúdo abaixo como base:\n${body.excerpt || body.content_mdx || body.title || ""}`;

  const resTitle = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
      { role: "system", content: "Você é um assistente que gera títulos e meta descriptions otimizadas para SEO em Português (pt-BR). Priorize termos long-tail e intenção de busca." },
      { role: "user", content: promptTitle },
        ],
        max_tokens: 60,
        temperature: 0.6,
      }),
    });

    if (!resTitle.ok) {
      const txt = await resTitle.text();
      throw new Error(`OpenAI title request failed: ${txt}`);
    }
    const jTitle = await resTitle.json();
  const seo_title = jTitle.choices?.[0]?.message?.content?.trim() || "";

  const resDesc = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
      { role: "system", content: "Você é um assistente que gera meta descriptions otimizadas para SEO em Português (pt-BR). Foque em CTR e intenção de busca." },
      { role: "user", content: promptDesc },
        ],
        max_tokens: 120,
        temperature: 0.6,
      }),
    });

    if (!resDesc.ok) {
      const txt = await resDesc.text();
      throw new Error(`OpenAI description request failed: ${txt}`);
    }
    const jDesc = await resDesc.json();
    const seo_description = jDesc.choices?.[0]?.message?.content?.trim() || "";

    return NextResponse.json({ ok: true, suggestions: { seo_title, seo_description } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
