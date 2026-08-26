export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { corpoJson } from "@/lib/limitePublico";
import { embedText, lexicalFallback, rankChunks } from "@/lib/rag";
import { rateLimit } from "@/lib/rateLimit";
import { supabasePublic } from "@/lib/supabasePublic";

interface QaRequestBody { q?: string }
interface BlogPostRow { id: string; slug: string; title: string; content_mdx?: string | null; excerpt?: string | null }
interface ChunkCandidate { id: string; slug: string; title: string; content: string; anchor?: string; offset: number; embedding?: number[] }

export const runtime = "nodejs";

// Simple QA endpoint: retrieves candidate chunks (naive split) then ranks.
//
// Teto de embeddings por requisição. Antes eram até 120 chamadas seriais à
// OpenAI por POST, uma por trecho de post -- e o rate limit permite 8 POSTs
// em rajada por IP, então uma pessoa sozinha podia disparar quase mil
// chamadas pagas. Com o cache abaixo, as requisições seguintes reaproveitam
// o vetor de cada trecho e o custo real cai para perto de zero.
const MAX_EMBEDDINGS_POR_REQ = 24;

// Cache de embedding por trecho (conteúdo -> vetor). Vive na memória da
// instância e some no cold start; é otimização de custo, não estado.
const EMB_CACHE = new Map<string, { v:number[]; t:number }>();
const EMB_TTL_MS = 30 * 60_000;
const EMB_CACHE_MAX = 500;

function embeddingEmCache(chave: string): number[] | undefined {
  const achado = EMB_CACHE.get(chave);
  if (!achado) return undefined;
  if (Date.now() - achado.t > EMB_TTL_MS) { EMB_CACHE.delete(chave); return undefined; }
  return achado.v;
}

function guardarEmbedding(chave: string, v: number[]) {
  if (EMB_CACHE.size >= EMB_CACHE_MAX) {
    const maisAntiga = EMB_CACHE.keys().next().value;
    if (maisAntiga !== undefined) EMB_CACHE.delete(maisAntiga);
  }
  EMB_CACHE.set(chave, { v, t: Date.now() });
}

export async function POST(req: Request){
  const lido = await corpoJson<QaRequestBody>(req, 4 * 1024);
  if (lido.resposta) return lido.resposta;
  const body = lido.dados ?? {};
  const q: string = (typeof body.q === 'string' ? body.q : '').slice(0,300);
  if(!q) return NextResponse.json({ ok:false, error:'q vazio' }, { status:400 });
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const rl = rateLimit(`qa:${ip}`, { capacity: 8, refillPerSec: 0.05 }); // ~1 nova a cada 20s além do burst
  if(!rl.allowed) return NextResponse.json({ ok:false, error:'rate_limited', retryAfterSec: Math.ceil((1)/0.05) }, { status:429 });
  // Fetch latest published posts (limit for performance)
  const sb = supabasePublic();
  const { data } = await sb.from('blog_posts')
    .select('id,slug,title,content_mdx,excerpt')
    .eq('status','published')
    .order('published_at', { ascending:false })
    .limit(40);
  const posts: BlogPostRow[] = (data as BlogPostRow[]) || [];
  // Build chunks (very naive: split paragraphs)
  const chunks: ChunkCandidate[] = posts.flatMap((p: BlogPostRow) => {
    const raw = (p.content_mdx || '');
    // Split by double newline; capture heading anchors (# or ##...) to build fragment id references
    const parts = raw.split(/\n{2,}/).slice(0,40);
    let charOffset = 0;
    return parts.map((part: string, i: number) => {
      const clean = part.replace(/[#>*`]/g,'').slice(0,1200);
      const headingMatch = part.match(/^#+\s+([^\n]+)/);
      const heading = headingMatch ? headingMatch[1].trim() : undefined;
      const anchor = heading ? heading.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') : undefined;
      const chunk = { id:`${p.id}-${i}`, slug:p.slug, title:p.title, content: clean, anchor, offset: charOffset };
      charOffset += part.length + 2;
      return chunk;
    });
  }).filter((c: ChunkCandidate) => c.content.length > 60);

  // Precompute embeddings if OpenAI key present (otherwise lexical fallback will handle)
  const key = process.env.OPENAI_API_KEY;
  if(key){
    try {
      let pagas = 0;
      for(const c of chunks){
        const emCache = embeddingEmCache(c.content);
        if(emCache){ c.embedding = emCache; continue; }
        // Só o que não está em cache consome cota. Ao bater o teto, o
        // restante fica sem vetor: rankChunks trabalha com os que têm, e
        // se nenhum tiver, o lexicalFallback responde.
        if(pagas >= MAX_EMBEDDINGS_POR_REQ) break;
        pagas++;
        const vetor = await embedText(c.content);
        c.embedding = vetor;
        guardarEmbedding(c.content, vetor);
      }
    } catch(e){ /* ignore errors */ }
  }

  let ranked: { chunk:any; score:number }[] = [];
  if(chunks.some((c: ChunkCandidate) => c.embedding)) ranked = await rankChunks(q, chunks, 8); else ranked = lexicalFallback(q, chunks, 8);

  // Build answer (extractive: top 2-3 sentences from best chunk)
  const top = ranked[0];
  const answer = top ? top.chunk.content.split(/(?<=[.!?])\s+/).slice(0,3).join(' ') : 'Não encontrei conteúdo relevante para sua pergunta ainda.';
  const citations = ranked.map(r=> ({ slug: r.chunk.slug, snippet: r.chunk.content.slice(0,220), score: r.score, anchor: r.chunk.anchor || null, offset: r.chunk.offset }));
  return NextResponse.json({ ok:true, q, answer, citations });
}
