import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';

export async function POST(req:Request){
  const auth = requireAdmin(req as any); if(auth) return auth;
  const body = await req.json().catch(()=>({}));
  const title = body.title || 'Spitz Alemão';
  return NextResponse.json({ ok:true, captions: [
    `🐾 ${title}: energia, companheirismo e charme em miniatura! #SpitzAlemao` ,
    `${title}: guia rápido de cuidados e amor diário. Conheça mais no blog!`,
    `Pelagem exuberante, personalidade intensa: ${title}. Leia o guia completo.`
  ]});
}
