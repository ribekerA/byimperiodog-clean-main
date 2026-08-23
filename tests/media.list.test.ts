import { describe, it, expect, vi } from 'vitest';

import { GET as mediaList } from '../app/api/admin/blog/media/list/route';

import { makeNextRequestStub } from './helpers/nextRequestStub';

vi.mock('@/lib/adminAuth', () => ({ requireAdmin: () => null }));

interface Media { id: string; file_path: string; alt: string|null; caption: string|null; tags: string[]|null; created_at: string }

const mediaRows: Media[] = [
  { id: 'm1', file_path: 'a.jpg', alt: 'Cão feliz', caption: null, tags: ['dog','cute'], created_at: new Date(Date.now()-1000).toISOString() },
  { id: 'm2', file_path: 'b.jpg', alt: 'Gato', caption: 'Fofo', tags: ['cat'], created_at: new Date().toISOString() }
];
const pivot = [ { media_id: 'm2', role: 'cover', post_id: 'p1' } ];

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if(table==='media_assets'){
        type Builder = { _filtered: Media[]; select: () => Builder; order: () => Builder; or: (expr: string) => Builder; contains: (col: string, arr: string[]) => Builder; range: () => { data: Media[]; error: null; count: number } };
        const builder: Builder = {
          _filtered: [...mediaRows],
          select: () => builder,
          order: () => builder,
          or: (expr: string) => { // expr ex: alt.ilike.%dog%,caption.ilike.%dog%
            const term = expr.match(/%([^%]+)%/); if(term){
              builder._filtered = builder._filtered.filter((m: Media) => (m.alt||'').includes(term[1]) || (m.caption||'').includes(term[1]));
            }
            return builder;
          },
          contains: (_col: string, arr: string[]) => { builder._filtered = builder._filtered.filter((m: Media)=> (m.tags||[]).includes(arr[0])); return builder; },
          range: () => ({ data: builder._filtered, error: null, count: builder._filtered.length })
        };
        return builder as unknown as { select: () => unknown };
      }
      if(table==='post_media'){
        const pb = {
          _rows: pivot,
          select: () => pb,
          eq: (_col: string, val: string) => { pb._rows = pivot.filter(r=>r.role===val); return pb; },
          limit: () => Promise.resolve({ data: pb._rows, error: null })
        };
        return pb;
      }
      return { select: () => ({ data: [], error: null }) };
    }
  })
}));

describe('media list endpoint', () => {
  it('lista base sem filtros', async () => {
    const req = makeNextRequestStub('http://localhost/api/admin/blog/media/list', { method: 'GET' });
    const res = await mediaList(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.items.length).toBe(2);
  });
  it('filtra por role=cover', async () => {
    const req = makeNextRequestStub('http://localhost/api/admin/blog/media/list?role=cover', { method: 'GET' });
    const res = await mediaList(req as unknown as import('next/server').NextRequest);
    const j = await res.json();
    expect(j.items.length).toBe(1);
    expect(j.items[0].id).toBe('m2');
  });
  it('filtra por tag dog', async () => {
    const req = makeNextRequestStub('http://localhost/api/admin/blog/media/list?tag=dog', { method: 'GET' });
    const res = await mediaList(req as unknown as import('next/server').NextRequest);
    const j = await res.json();
    expect(j.items.length).toBe(1);
    expect(j.items[0].id).toBe('m1');
  });
});
