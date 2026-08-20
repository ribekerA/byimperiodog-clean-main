import type { Metadata } from "next";

import { ObrigadoConversionTracker } from "@/components/ObrigadoConversionTracker";
import { getPixelsSettings, resolveActiveEnvironment } from "@/lib/pixels";

export const revalidate = 0;

// Página de confirmação pós-formulário: não tem valor de busca, é conteúdo
// raso e pode aparecer na SERP no lugar do formulário. Fica fora do índice.
export const metadata: Metadata = {
  title: "Obrigado pelo contato",
  robots: { index: false, follow: true },
};

export default async function ObrigadoPage() {
  const pixelsSettings = await getPixelsSettings();
  const { config } = resolveActiveEnvironment(pixelsSettings);

  return (
    <div className="container mx-auto px-4 py-16">
      <ObrigadoConversionTracker
        adsId={config.googleAdsId}
        leadLabel={config.googleAdsConversionLabel}
      />
      <h1 className="text-3xl font-bold">Obrigado! Recebemos seu interesse</h1>
      <p className="mt-3 text-muted-foreground">Em breve a By Império Dog entrará em contato para continuar seu atendimento.</p>
      <div className="mt-6 space-y-2 text-sm text-muted-foreground">
        <p>Prazo de contato: em até 2 horas, no horário de atendimento (todos os dias, 8h–22h).</p>
        <p>Canais oficiais: WhatsApp e Instagram @byimperiodog.</p>
        <p>Fique de olho no seu WhatsApp para nossa mensagem inicial.</p>
      </div>
      <div className="mt-8">
        <a className="inline-block rounded bg-black px-4 py-2 text-white" href="/filhotes">Voltar aos filhotes</a>
      </div>
    </div>
  );
}
