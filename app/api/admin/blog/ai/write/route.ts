export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type WriteRequest = {
  topic: string;
  keywords?: string[];
  audience?: string;
  tone?: "informative" | "friendly" | "formal";
  targetLang?: string; // pt-BR default
  wordBudget?: number; // 800-1500 default
  generateImage?: boolean;
  status?: "draft" | "review" | "scheduled" | "published";
  scheduled_at?: string | null;
  category?: string;
  primaryKeyword?: string;
  scope?: 'guia-completo' | 'filhote' | 'adulto';
  randomize?: boolean; // aumenta temperatura
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as WriteRequest;
    const topic = (body.topic || "").trim();
    if (!topic) return NextResponse.json({ error: "topic é obrigatório" }, { status: 400 });

    const openaiKey = process.env.OPENAI_API_KEY;
    const targetLang = body.targetLang || "pt-BR";
    const wordBudget = Math.max(600, Math.min(2400, body.wordBudget || 1200));
    const primaryKw = (body.primaryKeyword || "Spitz Alemão filhote").trim();
  const enforcedKeywords = [primaryKw, "Spitz Alemão", "Lulu da Pomerânia", "filhote"]; 
  const scope = body.scope || 'guia-completo';

  // 1) Generate structured content (sempre incluir seções fixas e CTA final)
    let content: any;
    if (!openaiKey) {
      // Stronger local stub: deterministic long-form MDX with FAQ and CTA
      const heading = `Guia completo: ${topic} (Spitz Alemão / Lulu da Pomerânia)`;
      const sections = [
        { h: "Introdução", p: `Contextualização inicial sobre ${topic} focado em filhotes de Spitz Alemão.` },
        { h: "Características da Raça", list: ["Temperamento", "Energia", "Socialização", "Pelagem"] },
        { h: "Cuidados Essenciais", list: ["Alimentação", "Higiene e tosa", "Vacinas e veterinário", "Adestramento inicial"] },
        { h: "Socialização e Enriquecimento", p: "Como introduzir estímulos, pessoas e outros animais de forma segura." },
        { h: "Alimentação Detalhada", p: "Frequência, tipos de ração, snacks seguros e hidratação." },
        { h: "Saúde Preventiva", list: ["Calendário de vacinas", "Vermifugação", "Consulta de rotina", "Sinais de alerta"] },
        { h: "Grooming e Pelagem", p: "Escovação, banhos, cuidados com subpelo e ambientação ao grooming." },
        { h: "Treinamento Básico", list: ["Nome", "Recall", "Higiene", "Uso de reforço positivo"] },
        { h: "FAQ", faq: [
          { q: `Quando começar adestramento do filhote?`, a: `Desde que chega a casa, com ênfase em reforço positivo.` },
          { q: `Quantas refeições um filhote precisa?`, a: `Normalmente 3 a 4 até estabilizar peso e crescimento.` },
        ]},
      ];
      const lines: string[] = [];
      lines.push(`# ${heading}`);
      lines.push("");
      for (const s of sections) {
        lines.push(`## ${s.h}`);
        if (s.p) lines.push(s.p);
        if (s.list) { for (const li of s.list) lines.push(`- ${li}`); }
        if (s.faq) {
          for (const f of s.faq) {
            lines.push(`### ${f.q}`);
            lines.push(f.a);
          }
        }
        lines.push("");
      }
  lines.push("## Recursos" );
  lines.push("- Veja os filhotes disponíveis: [/filhotes](/filhotes)");
  lines.push("- Processo de compra: [/como-comprar](/como-comprar)");
  lines.push("- Contato direto: [/contato](/contato)\n");
  lines.push("> CTA: Solicite agora um vídeo de um filhote disponível no WhatsApp e tire dúvidas em tempo real.");
      const excerpt = `Tudo que você precisa saber sobre ${topic}.`;
      content = {
        title: heading,
        excerpt,
        content_mdx: lines.join("\n"),
        seo_title: heading.slice(0, 60),
        seo_description: excerpt.slice(0, 155),
        tags: (body.keywords || []).slice(0, 6),
        cover_prompt: `Foto realista 16:9 relacionada a ${topic} em contexto profissional, estética editorial, alta qualidade`,
        cover_alt: `Imagem ilustrativa sobre ${topic}`,
      };
    } else {
      const messages = [
        { role: "system", content: `Você é um redator sênior de SEO com especialização em conteúdo sobre raças caninas, especialmente Spitz Alemão (Lulu da Pomerânia). Produza conteúdo 100% focado na raça e em filhotes. Objetivos: SEO orgânico extremo, capturar intenção de busca (informativa, transacional, comparativa), criar FAQ otimizadas para rich snippets e sugerir interlinks/CTAs. Regras: H1 único, H2/H3 claros, listas quando úteis, exemplos práticos e fontes quando possível. Gere MDX válido (GFM). Retorne apenas um JSON válido com os campos solicitados.` },
        { role: "user", content: `Tópico base: ${topic}\nEscopo: ${scope}.\nObrigatório cobrir (mesmo se o tópico for estreito): História e Origem; Características Físicas; Temperamento (filhote vs adulto); Desenvolvimento do Filhote (0-2m, 2-6m, 6-12m); Cuidados Essenciais; Socialização; Alimentação Filhote; Alimentação Adulto; Saúde Preventiva (vacinas, vermifugação, check-ups, doenças comuns); Grooming / Pelagem; Exercícios & Enriquecimento Mental; Treinamento Básico; Problemas Comportamentais Comuns; FAQ com ao menos 5 perguntas reais; Recursos & CTA final.\nPalavras-chave: ${(body.keywords || []).join(", ")}\nPúblico: ${body.audience || "tutores e compradores (filhote e adulto)"}\nTom: ${body.tone || "informative"}\nMeta palavras: ~${wordBudget}.\nFormato de resposta JSON estrito conforme: {"title","excerpt","content_mdx","seo_title","seo_description","tags":[...],"faq":[{"q","a"}],"cover_prompt","cover_alt","suggested_ctas":[{"label","href"}],"recommended_internal_links":[{"href","anchor","reason"}]` },
      ];
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages, temperature: body.randomize ? 0.85 : 0.6, max_tokens: 4000 }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`OpenAI write failed: ${txt}`);
      }
      const j = await res.json();
      const raw = j.choices?.[0]?.message?.content || "{}";
      // Parser tolerante a JSON possivelmente com lixo antes/depois
      function safeParse(str: string): any {
        try { return JSON.parse(str); } catch {}
        const firstBrace = str.indexOf('{');
        const lastBrace = str.lastIndexOf('}');
        if (firstBrace >=0 && lastBrace > firstBrace) {
          const slice = str.substring(firstBrace, lastBrace+1);
          try { return JSON.parse(slice); } catch {}
        }
        return { title: topic, excerpt: str.slice(0,155), content_mdx: str };
      }
      content = safeParse(raw);
    }

    // Enforce domain: artigo sempre sobre Spitz Alemão / filhotes
  let txt0 = String(content?.content_mdx || "");
    const mentionsSpitz = /spitz/i.test(txt0) || /lulu/i.test(txt0) || /pomer/iu.test(txt0);
    if (!mentionsSpitz) {
      const heading = content?.title || `Guia de ${body.category || 'cuidados'} com filhotes de Spitz Alemão (Lulu da Pomerânia)`;
      const mdx = `# ${heading}\n\nEste guia cobre ${body.category || 'cuidados essenciais'} para filhotes de Spitz Alemão (Lulu da Pomerânia).\n\n## Perfil da raça\nVivo, inteligente e apegado à família.\n\n## Socialização\nIntroduza estímulos de forma gradual a partir da 8ª semana.\n\n## Alimentação e saúde\nRação premium para raças pequenas e calendário de vacinas em dia.\n\n## Higiene e pelagem\nEscovação regular e banhos espaçados mantêm a pelagem saudável.\n\n## FAQ\n### Quando começar a socialização?\nA partir da 8ª semana, reforço positivo.\n\n### Qual a quantidade de ração?\nConforme orientação do veterinário, ajustando ao peso.`;
      content = {
        ...content,
        title: heading,
        excerpt: content?.excerpt || `Tudo sobre ${primaryKw} com foco na raça Spitz Alemão (Lulu da Pomerânia).`,
        content_mdx: mdx,
        seo_title: (content?.seo_title || heading).slice(0, 60),
        seo_description: (content?.seo_description || `Guia para filhotes de Spitz Alemão.`).slice(0, 155),
      };
      txt0 = String(content.content_mdx || '');
    }
  if (!content?.cover_prompt || !/spitz|lulu|pomer/iu.test(String(content.cover_prompt))) {
      content.cover_prompt = `Fotografia realista 16:9 de filhote de Spitz Alemão (Lulu da Pomerânia), nítida, luz suave, fundo neutro, estilo editorial, cores quentes`;
      content.cover_alt = `Filhote de Spitz Alemão (Lulu da Pomerânia)`;
    }
    // Garantir tags de SEO relacionadas
    const baseTags = Array.from(new Set(["Spitz Alemão", "Lulu da Pomerânia", "filhote", "adulto", "guia", ...(content?.tags || []), ...(body.keywords || [])]));
    content.tags = baseTags.slice(0, 8);

    // Pós-processador para garantir seções obrigatórias faltantes
    const requiredSections: { heading: string; template: string }[] = [
      { heading: '## História e Origem', template: '## História e Origem\nBreve contexto da origem do Spitz Alemão (Lulu da Pomerânia), evolução e popularização.' },
      { heading: '## Características Físicas', template: '## Características Físicas\nTamanho, pelagem dupla, cores comuns, expectativa de peso e longevidade.' },
      { heading: '## Temperamento (Filhote vs Adulto)', template: '## Temperamento (Filhote vs Adulto)\nComparação de energia, curiosidade, socialização e maturidade comportamental.' },
      { heading: '## Desenvolvimento do Filhote', template: '## Desenvolvimento do Filhote\n### 0–2 meses\nNecessidades iniciais.\n### 2–6 meses\nSocialização intensa e regras.\n### 6–12 meses\nTransição para adulto jovem.' },
      { heading: '## Cuidados Essenciais', template: '## Cuidados Essenciais\nRotina diária: alimentação, hidratação, sono, higiene e enriquecimento.' },
      { heading: '## Socialização', template: '## Socialização\nExposição gradual a sons, pessoas, outros cães e ambientes.' },
      { heading: '## Alimentação Filhote', template: '## Alimentação Filhote\nFrequência, ração adequada, ajustes de peso.' },
      { heading: '## Alimentação Adulto', template: '## Alimentação Adulto\nManutenção, controle calórico, suplementos quando indicados.' },
      { heading: '## Saúde Preventiva', template: '## Saúde Preventiva\nVacinas, vermifugação, prevenção de problemas dentários e check-ups.' },
      { heading: '## Grooming e Pelagem', template: '## Grooming e Pelagem\nEscovação, banhos, cuidados com subpelo, períodos de troca.' },
      { heading: '## Exercícios e Enriquecimento', template: '## Exercícios e Enriquecimento\nPasseios curtos, estimulação mental, jogos olfativos.' },
      { heading: '## Treinamento Básico', template: '## Treinamento Básico\nNome, recall, higiene, comandos simples e reforço positivo.' },
      { heading: '## Problemas Comportamentais Comuns', template: '## Problemas Comportamentais Comuns\nLatidos excessivos, ansiedade de separação, possessividade de brinquedos.' },
      { heading: '## FAQ', template: '## FAQ\n### Spitz Alemão late muito?\nTendem a vocalizar; redirecione e reforce silêncio.\n### Pode viver em apartamento?\nSim, com rotina de estímulo mental.\n### Qual a frequência de banho?\nGeralmente a cada 3–4 semanas, mantendo escovação frequente.\n### Quando trocar para ração de adulto?\nApós avaliação veterinária ~12 meses.\n### Solta muito pelo?\nTem troca sazonal; escovação reduz acúmulo.' },
      { heading: '## Recursos e CTA', template: '## Recursos e CTA\n- Veja filhotes: [/filhotes](/filhotes)\n- Processo de compra: [/como-comprar](/como-comprar)\n- Fale direto: [/contato](/contato)\n\n> Solicite um vídeo agora de um filhote disponível pelo WhatsApp.' },
    ];

    let finalMDX = String(content.content_mdx || '');
    for (const sec of requiredSections) {
      if (!new RegExp('^' + sec.heading.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&'), 'm').test(finalMDX)) {
        finalMDX += '\n\n' + sec.template.trim();
      }
    }
    content.content_mdx = finalMDX.trim();

    // Injeção de links internos obrigatórios se ausentes
    const neededLinks: { anchor: string; href: string; pattern: RegExp }[] = [
      { anchor: 'Filhotes disponíveis', href: '/filhotes', pattern: /\]\(\/filhotes\)/ },
      { anchor: 'Como comprar', href: '/como-comprar', pattern: /\]\(\/como-comprar\)/ },
      { anchor: 'Fale conosco', href: '/contato', pattern: /\]\(\/contato\)/ },
    ];
    let mdxWithLinks = content.content_mdx as string;
    for (const l of neededLinks) {
      if (!l.pattern.test(mdxWithLinks)) {
        mdxWithLinks += `\n\n[${l.anchor}](${l.href})`;
      }
    }
    content.content_mdx = mdxWithLinks;

  // 2) Persist post (draft by default); persist tags depois
    const slug = slugify(content.title || topic);
    const sb = supabaseAdmin();
    const faqItems = extractFAQ(String(content.content_mdx||''));
    const readingTime = calcReadingTime(String(content.content_mdx||''));
    const contentBlocks = buildContentBlocks(String(content.content_mdx||''), faqItems);
    const authorId = await getOrCreateDefaultAuthor(sb);
    // tentativa de slug único (até 3 tentativas com sufixo)
    let inserted: any = null; let attemptError: any = null;
  const isPublished = (body.status || 'draft') === 'published';
  const publishedAtValue = isPublished ? new Date().toISOString() : null;
  for (let attempt = 0; attempt < 3; attempt++) {
      const attemptSlug = attempt === 0 ? slug : `${slug}-${attempt + 1}`;
      const { data, error } = await sb
        .from("blog_posts")
        .insert([
          {
            slug: attemptSlug,
            title: content.title || topic,
            excerpt: content.excerpt || null,
            content_mdx: content.content_mdx || null,
            seo_title: content.seo_title || null,
            seo_description: content.seo_description || null,
            status: body.status || "draft",
            scheduled_at: body.scheduled_at || null,
      published_at: publishedAtValue,
            reading_time: readingTime,
            content_blocks_json: contentBlocks,
            author_id: authorId,
            lang: 'pt-BR'
          },
        ])
        .select("id,slug")
        .single();
      if (!error && data) { inserted = data; break; }
      attemptError = error;
      if (error?.message && !/duplicate|unique/i.test(error.message)) break;
    }
    if (!inserted) throw attemptError || new Error("Falha ao inserir post");

    // Revisão inicial
    try {
      await sb.from('blog_post_revisions').insert([{ post_id: inserted.id, snapshot: { title: content.title, excerpt: content.excerpt, seo_title: content.seo_title, seo_description: content.seo_description, content_mdx: content.content_mdx, content_blocks_json: contentBlocks, reading_time: readingTime, faq: faqItems }, reason: 'initial-create' }]);
    } catch {}

    // Localização base (pt-BR)
    try {
      await sb.from('blog_post_localizations').insert([{ post_id: inserted.id, lang: 'pt-BR', slug: inserted.slug, title: content.title, subtitle: null, content_mdx: content.content_mdx, seo_title: content.seo_title, seo_description: content.seo_description, og_image_url: null }]);
    } catch {}

    let cover_url: string | undefined;
    // 3) Optionally create cover image with AI (calls our own endpoint for uniform upload)
  if (body.generateImage) {
      try {
    const selfUrl = new URL(req.url);
    const baseOrigin = `${selfUrl.protocol}//${selfUrl.host}`;
    const imgEndpoint = `${baseOrigin}/api/admin/blog/ai/image`;
    const imgRes = await fetch(imgEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: content.cover_prompt || `${topic}, editorial, 16:9`, alt: content.cover_alt || `Imagem: ${topic}` }),
        });
        if (imgRes.ok) {
          const { url } = await imgRes.json();
          cover_url = url;
        }
      } catch {}
    }

    if (cover_url) {
      await sb.from("blog_posts").update({ cover_url, og_image_url: cover_url }).eq("id", inserted.id);
    }

    try {
      // Revalida a listagem e, se publicado, a página do post
      revalidatePath("/blog");
      if ((body.status || "draft") === "published") {
        revalidatePath(`/blog/${inserted.slug}`);
      }
    } catch {}

    // 4) Tags persist (blog_tags + blog_post_tags)
    try {
      if (Array.isArray(content.tags) && content.tags.length) {
        const sb2 = sb; // reuse
        // upsert tags (slug slugify simplificado)
        const tagRows = content.tags
          .map((t: string) => (t || '').trim())
          .filter(Boolean)
          .slice(0, 8)
          .map((t: string) => ({ slug: tagSlug(t), name: t }));
        if (tagRows.length) {
          const { data: upTags } = await sb2.from('blog_tags').upsert(tagRows, { onConflict: 'slug' }).select('id,slug');
          const tagMap = new Map<string,string>((upTags||[]).map((r:any)=>[r.slug,r.id]));
          const linkRows: { post_id: string; tag_id: string }[] = [];
            for (const t of tagRows) {
              const id = tagMap.get(t.slug);
              if (id) linkRows.push({ post_id: inserted.id, tag_id: id });
            }
          if (linkRows.length) {
            const exist = await sb2.from('blog_post_tags').select('post_id,tag_id').eq('post_id', inserted.id);
            const existingSet = new Set((exist.data||[]).map((x:any)=>x.tag_id));
            const toInsert = linkRows.filter(l=>!existingSet.has(l.tag_id));
            if (toInsert.length) await sb2.from('blog_post_tags').insert(toInsert);
          }
        }
      }
    } catch {}

  return NextResponse.json({ ok: true, post: { ...inserted, reading_time: readingTime }, cover_url });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err), stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined }, { status: 500 });
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}+/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function tagSlug(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}+/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,'');
}

