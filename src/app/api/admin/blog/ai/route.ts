// PATH: src/app/api/admin/blog/ai/route.ts
import { NextRequest } from 'next/server';

import type { EditorAIRequest, EditorAIResponse } from '@/lib/blog/types';

// Placeholder de provedor IA: supõe existência de variável de ambiente já configurada (ex: OPENAI_API_KEY ou AZURE_OPENAI_KEY)
// Não expõe secrets; apenas chama fetch na API configurada. Substituir internamente conforme stack atual.
async function callProvider(prompt: string, opts?: { temperature?: number }): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY || '';
  if (!apiKey) return 'Configurar chave de IA para respostas reais.';
  // Exemplo minimalista (adapte ao provedor real do projeto)
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [ { role: 'user', content: prompt } ],
        temperature: opts?.temperature ?? 0.7,
        max_tokens: 800,
      }),
    });
    if (!res.ok) return `Erro provider (${res.status})`;
    const json: any = await res.json();
    return json.choices?.[0]?.message?.content?.trim() || '';
  } catch (err: any) {
    return 'Erro de rede ao chamar provedor IA';
  }
}

function buildPrompt(req: EditorAIRequest): string {
  const baseLocale = req.locale || 'pt-BR';
  switch (req.mode) {
    case 'title':
      return `Gere 5 títulos atraentes em ${baseLocale} para um post sobre: ${req.topic || req.currentText || 'tema não informado'}. Use variações concisas (<= 60 caracteres). Liste em linhas.`;
    case 'subtitle':
      return `Gere 3 subtítulos complementares (<= 120 caracteres) em ${baseLocale} para o título: ${req.topic || 'sem título'}.`;
    case 'outline':
      return `Monte um outline (H2 e H3) para post em ${baseLocale} sobre: ${req.topic}. Saída: JSON com array de objetos {"heading":"H2","children":["H3",...]}.`;
    case 'section':
      return `Escreva uma seção em ${baseLocale} com heading: ${req.sectionHeading}. Tom: ${req.tone || 'informativo'}. Público: ${req.audience || 'tutores de cães'}. Contexto existente: ${req.currentText || 'n/a'}. Saída em MDX leve (sem exageros).`;
    case 'full':
      return `Escreva rascunho MDX completo em ${baseLocale} para: ${req.topic}. Inclua headings (H2/H3), parágrafos curtos, listas se cabível. Não invente dados clínicos. Terminar com CTA sutil.`;
    case 'tags':
      return `Sugira até 8 tags (palavras ou pequenas frases) em ${baseLocale} separadas por vírgula para: ${req.topic || req.currentText}.`;
    case 'meta':
      return `Escreva meta description (<= 155 caracteres) em ${baseLocale} para: ${req.topic || req.currentText}. Tom claro e atrativo, sem clickbait exagerado.`;
    case 'altText':
      return `Gere texto alternativo descritivo (<= 120 caracteres) em ${baseLocale} para imagem: ${req.imageContext || req.topic || 'sem contexto'}. Não iniciar com 'Imagem de'.`;
    case 'coverIdea':
      return `Sugira um prompt de imagem (estilo realista fotográfico) em ${baseLocale} para gerar uma capa sobre: ${req.topic || 'tema'}. Incluir composição, iluminação e foco.`;
    default:
      return 'Modo desconhecido.';
  }
}

function parseOutline(raw: string): { heading: string; children?: string[] }[] | undefined {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/) || raw.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    if (Array.isArray(parsed)) return parsed as any;
    if (Array.isArray(parsed.outline)) return parsed.outline;
  } catch {}
  return undefined;
}

export async function POST(req: NextRequest) {
  let body: EditorAIRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'JSON inválido' }), { status: 400 });
  }
  if (!body.mode) {
    return new Response(JSON.stringify({ ok: false, error: 'Campo mode obrigatório' }), { status: 400 });
  }
  const prompt = buildPrompt(body);
  const raw = await callProvider(prompt, { temperature: body.mode === 'outline' ? 0.3 : 0.7 });
  const res: EditorAIResponse = { ok: true, mode: body.mode };

  if (body.mode === 'title' || body.mode === 'subtitle') {
    const lines = raw.split(/\n+/).map(l => l.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean);
    res.suggestions = lines.slice(0, 8);
  } else if (body.mode === 'outline') {
    res.outline = parseOutline(raw) || [];
  } else if (body.mode === 'section' || body.mode === 'full') {
    res.content = raw;
  } else if (body.mode === 'tags') {
    const tags = raw.split(/[,\n]/).map(t => t.trim().toLowerCase()).filter(Boolean);
    res.tags = Array.from(new Set(tags)).slice(0, 8);
  } else if (body.mode === 'meta') {
    res.metaDescription = raw.replace(/\n+/g, ' ').trim().slice(0, 180);
  } else if (body.mode === 'altText') {
    res.altText = raw.replace(/\n+/g, ' ').trim().slice(0, 140);
  } else if (body.mode === 'coverIdea') {
    res.coverPrompt = raw.trim();
  }

  return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
