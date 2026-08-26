import type { Metadata } from "next";

import { LastUpdated } from "@/components/common/LastUpdated";
import { TOC } from "@/components/common/TOC";
import { pageMetadata } from "@/lib/seo";
import { buildBreadcrumbLD } from "@/lib/structured-data";

const path = "/politica-de-privacidade";
// Data mexida porque o conteudo mudou de verdade nesta revisao (dados
// coletados, base legal, cookies, prazos e transferencia internacional).
const lastUpdated = "2026-08-20T09:00:00.000Z";

const tocItems = [
  { id: "dados-coletados", label: "Dados coletados" },
  { id: "finalidades", label: "Finalidades e base legal" },
  { id: "compartilhamento", label: "Compartilhamento e operadores" },
  { id: "cookies", label: "Cookies e preferências" },
  { id: "retencao", label: "Retenção e segurança" },
  { id: "direitos", label: "Direitos do titular" },
  { id: "contato", label: "Contato do controlador" },
];

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Política de Privacidade",
    description:
      "Como a By Império Dog trata os dados pessoais de quem entra em contato: coleta, finalidade, retenção, segurança e atendimento à LGPD.",
    path,
    // /og/politica-privacidade.jpg não existe (a pasta public/og/ nunca foi
    // criada) e respondia 404. Sem `images`, entra a imagem padrão do site.
  });
}

const breadcrumbLd = buildBreadcrumbLD([
  { name: "Início", url: "/" },
  { name: "Política de Privacidade", url: path },
]);

