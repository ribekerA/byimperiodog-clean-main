import type { Metadata } from "next";
import Link from "next/link";

import SeoJsonLd from "@/components/SeoJsonLd";
import { pageMetadata } from "@/lib/seo";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");
const PATH = "/politica-editorial";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Política Editorial e Metodologia",
    description:
      "Nossa política editorial: quem escreve, como produzimos, revisão de fontes, correções e transparência sobre IA. Compromisso com conteúdo útil e confiável.",
    path: PATH,
    openGraph: { type: "website" },
  });
}

export default function PoliticaEditorialPage() {
  const url = `${SITE}${PATH}`;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Política Editorial", item: url },
    ],
  } as const;

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Política Editorial e Metodologia",
    url,
    description:
      "Nossa política editorial: quem escreve, como produzimos e revisamos, política de correções e transparência sobre uso de IA.",
    isPartOf: { "@type": "WebSite", name: "By Império Dog", url: `${SITE}/` },
  } as const;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 text-[var(--text)]">
      <SeoJsonLd data={[breadcrumb, webPage]} />

      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">Transparência</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Política Editorial e Metodologia</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-muted)]">
          Nosso compromisso é produzir conteúdo útil, confiável e centrado nas pessoas sobre Spitz Alemão Anão (Lulu da
          Pomerânia). Abaixo, documentamos como selecionamos pautas, verificamos informações e revisamos cada material.
        </p>
      </header>

      <section className="prose prose-zinc max-w-none dark:prose-invert">
        <h2>Quem escreve</h2>
        <p>
          Os conteúdos são produzidos com apoio de ferramentas de tecnologia e revisados pela equipe da By Império Dog antes
          da publicação, com base na experiência prática da criação responsável do Spitz Alemão Anão. Quando aplicável,
          citamos profissionais especializados (veterinária, adestramento, genética).
        </p>

        <h2>Como produzimos</h2>
        <p>
          Selecionamos temas com base nas dúvidas reais de tutores e no nosso processo de criação. As pautas passam por:
        </p>
        <ul>
          <li>Pesquisa de base (literatura, diretrizes e materiais técnicos relevantes).</li>
          <li>Experiência em primeira mão (rotina, socialização, saúde preventiva e documentação).</li>
          <li>Revisão interna de clareza, precisão e alinhamento ao objetivo do leitor.</li>
        </ul>

        <h2>Fontes e revisão</h2>
        <p>
          Sempre que citamos dados, incluímos referência ou contexto. Revisamos fatos simples e evitamos afirmações
          não verificáveis. Relatos de experiência são apresentados como tal e não substituem orientação profissional.
        </p>

        <h2>Correções e atualizações</h2>
        <p>
          Quando identificamos imprecisões, atualizamos o conteúdo e ajustamos o campo “Atualizado em” no topo do artigo.
          Para reportar uma correção, entre em contato pela página de <Link href="/contato" className="underline">Contato</Link>.
        </p>

        <h2>Uso de IA e automação</h2>
        <p>
          Usamos ferramentas de IA como apoio na produção editorial (por exemplo: estruturação de pautas, redação de
          rascunhos, revisão de clareza e checagem gramatical). Os textos passam por revisão da equipe da By Império Dog
          antes da publicação e devem refletir a experiência prática do canil. Não publicamos material gerado
          automaticamente com o objetivo de manipular rankings de busca.
        </p>

        <h2>Conflitos de interesse</h2>
        <p>
          Podemos referenciar nossos próprios serviços e conteúdos (ex.: filhotes, processos e FAQ). Indicamos quando há
          interesse comercial e priorizamos informações que ajudem o leitor a decidir com responsabilidade.
        </p>

        <h2>Fale com a gente</h2>
        <p>
          Dúvidas, sugestões e pedidos de correção podem ser enviados pela página de <Link href="/contato" className="underline">Contato</Link>.
        </p>
      </section>
    </main>
  );
}
