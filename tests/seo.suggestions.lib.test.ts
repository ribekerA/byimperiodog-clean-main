import { describe, it, expect, vi, beforeEach } from 'vitest';

// Usar caminho relativo para evitar falha de resolução de alias em ambiente de teste isolado
import { listSuggestions, approveSuggestion, applySuggestion } from '../src/lib/seoSuggestions';

interface Row { id:string; entity_type:string; entity_id:string|null; entity_ref:string|null; data_json:Record<string,unknown>|null; score:number|null; status:string; created_at?:string }

type Tables = { seo_suggestions: Row[]; blog_posts: { id:string; seo_title?:string|null; seo_description?:string|null }[] };
let table: Tables = { seo_suggestions: [], blog_posts: [] };

function builderFor(rows: Row[]) {
  let current = [...rows];
  return {
    select(){ return this; },
    eq(col:string, val:string){
      current = current.filter(r => (col==='status' ? r.status===val : r.id===val));
      return this;
    },
    order(){ return this; },
    limit(){ return { data: current, error: null }; },
    update(patch: Partial<Row>){ current.forEach(r => Object.assign(r, patch)); return {
      eq: () => ({ select: () => ({ maybeSingle: () => Promise.resolve({ data: current[0]||null, error:null }) }) })
    }; },
    maybeSingle(){ return Promise.resolve({ data: current[0]||null, error:null }); },
    insert(vals: Partial<Row>[]){
      const inserted = vals.map(v => ({
        id: (v.id as string) || `id_${table.seo_suggestions.length+1}`,
        entity_type: v.entity_type as string,
        entity_id: (v.entity_id as string)||null,
        entity_ref: (v.entity_ref as string)||null,
        data_json: (v.data_json as Record<string,unknown>)||null,
        score: (typeof v.score==='number'? v.score : null),
        status: v.status || 'proposed'
      }));
      table.seo_suggestions.push(...inserted);
      return this;
    }
  };
}

vi.mock('../src/lib/supabaseAdmin', () => ({
  supabaseAdmin: () => ({
    from: (name:string) => {
      if(name==='seo_suggestions') return builderFor(table.seo_suggestions);
      if(name==='blog_posts') return {
        update: (patch: Record<string,unknown>) => ({
          eq: (_col:string, id:string) => { table.blog_posts = table.blog_posts.map(p=> p.id===id ? { ...p, ...patch } : p); return {}; }
        })
      };
      return builderFor([]);
    }
  })
}));

beforeEach(()=>{ table = { seo_suggestions: [
  { id:'s1', entity_type:'blog_post', entity_id:'p1', entity_ref:null, data_json:{ seo_title:'A', seo_description:'Desc A'}, score:10, status:'proposed' },
  { id:'s2', entity_type:'blog_post', entity_id:'p2', entity_ref:null, data_json:{ seo_title:'B'}, score:5, status:'approved' },
], blog_posts: [{ id:'p2' }] }; });

describe('seoSuggestions lib', () => {
  it('listSuggestions retorna somente status filtrado', async () => {
    const proposed = await listSuggestions('proposed');
    expect(proposed.length).toBe(1);
    expect(proposed[0].id).toBe('s1');
  });
  it('approveSuggestion altera status para approved', async () => {
    const r = await approveSuggestion('s1');
    expect(r?.id).toBe('s1');
    const approved = await listSuggestions('approved');
  expect(approved.some((s:Row)=>s.id==='s1')).toBe(true);
  });
  it('applySuggestion aplica patch em blog_post quando status proposed/approved', async () => {
    const res = await applySuggestion('s2');
    expect(res.applied).toBe(true);
  });
  it('applySuggestion falha para status inválido', async () => {
    // set invalid
    table.seo_suggestions.push({ id:'s3', entity_type:'blog_post', entity_id:'p3', entity_ref:null, data_json:{}, score:null, status:'rejected' });
    await expect(applySuggestion('s3')).rejects.toThrow('invalid-status');
  });
});
