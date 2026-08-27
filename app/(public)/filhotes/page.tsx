import type { Metadata } from "next";
import Link from "next/link";

import StaticCatalog from "@/components/catalog/StaticCatalog";
import { puppiesPublicados } from "@/content/puppies-static";
import { buildItemListLD, buildBreadcrumbLD, buildCollectionPageLD } from "@/lib/structured-data";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");

const CATALOG_FAQS = [
  {
    question: "Como funciona o processo de reserva de um filhote de Spitz Alemão Anão (Lulu da Pomerânia)?",
    answer:
      "Use a vitrine desta página para identificar a cor e o sexo que você procura e fale com a equipe pelo WhatsApp: é no atendimento que as opções atuais são confirmadas e a reserva é fechada. A entrega inclui registro oficial, carteira de vacinação, consulta veterinária e hemograma completo; a identificação do animal segue os requisitos exigidos pela legislação aplicável.",
  },
  {
    question: "Com quais cores de Spitz Alemão Anão a By Império Dog trabalha?",
    answer:
      "São cinco cores divulgadas: Particolor, Laranja, Creme, Preto e Branco. O particolor é o menor valor da tabela e o branco, o maior. As opções atuais de cada cor são confirmadas no atendimento.",
  },
  {
    question: "Qual a diferença de preço entre Spitz Alemão Anão Fêmea e Macho?",
    answer:
      "A fêmea custa R$ 1.000 a mais que o macho da mesma cor, por conta da maior procura. Cada valor é o ponto de partida da cor. Fêmeas: R$ 6.500 no particolor, R$ 7.500 no laranja, R$ 8.500 em creme e preto, R$ 9.500 no branco. Machos: R$ 5.500 no particolor, R$ 6.500 no laranja, R$ 7.500 em creme e preto, R$ 8.500 no branco.",
  },
  {
    question: "Os filhotes são entregues com quais documentos?",
    answer:
      "Todos os filhotes saem com registro oficial, consulta veterinária, hemograma completo, carteira de vacinação assinada pelo médico-veterinário, com o protocolo em dia conforme a idade do filhote, histórico de vermifugação e contrato. A identificação do animal segue os requisitos exigidos pela legislação aplicável. Depois da entrega, o tutor continua com o suporte da equipe pelo WhatsApp.",
  },
];

// O title dizia "Filhotes de Spitz Alemão Anão Disponíveis" — a página é uma
// vitrine de fotos permanentes, não um estoque em tempo real, e a palavra
// prometia no resultado da busca uma informação que só o atendimento tem.
//
// O array `keywords` saiu junto: o Google ignora meta keywords desde 2009, e o
// deste arquivo carregava "filhotes Spitz Alemão Anão disponíveis" e
// "Lulu da Pomerânia à venda" — a mesma promessa, no lugar onde ninguém a lê.
export const metadata: Metadata = {
  title:       "Filhotes de Spitz Alemão Anão — Cores, Fotos e Valores",
  // 226 caracteres: o Google cortava antes da entrega em todo o Brasil, que é
  // o que diferencia esta página para quem busca de fora de SP. Reescrita em 156.
  description: "Filhotes de Spitz Alemão Anão nas cores Particolor, Laranja, Creme, Preto e Branco. Bragança Paulista, SP.",
  alternates: { canonical: "/filhotes" },
  openGraph: {
    title:       "Filhotes de Spitz Alemão Anão — By Império Dog",
    description: "Vitrine de filhotes com registro oficial, consulta veterinária e hemograma completo. Bragança Paulista, SP.",
    type:        "website",
    images:      [{ url: "/spitz-hero-desktop.webp", width: 1400, height: 933, alt: "Filhotes de Spitz Alemão Anão da By Império Dog" }],
  },
};

export default function FilhotesPage() {
  const itemListLd   = buildItemListLD(puppiesPublicados as any);
  // O ItemList existia solto: descrevia a coleção sem dizer de que página ela
  // é. O CollectionPage é o nó dono, e os dois se referenciam pelo @id.
  const collectionLd = buildCollectionPageLD({
    path: "/filhotes",
    name: "Vitrine de filhotes de Spitz Alemão Anão — By Império Dog",
    description:
      "Fotos reais das cores e dos sexos com que a By Império Dog trabalha, com o valor de partida de cada combinação.",
    image: "/spitz-hero-desktop.webp",
    itemListId: `${SITE_URL}/filhotes#itemlist`,
  });
  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início",   url: `${SITE_URL}/` },
    { name: "Filhotes", url: `${SITE_URL}/filhotes` },
  ]);

  return (
    <>
      <script id="ld-collection" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <script id="ld-item-list"  type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script id="ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <StaticCatalog puppies={puppiesPublicados as any[]} />

      {/* Caminho de clique para as páginas de estado, que até aqui só existiam
          no sitemap. O breadcrumb delas já declara /filhotes como pai. */}
      <nav
        aria-labelledby="catalog-estados-heading"
        className="mx-auto max-w-3xl px-5 pb-4 sm:px-8"
      >
        <h2
          id="catalog-estados-heading"
          className="mb-3 text-sm font-semibold tracking-tight text-zinc-900"
        >
          Entrega e acompanhamento por estado
        </h2>
        <ul className="flex flex-wrap gap-2">
          {[
            { href: "/filhotes/sao-paulo",      rotulo: "São Paulo (SP)" },
            { href: "/filhotes/minas-gerais",   rotulo: "Minas Gerais (MG)" },
            { href: "/filhotes/rio-de-janeiro", rotulo: "Rio de Janeiro (RJ)" },
          ].map((estado) => (
            <li key={estado.href}>
              <Link
                href={estado.href}
                className="inline-flex rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-emerald-300 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {estado.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* FAQ visível — indexável por Google/IAs e útil para featured snippets */}
      <section
        className="mx-auto max-w-3xl px-5 pb-16 sm:px-8"
        aria-labelledby="catalog-faq-heading"
       
      >
        <h2
          id="catalog-faq-heading"
          className="mb-6 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl"
        >
          Perguntas frequentes sobre os filhotes
        </h2>
        {/* <div> e nao <dl>: esta secao e um acordeao de <details>, nao uma lista
            de descricao. Sem <dt>/<dd> dentro, o <dl> reprovava a regra
            definition-list do axe e o leitor de tela anunciava uma lista que
            nao existe. A marcacao schema.org da FAQ foi removida em 26/08/2026: o
            Google encerrou o rich result de FAQ em 07/05/2026 e o markup
            deixou de render qualquer resultado na busca. A FAQ visivel
            continua igual — ela e para o leitor, nao para o SERP. */}
        <div className="divide-y divide-zinc-100">
          {CATALOG_FAQS.map((item) => (
            <div key={item.question}>
              <details className="group py-4">
                <summary
                  className="flex cursor-pointer list-none items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
                >
                  <span className="text-sm font-semibold text-zinc-900">{item.question}</span>
                  <span className="mt-0.5 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180" aria-hidden="true">
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </summary>
                <div className="mt-3 pr-7">
                  <p className="text-sm leading-relaxed text-zinc-600">{item.answer}</p>
                </div>
              </details>
            </div>
          ))}
        </div>

        {/* Breadcrumb navegacional */}
        <nav aria-label="Navegação estrutural" className="mt-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
            <li><Link href="/" className="hover:text-emerald-700">Início</Link></li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-zinc-600" aria-current="page">Filhotes</li>
          </ol>
        </nav>
      </section>
    </>
  );
}
