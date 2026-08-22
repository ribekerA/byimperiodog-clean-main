import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

// Endpoint mock: aceita POST { title, date } e responde 204. Sem persistência real.
export async function POST(req: NextRequest){
  const auth = await requireAdmin(req, { permission: "blog:write" });
  if (auth) return auth; // 401 se não autenticado
  try {
    const body = await req.json().catch(()=>({}));
    if(!body?.title || !body?.date){
      return NextResponse.json({ error:'title e date são obrigatórios' }, { status:400 });
    }
    // Aqui futuramente poderemos persistir em DB (Supabase)
    return new NextResponse(null, { status:204 });
  } catch (e:any){
    return NextResponse.json({ error: String(e?.message||e) }, { status:500 });
  }
}
