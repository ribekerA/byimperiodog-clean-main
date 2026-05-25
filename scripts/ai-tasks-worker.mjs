#!/usr/bin/env node
/* eslint-disable no-console */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('[ai-worker] Missing SUPABASE env');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function fetchNextTask() {
  const { data, error } = await sb
    .from('ai_tasks')
    .select('id,type,topic,payload,status,progress')
    .in('status', ['pending'])
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

async function markRunning(id) {
  await sb
    .from('ai_tasks')
    .update({ status: 'running', progress: 10, started_at: new Date().toISOString() })
    .eq('id', id);
}

async function completeTask(id, result) {
  await sb
    .from('ai_tasks')
    .update({ status: 'done', progress: 100, result, finished_at: new Date().toISOString() })
    .eq('id', id);
}

async function errorTask(id, message) {
  await sb
    .from('ai_tasks')
    .update({ status: 'error', progress: 100, error_message: message, finished_at: new Date().toISOString() })
    .eq('id', id);
}

async function updateSession(sessionId) {
  const { data: tasks } = await sb
    .from('ai_tasks')
    .select('status,progress,type')
    .contains('payload', { session_id: sessionId });
  if (!tasks || !tasks.length) return;
  const progress = Math.round(tasks.reduce((acc, task) => acc + (task.progress || 0), 0) / tasks.length);
  const allDone = tasks.every((task) => task.status === 'done');
  const anyError = tasks.some((task) => task.status === 'error');
  const nextPhase =
    tasks.find((task) => task.status === 'pending' || task.status === 'running')?.type || tasks[tasks.length - 1].type;
  await sb
    .from('ai_generation_sessions')
    .update({ progress, phase: nextPhase, status: anyError ? 'error' : allDone ? 'completed' : 'active' })
    .eq('id', sessionId);
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function callOpenAI(messages, response_format = { type: 'json_object' }) {
  if (!OPENAI_KEY) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.6,
        response_format,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`openai ${res.status}: ${text}`);
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content);
  } catch (error) {
    console.warn('[ai-worker] OpenAI call failed', error?.message || error);
    return null;
  }
}

function fallbackResearch(topic) {
  const normalized = topic.trim();
  const baseSlug = slugify(normalized) || 'spitz-alemao';
  const primary = normalized.toLowerCase().includes('spitz') ? normalized : `${normalized} Spitz Alemão`;
  const secondary = [
    `${normalized} cuidados`,
    `${normalized} filhote`,
    `${normalized} guia completo`,
    'Spitz Alemão saúde',
    'Lulu da Pomerânia alimentação',
  ];
  const internal = [
    { href: '/blog/cuidados-gerais-spitz', anchor: 'Cuidados gerais com Spitz' },
    { href: '/blog/como-cuidar-do-seu-spitz-alemao-anao', anchor: 'Guia completo de cuidados' },
    { href: '/filhotes', anchor: 'Veja filhotes disponíveis' },
  ];
  return {
    topic: normalized,
    search_intent: 'informational + transactional',
    primary_keyword: primary,
    secondary_keywords: [...new Set(secondary)],
    audience: 'Tutores e futuros compradores de Spitz Alemão',
    angle: 'Guia completo com foco em saúde, bem-estar e experiência de compra segura',
    competitor_urls: [
      'https://www.akc.org/dog-breeds/pomeranian/',
      'https://pt.wikipedia.org/wiki/Spitz-alem%C3%A3o',
      'https://blog.cobasi.com.br/spitz-alemao/',
    ],
    related_questions: [
      `Como cuidar de ${normalized.toLowerCase()} em climas quentes?`,
      'Qual a melhor alimentação para Spitz filhote?',
      'Quais vacinas são obrigatórias para Lulu da Pomerânia?',
      'Como preparar o enxoval do filhote?'
    ],
    internal_links: internal,
    slug_hint: baseSlug,
  };
}

