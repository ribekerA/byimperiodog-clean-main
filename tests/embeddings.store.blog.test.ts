import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ensurePostEmbedding, batchEnsureEmbeddings } from '../src/lib/embeddings.store.blog';

// Estado em memória para upserts
interface EmbRow { post_id:string; source:string; embedding:string }
const table: EmbRow[] = [];
let failEmbed = false;

beforeEach(()=> { table.length = 0; failEmbed = false; });

// Mock embedText
vi.mock('../src/lib/rag', () => ({
  embedText: vi.fn(async (text:string) => {
    if(failEmbed) throw new Error('embed failed');
    // Vetor determinístico baseado no comprimento
    const len = Math.min(text.length, 999);
    return [len/1000, 0.123, 0.456];
  })
}));

// Mock supabaseAdmin upsert storage
vi.mock('../src/lib/supabaseAdmin', () => ({
  supabaseAdmin: () => ({
    from: (tableName:string) => {
      if(tableName !== 'blog_post_embeddings') return { upsert: async () => { /* ignore */ } };
      return {
        upsert: async (row: { post_id:string; source:string; embedding:string }) => {
          const idx = table.findIndex(r=> r.post_id===row.post_id && r.source===row.source);
          if(idx>=0) table[idx] = row; else table.push(row);
          return { data: row, error:null };
        }
      };
    }
  })
}));

describe('embeddings.store.blog', () => {
  it('ensurePostEmbedding retorna true e persiste vetor', async () => {
    const ok = await ensurePostEmbedding({ id:'p1', title:'Titulo', content_mdx:'Conteúdo **markdown**' });
    expect(ok).toBe(true);
    expect(table.length).toBe(1);
    expect(table[0].embedding.startsWith('[')).toBe(true);
  });

  it('ensurePostEmbedding retorna false em erro de embed', async () => {
    failEmbed = true;
    const ok = await ensurePostEmbedding({ id:'p2', title:'Falha', content_mdx:'Texto' });
    expect(ok).toBe(false);
    expect(table.length).toBe(0);
  });

  it('batchEnsureEmbeddings processa subset e agrega resultados', async () => {
    const posts = Array.from({ length:5 }).map((_,i)=> ({ id:`b${i+1}`, title:`T${i+1}`, content_mdx:'x'.repeat(10+i) }));
    const res = await batchEnsureEmbeddings(posts, 3);
    expect(res).toHaveLength(3);
    expect(res.every(r => r.ok)).toBe(true);
    expect(table.length).toBe(3);
  });

  it('batchEnsureEmbeddings mistura sucesso e falha', async () => {
    const posts = [ { id:'c1', title:'ok', content_mdx:'aaa' }, { id:'c2', title:'err', content_mdx:'bbb' } ];
    failEmbed = true; // todas falham
    const res = await batchEnsureEmbeddings(posts, 10);
    expect(res.map(r=> r.ok)).toEqual([false,false]);
    expect(table.length).toBe(0);
  });
});
