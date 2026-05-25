export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";
import { requireAdmin, logAdminAction } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/rateLimit';

/*
  Orquestrador multi-fases de geração de post
  Fases: outline -> expand -> enrich -> finalize
  - outline: cria esqueleto de seções baseado em escopo
  - expand: gera conteúdo bruto para cada seção
  - enrich: adiciona FAQ, CTAs, links internos, valida seções obrigatórias
  - finalize: persiste no banco (reuso de parte da lógica do write)

  Simples implementação síncrona (tudo em uma chamada) por enquanto.
  Futuro: dividir em jobs assíncronos, streaming incremental, sessão em memória/redis.
*/

// Tipos básicos
interface GenerateRequest {
  topic: string;
  scope?: 'guia-completo' | 'filhote' | 'adulto';
  keywords?: string[];
  audience?: string;
  tone?: 'informative' | 'friendly' | 'formal';
  targetLang?: string;
  wordBudget?: number;
  status?: 'draft' | 'review' | 'scheduled' | 'published';
  scheduled_at?: string | null;
  generateImage?: boolean;
  randomize?: boolean;
}

interface SectionOutline { id: string; heading: string; goal: string; }

interface PersistExtras {
  contentBlocks: any;
  readingTime: number;
  faqItems: { q: string; a: string }[];
}

export async function POST(req: Request) {
  const auth = requireAdmin(req); if(auth) return auth;
  const ip = (req as any).ip || '0.0.0.0';
  const rl = rateLimit('gen:'+ip, 10, 60_000); // 10/min
  if(!rl.allowed) return NextResponse.json({ ok:false, error:'rate-limit', retry_at: rl.reset }, { status:429 });

  const body = (await req.json()) as GenerateRequest;
  const topic = (body.topic||'').trim();
  if (!topic) return NextResponse.json({ error: 'topic é obrigatório' }, { status: 400 });

  const openaiKey = process.env.OPENAI_API_KEY;
  const scope = body.scope || 'guia-completo';
  const temperature = body.randomize ? 0.85 : 0.55;
  const wordBudget = Math.max(800, Math.min(2400, body.wordBudget || 1400));

  // --- Sessão IA persistida ---
  const sb = supabaseAdmin();
  let sessionId: string | null = null;
  try {
    const { data: created } = await sb.from('ai_generation_sessions').insert([{ topic, phase: 'outline', progress: 5 }]).select('id').single();
    sessionId = created?.id || null;
  } catch {}
  async function updateSession(patch: { phase?: string; progress?: number; status?: string; error_message?: string; post_id?: string }) {
    if(!sessionId) return; try { await sb.from('ai_generation_sessions').update(patch).eq('id', sessionId); } catch {}
  }

  // 1. Outline
  await updateSession({ phase:'outline', progress:10 });
  const outlineSections: SectionOutline[] = buildOutline(scope);

  // 2. Expand
  await updateSession({ phase:'expand', progress:25 });
  let expandedSections: { heading: string; content: string }[] = [];
  if (!openaiKey) {
    expandedSections = outlineSections.map(s => ({ heading: s.heading, content: `### ${s.heading}\n${s.goal}\n\n(Conteúdo placeholder offline para ${topic} - substituir quando OPENAI disponível)` }));
  } else {
  const prompt = `Você é um redator sênior especialista em Spitz Alemão (Lulu da Pomerânia) e comportamento canino. Gere conteúdo EM PORTUGUÊS BRASIL em MDX (GFM) altamente útil, prático e humano para o TEMA: ${topic}\nEscopo: ${scope}.\nDiretrizes de estilo:\n- Tom: caloroso, especialista confiável, sem floreio vazio.\n- Nunca use frases genéricas tipo "Assunto do artigo" ou "Introdução ao tema".\n- Cada seção deve ter exemplos concretos (rotina, idade, sinais, quantidades).\n- Incluir dicas acionáveis, micro-checklists e erros comuns.\n- FAQ: respostas curtas, objetivas e factuais.\n- Usar headings fornecidos EXATOS.\nSeções (não pule):\n${outlineSections.map(s=>`- ${s.heading}: ${s.goal}`).join('\n')}\nFormato de saída: JSON ESTRITO -> {"sections":[{"heading":"...","content_mdx":"..."}]}. Nada antes/depois do JSON.`;
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', temperature, messages: [ { role: 'user', content: prompt } ], max_tokens: 6000 })
      });
      if (res.ok) {
        const j = await res.json();
        const raw = j.choices?.[0]?.message?.content || '{}';
        const parsed = safeJSON(raw);
        expandedSections = Array.isArray(parsed.sections) ? parsed.sections.map((s:any)=>({ heading: s.heading, content: s.content_mdx || s.content || '' })) : outlineSections.map(s=>({ heading: s.heading, content: s.goal }));
      } else {
        expandedSections = outlineSections.map(s=>({ heading: s.heading, content: s.goal }));
      }
    } catch {
      expandedSections = outlineSections.map(s=>({ heading: s.heading, content: s.goal }));
    }
  }

  // 3. Enrich
  await updateSession({ phase:'enrich', progress:55 });
  let mdx = composeMDX(topic, expandedSections);
  mdx = refineMDX(mdx, topic);
  mdx = ensureRequiredSections(mdx);
  mdx = injectInternalLinks(mdx);
  mdx = ensureFAQMinimum(mdx);
  await updateSession({ progress:65 });
  mdx = await ensureMinWords(mdx, 600, openaiKey, temperature, topic);
  await updateSession({ progress:75 });
  const excerpt = buildExcerpt(mdx, topic);
  const title = buildTitle(topic, scope);
  const seo_title = title.slice(0,60);
  const seo_description = excerpt.slice(0,155);
  const tags = buildTags(body.keywords);
  const faqItems = extractFAQ(mdx);
  const readingTime = calcReadingTime(mdx);
  const contentBlocks = buildContentBlocks(mdx, faqItems);

  // 4. Persist
  await updateSession({ phase:'finalize', progress:85 });
  try {
    const { slug, insertedId, cover_url } = await persistPost({ title, excerpt, mdx, seo_title, seo_description, status: body.status, scheduled_at: body.scheduled_at, generateImage: body.generateImage, coverPrompt: `Foto realista 16:9 filhote Spitz Alemão ${topic}`, coverAlt: `Filhote Spitz Alemão - ${topic}`, extras: { contentBlocks, readingTime, faqItems } });
    if (tags && tags.length) { try { await persistTags(insertedId, tags); } catch {} }
    await updateSession({ phase:'done', progress:100, status:'completed', post_id: insertedId });
    logAdminAction({ route:'/api/admin/blog/ai/generate-post', method:'POST', action:'generate_post', payload:{ topic, post_id: insertedId } });
    return NextResponse.json({ ok: true, slug, title, excerpt, tags, cover_url, post_id: insertedId, reading_time: readingTime, session_id: sessionId });
  } catch (e:any) {
    await updateSession({ status:'error', error_message: e?.message||'erro' });
    logAdminAction({ route:'/api/admin/blog/ai/generate-post', method:'POST', action:'generate_post_error', payload:{ topic, error: e?.message } });
    return NextResponse.json({ ok:false, error: e.message, session_id: sessionId });
  }
}

