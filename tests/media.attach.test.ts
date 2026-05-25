import { describe, it, expect, vi } from 'vitest';
import { POST as mediaAttach } from '../app/api/admin/blog/media/attach/route';
import { makeNextRequestStub } from './helpers/nextRequestStub';

// Mock requireAdmin para simular admin válido
vi.mock('@/lib/adminAuth', () => ({
  requireAdmin: () => null,
  logAdminAction: () => Promise.resolve()
}));

// Mock supabaseAdmin para cenários específicos
// 1) post inexistente
// 2) media inexistente
// 3) sucesso cover e sucesso gallery

function makeBuilder<T>(data: T){
  const builder = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: () => Promise.resolve({ data, error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => builder
  } as const;
  return builder;
}

// Sequência de respostas controlada por role
let scenario: 'post-missing'|'media-missing'|'cover-success'|'gallery-success' = 'cover-success';

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if(table==='blog_posts'){
        if(scenario==='post-missing') return makeBuilder(null);
        return makeBuilder({ id: 'post1', cover_url: null, og_image_url: null });
      }
      if(table==='media_assets'){
        if(scenario==='media-missing') return makeBuilder(null);
        return makeBuilder({ id: 'media1', file_path: 'folder/file.jpg', alt: 'Foto', caption: null });
      }
      if(table==='post_media'){
        return { insert: () => Promise.resolve({ data: null, error: null }), update: () => Promise.resolve({ data: null, error: null }) };
      }
      return makeBuilder(null);
    },
    storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.example/file.jpg' } }) }) }
  })
}));

describe('media attach endpoint', () => {
  it('retorna 404 se post não existe', async () => {
    scenario = 'post-missing';
    const req = makeNextRequestStub('http://localhost/api/admin/blog/media/attach', { method: 'POST', headers: { 'content-type': 'application/json' }, body: { post_id: 'pX', media_id: 'm1', role: 'gallery' } });
    const res = await mediaAttach(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(404);
    const j = await res.json();
    expect(j.error).toBe('post-not-found');
  });
  it('retorna 404 se media não existe', async () => {
    scenario = 'media-missing';
    const req = makeNextRequestStub('http://localhost/api/admin/blog/media/attach', { method: 'POST', headers: { 'content-type': 'application/json' }, body: { post_id: 'post1', media_id: 'm404', role: 'inline' } });
    const res = await mediaAttach(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(404);
    const j = await res.json();
    expect(j.error).toBe('media-not-found');
  });
  it('associa cover e define cover_set true', async () => {
    scenario = 'cover-success';
    process.env.NEXT_PUBLIC_SUPABASE_BUCKET = 'media';
    const req = makeNextRequestStub('http://localhost/api/admin/blog/media/attach', { method: 'POST', headers: { 'content-type': 'application/json' }, body: { post_id: 'post1', media_id: 'media1', role: 'cover' } });
    const res = await mediaAttach(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.cover_set).toBe(true);
  });
  it('associa gallery e cover_set false', async () => {
    scenario = 'gallery-success';
    const req = makeNextRequestStub('http://localhost/api/admin/blog/media/attach', { method: 'POST', headers: { 'content-type': 'application/json' }, body: { post_id: 'post1', media_id: 'media1', role: 'gallery' } });
    const res = await mediaAttach(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.cover_set).toBe(false);
  });
});
