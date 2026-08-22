export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";

import { embedTexts, lexicalFallback, rankChunks } from "@/lib/rag";
import { rateLimitRequest, tooManyRequests } from "@/lib/rateLimitDurable";
import { RequestBodyError, readJsonWithLimit } from "@/lib/requestGuards";
import { supabasePublic } from "@/lib/supabasePublic";

interface BlogPostRow { id: string; slug: string; title: string; content_mdx?: string | null; excerpt?: string | null }
interface ChunkCandidate { id: string; slug: string; title: string; content: string; anchor?: string; offset: number; embedding?: number[] }

export const runtime = "edge";

// Simple QA endpoint: retrieves candidate chunks (naive split) then ranks.
// Simple in-memory embedding cache (query -> vector) ephemeral
const requestSchema = z.object({ q: z.string().trim().min(1).max(300) }).strict();

export async function POST(req: Request){
  const rate = await rateLimitRequest(req, { scope: "qa", limit: 8, windowMs: 60_000 });
  if(!rate.allowed) return tooManyRequests(rate);

  let body: unknown;
  try {
    body = await readJsonWithLimit(req, 8 * 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ ok:false, error:'invalid_body' }, { status });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false, error:'q invalido' }, { status:400 });
  const { q } = parsed.data;
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
      // Uma chamada em lote substitui ate 120 chamadas individuais.
      const candidates = chunks.slice(0,120);
      const embeddings = await embedTexts(
        candidates.map((chunk) => chunk.content),
        { signal: AbortSignal.timeout(15_000) },
      );
      candidates.forEach((chunk, index) => { chunk.embedding = embeddings[index]; });
    } catch(e){ /* ignore errors */ }
  }

  let ranked: { chunk:any; score:number }[] = [];
  if(chunks.some((c: ChunkCandidate) => c.embedding)) ranked = await rankChunks(q, chunks, 8, { signal: AbortSignal.timeout(15_000) }); else ranked = lexicalFallback(q, chunks, 8);

  // Build answer (extractive: top 2-3 sentences from best chunk)
  const top = ranked[0];
  const answer = top ? top.chunk.content.split(/(?<=[.!?])\s+/).slice(0,3).join(' ') : 'Não encontrei conteúdo relevante para sua pergunta ainda.';
  const citations = ranked.map(r=> ({ slug: r.chunk.slug, snippet: r.chunk.content.slice(0,220), score: r.score, anchor: r.chunk.anchor || null, offset: r.chunk.offset }));
  return NextResponse.json({ ok:true, q, answer, citations });
}