export default function PoliticaDePrivacidadePage() {
  return (
    <>
      <script id="ld-privacidade-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

    <div className="mx-auto max-w-4xl space-y-12 px-6 py-16 text-zinc-800">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">LGPD</p>
        <h1 className="text-4xl font-bold text-zinc-900">Política de Privacidade</h1>
        <p className="text-lg text-zinc-600">
          Esta política descreve como coletamos, utilizamos e protegemos dados pessoais fornecidos por tutores e interessadas em
          receber um Spitz Alemão Anão (Lulu da Pomerânia). Informamos como os dados são usados durante o relacionamento e respeitamos os
          princípios da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>
      </header>

      <TOC items={tocItems} />

      <section id="dados-coletados" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Dados coletados</h2>
        {/* A politica anunciava coleta de CPF, data de nascimento, documentos de
            responsabilidade civil, endereco completo e fotos do ambiente logo no
            primeiro contato. O formulario do site nao pede nada disso: pede nome,
            WhatsApp, cidade/estado, preferencia de cor e sexo, prazo e uma
            mensagem livre. Declarar coleta maior do que a real contraria o
            principio da necessidade (art. 6º, III da LGPD), entao a politica foi
            separada em duas etapas — interesse e contratacao. */}
        <p className="text-zinc-600">
          Coletamos apenas o necessário para cada etapa, e a etapa determina o que é pedido.
        </p>
        <h3 className="pt-2 text-lg font-semibold text-zinc-900">1. Contato inicial e interesse</h3>
        <p className="text-zinc-600">
          No formulário do site e no atendimento por WhatsApp, pedimos somente o suficiente para responder e apresentar os
          filhotes disponíveis:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-zinc-600">
          <li>Nome e um canal de contato (WhatsApp, telefone ou e-mail).</li>
          <li>Cidade e estado, para orientar sobre logística de entrega.</li>
          <li>
            Preferências informadas voluntariamente: cor, sexo, prazo desejado e a mensagem que você escrever.
          </li>
        </ul>
        <h3 className="pt-2 text-lg font-semibold text-zinc-900">2. Contratação</h3>
        <p className="text-zinc-600">
          Somente quando a aquisição avança é que solicitamos os dados exigidos para emitir contrato e documento fiscal e para
          organizar a entrega — como qualificação completa, número de documento e endereço. Esses dados não são pedidos na fase de
          interesse e são tratados para execução do contrato e cumprimento de obrigação legal.
        </p>
        <h3 className="pt-2 text-lg font-semibold text-zinc-900">3. Materiais enviados por você</h3>
        <p className="text-zinc-600">
          Fotos, vídeos e outras informações sobre a rotina da família são tratados apenas quando você decide enviá-los, e apenas
          para a finalidade combinada no atendimento.
        </p>
      </section>

      <section id="finalidades" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Finalidades e base legal</h2>
        <p className="text-zinc-600">
          Utilizamos os dados para garantir alinhamento entre o tutor e o Spitz Alemão Anão, cumprir obrigações
          legais e oferecer suporte contínuo. As principais finalidades são:
        </p>
        <ol className="list-decimal space-y-2 pl-6 text-zinc-600">
          <li>
            Compreender as preferências informadas pelo interessado, apresentar as opções disponíveis e orientar a preparação da residência (execução de contrato e procedimentos prévios -
            art. 7º, V da LGPD).
          </li>
          {/* "Legitimo interesse" estava cobrindo envio de material educativo, que
              na pratica e comunicacao de marketing. Marketing pede consentimento
              e opt-out proprio (art. 7º, I da LGPD), nao legitimo interesse. */}
          <li>
            Responder ao contato e informar sobre disponibilidade, valores e etapas da reserva (execução de contrato e
            procedimentos preliminares — art. 7º, V da LGPD).
          </li>
          <li>
            Enviar materiais educativos, novidades e comunicações de relacionamento (consentimento — art. 7º, I da LGPD). Esse
            envio é opcional, independe da aquisição e pode ser cancelado a qualquer momento, sem prejuízo do atendimento.
          </li>
          <li>
            Cumprir exigências fiscais, sanitárias e de transporte do Spitz Alemão Anão (cumprimento de obrigação
            legal).
          </li>
        </ol>
        <p className="text-zinc-600">
          O consentimento para comunicações de marketing é recolhido separadamente e não é condição para o atendimento nem para a
          execução do contrato. Você pode revogá-lo a qualquer momento, respondendo a qualquer comunicação, escrevendo para{" "}
          <a href="mailto:contato@byimperiodog.com.br" className="font-medium text-emerald-700 underline">
            contato@byimperiodog.com.br
          </a>{" "}
          ou pelo link &ldquo;Preferências de cookies&rdquo; no rodapé do site, quando se tratar de cookies.
        </p>
      </section>

      <section id="compartilhamento" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Compartilhamento e operadores</h2>
        <p className="text-zinc-600">
          Compartilhamos dados somente com operadores contratados, obrigados contratualmente a manter sigilo e a tratar os dados apenas para a finalidade combinada. Exemplos:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-zinc-600">
          {/* "Clinicas parceiras" sugeria uma rede formal que a responsavel ja
              confirmou nao existir. O atendimento veterinario existe; a parceria
              institucional, nao. */}
          <li>Médicos-veterinários e clínicas responsáveis pelos exames, laudos e vacinas do filhote.</li>
          <li>Serviços de transporte especializado para entrega do Spitz Alemão Anão.</li>
          <li>
            Provedores de hospedagem, banco de dados e comunicação utilizados para operar o site e registrar
            atendimentos, sujeitos aos termos e às políticas de privacidade de cada fornecedor.
          </li>
        </ul>
        <p className="text-zinc-600">
          Não vendemos dados pessoais. Parte da operação do site — hospedagem, banco de dados e medição de audiência — utiliza
          fornecedores que podem armazenar ou processar informações em servidores fora do Brasil. Essas transferências
          internacionais ocorrem nos termos do capítulo V da LGPD, com base nas cláusulas e garantias contratuais oferecidas por
          cada fornecedor.
        </p>
      </section>

      <section id="cookies" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Cookies e preferências</h2>
        <p className="text-zinc-600">
          Utilizamos cookies para analisar desempenho, personalizar conteúdos e lembrar preferências. No primeiro acesso, exibimos
          banner de consentimento para que você selecione categorias de coleta. Os tipos de cookies utilizados incluem:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-zinc-600">
          <li>Necessários: garantem segurança, autenticação e funcionamento do site.</li>
          <li>Analíticos: medem comportamento de navegação para otimizar experiência.</li>
          <li>Marketing: somente quando o tutor aceita compartilhar preferências com nossos canais de relacionamento.</li>
        </ul>
        <p className="text-zinc-600">
          <strong className="font-semibold text-zinc-900">Curtidas em fotos e vídeos.</strong> Se você curtir uma foto de filhote
          ou um vídeo da galeria, gravamos um cookie próprio chamado <code className="rounded bg-zinc-100 px-1 py-0.5 text-sm">bid_visitante</code>,
          com validade de 180 dias. Ele guarda apenas um código aleatório, sem qualquer relação com seu nome, telefone, e-mail ou
          endereço de IP, e existe por um motivo específico: reconhecer que aquela curtida é sua, para que a mesma foto não seja
          contada duas vezes e para que você possa desfazer a curtida depois. Em nossos servidores esse código é guardado apenas
          de forma cifrada, sem possibilidade de leitura reversa. O cookie só é criado no momento em que você curte alguma coisa —
          navegar pelo site sem curtir não cria nada — e é lido apenas pelo servidor, nunca por scripts da página.
        </p>
        {/* Esta frase era falsa ate esta revisao: o GTM subia em producao sem
            nenhuma checagem de consentimento. O texto so volta a ser verdadeiro
            porque o Consent Mode v2 passou a entrar em "denied" por padrao,
            antes de qualquer tag carregar (ver ConsentModeDefault). */}
        <p className="text-zinc-600">
          Você pode revisar ou revogar o consentimento a qualquer momento pelo link &ldquo;Preferências de cookies&rdquo; no
          rodapé do site ou entrando em contato conosco. Enquanto não houver aceite, as ferramentas de medição e de marketing
          operam em modo restrito: não gravam cookies de analytics nem de publicidade e não registram identificadores de
          publicidade. O armazenamento nessas categorias só é habilitado depois que você aceita.
        </p>
      </section>

      <section id="retencao" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Retenção e segurança</h2>
        <p className="text-zinc-600">
          Mantemos dados apenas durante o relacionamento ativo com o tutor e pelo prazo necessário para cumprir obrigações legais.
          Após esse período, aplicamos anonimização ou exclusão segura. Medidas técnicas implementadas:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-zinc-600">
          <li>Tráfego do site protegido por HTTPS/TLS.</li>
          <li>Acesso ao painel administrativo restrito por autenticação e permissões.</li>
          <li>Armazenamento em provedores de infraestrutura que mantêm rotinas próprias de backup.</li>
          <li>Revisão periódica de quem tem acesso aos dados.</li>
        </ul>
        <p className="text-zinc-600">
          Nenhum sistema é totalmente imune a incidentes. Em caso de incidente de segurança relevante,
          comunicaremos os titulares afetados e a ANPD conforme exige a LGPD.
        </p>
      </section>

      <section id="direitos" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Direitos do titular</h2>
        <p className="text-zinc-600">
          O titular pode solicitar a qualquer momento: confirmação de tratamento, acesso, correção, anonimização, portabilidade,
          eliminação, informação sobre compartilhamento e revogação de consentimento. As solicitações relacionadas aos direitos
          dos titulares serão tratadas nos prazos previstos na legislação e regulamentação aplicáveis, sem custo. Quando cabível,
          a declaração completa de acesso aos dados será fornecida em até 15 dias, nos termos da LGPD.
        </p>
      </section>

      <section id="contato" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Contato do controlador</h2>
        <p className="text-zinc-600">
          Controladora: By Império Dog LTDA • CNPJ 22.587.478/0001-00
        </p>
        <p className="text-zinc-600">
          E-mail para assuntos de privacidade: <strong>privacidade@byimperiodog.com.br</strong>
        </p>
        <p className="text-zinc-600">
          E-mail comercial: <strong>contato@byimperiodog.com.br</strong>
        </p>
        <p className="text-zinc-600">
          Criação, atendimento e visitas: Bragança Paulista/SP. Ao enviar uma solicitação, informe nome completo, documento
          utilizado no cadastro e canal de contato preferido.
        </p>
      </section>

      <LastUpdated contentTime={lastUpdated} />
    </div>
    </>
  );
}
