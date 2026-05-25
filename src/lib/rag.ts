// Simple RAG helpers for blog Q&A (fallback embeddings + naive similarity)
// No external env required. If OpenAI key missing, returns lexical fallback.

export type EmbeddingVector = number[];

export interface BlogChunk {
  id: string;
  slug: string;
  title: string;
  content: string;
  tokens?: number;
  embedding?: EmbeddingVector;
}

// Tiny cosine similarity
function cosine(a: EmbeddingVector, b: EmbeddingVector){
  let dot=0, na=0, nb=0;
  for(let i=0;i<a.length;i++){ dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; }
  return dot / (Math.sqrt(na)||1) / (Math.sqrt(nb)||1);
}

// Fake embedding if no model: hashed char codes into fixed dim
function localEmbed(text: string, dim=128): EmbeddingVector {
  const vec = new Array(dim).fill(0);
  for (let i=0;i<text.length;i++){
    const c = text.charCodeAt(i);
    const idx = c % dim;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s,v)=> s+v*v,0))||1;
  return vec.map(v=> v/norm);
}

export async function embedText(text: string): Promise<EmbeddingVector>{
  const key = process.env.OPENAI_API_KEY; // not mandatory
  if(!key){
    return localEmbed(text);
  }
  try {
    const r = await fetch('https://api.openai.com/v1/embeddings',{ method:'POST', headers:{ 'Authorization':`Bearer ${key}`,'Content-Type':'application/json' }, body: JSON.stringify({ model:'text-embedding-3-small', input: text }) });
    if(!r.ok) throw new Error('openai error');
    const j = await r.json();
    return j.data[0].embedding as number[];
  } catch(e){
    console.warn('[rag] embedding fallback', e);
    return localEmbed(text);
  }
}

export async function rankChunks(query: string, chunks: BlogChunk[], topK=5){
  if(!chunks.length) return [] as { chunk:BlogChunk; score:number }[];
  const qEmb = await embedText(query);
  return chunks
    .filter(c=> c.embedding)
    .map(c=> ({ chunk:c, score: cosine(qEmb, c.embedding as EmbeddingVector) }))
    .sort((a,b)=> b.score - a.score)
    .slice(0, topK);
}

export function lexicalFallback(query: string, chunks: BlogChunk[], topK=5){
  const q = query.toLowerCase();
  return chunks
    .map(c=> ({ chunk:c, score: (c.content.toLowerCase().includes(q)? 1:0) + (c.title.toLowerCase().includes(q)? 0.5:0) }))
    .filter(r=> r.score>0)
    .sort((a,b)=> b.score - a.score)
    .slice(0, topK);
}
