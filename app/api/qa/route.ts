export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { embedText, lexicalFallback, rankChunks } from "@/lib/rag";
import { rateLimit } from "@/lib/rateLimit";
import { supabasePublic } from "@/lib/supabasePublic";

interface QaRequestBody { q?: string }
interface BlogPostRow { id: string; slug: string; title: string; content_mdx?: string | null; excerpt?: string | null }
interface ChunkCandidate { id: string; slug: string; title: string; content: string; anchor?: string; offset: number; embedding?: number[] }

export const runtime = "edge";

// Simple QA endpoint: retrieves candidate chunks (naive split) then ranks.
// Simple in-memory embedding cache (query -> vector) ephemeral
const EMB_CACHE = new Map<string, { v:number[]; t:number }>();

export async function POST(req: Request){
  const body: QaRequestBody = await req.json().catch(()=>({}));
  const q: string = (body.q||'').slice(0,300);
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
      // Batch embed up to 50 chunks in groups to reduce latency (simplified serial here)
      for(const c of chunks.slice(0,120)){
        c.embedding = await embedText(c.content);
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
