import Link from 'next/link';

import {
  CORES_DIVULGADAS, FAIXA_PUBLICA_TEXTO, RESPOSTA_MACHO_VS_FEMEA,
  formatarPreco, precoDe, type CorDivulgada, type Sexo,
} from '@/domain/pricing';
import { buildWhatsAppLink } from '@/lib/whatsapp';

/** Server-rendered prices: articles use the same commercial matrix as the catalog. */
export function PrecoFilhote({ cor, sexo }: { cor: CorDivulgada; sexo: Sexo }) {
  if (!CORES_DIVULGADAS.includes(cor) || !['macho', 'femea'].includes(sexo)) {
    throw new Error('Combinação de preço inválida no artigo');
  }
  return <span>{formatarPreco(precoDe(cor, sexo))}</span>;
}

export function TabelaPrecos() {
  return <ConsultaFilhotes />;
}

export function DiferencaPrecosSexo() {
  return <p>{RESPOSTA_MACHO_VS_FEMEA}</p>;
}

export function FaixaPrecos() {
  return <span>{FAIXA_PUBLICA_TEXTO} no Pix</span>;
}

export function ConsultaFilhotes({ placement = 'blog' }: { placement?: 'blog' | 'content' }) {
  const href = buildWhatsAppLink({
    message: 'Olá! Consultei os preços no site e gostaria de conhecer as opções atuais e as condições de reserva.',
    utmSource: 'site', utmMedium: 'blog_article', utmCampaign: 'consulta_precos',
  });
  return (
    <aside className="not-prose my-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4" aria-label="Consultar filhotes e preços">
      <p className="text-sm text-zinc-700">Quer comparar opções reais? Fale com a equipe em Bragança Paulista sobre cor, sexo, documentação e condições de reserva.</p>
      <a href={href} target="_blank" rel="noopener noreferrer" data-wa-placement={placement} className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Consultar opções e condições no WhatsApp</a>
      <Link href="/filhotes" className="mt-3 block text-sm font-medium text-emerald-800 underline">Ver fotos e vídeos na vitrine</Link>
    </aside>
  );
}
