import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { suggestInternalLinks } from "@/lib/internalLinks";

type GenPayload = {
  prompt?: string;
  topic?: string;
  tone?: string;
  length?: "short" | "medium" | "long";
};

function stubGenerate(p: GenPayload) {
  const breed = "Spitz Alemão Anão (Lulu da Pomerânia)";
  const topic = p.topic || p.prompt || breed;
  const title = `Cuidados e dicas para filhotes de ${breed}`;
  const excerpt = `Tudo que você precisa saber sobre cuidados, alimentação e treinamento de filhotes de ${breed}.`;
  const content_mdx = `# ${title}

${excerpt}

## Introdução

O ${breed} é uma raça pequena, energética e muito apegada à família. Filhotes exigem atenção especial nas primeiras semanas.

## Preparando a casa para o filhote

- Encontre um local tranquilo para dormir
- Tenha brinquedos e itens de conforto

## Alimentação e nutrição

Explique a importância de ração específica para filhotes e frequência das refeições.

## Treinamento inicial

- Socialização com pessoas e outros animais
- Treinamento de caixa e higiene

## Saúde e vacinas

Consulte um veterinário, mantenha o esquema de vacinas e avalie vermifugação.

## Conclusão

Com amor, rotina e atenção, seu filhote de ${breed} crescerá saudável e feliz.`;
  const og_image_url = `/api/og?title=${encodeURIComponent(title)}`;
  const seo_title = `${title} — By Império Dog`;
  const seo_description = excerpt;
  const suggested_ctas = [
    "Conheça nossos filhotes disponíveis",
    "Agende uma visita",
    "Assine nossa newsletter para dicas"
  ];
  const recommended_internal_links = suggestInternalLinks(title, ["filhote", "spitz"], 3).map(l => ({ title: l.anchor, href: l.href }));
  return { title, excerpt, content_mdx, og_image_url, seo_title, seo_description, suggested_ctas, recommended_internal_links };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenPayload;
    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ ok: true, post: stubGenerate(body) });


  // Call OpenAI Chat completions (basic flow)
  const defaultTopic = "Spitz Alemão Anão (Lulu da Pomerânia)";
  const prompt = `Gere um post em MDX sobre: ${body.topic || body.prompt || defaultTopic}.
Inclua título, um excerpt curto e conteúdo estruturado com headings (Introdução, Cuidados com filhotes, Alimentação, Treinamento, Saúde, Conclusão). Foque em filhotes, escreva em Português (pt-BR). Ao final, sugira 2-3 CTAs curtos e 2 links internos relevantes no formato JSON.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 800 }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`OpenAI erro: ${txt}`);
    }
    const j = await res.json();
    const text = j.choices?.[0]?.message?.content || "";

    // crude parsing: assume first line is title, next paragraph is excerpt, rest is MDX
    const lines = text.split(/\r?\n/).filter(Boolean);
    let title = lines[0] || "Post gerado";
    let excerpt = (lines[1] || "").slice(0, 160);
    let content_mdx = text;

    // If returned content doesn't look like MDX (no headings), wrap it
    if (!/^#+\s+/m.test(content_mdx)) {
      content_mdx = `# ${title}\n\n${excerpt}\n\n${content_mdx}`;
    }

    const og_image_url = `/api/og?title=${encodeURIComponent(title)}`;

    // lightweight SEO heuristics
    const seo_title = `${title} — By Império Dog`;
    const seo_description = excerpt || content_mdx.slice(0, 150).replace(/\n/g, ' ');
    // default CTAs and links (OpenAI may include better ones in a JSON block but we fallback)
    const suggested_ctas = ["Conheça nossos filhotes disponíveis", "Agende uma visita"];
  const recommended_internal_links = suggestInternalLinks(title, (body.topic ? [body.topic] : []), 3).map(l => ({ title: l.anchor, href: l.href }));

    return NextResponse.json({ ok: true, post: { title, excerpt, content_mdx, og_image_url, seo_title, seo_description, suggested_ctas, recommended_internal_links } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