function fallbackOutline(topic, research) {
  return {
    headline: `Guia definitivo: ${topic}`,
    summary: `Estrutura sugerida para abordar ${topic} com foco em SEO e experiência do tutor.`,
    sections: [
      {
        id: 'intro',
        heading: 'Introdução e contexto',
        goal: `Apresentar por que ${topic.toLowerCase()} é importante para tutores de Spitz Alemão`,
        key_points: ['Resumo rápido', 'Benefícios do conteúdo', 'Como o leitor será guiado'],
      },
      {
        id: 'historia',
        heading: 'História e origem do Spitz Alemão',
        goal: 'Resgatar a origem da raça, evolução e curiosidades',
        key_points: ['Origem europeia', 'Seleção para companhia', 'Características preservadas'],
      },
      {
        id: 'fisico',
        heading: 'Características físicas e comportamento',
        goal: 'Detalhar aparência, pelagem, peso, personalidade e nível de energia',
        key_points: ['Pelagem dupla', 'Tamanho toy', 'Energia alta e inteligência'],
      },
      {
        id: 'desenvolvimento',
        heading: 'Desenvolvimento do filhote mês a mês',
        goal: 'Oferecer roteiro de cuidados por faixa etária',
        key_points: ['0-2 meses', '2-6 meses', '6-12 meses'],
      },
      {
        id: 'rotina',
        heading: 'Rotina ideal: alimentação, saúde e enriquecimento',
        goal: 'Criar check-list prático de rotina diária',
        key_points: ['Plano alimentar', 'Agenda de vacinas', 'Atividades mentais'],
      },
      {
        id: 'grooming',
        heading: 'Grooming e cuidados com a pelagem',
        goal: 'Ensinar manutenção correta da pelagem e higiene',
        key_points: ['Frequência de escovação', 'Banho seguro', 'Cuidados com subpelo'],
      },
      {
        id: 'faq',
        heading: 'Perguntas frequentes do tutor',
        goal: 'Responder dúvidas frequentes para SEO',
        key_points: research?.related_questions || [],
      },
      {
        id: 'cta',
        heading: 'Próximos passos e CTA',
        goal: 'Encerrar com motivação e proposta de contato',
        key_points: ['Consulta especializada', 'Vídeo dos filhotes', 'Acompanhamento pós-venda'],
      },
    ],
  };
}

function buildFaqFromOutline(outline) {
  const faqSection = outline?.sections?.find((section) => section.id === 'faq');
  if (!faqSection) return [];
  return (faqSection.key_points || []).map((question) => ({
    question,
    answer: `${question} — resposta detalhada com foco em tutores de Spitz Alemão.`,
  }));
}

function fallbackDraft(topic, outline, research) {
  const sections = outline?.sections || [];
  const lines = [`# ${outline?.headline || topic}`, ''];
  sections.forEach((section) => {
    const heading = section.heading || 'Seção';
    lines.push(`## ${heading}`);
    const paragraph = section.goal
      ? `${section.goal}. Aborde ${section.key_points?.join(', ') || 'os principais pontos'} com exemplos reais.`
      : `Detalhes sobre ${heading.toLowerCase()}.`;
    lines.push(paragraph);
    if (section.key_points?.length) {
      section.key_points.forEach((point) => {
        lines.push(`- ${point}`);
      });
    }
    lines.push('');
  });
  lines.push('## Recursos indicados');
  lines.push('- Contato direto: [/contato](/contato)');
  lines.push('- Ver filhotes disponíveis: [/filhotes](/filhotes)');
  const faq = buildFaqFromOutline(outline);
  faq.forEach((item) => {
    lines.push('');
    lines.push(`### ${item.question}`);
    lines.push(item.answer);
  });
  const mdx = lines.join('\n');
  return {
    title: outline?.headline || `Guia completo sobre ${topic}`,
    excerpt: `Tudo que você precisa saber sobre ${topic} para garantir um Spitz Alemão saudável e feliz.`,
    mdx,
    faq,
    word_count: mdx.split(/\s+/).length,
    research_context: research || null,
  };
}

function fallbackOptimize(topic, draft, research) {
  const slugSuggestion = slugify(research?.primary_keyword || topic);
  return {
    seo_title: `${topic} | Guia completo Spitz Alemão`,
    seo_description: `Aprenda ${topic.toLowerCase()} com orientações práticas para tutores de Spitz Alemão: rotina, saúde, grooming e muito mais.`,
    slug: slugSuggestion,
    h1: draft?.title || topic,
    cta: 'Fale com a equipe By Império Dog e receba vídeo exclusivo dos filhotes disponíveis.',
    alt_texts: [
      `Spitz Alemão feliz durante ${topic.toLowerCase()}`,
      'Tutor cuidando do Lulu da Pomerânia',
      'Detalhes da pelagem do Spitz Alemão',
    ],
    internal_links: research?.internal_links || [],
    meta: {
      'article:section': 'Blog By Império Dog',
      'article:tag': research?.primary_keyword || topic,
    },
  };
}

function fallbackAssets(topic) {
  return {
    cover_prompt: `Foto editorial 16:9 de Spitz Alemão em situação relacionada a ${topic}, iluminação suave, qualidade profissional`,
    cover_alt: `Spitz Alemão durante ${topic.toLowerCase()}`,
    gallery_prompts: [
      `Close do Spitz Alemão em momento de ${topic.toLowerCase()}`,
      'Detalhes da pelagem e cuidados com grooming',
      'Tutor interagindo com Lulu da Pomerânia em ambiente doméstico',
    ],
  };
}

async function fetchPreviousResult(sessionId, type) {
  const { data, error } = await sb
    .from('ai_tasks')
    .select('result')
    .contains('payload', { session_id: sessionId })
    .eq('type', type)
    .maybeSingle();
  if (error) throw error;
  return data?.result || null;
}

