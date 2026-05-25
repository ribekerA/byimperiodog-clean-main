export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  try {
    const { puppy_id, client_name, client_phone, client_email } = await req.json();
    if(!puppy_id || !client_name) return NextResponse.json({ error:'puppy_id e client_name obrigatórios' },{ status:400 });
    const sb = supabaseAdmin();
    // update puppy status
    await sb.from('puppies').update({ status:'vendido', sold_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', puppy_id);
    // insert contract (se tabela existir)
    try {
      await sb.from('contracts').insert([{ puppy_id, client_name, client_phone: client_phone||null, client_email: client_email||null, status:'pending', created_at: new Date().toISOString() }]);
    } catch {}
    return NextResponse.json({ ok:true });
  } catch(e:any){
    return NextResponse.json({ error: e?.message || 'erro' },{ status:500 });
  }
}
