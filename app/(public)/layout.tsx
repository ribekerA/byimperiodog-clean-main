import type { Metadata } from "next";

import "../globals.css";
import "../../design-system/tokens.css";

// Components
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import SkipLink from "@/components/common/SkipLink";
import ConsentModeDefault from "@/components/ConsentModeDefault";
import Pixels from "@/components/Pixels";
import {
  ClientOnlyAttributionTracker,
  ClientOnlyConsentBanner,
  ClientOnlyTrackingScripts,
  ClientOnlyWhatsAppClickTracker,
  ClientOnlyWhatsAppFloat,
} from "@/components/PublicClientOnly";
import ToastContainer from "@/components/Toast";
import { getSiteSettings } from "@/lib/getSettings";
import { getPixelsSettings, resolveActiveEnvironment } from "@/lib/pixels";
import { resolveRobots } from "@/lib/seo";
import { baseSiteMetadata } from "@/lib/seo.core";
import { buildLocalBusinessLD } from "@/lib/structured-data";
import {
  resolveTracking,
  buildWebsiteLD,
  buildSiteNavigationLD,
} from "@/lib/tracking";

import { dmSans } from "../fonts";

// Lazy load componentes nao-criticos para reduzir TBT
// RecentSalesPopup removido: exibia "Familia de X reservou ha 12 min" a partir
// de uma lista fixa de eventos inventados, sorteados aleatoriamente. Nao havia
// nenhuma venda real por tras do aviso.

export const metadata: Metadata = baseSiteMetadata({
  robots: resolveRobots(),
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#052e2b",
};

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const isProd = process.env.NODE_ENV === "production";

  const [siteSettings, pixelSettings] = await Promise.all([
    getSiteSettings(),
    getPixelsSettings(),
  ]);
  const { config } = resolveActiveEnvironment(pixelSettings);
  const ids = resolveTracking(siteSettings, config);
  const META_VERIFY = ids.metaVerify;
  const GOOGLE_VERIFY = ids.googleVerify;
  const PINTEREST_VERIFY = ids.pinterestVerify;

  let organizationLd: Record<string, unknown> | null = null;
  let websiteLd: Record<string, unknown> | null = null;
  let siteNavigationLd: Record<string, unknown> | null = null;
  // O nó da empresa é emitido aqui, uma vez, em toda página pública. Antes
  // saía daqui um Organization e, em quinze páginas, um LocalBusiness — ambos
  // com @id #business e fatos diferentes.
  if (ids.siteUrl) {
    organizationLd = buildLocalBusinessLD();
    websiteLd = buildWebsiteLD(ids.siteUrl);
    siteNavigationLd = buildSiteNavigationLD(ids.siteUrl);
  }

  return (
    <html lang="pt-BR" className={`scroll-smooth ${dmSans.variable}`}>
      <head>
        <meta charSet="utf-8" />

        {/*
          O site reabria no meio da página. A causa é o
          `history.scrollRestoration = "auto"` do navegador: ao recarregar, ele
          devolve a posição de rolagem da visita anterior. Numa home longa isso
          faz a página abrir na altura em que o visitante parou, não no topo.

          Só desligamos a restauração quando a navegação NÃO é back/forward —
          nesse caso voltar para a listagem e cair de novo no mesmo card é o
          comportamento esperado. Âncoras (#secao) também continuam funcionando,
          porque a checagem roda antes de qualquer scroll e não mexe no hash.

          Precisa rodar no <head>, antes da primeira pintura: em useEffect o
          navegador já teria restaurado a posição e o usuário veria o salto.
        */}
        <script

          dangerouslySetInnerHTML={{
            __html: `try{if('scrollRestoration' in history){var n=performance.getEntriesByType('navigation')[0];if(!n||n.type!=='back_forward'){history.scrollRestoration='manual';if(!location.hash){window.scrollTo(0,0);}}}}catch(e){}`,
          }}
        />

        {/* Consentimento ANTES de qualquer tag. Enquanto o visitante nao aceita,
            analytics e publicidade ficam em "denied" -- que e exatamente o que a
            politica de privacidade promete. As bibliotecas so sao baixadas
            depois da escolha explicita em PixelsByConsent. */}
        <ConsentModeDefault />

        {/* Verificacao de dominio Meta (se houver) */}
        {META_VERIFY && (
          <meta name="facebook-domain-verification" content={META_VERIFY} />
        )}
        {/* Verificacao do Google Search Console (se houver) */}
        {GOOGLE_VERIFY && (
          <meta name="google-site-verification" content={GOOGLE_VERIFY} />
        )}
        {/* Verificacao do Pinterest Business Hub (se houver) */}
        {PINTEREST_VERIFY && (
          <meta name="p:domain_verify" content={PINTEREST_VERIFY} />
        )}

        {/* JSON-LD inline para renderizacao imediata (melhor SEO) */}
        {organizationLd && (
          <script
            type="application/ld+json"

            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
          />
        )}
        {websiteLd && (
          <script
            type="application/ld+json"

            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
          />
        )}
        {siteNavigationLd && (
          <script
            type="application/ld+json"

            dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationLd) }}
          />
        )}
        {/**
          * O nó da empresa sai de `organizationLd` acima — buildLocalBusinessLD(),
          * emitido uma vez por página. Aqui existiram um Organization e um
          * DogBreeder concorrentes, com o mesmo @id #business e
          * name/url/description/priceRange diferentes: era essa colisão que o
          * Search Console reportava como "campo duplicado". As propriedades
          * exclusivas do DogBreeder (makesOffer, knowsAbout de raça) foram
          * incorporadas ao nó canônico em src/lib/structured-data.ts.
          *
          * Em 26/08/2026 saíram também os últimos nós secundários: o
          * LocalBusiness próprio de cada página de estado (/filhotes/sao-paulo,
          * /minas-gerais, /rio-de-janeiro), que descrevia três negócios com o
          * mesmo endereço, e a microdata LocalBusiness de
          * /criador-spitz-confiavel e /lulu-da-pomerania-braganca-paulista.
          * Uma empresa, um nó.
          */}

        {/** Pixels custom HTML removidos por seguranca. Apenas modelos oficiais via <Pixels />. */}
      </head>

      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <SkipLink />
        {/* Um unico proprietario para todas as tags. PixelsByConsent so monta
            GTM/GA/pixels depois da escolha explicita e nunca roda em dev. */}
        {isProd && <Pixels isAdminRoute={false} settings={pixelSettings ?? undefined} />}

        {/* Dispara page_view em navegacoes SPA (somente quando os pixels existem) */}
        <ClientOnlyTrackingScripts />
        {/* Captura UTM params para atribuição first/last touch */}
        <ClientOnlyAttributionTracker />
        {/* ÚNICO ouvinte de clique em WhatsApp do site. Não adicione onClick de
            medição nos CTAs: dois caminhos para o mesmo clique é exatamente o
            que faz uma conversão virar duas no Google Ads. */}
        <ClientOnlyWhatsAppClickTracker />

        <div className="flex min-h-screen flex-col">
          <Header />
          {/* Este é o ÚNICO <main> do site público, e o alvo do skip link.
              As páginas abriam cada uma o seu, o que deixava dois landmarks
              "main" no mesmo documento (a home ainda repetia o id, HTML
              inválido); todas passaram a usar <div>. Página nova não deve
              reabrir <main> nem redeclarar id="conteudo-principal". */}
          <main className="flex-1" id="conteudo-principal" role="main">
            {children}
          </main>
          <Footer />
          <ClientOnlyWhatsAppFloat />
          <ClientOnlyConsentBanner />
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}