function buildOutline(scope: string): SectionOutline[] {
  const base: SectionOutline[] = [
    { id: 'intro', heading: 'Introdução', goal: 'Contextualizar o tema e relação com Spitz Alemão (Lulu da Pomerânia).'},
    { id: 'historia', heading: 'História e Origem', goal: 'Breve origem e evolução da raça.'},
    { id: 'fisicas', heading: 'Características Físicas', goal: 'Tamanho, pelagem, longevidade.'},
    { id: 'temperamento', heading: 'Temperamento (Filhote vs Adulto)', goal: 'Comparar fases comportamentais.'},
    { id: 'desenvolvimento', heading: 'Desenvolvimento do Filhote', goal: 'Marcos 0-2m, 2-6m, 6-12m.'},
    { id: 'cuidados', heading: 'Cuidados Essenciais', goal: 'Rotina, higiene, ambiente.'},
    { id: 'socializacao', heading: 'Socialização', goal: 'Exposição controlada estímulos e outros cães.'},
    { id: 'alimentacao-fil', heading: 'Alimentação Filhote', goal: 'Frequência, ração adequada.'},
    { id: 'alimentacao-adu', heading: 'Alimentação Adulto', goal: 'Manutenção e ajustes.'},
    { id: 'saude', heading: 'Saúde Preventiva', goal: 'Vacinas, vermífugos, sinais de alerta.'},
    { id: 'grooming', heading: 'Grooming e Pelagem', goal: 'Escovação, banho, subpelo.'},
    { id: 'exercicios', heading: 'Exercícios e Enriquecimento', goal: 'Estimulação mental, passeios.'},
    { id: 'treinamento', heading: 'Treinamento Básico', goal: 'Comandos iniciais e reforço positivo.'},
    { id: 'problemas', heading: 'Problemas Comportamentais Comuns', goal: 'Latidos, ansiedade, mordidas.'},
    { id: 'faq', heading: 'FAQ', goal: 'Perguntas frequentes (>=5).'},
    { id: 'recursos', heading: 'Recursos e CTA', goal: 'Links internos e chamada para ação.'}
  ];
  return base;
}

