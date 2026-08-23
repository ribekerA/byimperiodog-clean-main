import { describe, it, expect, vi } from 'vitest';

import { getRelatedPosts, scoreRelatedPost } from '../../src/lib/relatedPosts';

// Mock supabasePublic com cadeia de métodos eq/neq/order/limit/maybeSingle
vi.mock('@/lib/supabasePublic', () => {
  return {
    supabasePublic: () => {
      let callCount = 0;
      function buildChain(isBase: boolean) {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          neq: () => chain,
          order: () => chain,
          limit: () => ({ data: candidates }),
          maybeSingle: async () => ({ data: basePost })
        };
        return chain;
      }
      return {
        from: (_table: string) => {
          callCount += 1;
            return buildChain(callCount === 1); // primeira chamada: base, segunda: candidatos
        }
      };
    }
  };
});

const basePost = { id:'1', slug:'post-base', title:'Post Base', excerpt:'', published_at: new Date(Date.now()-2*86400000).toISOString(), blog_post_categories:[{ blog_categories:{ slug:'saude' }}] };

const candidates = [
  { id:'2', slug:'post-recente-same-cat', title:'A', excerpt:'', published_at:new Date(Date.now()-12*3600000).toISOString(), blog_post_categories:[{ blog_categories:{ slug:'saude' }}], blog_authors:{ name:'Ana', slug:'ana' } },
  { id:'3', slug:'post-antigo-outra-cat', title:'B', excerpt:'', published_at:new Date(Date.now()-50*86400000).toISOString(), blog_post_categories:[{ blog_categories:{ slug:'nutricao' }}] },
];

describe('relatedPosts', () => {
  it('rankeia candidatos por categoria compartilhada + recência', async () => {
    const related = await getRelatedPosts('post-base', 5);
    expect(related.length).toBeGreaterThan(0);
    expect(related[0].slug).toBe('post-recente-same-cat');
  });
  it('scoreRelatedPost prioriza categorias compartilhadas', () => {
    const baseCats = ['saude'];
    const recentSame = { published_at: new Date().toISOString(), blog_post_categories:[{ blog_categories:{ slug:'saude' }}] };
    const recentDifferent = { published_at: new Date().toISOString(), blog_post_categories:[{ blog_categories:{ slug:'nutricao' }}] };
    const s1 = scoreRelatedPost(baseCats, recentSame);
    const s2 = scoreRelatedPost(baseCats, recentDifferent);
    expect(s1).toBeGreaterThan(s2);
  });
});