async function runResearchTask(topic) {
  const response = await callOpenAI([
    {
      role: 'system',
      content:
        'Você é um estrategista de SEO especializado em nicho pet (Spitz Alemão). Responda em JSON com campos: topic, search_intent, primary_keyword, secondary_keywords[], audience, angle, competitor_urls[], related_questions[], internal_links[{href,anchor,reason}]',
    },
    {
      role: 'user',
      content: `Analise o tópico: ${topic}. Crie briefing SEO focado em intenção informacional/transacional para tutores de Spitz Alemão no Brasil.`,
    },
  ]);
  return response || fallbackResearch(topic);
}

async function runOutlineTask(topic, sessionId) {
  const research = await fetchPreviousResult(sessionId, 'research');
  const outlineAi = await callOpenAI([
    {
      role: 'system',
      content: 'Você estrutura outlines para artigos sobre Spitz Alemão. Responda em JSON com headline, summary, sections[{id,heading,goal,key_points[]}].',
    },
    {
      role: 'user',
      content: `Monte um outline para o tópico "${topic}" usando o briefing: ${JSON.stringify(research || {})}`,
    },
  ]);
  return outlineAi || fallbackOutline(topic, research);
}

async function runDraftTask(topic, sessionId) {
  const outline = await fetchPreviousResult(sessionId, 'outline');
  const research = await fetchPreviousResult(sessionId, 'research');
  const draftAi = await callOpenAI([
    {
      role: 'system',
      content:
        'Você escreve artigos completos em MDX sobre Spitz Alemão. Responda em JSON com campos title, excerpt, mdx, faq[{question,answer}]. Utilize tom consultivo e CTA final.',
    },
    {
      role: 'user',
      content: `Com base neste outline ${JSON.stringify(outline || {})} e briefing ${JSON.stringify(research || {})}, gere artigo completo para o tópico ${topic}.`,
    },
  ], { type: 'json_object' });
  return draftAi || fallbackDraft(topic, outline, research);
}

async function runOptimizeTask(topic, sessionId) {
  const draft = await fetchPreviousResult(sessionId, 'draft');
  const research = await fetchPreviousResult(sessionId, 'research');
  const optimizeAi = await callOpenAI([
    {
      role: 'system',
      content:
        'Você gera metadados SEO para artigos sobre Spitz Alemão. Responda JSON com seo_title, seo_description, slug, h1, cta, alt_texts[], internal_links[{href,anchor,reason}], meta{key:value}.',
    },
    {
      role: 'user',
      content: `Crie otimizações para ${topic} considerando o artigo ${JSON.stringify(draft || {})} e research ${JSON.stringify(research || {})}.`,
    },
  ]);
  return optimizeAi || fallbackOptimize(topic, draft, research);
}

async function runAssetsTask(topic, sessionId) {
  const research = await fetchPreviousResult(sessionId, 'research');
  const assetsAi = await callOpenAI([
    {
      role: 'system',
      content:
        'Você define prompts de imagem e alt-text para artigos de Spitz Alemão. Responda JSON com cover_prompt, cover_alt, gallery_prompts[].',
    },
    {
      role: 'user',
      content: `Gere prompts e descrições para ${topic} considerando ${JSON.stringify(research || {})}.`,
    },
  ]);
  return assetsAi || fallbackAssets(topic);
}

async function processOne() {
  const task = await fetchNextTask();
  if (!task) {
    console.log('[ai-worker] No pending tasks.');
    return false;
  }
  console.log('[ai-worker] Processing task', task.id, task.type);
  await markRunning(task.id);
  const sessionId = task.payload?.session_id;
  try {
    let result;
    const topic = task.topic || 'Spitz Alemão';
    switch (task.type) {
      case 'research':
        result = await runResearchTask(topic);
        break;
      case 'outline':
        result = await runOutlineTask(topic, sessionId);
        break;
      case 'draft':
        result = await runDraftTask(topic, sessionId);
        break;
      case 'optimize':
        result = await runOptimizeTask(topic, sessionId);
        break;
      case 'assets':
        result = await runAssetsTask(topic, sessionId);
        break;
      default:
        result = { note: 'tipo de tarefa não suportado' };
    }
    await completeTask(task.id, result);
  } catch (error) {
    console.error('[ai-worker] Error', error);
    await errorTask(task.id, error instanceof Error ? error.message : 'erro');
  }
  if (sessionId) await updateSession(sessionId);
  return true;
}

async function main() {
  const loop = process.argv.includes('--loop');
  if (loop) {
    console.log('[ai-worker] Loop mode');
    while (true) {
      const processed = await processOne();
      await new Promise((resolve) => setTimeout(resolve, processed ? 1500 : 4000));
    }
  } else {
    await processOne();
  }
}

main();
