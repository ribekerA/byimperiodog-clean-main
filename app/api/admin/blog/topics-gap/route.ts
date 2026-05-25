import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Matriz de tópicos estratégicos (clusters principais + subtemas)
// slugBase sem prefixo /blog
const TOPIC_MATRIX: { slug: string; title: string; cluster: string; priority: number; scope?: 'guia-completo' | 'filhote' | 'adulto' }[] = [
  { slug: 'guia-completo-spitz-alemao', title: 'Guia Completo do Spitz Alemão (Lulu da Pomerânia)', cluster: 'Guia', priority: 1, scope: 'guia-completo' },
  { slug: 'socializacao-spitz-alemao', title: 'Socialização do Spitz Alemão: Etapas e Práticas', cluster: 'Comportamento', priority: 2, scope: 'filhote' },
  { slug: 'adestramento-basico-spitz', title: 'Adestramento Básico do Spitz Alemão: Comandos Essenciais', cluster: 'Comportamento', priority: 2, scope: 'filhote' },
  { slug: 'comportamento-latidos-spitz', title: 'Latidos do Spitz Alemão: Como Reduzir e Entender', cluster: 'Comportamento', priority: 3 },
  { slug: 'ansiedade-separacao-spitz', title: 'Ansiedade de Separação no Spitz Alemão: Prevenção e Manejo', cluster: 'Comportamento', priority: 3 },
  { slug: 'enriquecimento-mental-spitz', title: 'Enriquecimento Mental para Spitz Alemão: Jogos e Rotina', cluster: 'Comportamento', priority: 3 },
  { slug: 'alimentacao-filhote-spitz', title: 'Alimentação do Filhote de Spitz Alemão: Guia Completo', cluster: 'Alimentação', priority: 2, scope: 'filhote' },
  { slug: 'alimentacao-adulto-spitz', title: 'Alimentação do Spitz Alemão Adulto: Manutenção e Ajustes', cluster: 'Alimentação', priority: 2, scope: 'adulto' },
  { slug: 'saude-vacinas-spitz', title: 'Vacinas Essenciais e Calendário do Spitz Alemão', cluster: 'Saúde', priority: 2 },
  { slug: 'vermifugacao-spitz', title: 'Vermifugação e Parasitas no Spitz Alemão', cluster: 'Saúde', priority: 3 },
  { slug: 'doencas-comuns-spitz', title: 'Doenças Comuns no Spitz Alemão: Prevenção e Sinais', cluster: 'Saúde', priority: 3 },
  { slug: 'cuidados-dentarios-spitz', title: 'Saúde Bucal do Spitz Alemão: Placa, Higiene e Rotina', cluster: 'Saúde', priority: 4 },
  { slug: 'grooming-pelagem-spitz', title: 'Pelagem e Grooming do Spitz Alemão: Escovações e Banhos', cluster: 'Grooming', priority: 2 },
  { slug: 'queda-de-pelos-spitz', title: 'Queda de Pelos no Spitz Alemão: Ciclos e Manejo', cluster: 'Grooming', priority: 3 },
  { slug: 'tamanho-e-peso-spitz', title: 'Tamanho e Peso do Spitz Alemão: Expectativas e Variações', cluster: 'Guia', priority: 3 },
  { slug: 'reproducao-cio-spitz', title: 'Cio e Reprodução no Spitz Alemão: Responsabilidade e Ética', cluster: 'Guia', priority: 4 },
  { slug: 'adaptacao-apartamento-spitz', title: 'Spitz Alemão em Apartamento: Rotina e Adaptação', cluster: 'Estilo de Vida', priority: 3 },
  { slug: 'custo-manutencao-spitz', title: 'Custos do Spitz Alemão: Manutenção Mensal e Prevenções', cluster: 'Compra & Planejamento', priority: 2 },
  { slug: 'comprar-filhote-spitz', title: 'Como Escolher um Bom Criador de Spitz Alemão', cluster: 'Compra & Planejamento', priority: 1 },
  { slug: 'checklist-preparar-casa-spitz', title: 'Checklist: Preparando a Casa para um Filhote de Spitz', cluster: 'Compra & Planejamento', priority: 2, scope: 'filhote' },
];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sb = supabaseAdmin();
    const { data, error } = await sb.from('blog_posts').select('slug');
    if (error) throw error;
  const existing = new Set((data || []).map((r:{slug:string}) => String(r.slug)));

    const topics = TOPIC_MATRIX.map(t => ({
      ...t,
  exists: existing.has(t.slug) || Array.from(existing).some((s:any) => String(s).startsWith(t.slug + '-')),
    })).sort((a,b)=> a.priority - b.priority || a.slug.localeCompare(b.slug));

    const missing = topics.filter(t=>!t.exists);
    const coveragePercent = Math.round(((topics.length - missing.length) / topics.length) * 100);

    // random suggestion (prioriza missing, depois menor prioridade)
    let random: any = null;
    if (missing.length) {
      random = missing[Math.floor(Math.random()*missing.length)];
    } else {
      random = topics[Math.floor(Math.random()*topics.length)];
    }

    return NextResponse.json({ ok: true, topics, missingCount: missing.length, total: topics.length, coveragePercent, suggestion: random });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';