import type { Metadata } from "next";

import { LastUpdated } from "@/components/common/LastUpdated";
import { TOC } from "@/components/common/TOC";
import { pageMetadata } from "@/lib/seo";
import { buildBreadcrumbLD } from "@/lib/structured-data";

const path = "/termos-de-uso";
// Data mexida porque o conteudo mudou de verdade nesta revisao (identificacao
// do fornecedor, arrependimento, contrato e foro). Fora isso a data nao se toca.
const lastUpdated = "2026-08-20T09:00:00.000Z";

const tocItems = [
  { id: "fornecedor", label: "Identificação do fornecedor" },
  { id: "escopo", label: "Escopo dos serviços" },
  { id: "responsabilidades", label: "Responsabilidades do tutor" },
  { id: "obrigacoes", label: "Obrigações da By Império Dog" },
  { id: "condicoes", label: "Condições comerciais e materiais" },
  { id: "arrependimento", label: "Direito de arrependimento" },
  { id: "alteracoes", label: "Alterações destes termos" },
  { id: "foro", label: "Foro aplicável" },
];

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Termos de Uso",
    description:
      "Condições para acesso ao site, aos conteúdos educativos e ao suporte pós-entrega oferecidos pela By Império Dog a tutores do Spitz Alemão (Lulu da Pomerânia).",
    path,
    // /og/termos-uso.jpg não existe (a pasta public/og/ nunca foi criada) e
    // respondia 404. Sem `images`, entra a imagem padrão do site.
  });
}

const breadcrumbLd = buildBreadcrumbLD([
  { name: "Início", url: "/" },
  { name: "Termos de Uso", url: path },
]);

export default function TermosDeUsoPage() {
  return (
    <>
      <script id="ld-termos-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

    <div className="mx-auto max-w-4xl space-y-12 px-6 py-16 text-zinc-800">
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

      {/* O Decreto 7.962/2013 (art. 2º) exige que o site de comercio eletronico
          exiba em destaque a identificacao do fornecedor e um canal de
          atendimento. O site nao trazia nada disso: so e-mail e telefone no
          rodape. Aqui entra o que o proprio site ja publica e pode ser
          comprovado. O CNPJ e o endereco fisico ficam de fora de proposito:
          existem dois CNPJs diferentes no codigo (politica de privacidade x
          contrato) e nao cabe a este reparo escolher um nem inventar endereco. */}
      <section id="fornecedor" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Identificação do fornecedor</h2>
        <p className="text-zinc-600">
          O site é operado pela By Império Dog, criadora de Spitz Alemão Anão (Lulu da Pomerânia) sediada em Bragança
          Paulista/SP. O atendimento ao consumidor — dúvidas, reclamações, exercício de direitos e suporte pós-entrega — é
          prestado pelos canais abaixo:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-zinc-600">
          <li>
            E-mail:{" "}
            <a href="mailto:contato@byimperiodog.com.br" className="font-medium text-emerald-700 underline">
              contato@byimperiodog.com.br
            </a>
          </li>
          <li>WhatsApp e telefone: (11) 9 6863-3239</li>
          <li>Município de operação: Bragança Paulista/SP</li>
        </ul>
        <p className="text-zinc-600">
          A identificação empresarial completa do fornecedor — incluindo razão social e número de inscrição no CNPJ — consta do
          contrato de compra e venda e do documento fiscal emitido em cada aquisição.
        </p>
      </section>

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
        {/* Antes dizia que o contrato "prevalece sobre estes termos". Um contrato
            de adesao nao pode se sobrepor ao CDC nem a oferta publicada — o
            art. 30 torna a oferta vinculante, e o art. 51 anula clausula que
            afaste direito do consumidor. */}
        <p className="text-zinc-600">
          O contrato individual disciplina as condições específicas da aquisição, sem prejuízo dos direitos assegurados pela
          legislação aplicável e das ofertas vinculantes regularmente apresentadas ao consumidor. Eventuais condições comerciais
          são pessoais e intransferíveis. Os conteúdos publicados no site permanecem protegidos por direitos autorais e não podem
          ser redistribuídos sem autorização expressa.
        </p>
      </section>

      {/* O site vende a distancia e nao dizia uma palavra sobre o art. 49 do CDC.
          As condicoes de sinal que ja estavam publicadas continuam aqui — quem
          revisa contrato e a responsavel, nao este reparo —, mas agora vem
          depois da regra legal, e nao no lugar dela. */}
      <section id="arrependimento" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Direito de arrependimento</h2>
        <p className="text-zinc-600">
          Nas contratações sujeitas ao direito de arrependimento previsto no art. 49 do Código de Defesa do Consumidor, serão
          observados integralmente os prazos e efeitos previstos na legislação, inclusive quanto à restituição dos valores pagos.
        </p>
        <p className="text-zinc-600">
          Fora dessas hipóteses, o cancelamento da reserva segue as condições pactuadas no contrato individual de compra e venda,
          que podem incluir a devolução parcial do sinal ou a transferência da reserva para outra ninhada. Em qualquer caso, as
          condições contratuais não afastam nem reduzem os direitos assegurados ao consumidor pela legislação aplicável.
        </p>
        <p className="text-zinc-600">
          Para exercer o direito de arrependimento ou solicitar o cancelamento, entre em contato pelos canais indicados em{" "}
          <a href="#fornecedor" className="font-medium text-emerald-700 underline">
            Identificação do fornecedor
          </a>
          .
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
        {/* A renuncia "a qualquer outro foro" e nula em relacao de consumo: o
            CDC (art. 6º, VIII, e art. 101, I) garante ao consumidor o foro do
            proprio domicilio. A eleicao vira indicacao, nao renuncia. */}
        <p className="text-zinc-600">
          Fica indicado o foro de Bragança Paulista/SP para as controvérsias que legalmente admitam eleição de foro, sem prejuízo
          do foro do domicílio do consumidor e de outros foros legalmente assegurados.
        </p>
      </section>

      <LastUpdated contentTime={lastUpdated} />
    </div>
    </>
  );
}
