export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req:Request){
  const auth = requireAdmin(req as any); if(auth) return auth;
  const { media_id, hint } = await req.json().catch(()=>({}));
  if(!media_id) return NextResponse.json({ ok:false, error:'media_id obrigatório' },{ status:400 });
  try {
    const sb = supabaseAdmin();
    const { data: media, error } = await sb.from('media_assets').select('id,file_path,alt,caption').eq('id', media_id).maybeSingle();
    if(error) throw error;
    if(!media) return NextResponse.json({ ok:false, error:'not found' },{ status:404 });
    // Gerador super simples (pode evoluir para visão ou IA):
    const base = hint || media.file_path.split('/').pop()?.replace(/[-_]/g,' ').replace(/\.[a-z0-9]+$/i,'') || 'spitz alemao';
    const alt = ('Spitz Alemão '+ base).slice(0,140);
    await sb.from('media_assets').update({ alt }).eq('id', media_id);
    return NextResponse.json({ ok:true, alt });
  } catch(e:any){
    return NextResponse.json({ ok:false, error:e?.message||'erro' },{ status:500 });
  }
}
