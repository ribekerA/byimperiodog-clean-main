import Link from "next/link";

import type { BlogPost } from "@/lib/blog";

export const posts: BlogPost[] = [
  {
    slug: "guia-tutor-spitz-alemao-anao",
  title: "Guia definitivo para escolher um Spitz Alemão Anão (Lulu da Pomerânia)",
    subtitle: "Planejamento financeiro, perfil da familia e acompanhamento vitalicio",
    category: "Guia do Tutor",
    excerpt:
  "Entenda os criterios que usamos para conectar Spitz Alemão Anão (Lulu da Pomerânia) ate 22 cm com familias que buscam responsabilidade e suporte continuo.",
    coverUrl: "/blog/guia-tutor-spitz.webp",
    publishedAt: "2024-09-01T08:00:00.000Z",
    author: { name: "Equipe By Imperio Dog" },
    tags: ["guia", "planejamento", "tutor"],
    seo: {
  title: "Guia do tutor: como escolher um Spitz Alemão Anão (Lulu da Pomerânia) com responsabilidade",
      description:
  "Checklist completo de selecao, entrevistas e acompanhamento para tutores que buscam Spitz Alemão Anão (Lulu da Pomerânia) com suporte premium.",
      ogImage: "/blog/guia-tutor-spitz.webp",
    },
    Content: function Content() {
      return (
        <article className="max-w-none space-y-6 text-zinc-800">
          <p>
            Cada ninhada do By Imperio Dog nasce com planejamento genetico, socializacao guiada e mentoria vitalicia.
            Antes de reservar, avaliamos rotina, disponibilidade de tempo, criancas em casa e expectativas esteticas para garantir aderencia real.
          </p>
          <h2 className="text-xl font-semibold text-zinc-900">Checklist de avaliacao inicial</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Horarios da familia e rede de apoio para passeios e enriquecimento.</li>
            <li>Preferencias de cor e textura da pelagem considerando manutencao semanal.</li>
            <li>Expectativas de peso e altura: trabalhamos com padrao ate 22 cm conforme FCI.</li>
            <li>Planilha financeira com investimento inicial, mensalidade veterinaria e pet care.</li>
          </ul>
          <p>
            Na etapa de entrevista, enviamos um briefing detalhado com video-chamadas e coletamos fotos do ambiente.
            Apos a aprovacao, voce recebe acesso ao cronograma semanal com metas de socializacao e suporte 24h via WhatsApp.
          </p>
          <p>
            Quer visualizar como funciona a entrega humanizada? Conheca o{" "}
            <Link href="/sobre#processo" className="text-brand hover:underline">
              processo completo
            </Link>{" "}
            e veja por que limitamos o numero de reservas por ninhada.
          </p>
        </article>
      );
    },
  },
  {
    slug: "checklist-cuidados-spitz-alemao-anao",
    title: "Checklist de cuidados diarios, semanais e mensais",
    subtitle: "Rotina realista para manter o Spitz equilibrado e com pelagem premium",
    category: "Cuidados",
    excerpt:
      "Organize banho, escovacao, nutricao e enriquecimento com uma agenda pratica pensada para familias urbanas.",
    coverUrl: "/blog/cuidados-rotina-spitz.webp",
    publishedAt: "2024-09-05T08:00:00.000Z",
    author: { name: "Equipe By Imperio Dog" },
    tags: ["cuidados", "rotina", "higiene"],
    seo: {
  title: "Cuidados essenciais com Spitz Alemão Anão (Lulu da Pomerânia): checklist completo",
      description:
  "Agenda planejada para saude, higiene e equilibrio emocional do Spitz Alemão Anão (Lulu da Pomerânia) premium.",
      ogImage: "/blog/cuidados-rotina-spitz.webp",
    },
    Content: function Content() {
      return (
        <article className="max-w-none space-y-6 text-zinc-800">
          <p>
            A rotina bem estruturada evita queda excessiva de pelo, reduz estresse e fortalece o vinculo com a familia.
            Dividimos o checklist em blocos que cabem na agenda de quem trabalha em formato hibrido ou remoto.
          </p>
          <h3 className="text-lg font-semibold text-zinc-900">Cuidados diarios</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Escovacao rapida com escova slicker para remover subpelo solto.</li>
            <li>Inspecao de olhos, orelhas e patas para antecipar alergias ou irritacoes.</li>
            <li>Brincadeiras de forrageamento ou snuffle mat por 10 minutos para gasto mental.</li>
            <li>Registro de peso e apetite em aplicativo compartilhado com a equipe.</li>
          </ul>
          <h3 className="text-lg font-semibold text-zinc-900">Cuidados semanais</h3>
          <p>
            Reserve um dia para banho com cosmeticos hipoalergenicos, secagem com soprador frio e aparo leve dos pelos nas patas.
            Finalize com hidratante especifico para a pelagem dupla.
          </p>
          <p>
            Para aprofundar nutricao e suplementacao, consulte nosso{" "}
            <Link href="/faq#nutricao" className="text-brand hover:underline">
              FAQ de cuidados
            </Link>{" "}
            que cobre cardapios naturais, zootecnista parceiro e ajustes sazonais.
          </p>
        </article>
      );
    },
  },
  {
    slug: "adestramento-spitz-urbano",
    title: "Adestramento gentil para Spitz em ambiente urbano",
    subtitle: "Socializacao guiada, enriquecimento ambiental e protocolos anti-ansiedade",
    category: "Adestramento",
    excerpt:
      "Sequencia de treinos curtos que desenvolvem independencia, evitam latidos excessivos e garantem convivio harmonioso.",
    coverUrl: "/blog/adestramento-spitz.webp",
    publishedAt: "2024-09-12T08:00:00.000Z",
    author: { name: "Equipe By Imperio Dog" },
    tags: ["adestramento", "comportamento", "socializacao"],
    seo: {
  title: "Adestramento gentil para Spitz Alemão Anão (Lulu da Pomerânia)",
      description:
  "Protocolos positivos, jogos de odor e cronograma de socializacao para Spitz Alemão Anão (Lulu da Pomerânia) em apartamentos.",
      ogImage: "/blog/adestramento-spitz.webp",
    },
    Content: function Content() {
      return (
        <article className="max-w-none space-y-6 text-zinc-800">
          <p>
            Spitz Alemão Anão (Lulu da Pomerânia) e atento e expressivo. Com reforco positivo estruturado, a comunicacao fica previsivel e o tutor evita conflitos.
            Comece com sessoes de 5 minutos, duas vezes ao dia, priorizando comandos de autocontrole.
          </p>
          <h3 className="text-lg font-semibold text-zinc-900">Trilogia de exercicios fundamentais</h3>
          <ol className="list-decimal space-y-2 pl-6">
            <li>
              <strong>Place relax:</strong> ensine o filhote a permanecer em um tapete com recompensa por permanencia calma.
            </li>
            <li>
              <strong>Treino de silencio:</strong> antecipe gatilhos de latido e ofereca alternativa com recompensas de alto valor.
            </li>
            <li>
              <strong>Socializacao ativa:</strong> monte um quadro de experiencias com sons, texturas e superficies variadas.
            </li>
          </ol>
          <p>
            Use videochamadas semanais com nossa equipe para ajustes finos.
            Ao combinar reforcos positivos e manejo do ambiente, a convivencia com vizinhos e convidados se torna leve.
          </p>
          <p>
            Veja como estruturamos a mentoria dentro do{" "}
            <Link href="/sobre#processo" className="text-brand hover:underline">
              processo By Imperio Dog
            </Link>{" "}
            e acompanhe os relatos de tutores nas redes sociais.
          </p>
        </article>
      );
    },
  },
  {
    slug: "protocolos-saude-spitz",
    title: "Saude preventiva: exames, vacinas e sinais de alerta",
    subtitle: "Diagnostico proativo para Spitz ate 22 cm com acompanhamento veterinario especializado",
    category: "Saude",
    excerpt:
      "Linha do tempo completa de exames geneticos, cardiologicos e laboratoriais que entregamos antes da reserva e durante o primeiro ano.",
    coverUrl: "/blog/saude-protocolos-spitz.webp",
    publishedAt: "2024-09-18T08:00:00.000Z",
    author: { name: "Equipe By Imperio Dog" },
    tags: ["saude", "exames", "preventivo"],
    seo: {
  title: "Saude do Spitz Alemão Anão (Lulu da Pomerânia): exames e vacinas recomendadas",
      description:
  "Protocolos preventivos, calendario vacinal e monitoramento de sinais de alerta para Spitz Alemão Anão (Lulu da Pomerânia) premium.",
      ogImage: "/blog/saude-protocolos-spitz.webp",
    },
    Content: function Content() {
      return (
        <article className="max-w-none space-y-6 text-zinc-800">
          <p>
            Antes da reserva, disponibilizamos laudos geneticos (prcd-PRA, alopecia X), painel cardiologico e hemograma completo.
            No primeiro ano, seguimos com eco cardiograma, acompanhamentos ortopedicos e revisao nutricional trimestral.
          </p>
          <h3 className="text-lg font-semibold text-zinc-900">Cronograma sugerido</h3>
          <table className="w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-100 text-left">
                <th className="border px-3 py-2">Idade</th>
                <th className="border px-3 py-2">Exames</th>
                <th className="border px-3 py-2">Objetivo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-3 py-2">45 dias</td>
                <td className="border px-3 py-2">Hemograma, exames de fezes e laudo genetico</td>
                <td className="border px-3 py-2">Liberacao para socializacao e planejamento alimentar</td>
              </tr>
              <tr>
                <td className="border px-3 py-2">4 meses</td>
                <td className="border px-3 py-2">Eco cardiograma e raio X toracico</td>
                <td className="border px-3 py-2">Avaliar estrutura e liberar atividades controladas</td>
              </tr>
              <tr>
                <td className="border px-3 py-2">12 meses</td>
                <td className="border px-3 py-2">Perfil hormonal e ultrassom abdominal</td>
                <td className="border px-3 py-2">Ajustes de dieta e prevencao a disturbios metabolicos</td>
              </tr>
            </tbody>
          </table>
          <p>
            Em cada consulta orientamos o tutor a registrar ritmo respiratorio, frequencia de idas ao banheiro e nivel de energia.
            Use nosso{" "}
            <Link href="/faq#saude" className="text-brand hover:underline">
              guia de saude preventiva
            </Link>{" "}
            para interpretar cada resultado e saber quando acionar o veterinario parceiro.
          </p>
        </article>
      );
    },
  },
  {
    slug: "perguntas-importantes-spitz",
    title: "Perguntas essenciais antes de confirmar a reserva",
    subtitle: "Transparencia financeira, logistica e suporte continuo",
    category: "Perguntas",
    excerpt:
  "Lista de perguntas que todo tutor deveria fazer ao selecionar um criador especializado em Spitz Alemão Anão (Lulu da Pomerânia) premium.",
    coverUrl: "/blog/perguntas-spitz.webp",
    publishedAt: "2024-09-25T08:00:00.000Z",
    author: { name: "Equipe By Imperio Dog" },
    tags: ["faq", "investimento", "logistica"],
    seo: {
  title: "Perguntas que garantem transparencia ao reservar um Spitz Alemão Anão (Lulu da Pomerânia)",
      description:
  "Use este roteiro para confirmar suporte, transparencia financeira e logistica antes de reservar seu Spitz Alemão Anão (Lulu da Pomerânia).",
      ogImage: "/blog/perguntas-spitz.webp",
    },
    Content: function Content() {
      return (
        <article className="max-w-none space-y-6 text-zinc-800">
          <p>
            Selecionamos as perguntas que mostramos nas consultorias premium. Elas ajudam a distinguir quem entrega suporte integral de quem apenas intermedia filhotes.
          </p>
          <h3 className="text-lg font-semibold text-zinc-900">Pergunte sobre suporte</h3>
          <p>
            Como e estruturado o atendimento apos a entrega? Existe grupo exclusivo, videochamada semanal, acesso a profissionais de nutricao e comportamento?
            No By Imperio Dog, oferecemos mentoria vitalicia com materiais atualizados trimestralmente.
          </p>
          <h3 className="text-lg font-semibold text-zinc-900">Questione a logistica</h3>
          <p>
            Entrega presencial, concierge aereo ou retirada agendada precisam estar claros.
            Solicite contrato digital descrevendo responsabilidades de cada parte. Veja nosso{" "}
            <Link href="/faq#logistica" className="text-brand hover:underline">
              FAQ de logistica
            </Link>{" "}
            e garanta que o transporte seja confortavel e seguro.
          </p>
          <p>
            Pronto para conversar com a criadora? Acesse o{" "}
            <Link href="/filhotes" className="text-brand hover:underline">
              painel de filhotes sob consulta
            </Link>{" "}
            e responda ao questionario qualificado. Assim conseguimos direcionar as vagas disponiveis de maneira justa.
          </p>
        </article>
      );
    },
  },
];

export default posts;
