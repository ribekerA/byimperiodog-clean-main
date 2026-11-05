import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';
import { corpoJson } from '@/lib/limitePublico';

export async function POST(req:Request){
  const auth = requireAdmin(req as any); if(auth) return auth;
  const lido = await corpoJson<{ title?: unknown }>(req, 4 * 1024);
  if (lido.resposta) return lido.resposta;
  const title = typeof lido.dados.title === 'string'
    ? lido.dados.title.trim().slice(0, 180) || 'Guia Spitz Alemão'
    : 'Guia Spitz Alemão';
  const base = title.replace(/guia|definitivo/gi,'').trim();
  return NextResponse.json({ ok:true, suggestions: {
    seo_title: `${title} | By Império Dog`,
    seo_description: `Tudo sobre ${base||'Spitz Alemão'}: cuidados, alimentação, saúde, socialização e dicas práticas.`,
    alt_cover: `Cão Spitz Alemão ${base||''} em destaque`,
    og_text: `${title} – Aprenda cuidados essenciais, grooming e socialização.`,
    internal_links: [
      { href:'/filhotes', anchor:'Ver a vitrine de filhotes' },
      { href:'/comprar-spitz-anao', anchor:'Processo de compra responsável' },
      { href:'/contato', anchor:'Fale com a equipe' }
    ]
  }});
}