function safeJSON(str: string): any {
  try { return JSON.parse(str); } catch {}
  const fb = str.match(/\{[\s\S]*\}$/); if (fb) { try { return JSON.parse(fb[0]); } catch {} }
  return {};
}

function composeMDX(topic: string, sections: {heading:string; content:string}[]): string {
  const lines: string[] = [`# ${buildTitle(topic, 'guia-completo')}`, ''];
  for (const s of sections) {
    if (!/^#+\s/.test(s.content.trim())) {
      lines.push(`## ${s.heading}`); lines.push(s.content.trim());
    } else {
      lines.push(s.content.trim());
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

function buildTitle(topic: string, scope: string): string {
  const clean = sanitizeTopic(topic);
  if (scope === 'filhote') return `Guia Filhote de Spitz Alemão: ${clean}`;
  if (scope === 'adulto') return `Spitz Alemão Adulto: ${clean}`;
  return `Guia Completo Spitz Alemão: ${clean}`;
}

function buildExcerpt(mdx: string, topic: string): string {
  const plain = mdx.replace(/[#>*`_\-]/g,' ').replace(/\s+/g,' ').trim();
  return (plain.slice(0, 155) || `Tudo sobre ${topic} no contexto do Spitz Alemão.`);
}

function buildTags(kw?: string[]): string[] { return Array.from(new Set([ 'Spitz Alemão','Lulu da Pomerânia','filhote','guia', ...(kw||[])] )).slice(0,8); }

function ensureRequiredSections(mdx: string): string {
  const required = [ '## História e Origem','## Características Físicas','## Temperamento (Filhote vs Adulto)','## Desenvolvimento do Filhote','## Cuidados Essenciais','## Socialização','## Alimentação Filhote','## Alimentação Adulto','## Saúde Preventiva','## Grooming e Pelagem','## Exercícios e Enriquecimento','## Treinamento Básico','## Problemas Comportamentais Comuns','## FAQ','## Recursos e CTA'];
  for (const r of required) {
    if (!new RegExp('^'+r.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&'),'m').test(mdx)) {
      // Preenche com bloco mínimo útil em vez de placeholder genérico
      const hint = r.includes('Recursos') ? `Links internos recomendados:\n- [Filhotes disponíveis](/filhotes)\n- [Como comprar](/como-comprar)\n- [Fale conosco](/contato)\n\nCTA: Agende uma conversa para saber disponibilidade de ninhadas.` : 'Resumo prático desta seção será expandido em revisão.';
      mdx += `\n\n${r}\n${hint}`;
    }
  }
  return mdx.trim();
}

function sanitizeTopic(t: string){
  return t.replace(/["'`]+/g,'').replace(/\b(assunto do artigo)\b/gi,'Spitz Alemão');
}

function refineMDX(mdx: string, topic: string){
  let out = mdx;
  // Remover citações literais exageradas do título
  out = out.replace(/Guia Completo Spitz Alemão:\s+"([^"]+)"/gi,(m,inner)=>`Guia Completo Spitz Alemão: ${inner}`);
  out = out.replace(/"Assunto do artigo"/gi, sanitizeTopic(topic));
  // Enriquecer seções muito curtas (< 40 palavras)
  out = out.replace(/^(##\s+[^\n]+)\n([^#\n]{0,240})$/gm,(match, heading, body)=>{
    const wc = (body.match(/\b\w+\b/g)||[]).length;
    if(wc>40) return match;
    const add = `\n\nChecklist rápido:\n- Contexto específico do Spitz Alemão\n- Exemplo prático diário\n- Erro comum para evitar\n\nDica: Observe sinais sutis de estresse ou desconforto e ajuste a rotina.`;
    return `${heading}\n${body.trim()}${add}`;
  });
  // CTA Section enhancement
  out = out.replace(/##\s+Recursos e CTA[\r\n]+(?!Links internos)([\s\S]*?)(?=^##\s|$)/m,(m,body)=>{
    const links = `Links internos recomendados:\n- [Filhotes disponíveis](/filhotes)\n- [Como comprar](/como-comprar)\n- [Socialização](/blog)\n\nCTA: Entre em contato para conhecer a próxima ninhada e receber dicas personalizadas.`;
    return `## Recursos e CTA\n${links}`;
  });
  return out;
}

function injectInternalLinks(mdx: string): string {
  const needed = [ { anchor: 'Filhotes disponíveis', href: '/filhotes', re: /\]\(\/filhotes\)/ }, { anchor: 'Como comprar', href: '/como-comprar', re: /\]\(\/como-comprar\)/ }, { anchor: 'Fale conosco', href: '/contato', re: /\]\(\/contato\)/ } ];
  let out = mdx;
  for (const n of needed) if (!n.re.test(out)) out += `\n\n[${n.anchor}](${n.href})`;
  return out;
}

function ensureFAQMinimum(mdx: string): string {
  // Conta quantas perguntas existem após '## FAQ'
  if (!/## FAQ/m.test(mdx)) return mdx; // já garantido antes, mas por segurança
  const faqSectionMatch = mdx.match(/## FAQ[\s\S]*/);
  if (!faqSectionMatch) return mdx;
  const current = faqSectionMatch[0];
  const qMatches = current.match(/###\s+.+/g) || [];
  if (qMatches.length >= 5) return mdx;
  const needed = 5 - qMatches.length;
  const samples = [
    { q: 'Spitz Alemão late muito?', a: 'Pode vocalizar; treino de reforço positivo ajuda a reduzir.' },
    { q: 'Quando trocar ração de filhote para adulto?', a: 'Em geral aos 12 meses, com orientação veterinária.' },
    { q: 'Precisa de muito exercício?', a: 'Exercício moderado diário e enriquecimento mental já satisfazem.' },
    { q: 'Perde muito pelo?', a: 'Trocas sazonais; escovação regular minimiza acúmulo.' },
    { q: 'Adapta-se a apartamento?', a: 'Sim, desde que tenha estímulo mental e rotina estruturada.' },
  ];
  let toAppend = '';
  for (let i=0;i<samples.length && i<needed;i++) {
    toAppend += `\n### ${samples[i].q}\n${samples[i].a}\n`;
  }
  return mdx + toAppend.trimEnd();
}

async function persistPost(opts: { title: string; excerpt: string; mdx: string; seo_title: string; seo_description: string; status?: string; scheduled_at?: string|null; generateImage?: boolean; coverPrompt: string; coverAlt: string; extras?: PersistExtras; }) {
  const { title, excerpt, mdx, seo_title, seo_description, status, scheduled_at, generateImage, coverPrompt, coverAlt, extras } = opts;
  const sb = supabaseAdmin();
  const slug = slugify(title);
  let inserted: any = null; let lastErr: any = null;
  const isPublished = (status||'draft') === 'published';
  const published_at = isPublished ? new Date().toISOString() : null;
  for (let i=0;i<3;i++) {
    const attempt = i===0? slug : `${slug}-${i+1}`;
    const { data, error } = await sb.from('blog_posts').insert([{ slug: attempt, title, excerpt, content_mdx: mdx, seo_title, seo_description, status: status||'draft', scheduled_at: scheduled_at||null, published_at, reading_time: extras?.readingTime || null, content_blocks_json: extras?.contentBlocks || null }]).select('id,slug').single();
    if (!error && data) { inserted = data; break; }
    lastErr = error; if (error && !/duplicate|unique/i.test(error.message)) break;
  }
  if (!inserted) throw lastErr || new Error('Falha ao inserir post');

  // Criar revisão inicial
  try {
    await sb.from('blog_post_revisions').insert([{ post_id: inserted.id, snapshot: { title, excerpt, seo_title, seo_description, content_mdx: mdx, content_blocks_json: extras?.contentBlocks, reading_time: extras?.readingTime, faq: extras?.faqItems || [] }, reason: 'initial-create' }]);
  } catch {}
  let cover_url: string | undefined;
  if (generateImage) {
    try {
      // chamada interna (assumindo mesmo host)
      const imgRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/admin/blog/ai/image`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: coverPrompt, alt: coverAlt }) });
      if (imgRes.ok) { const j = await imgRes.json(); cover_url = j.url; }
    } catch {}
    if (cover_url) await sb.from('blog_posts').update({ cover_url, og_image_url: cover_url }).eq('id', inserted.id);
  }
  try { revalidatePath('/blog'); revalidatePath(`/blog/${inserted.slug}`); } catch {}
  return { slug: inserted.slug, insertedId: inserted.id, cover_url };
}

function slugify(s: string): string { return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}+/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,''); }

async function persistTags(postId: string, tagNames: string[]) {
  const sb = supabaseAdmin();
  const cleaned = Array.from(new Set(tagNames.map(t=> (t||'').trim()).filter(Boolean)) ).slice(0,8);
  if (!cleaned.length) return;
  const rows = cleaned.map(name => ({ slug: tagSlug(name), name }));
  const { data: up } = await sb.from('blog_tags').upsert(rows, { onConflict: 'slug' }).select('id,slug');
  const upRows = (up || []) as { id: string; slug: string }[];
  const map = new Map<string,string>(upRows.map((r)=>[r.slug, r.id]));
  const linkRows: { post_id: string; tag_id: string }[] = [];
  for (const r of rows) {
    const id = map.get(r.slug); if (id) linkRows.push({ post_id: postId, tag_id: id });
  }
  if (linkRows.length) {
  const existing = await sb.from('blog_post_tags').select('tag_id').eq('post_id', postId);
  const present = new Set(((existing.data||[]) as { tag_id: string }[]).map((x)=>x.tag_id));
    const toInsert = linkRows.filter(l=>!present.has(l.tag_id));
    if (toInsert.length) await sb.from('blog_post_tags').insert(toInsert);
  }
}

function tagSlug(s: string): string { return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}+/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,''); }

function extractFAQ(mdx: string): { q: string; a: string }[] {
  const faqIndex = mdx.indexOf('## FAQ');
  if (faqIndex === -1) return [];
  const after = mdx.slice(faqIndex);
  const qa = Array.from(after.matchAll(/###\s+([^\n]+)\n([^#]+)/g));
  return qa.map(m=> ({ q: m[1].trim(), a: m[2].trim() }));
}

function calcReadingTime(mdx: string): number {
  const words = (mdx.replace(/```[\s\S]*?```/g,'').match(/\b\w+\b/g) || []).length;
  return Math.max(1, Math.round(words / 200));
}

function buildContentBlocks(mdx: string, faq: {q:string;a:string}[]) {
  const headings = Array.from(mdx.matchAll(/^##\s+(.+)$/gm)).map(h=>h[1].trim());
  return { headings, faq, version: 1 };
}

async function ensureMinWords(mdx: string, min: number, openaiKey: string|undefined, temperature: number, topic: string): Promise<string> {
  const count = (mdx.match(/\b\w+\b/g) || []).length;
  if (count >= min) return mdx;
  // Se não houver chave OpenAI, faz expansão simples duplicando seções com mais detalhes placeholder.
  if (!openaiKey) {
    const deficit = min - count;
    const filler = `\n\n## Detalhamento Adicional\n${Array.from({length: Math.ceil(deficit/120)}).map((_,i)=>`Parágrafo de aprofundamento (${i+1}) sobre ${topic}, cobrindo aspectos práticos, exemplos reais e dicas aplicáveis para tutores de Spitz Alemão.`).join('\n\n')}`;
    return (mdx + filler).trim();
  }
  try {
    const prompt = `O texto abaixo tem aproximadamente ${count} palavras. Expanda de forma NATURAL até pelo menos ${min} palavras, mantendo o estilo, adicionando exemplos práticos, dicas avançadas, erros comuns a evitar e mini checklists. NÃO reescreva tudo do zero: apenas acrescente onde fizer sentido. Responda somente o MDX expandido.\n\n--- TEXTO INICIAL ---\n${mdx}`;
    const res = await fetch('https://api.openai.com/v1/chat/completions', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${openaiKey}`}, body: JSON.stringify({ model:'gpt-4o-mini', temperature: Math.min(0.75, temperature+0.1), messages:[{role:'user', content: prompt}], max_tokens: 4096 }) });
    if (!res.ok) return mdx; // fallback silencioso
    const j = await res.json();
    const expanded = j.choices?.[0]?.message?.content || mdx;
    const newCount = (expanded.match(/\b\w+\b/g) || []).length;
    if (newCount < min) {
      // última tentativa: append filler curto
      return expanded + `\n\n### Checklist Rápido\n- Revisão de saúde\n- Socialização planejada\n- Enriquecimento mental diário\n- Rotina de grooming\n- Ajuste nutricional trimestral`;
    }
    return expanded;
  } catch { return mdx; }
}
