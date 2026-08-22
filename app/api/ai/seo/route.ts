import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(req:Request){
  const auth = await requireAdmin(req); if(auth) return auth;
  const body = await req.json().catch(()=>({}));
  const title = body.title || 'Guia Spitz Alemão';
  const base = title.replace(/guia|definitivo/gi,'').trim();
  return NextResponse.json({ ok:true, suggestions: {
    seo_title: `${title} | By Império Dog`,
    seo_description: `Tudo sobre ${base||'Spitz Alemão'}: cuidados, alimentação, saúde, socialização e dicas práticas.`,
    alt_cover: `Cão Spitz Alemão ${base||''} em destaque`,
    og_text: `${title} – Aprenda cuidados essenciais, grooming e socialização.`,
    internal_links: [
      { href:'/filhotes', anchor:'Ver filhotes disponíveis' },
      { href:'/comprar-spitz-anao', anchor:'Processo de compra responsável' },
      { href:'/contato', anchor:'Fale com a equipe' }
    ]
  }});
}
