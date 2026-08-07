import type { Metadata } from "next";

import { LastUpdated } from "@/components/common/LastUpdated";
import { TOC } from "@/components/common/TOC";
import { pageMetadata } from "@/lib/seo";

const path = "/termos-de-uso";
const lastUpdated = "2025-10-18T09:00:00.000Z";

const tocItems = [
  { id: "escopo", label: "Escopo dos serviços" },
  { id: "responsabilidades", label: "Responsabilidades do tutor" },
  { id: "obrigacoes", label: "Obrigações da By Império Dog" },
  { id: "condicoes", label: "Condições comerciais e materiais" },
  { id: "alteracoes", label: "Alterações destes termos" },
  { id: "foro", label: "Foro aplicável" },
];

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Termos de Uso",
    description:
      "Condições para acesso ao site, aos conteúdos educativos e ao suporte pós-entrega oferecidos pela By Império Dog a tutores do Spitz Alemão (Lulu da Pomerânia).",
    path,
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://byimperiodog.com.br"}/og/termos-uso.jpg`,
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
          Estes termos regem o uso do site, dos materiais educativos e do suporte oferecido pela By Império Dog a tutores e
          interessados no Spitz Alemão (Lulu da Pomerânia). Ao continuar navegando ou utilizar nossos serviços, você concorda com
          as condições descritas abaixo.
        </p>
      </header>

      <TOC items={tocItems} />

      <section id="escopo" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Escopo dos serviços</h2>
        <p className="text-zinc-600">
          Disponibilizamos conteúdos educativos e orientações gerais de pós-entrega do Spitz Alemão (Lulu da Pomerânia). As
          informações têm caráter informativo e não substituem consulta com médico-veterinário ou outro profissional habilitado.
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
            Procurar orientação de médico-veterinário antes de aplicar medidas corretivas de saúde ou comportamento.
          </li>
        </ul>
      </section>

      <section id="obrigacoes" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Obrigações da By Império Dog</h2>
        <p className="text-zinc-600">
          Comprometemo-nos a fornecer materiais atualizados, comunicar eventuais riscos à saúde e manter canal de suporte com o
          tutor. As orientações de pós-entrega são prestadas pela criadora e não constituem consulta veterinária.
        </p>
        <p className="text-zinc-600">
          Caso seja identificada necessidade de intervenção presencial, orientaremos que o tutor procure atendimento veterinário
          imediato.
        </p>
      </section>

      <section id="condicoes" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Condições comerciais e materiais</h2>
        <p className="text-zinc-600">
          A aquisição de um filhote é regida por contrato próprio de compra e venda, que prevalece sobre estes termos em caso de
          divergência. Eventuais condições comerciais são pessoais e intransferíveis. Os conteúdos publicados no site permanecem
          protegidos por direitos autorais e não podem ser redistribuídos sem autorização expressa.
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
          Fica eleito o foro da comarca de Bragança Paulista/SP para dirimir controvérsias decorrentes destes termos, com renúncia
          a qualquer outro, por mais privilegiado que seja.
        </p>
      </section>

      <LastUpdated contentTime={lastUpdated} />
    </main>
  );
}
