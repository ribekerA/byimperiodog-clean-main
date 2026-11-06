import type { Metadata } from "next";
import Link from "next/link";

import { ObrigadoConversionTracker } from "@/components/ObrigadoConversionTracker";
import { getPixelsSettings, resolveActiveEnvironment } from "@/lib/pixels";

export const revalidate = 0;

// Página de confirmação pós-formulário: não tem valor de busca, é conteúdo
// raso e pode aparecer na SERP no lugar do formulário. Fica fora do índice.
export const metadata: Metadata = {
  title: "Obrigado pelo contato",
  // Sem description própria a página herdava a genérica do layout, escrita
  // para a home. E sem canonical próprio herdava o da home — dizia ao Google
  // que esta página de confirmação era a home.
  description:
    "Confirmação de contato com a By Império Dog. A criadora responde pelo WhatsApp no horário de atendimento, todos os dias das 8h às 22h.",
  alternates: { canonical: "/obrigado" },
  robots: { index: false, follow: true },
};

export default async function ObrigadoPage() {
  const pixelsSettings = await getPixelsSettings();
  const { config } = resolveActiveEnvironment(pixelsSettings);

  return (
    <div className="container mx-auto px-4 pb-16">
      <ObrigadoConversionTracker
        adsId={config.googleAdsId}
        leadLabel={config.googleAdsConversionLabel}
      />
      <div className="faixa-topo">
        <h1 className="text-3xl font-bold">Obrigado! Recebemos seu interesse</h1>
        <p className="mt-3">Em breve a By Império Dog entrará em contato para continuar seu atendimento.</p>
      </div>
      <div className="mt-8 space-y-2 text-center text-sm text-zinc-700">
        <p>Horário de atendimento: todos os dias, das 8h às 22h.</p>
        <p>Canais oficiais: WhatsApp e Instagram @byimperiodog.</p>
        <p>Fique de olho no seu WhatsApp para nossa mensagem inicial.</p>
      </div>
      <div className="mt-8 text-center">
        <Link className="inline-flex min-h-[48px] items-center rounded-full bg-emerald-600 px-6 font-semibold text-white" href="/filhotes">Voltar aos filhotes</Link>
      </div>
    </div>
  );
}