// Utilidades adicionais alinhadas ao schema
function extractFAQ(mdx: string): { q: string; a: string }[] {
  const faqIndex = mdx.indexOf('## FAQ');
  if (faqIndex === -1) return [];
  const after = mdx.slice(faqIndex);
  const qa = Array.from(after.matchAll(/###\s+([^\n]+)\n([^#]+)/g));
  return qa.map(m=> ({ q: m[1].trim(), a: m[2].trim() }));
}

function calcReadingTime(mdx: string): number {
  const words = (mdx.replace(/```[\s\S]*?```/g,'').match(/\b\w+\b/g) || []).length;
  return Math.max(1, Math.round(words/200));
}

function buildContentBlocks(mdx: string, faq: {q:string;a:string}[]) {
  const headings = Array.from(mdx.matchAll(/^##\s+(.+)$/gm)).map(h=>h[1].trim());
  return { headings, faq, version: 1 };
}

async function getOrCreateDefaultAuthor(sb: ReturnType<typeof supabaseAdmin>): Promise<string | null> {
  try {
    const { data } = await sb.from('blog_authors').select('id').eq('name','Sistema').limit(1).maybeSingle();
    if (data?.id) return data.id;
    const ins = await sb.from('blog_authors').insert([{ name: 'Sistema', bio: 'Autor padrão gerado automaticamente.' }]).select('id').single();
    return ins.data?.id || null;
  } catch { return null; }
}
