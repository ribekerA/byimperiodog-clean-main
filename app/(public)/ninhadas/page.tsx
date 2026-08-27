import type { Metadata } from "next";
import Link from "next/link";

import { RelatedPages } from "@/components/common/RelatedPages";
import { buildArticleLD } from "@/lib/schema";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildBreadcrumbLD } from "@/lib/structured-data";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/ninhadas`;

export const metadata: Metadata = {
  // A descrição prometia "quais cores e datas previstas" numa página que nunca
  // mostrou data nem cor prevista, e "filhotes reserváveis" numa que não lista
  // filhote. `keywords` saiu junto: o Google ignora a meta keywords desde 2009,
  // e nenhuma busca interna deste site lê esse campo.
  title: "Ninhadas de Spitz Alemão Anão — lista de interesse",
  description: "Entre na lista de interesse para ser avisado sobre as próximas ninhadas de Spitz Alemão Anão em Bragança Paulista, SP. Conte qual cor e qual sexo você procura.",
  alternates: { canonical: "/ninhadas" },
  openGraph: { images: [OG_DEFAULT_IMAGE], title: "Ninhadas — By Império Dog", description: "Lista de interesse para as próximas ninhadas de Spitz Alemão Anão." },
};

const FAQS = [
  { question: "Como funcionam as reservas de ninhadas?", answer: "Reservas são por ordem de interesse e mediante pagamento de sinal. A criadora entrará em contato para confirmar datas e condições." },
  { question: "Posso entrar em lista de espera?", answer: "Sim — colocamos interessados em lista e avisamos quando houver confirmação de cobertura e nascimento." },
];

// Esta página não lista ninhada nenhuma, e nunca listou.
//
// O corpo dela filtrava a vitrine por `status` igual a "planned", "pregnant" ou
// "born" — três valores que nenhuma entrada do arquivo jamais teve. O ramo do
// `map` era código morto desde o primeiro dia: o que o visitante sempre viu foi
// o texto da lista de interesse, e é ele que fica. Agenda de ninhada só volta a
// aparecer aqui quando existir um registro real de ninhada, com data real, e
// não derivada de um campo de estoque. (26/08/2026)

export default function NinhadasPage() {
  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Filhotes", url: `${SITE_URL}/filhotes` },
    { name: "Ninhadas", url: PAGE_URL },
  ]);
  // Era `datePublished: new Date().toISOString()`: a cada build o schema dizia
  // que a página tinha acabado de ser publicada. Data de publicação não muda.
  // Depois virou "2026-08-06" fixo, escrito à mão a partir do primeiro commit —
  // certo na intenção, mas condenado a envelhecer errado. Hoje as duas datas
  // saem do histórico do git dentro de buildArticleLD, sem nada fixo aqui.
  const articleLd = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string });

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <script id="ld-ninhadas-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="ld-ninhadas-article" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="space-y-4">
        <h1 className="text-3xl font-bold">Ninhadas e lista de interesse</h1>
        <p className="text-zinc-600">Entre na lista de interesse para receber aviso por WhatsApp sobre as próximas ninhadas.</p>
      </header>

      <section className="mt-8 space-y-6">
        <p className="text-zinc-600">
          As ninhadas são comunicadas diretamente a quem está na lista de interesse.
          Fale com a equipe pelo WhatsApp para entrar na lista e contar qual cor e
          qual sexo você procura.
        </p>
        <p className="text-zinc-600">
          Enquanto isso, a{" "}
          <Link href="/filhotes" className="text-emerald-700 underline">
            vitrine de filhotes
          </Link>{" "}
          mostra fotos reais de cada combinação de cor e sexo com que trabalhamos.
        </p>
      </section>

      <RelatedPages links={[
        { label: 'Vitrine de filhotes', href: '/filhotes', desc: 'Fotos reais de cada cor e sexo' },
        { label: 'Como escolher um filhote', href: '/guias/como-escolher-spitz-alemao-anao', desc: 'Guia completo para escolher seu filhote' },
      ]} />
    </div>
  );
}
