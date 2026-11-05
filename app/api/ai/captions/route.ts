import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';
import { corpoJson } from '@/lib/limitePublico';

export async function POST(req:Request){
  const auth = requireAdmin(req as any); if(auth) return auth;
  const lido = await corpoJson<{ title?: unknown }>(req, 4 * 1024);
  if (lido.resposta) return lido.resposta;
  const title = typeof lido.dados.title === 'string'
    ? lido.dados.title.trim().slice(0, 180) || 'Spitz Alemão'
    : 'Spitz Alemão';
  return NextResponse.json({ ok:true, captions: [
    `🐾 ${title}: energia, companheirismo e charme em miniatura! #SpitzAlemao` ,
    `${title}: guia rápido de cuidados e amor diário. Conheça mais no blog!`,
    `Pelagem exuberante, personalidade intensa: ${title}. Leia o guia completo.`
  ]});
}
