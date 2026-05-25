import type { Metadata } from "next";

import { LastUpdated } from "@/components/common/LastUpdated";
import { TOC } from "@/components/common/TOC";
import { pageMetadata } from "@/lib/seo";

const path = "/politica-de-privacidade";
const lastUpdated = "2025-10-18T09:00:00.000Z";

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
    title: "Política de Privacidade | By Imperio Dog",
    description:
      "Como a By Imperio Dog trata dados pessoais de tutores interessados no Spitz Alemão (Lulu da Pomerânia): coleta, finalidade, retenção, segurança e atendimento à LGPD.",
    path,
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br"}/og/politica-privacidade.jpg`,
        alt: "Tutora protegendo os dados do Spitz Alemão (Lulu da Pomerânia) com segurança digital",
      },
    ],
  });
}

export default function PoliticaDePrivacidadePage() {
  return (
    <main className="mx-auto max-w-4xl space-y-12 px-6 py-16 text-zinc-800">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">LGPD</p>
        <h1 className="text-4xl font-bold text-zinc-900">Política de Privacidade</h1>
        <p className="text-lg text-zinc-600">
          Esta política descreve como coletamos, utilizamos e protegemos dados pessoais fornecidos por tutores e interessadas em
          receber um Spitz Alemão (Lulu da Pomerânia). Mantemos transparência total durante o relacionamento e respeitamos os
          princípios da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>
      </header>

      <TOC items={tocItems} />

      <section id="dados-coletados" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Dados coletados</h2>
        <p className="text-zinc-600">
          Coletamos apenas informações necessárias para análise de perfil, acompanhamento de saúde e prestação de suporte. Os
          principais dados incluem:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-zinc-600">
          <li>
            Dados de identificação: nome completo, CPF, data de nascimento e documentos de comprovação de responsabilidade civil.
          </li>
          <li>
            Dados de contato: e-mail, telefone, endereço completo para logística e preferências de comunicação.
          </li>
          <li>
            Informações sobre rotina familiar: presença de crianças ou outros animais, tempo disponível e objetivo ao receber o
            Spitz Alemão (Lulu da Pomerânia).
          </li>
          <li>
            Registros multimídia fornecidos voluntariamente, como fotos e vídeos para avaliação do ambiente.
          </li>
        </ul>
      </section>

      <section id="finalidades" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Finalidades e base legal</h2>
        <p className="text-zinc-600">
          Utilizamos os dados para garantir alinhamento entre o tutor e o Spitz Alemão (Lulu da Pomerânia), cumprir obrigações
          legais e oferecer suporte contínuo. As principais finalidades são:
        </p>
        <ol className="list-decimal space-y-2 pl-6 text-zinc-600">
          <li>
            Avaliar compatibilidade de perfil e orientar a preparação da residência (execução de contrato e procedimentos prévios -
            art. 7º, V da LGPD).
          </li>
          <li>
            Compartilhar materiais educativos, cronogramas de socialização e orientações personalizadas (legítimo interesse, art.
            10 da LGPD).
          </li>
          <li>
            Cumprir exigências fiscais, sanitárias e de transporte do Spitz Alemão (Lulu da Pomerânia) (cumprimento de obrigação
            legal).
          </li>
        </ol>
        <p className="text-zinc-600">
          Sempre que necessário, solicitamos consentimento específico, permitindo revogação simples por e-mail ou pelo painel de
          preferências.
        </p>
      </section>

      <section id="compartilhamento" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Compartilhamento e operadores</h2>
        <p className="text-zinc-600">
          Compartilhamos dados somente com operadores contratados que seguem padrões de segurança equivalentes. Exemplos:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-zinc-600">
          <li>Clínicas veterinárias parceiras para exames, laudos e vacinas.</li>
          <li>Serviços de transporte especializado para entrega do Spitz Alemão (Lulu da Pomerânia).</li>
          <li>Plataformas de comunicação e CRM com contratos de confidencialidade.</li>
        </ul>
        <p className="text-zinc-600">
          Não vendemos dados pessoais. Eventuais transferências internacionais ocorrem apenas quando ferramentas essenciais
          armazenam informações em servidores fora do Brasil, sempre com salvaguardas contratuais.
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
          Você pode revisar ou revogar o consentimento a qualquer momento pelo banner de privacidade ou entrando em contato com a
          nossa equipe.
        </p>
      </section>

      <section id="retencao" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Retenção e segurança</h2>
        <p className="text-zinc-600">
          Mantemos dados apenas durante o relacionamento ativo com o tutor e pelo prazo necessário para cumprir obrigações legais.
          Após esse período, aplicamos anonimização ou exclusão segura. Medidas técnicas implementadas:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-zinc-600">
          <li>Criptografia de dados sensíveis em repouso e em trânsito.</li>
          <li>Controle de acesso com autenticação multifator para colaboradores.</li>
          <li>Monitoramento de logs e revisão periódica de permissões.</li>
          <li>Planos de contingência e backups redundantes em datacenters certificados.</li>
        </ul>
      </section>

      <section id="direitos" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Direitos do titular</h2>
        <p className="text-zinc-600">
          O titular pode solicitar a qualquer momento: confirmação de tratamento, acesso, correção, anonimização, portabilidade,
          eliminação, informação sobre compartilhamento e revogação de consentimento. Atendemos solicitações em até 15 dias
          corridos e sem custo.
        </p>
      </section>

      <section id="contato" className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900">Contato do controlador</h2>
        <p className="text-zinc-600">
          Controladora: By Imperio Dog LTDA • CNPJ 34.010.264/0001-12
        </p>
        <p className="text-zinc-600">
          E-mail para assuntos de privacidade: <strong>privacidade@byimperiodog.com.br</strong>
        </p>
        <p className="text-zinc-600">
          Endereço: Rua Atibaia, 200 — Atibaia/SP — CEP 12940-000. Informe nome completo, documento utilizado no cadastro e canal
          de contato preferido.
        </p>
      </section>

      <LastUpdated buildTime={process.env.NEXT_PUBLIC_BUILD_TIME} contentTime={lastUpdated} />
    </main>
  );
}
