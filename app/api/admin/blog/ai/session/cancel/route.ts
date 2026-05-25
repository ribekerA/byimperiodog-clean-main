export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req:Request){
  const auth = requireAdmin(req); if(auth) return auth;
  const { id } = await req.json().catch(()=>({}));
  if(!id) return NextResponse.json({ ok:false, error:'id required' },{ status:400 });
  try {
    const sb = supabaseAdmin();
    await sb.from('ai_generation_sessions').update({ status:'canceled', phase:'canceled', progress:100, error_message:'cancelled' }).eq('id', id);
    return NextResponse.json({ ok:true });
  } catch(e:any){
    return NextResponse.json({ ok:false, error:e?.message||'error' },{ status:500 });
  }
}
