import type { Metadata } from "next";

import { LastUpdated } from "@/components/common/LastUpdated";
import { TOC } from "@/components/common/TOC";
import { pageMetadata } from "@/lib/seo";

const path = "/termos-de-uso";
const lastUpdated = "2025-10-18T09:00:00.000Z";

const tocItems = [
  { id: "escopo", label: "Escopo dos serviços" },
  { id: "responsabilidades", label: "Responsabilidades do tutor" },
  { id: "obrigacoes", label: "Obrigações da By Imperio Dog" },
  { id: "condicoes", label: "Condições comerciais e materiais" },
  { id: "alteracoes", label: "Alterações destes termos" },
  { id: "foro", label: "Foro aplicável" },
];

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Termos de Uso | By Imperio Dog",
    description:
      "Condições para acesso aos materiais, consultorias e suporte oferecidos pela By Imperio Dog a tutores do Spitz Alemão (Lulu da Pomerânia).",
    path,
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br"}/og/termos-uso.jpg`,
        alt: "Contrato de responsabilidade para tutores do Spitz Alemão (Lulu da Pomerânia)",
      },
    ],
  });
}

export default function TermosDeUsoPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-12 px-6 py-16 text-zinc-800">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">Condições legais</p>
        <h1 className="text-4xl font-bold text-zinc-900">Termos de Uso</h1>
        <p className="text-lg text-zinc-600">
          Estes termos regem o uso do site, dos materiais educativos e do suporte oferecido pela By Imperio Dog a tutores e
          interessados no Spitz Alemão (Lulu da Pomerânia). Ao continuar navegando ou utilizar nossos serviços, você concorda com
          as condições descritas abaixo.
        </p>
      </header>

      <TOC items={tocItems} />

      <section id="escopo" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Escopo dos serviços</h2>
        <p className="text-zinc-600">
          Disponibilizamos conteúdos educativos, diagnósticos comportamentais, consultorias remotas e acompanhamento pós-entrega do
          Spitz Alemão (Lulu da Pomerânia). Os materiais possuem caráter informativo e não substituem avaliação presencial de
          profissionais habilitados (médica veterinária, nutricionista, adestrador).
        </p>
      </section>

      <section id="responsabilidades" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Responsabilidades do tutor</h2>
        <p className="text-zinc-600">
          O tutor compromete-se a fornecer informações verídicas, seguir orientações sanitárias, manter consultas preventivas e
          garantir ambiente seguro para o Spitz Alemão (Lulu da Pomerânia). O descumprimento de protocolos ou recomendações pode
          inviabilizar garantias contratuais.
        </p>
        <ul className="list-disc space-y-2 pl-6 text-zinc-600">
          <li>Realizar consultas veterinárias periódicas e cumprir o calendário de vacinas.</li>
          <li>Monitorar peso, alimentação e hidratação, comunicando alterações relevantes.</li>
          <li>
            Solicitar suporte oficial antes de aplicar medidas corretivas não validadas pela equipe técnica da By Imperio Dog.
          </li>
        </ul>
      </section>

      <section id="obrigacoes" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Obrigações da By Imperio Dog</h2>
        <p className="text-zinc-600">
          Comprometemo-nos a fornecer materiais atualizados, comunicar eventuais riscos à saúde e manter canal ágil de suporte. O
          acompanhamento remoto é prestado por equipe especializada, respeitando limites éticos e o bem-estar do Spitz Alemão
          (Lulu da Pomerânia).
        </p>
        <p className="text-zinc-600">
          Caso seja identificada necessidade de intervenção presencial, indicaremos profissionais de confiança ou solicitaremos que
          o tutor procure atendimento imediato.
        </p>
      </section>

      <section id="condicoes" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Condições comerciais e materiais</h2>
        <p className="text-zinc-600">
          Produtos físicos, cursos ou serviços adicionais podem possuir contratos próprios. Eventuais descontos são pessoais e
          intransferíveis. Materiais disponibilizados em PDF, vídeo ou áudio permanecem protegidos por direitos autorais e não
          podem ser redistribuídos sem autorização expressa.
        </p>
      </section>

      <section id="alteracoes" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Alterações destes termos</h2>
        <p className="text-zinc-600">
          Atualizamos estes termos sempre que houver mudanças relevantes em processos, regulamentação ou serviços oferecidos. A
          versão vigente estará disponível nesta página, com indicação da última atualização. Recomendamos revisão periódica.
        </p>
      </section>

      <section id="foro" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Foro aplicável</h2>
        <p className="text-zinc-600">
          Fica eleito o foro da comarca de Atibaia/SP para dirimir controvérsias decorrentes destes termos, com renúncia a qualquer
          outro, por mais privilegiado que seja.
        </p>
      </section>

      <LastUpdated buildTime={process.env.NEXT_PUBLIC_BUILD_TIME} contentTime={lastUpdated} />
    </main>
  );
}
