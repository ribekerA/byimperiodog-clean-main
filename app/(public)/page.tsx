import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PixIcon } from "@/components/icons/PixIcon";
import AvaliacoesRotativas from "@/components/reviews/AvaliacoesRotativas";
import ColorGallery from "@/components/sections/ColorGallery";
import GradeDaHome, { type FilhoteDaHome } from "@/components/sections/GradeDaHome";
import {
  ClientOnlyAiMatchmakerChat,
  ClientOnlyTestimonials,
} from "@/components/sections/HomeClientOnly";
import HomeFAQ from "@/components/sections/HomeFAQ";
import NinhadaAlert from "@/components/sections/NinhadaAlert";
import PriceTransparency from "@/components/sections/PriceTransparency";
import TextTestimonials from "@/components/sections/TextTestimonials";
import { puppiesPublicados } from "@/content/puppies-static";
import { FOUNDING_YEAR } from "@/domain/config";
import { PISOS_POR_SEXO, partesDoPrecoNoPix } from "@/domain/pricing";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  // O `template: '%s | By Império Dog'` fica em baseSiteMetadata, no layout do
  // segmento (public). No Next.js o template só alcança segmentos FILHOS, então
  // /filhotes recebia a marca e a home — que é a página do próprio segmento —
  // saía sem. Resultado: as buscas por "Império Dog" apareciam na posição 7 e
  // não geravam clique, porque o nome não estava no título do resultado.
  // Escrever a marca aqui não duplica nada, justamente porque o template não
  // se aplica a esta página.
  title: "Canil Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista | By Império Dog",
  // A description tinha 218 caracteres. O Google corta perto de 155 (menos
  // ainda no celular, de onde vêm 90% dos cliques), então "13 anos, 180+
  // famílias. Entregamos em todo o Brasil." nunca chegava a ser lido. Encurtada
  // para caber inteira, mantendo "Lulu da Pomerânia" — que sai do título por
  // falta de espaço, mas é o nome pelo qual a raça é de fato pesquisada.
  description:
    "Canil de Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista, SP. Veja fotos, preços, documentação e atendimento para famílias de todo o Brasil.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "By Império Dog | Spitz Alemão Anão (Lulu da Pomerânia) — Bragança Paulista, SP",
    description:
      `Canil especializado em Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista, SP. Registro oficial, consulta veterinária e hemograma completo inclusos. Criação desde ${FOUNDING_YEAR}, com contrato.`,
    // `/og/home.jpg` nunca existiu: a pasta public/og/ não existe no repositório
    // e o arquivo respondia 404. Toda pré-visualização de link da home saía sem
    // imagem. Agora aponta para o arquivo real de 1200x630.
    images: [{ url: OG_DEFAULT_IMAGE.url, width: OG_DEFAULT_IMAGE.width, height: OG_DEFAULT_IMAGE.height, alt: "Spitz Alemão Anão (Lulu da Pomerânia) da By Império Dog, Bragança Paulista SP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "By Império Dog | Spitz Alemão Anão (Lulu da Pomerânia)",
    description: "Criação responsável em Bragança Paulista, SP. Registro oficial, consulta veterinária e hemograma completo inclusos.",
    images: [OG_DEFAULT_IMAGE.url],
  },
};

// Links estratégicos — PageRank distribution para landing pages
const RACE_LINKS = [
  { emoji: "🐾", label: "Spitz Alemão Anão (Lulu da Pomerânia) — A Raça", href: "/spitz-alemao",              desc: "Lulu da Pomerânia — origem, características, temperamento e cuidados" },
  // O rótulo era `Tabela de Preços ${new Date().getFullYear()}`. Como o ano vinha
  // do relógio, a página publicava "Tabela de Preços 2026" sem que esse texto
  // existisse em lugar nenhum do código — e viraria "2027" sozinho na virada do
  // ano. Era também a origem do "Preços 2025" reprovado na auditoria anterior:
  // mesma linha, ano diferente. Sem data, o rótulo não envelhece.
  { emoji: "🛡️", label: "Como Comprar com Segurança", href: "/comprar-spitz-anao",         desc: "Guia passo a passo para não cair em golpes" },
  { emoji: "🍼", label: "Filhote de Spitz Alemão (Lulu da Pomerânia)",    href: "/filhote-de-spitz-alemao",   desc: "Lulu da Pomerânia — como escolher, primeiros cuidados e vacinação" },
  { emoji: "✅", label: "Criador Confiável",           href: "/criador-spitz-confiavel",   desc: "Documentação, exames e red flags para evitar" },
  { emoji: "📍", label: "Canil no Interior de SP",    href: "/canil-spitz-alemao-interior-sp", desc: "Cidades atendidas — Bragança Paulista e região" },
] as const;

// Diferenciais — definidos fora para evitar recriação a cada render
const DIFFERENTIALS = [
  { emoji: "🏅", title: "Registro oficial incluso", body: "Registro oficial incluso, com emissão e entrega conforme o prazo da entidade responsável e as condições previstas em contrato." },
  { emoji: "🩺", title: "Saúde documentada", body: "Consulta veterinária e hemograma completo antes da entrega, com protocolo vacinal em dia conforme a idade do filhote e carteira assinada pelo médico-veterinário." },
  { emoji: "🏡", title: "Socialização guiada", body: "Convivência com pessoas, sons e rotinas domésticas, com orientação de ambientação para a chegada na nova casa." },
  { emoji: "💬", title: "Mentoria pós-venda", body: "Suporte direto com a criadora via WhatsApp para rotina, nutrição e comportamento." },
  { emoji: "🚗", title: "Transporte orientado", body: "Orientação sobre transporte seguro, seja buscar pessoalmente ou por transportadora." },
  { emoji: "📋", title: "Lista de enxoval", body: "Lista de itens, alimentação e rotina entregue antes da chegada do filhote." },
] as const;

// ── Textos e ícones do mockup de 05/11/2026, ao pé da letra ──
//
// `w` e `h` são as medidas reais de cada arquivo, para a página reservar o
// espaço certo antes de o ícone chegar.
const SELOS = [
  { linha1: "Procedência", linha2: "confiável", icone: "/images/home/selo-procedencia.webp", w: 96, h: 96 },
  { linha1: "Acompanhamento", linha2: "pós-reserva", icone: "/images/home/selo-acompanhamento.webp", w: 108, h: 96 },
  { linha1: "Documentação", linha2: "orientada", icone: "/images/home/selo-documentacao.webp", w: 96, h: 96 },
  { linha1: "Suporte", linha2: "veterinário", icone: "/images/home/selo-veterinario.webp", w: 100, h: 96 },
  { linha1: "Atendimento", linha2: "humanizado", icone: "/images/home/selo-atendimento.webp", w: 108, h: 96 },
] as const;

// Os três que abrem a vitrine, na ordem do mockup. A foto é a do próprio filhote:
// a do desenho cortava as patas e não era a do animal do link.
const ABREM_A_VITRINE = [
  "spitz-alemao-anao-branco-macho",
  "spitz-alemao-anao-laranja-femea",
  "spitz-alemao-anao-preto-macho",
];

// Avaliação real e curta do perfil do Google, na íntegra.

// WebSite e Organization saíram daqui: o layout público já emite os dois em
// todas as páginas, com o mesmo @id. Emitir de novo na home criava um segundo
// nó por entidade e era isso que o Search Console reportava como campo
// duplicado. O SearchAction e o speakable que existiam aqui foram levados para
// buildWebsiteLD, e o knowsAbout para buildOrganizationLD (src/lib/tracking.ts).
// O contactPoint tinha `contactOption: "TollFree"` — o WhatsApp de atendimento
// não é gratuito, então a propriedade foi removida em vez de migrada.

export default function HomePage() {

  // A vitrine inteira, sem corte e sem filtro de estoque.
  //
  // Aqui havia um `.filter(p => p.status !== "sold" && p.status !== "vendido")`.
  // Ele fazia a foto sumir da home no dia em que aquele animal específico saía —
  // e essa foto é justamente o que a home tem de mais forte: referência visual
  // real de uma cor e de um sexo, indexada, compartilhada e trabalhando para o
  // domínio muito depois de o animal ter ido embora. Nenhum filhote sai da
  // vitrine por ter sido vendido. Quem sabe o que existe hoje é o atendimento.
  // (26/08/2026)
  const featured = puppiesPublicados;

  // Primeiro os três que abrem a vitrine; depois todos os outros.
  const filhotesDaHome: FilhoteDaHome[] = [
    ...ABREM_A_VITRINE.flatMap((slug) => featured.filter((p) => p.slug === slug)),
    ...featured.filter((p) => !ABREM_A_VITRINE.includes(p.slug)),
  ].map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    color: p.color,
    cor: p.cor,
    sex: p.sex,
    priceCents: p.priceCents,
    price_cents: p.price_cents,
    images: p.images,
  }));

  return (
    <>

      <div className="tema-verde relative flex flex-col">

        {/* ── A HOME DO MOCKUP DE 05/11/2026 ──────────────────────────────────
            Da primeira dobra até a faixa de avaliações, a home é o mockup: mesma
            ordem, mesmas frases e mesmas imagens, por decisão da responsável
            ("idêntica a esse mockup, fielmente, imagens, escritas, tudo").

            Três coisas não seguem o desenho ao pé da letra, de propósito:
            - os valores dos cartões vêm de PRECO_POR_SLUG (ver StaticPuppyCard);
            - a citação e o retrato do mockup não existem: a faixa publica uma
              avaliação real do perfil do Google;
            - "Lulu da Pomerânia" segue no H1 só para leitor de tela e índice.

            As medidas estão em `--u`, o pixel do mockup (ver `.hm` em
            globals.css). O que vinha depois continua depois. */}
        <div className="hm">

          <section className="hm-topo" aria-labelledby="hero-heading">
            <div className="hm-topo-foto">
              <Image
                src="/images/home/topo-quatro.webp"
                alt="Quatro filhotes de Spitz Alemão Anão, o Lulu da Pomerânia: branco, laranja, preto e creme."
                fill
                priority
                fetchPriority="high"
                quality={80}
                sizes="(min-width: 1180px) 1180px, 100vw"
                className="object-cover"
              />
            </div>
            <div className="hm-topo-texto">
              <h1 id="hero-heading" className="hm-titulo">
                Spitz Alemão Anão
                {" "}<span className="hm-titulo-lulu">(Lulu da Pomerânia)</span>
              </h1>
              <p className="hm-exclusivos">
                <Image src="/images/home/pata-esq.webp" alt="" width={88} height={76} unoptimized loading="eager" />
                <span>Filhotes Exclusivos</span>
                <Image src="/images/home/pata-dir.webp" alt="" width={88} height={76} unoptimized loading="eager" />
              </p>
              <p className="hm-chamada">Escolha o seu novo companheiro hoje mesmo!</p>
            </div>
          </section>

          <div className="hm-corpo">
            {/* O VALOR não é digitado: PISOS_POR_SEXO é o menor preço cadastrado
                por sexo, e sem oferta naquele valor a pílula não é publicada. */}
            <section aria-labelledby="pisos-heading">
              <h2 id="pisos-heading" className="sr-only">Valores a partir de, por sexo</h2>
              <ul className="hm-miolo hm-pilulas">
                {PISOS_POR_SEXO.map((piso) => {
                  const partes = partesDoPrecoNoPix(piso.cents);
                  const [inteiro, centavos] = partes.valor.split(",");
                  return (
                    <li key={piso.sexo}>
                      <Link href={`/filhotes/sexo/${piso.sexo}`} className={`hm-pilula ${piso.sexo === "macho" ? "hm-pilula-macho" : "hm-pilula-femea"}`}>
                        <span className="hm-pilula-topo">
                          <strong>{piso.rotulo}</strong>{" "}<span>{partes.prefixo}</span>
                        </span>{" "}
                        <span className="hm-pilula-meio">
                          {piso.sexo === "macho" ? (
                            <svg viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <circle cx="24" cy="36" r="18" />
                              <path d="M37 23 54 6M38 6h16v16" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" aria-hidden="true">
                              <circle cx="30" cy="20" r="16" />
                              <path d="M30 36v22M19 47h22" />
                            </svg>
                          )}
                          <span className="hm-pilula-valor">{inteiro}<span className="hm-pilula-centavos">,{centavos}</span></span>
                        </span>{" "}
                        <span className="hm-pilula-pix"><PixIcon />{partes.sufixo}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            <ul className="hm-miolo hm-selos">
              {SELOS.map((selo) => (
                <li key={selo.linha1}>
                  <Image src={selo.icone} alt="" width={selo.w} height={selo.h} unoptimized loading="eager" />
                  <span>{selo.linha1}{" "}<br />{selo.linha2}</span>
                </li>
              ))}
            </ul>

            <section aria-labelledby="featured-heading">
              <h2 id="featured-heading" className="sr-only">Conheça os filhotes</h2>
              <GradeDaHome filhotes={filhotesDaHome} />
            </section>

            <AvaliacoesRotativas className="hm-avaliacoes" />
          </div>
        </div>

        {/* Os seis diferenciais explicam por extenso o que os cinco selos do topo
            dizem em duas palavras. Ficaram aqui, logo depois da composição do
            mockup, e a frase de abertura veio junto. */}
        <section className="home-deferred-section overflow-hidden bg-[var(--bg-2)] py-14 sm:py-20" aria-label="Como a By Império Dog trabalha">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-[var(--text-muted)] sm:text-base">
              Desde {FOUNDING_YEAR} cuidando de cada detalhe para que você receba um filhote saudável, com documentação em ordem e mentoria pós-venda direta com a criadora.
            </p>

            <div className="grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {DIFFERENTIALS.map(({ emoji, title, body }) => (
                <div key={title}>
                  <div className="group flex h-full gap-3 sm:gap-4 rounded-2xl border border-zinc-100 bg-white p-4 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md">
                    <div
                      className="mt-0.5 flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg sm:text-xl transition-all duration-300 group-hover:bg-emerald-100 group-hover:scale-110"
                      aria-hidden="true"
                    >
                      {emoji}
                    </div>
                    {/* <dl> e não <div>: dt/dd só são válidos dentro de uma lista
                        de descrição. O preflight do Tailwind zera a margem de <dl>
                        igual à de <div>, então o render é idêntico. */}
                    <dl>
                      <dt className="text-sm font-bold text-zinc-900 sm:text-base">{title}</dt>
                      <dd className="mt-1 text-xs sm:text-sm leading-relaxed text-zinc-600">{body}</dd>
                    </dl>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. GALERIA DE CORES ─────────────────────────────────────────────── */}
        <div className="home-deferred-section">
          <ColorGallery />
        </div>

        {/* ── 6. AI MATCHMAKER ────────────────────────────────────────────────── */}
        <div className="home-deferred-section bg-[var(--bg)]">
          <ClientOnlyAiMatchmakerChat />
        </div>

        {/* ── 7. PROVA SOCIAL ─────────────────────────────────────────────────── */}
        <div className="home-deferred-section bg-white overflow-hidden">
          <div className="border-t border-zinc-100 pb-4">
            <ClientOnlyTestimonials title="Álbum das famílias" />
          </div>
          <TextTestimonials />
        </div>

        {/* ── 8. TRANSPARÊNCIA DE PREÇO ───────────────────────────────────────── */}
        <div className="home-deferred-section bg-[var(--bg)]">
          <PriceTransparency />
        </div>

        {/* ── 9. ALERTA DE NINHADA ────────────────────────────────────────────── */}
        <div className="home-deferred-section bg-[var(--bg)] px-4 py-16 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-5xl">
            <NinhadaAlert />
          </div>
        </div>

        {/* ── 10. FAQ — SEO semântico, voice search, AI overviews ─────────────── */}
        <div className="home-deferred-section">
          <HomeFAQ />
        </div>

        {/* ── 10.5. RECURSOS SOBRE A RAÇA — PageRank distribution ─────────── */}
        <div className="home-deferred-section">
          <section className="bg-zinc-50 border-t border-zinc-100 py-14 sm:py-20" aria-labelledby="recursos-heading">
            <div className="mx-auto max-w-5xl px-5 sm:px-8">
              <div className="mb-8 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Tudo sobre a raça</p>
                <h2 id="recursos-heading" className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  Guias e recursos para novos tutores
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Conteúdo escrito por quem cria a raça desde {FOUNDING_YEAR} — para você tomar a melhor decisão.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {RACE_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="text-2xl" aria-hidden="true">{l.emoji}</span>
                    <span className="mt-3 text-sm font-bold text-zinc-900 leading-snug group-hover:text-emerald-700">{l.label}</span>
                    <span className="mt-1.5 text-xs text-zinc-500 leading-snug">{l.desc}</span>
                    <span className="mt-4 text-xs font-semibold text-emerald-700">Ler mais →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ── 11. CTA DE GUIAS ────────────────────────────────────────────────── */}
        <div className="home-deferred-section border-t border-zinc-200 bg-white py-14">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Conteúdo educativo</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Preço, escolha e rotina do Lulu da Pomerânia
            </h2>
            <p className="mt-3 text-zinc-600">
              Compare cores e valores, conheça os cuidados e veja como preparar a chegada do filhote. Os guias estão organizados por assunto para ajudar em cada etapa.
            </p>
            <Link
              href="/guias"
              className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-zinc-200 px-7 py-3 text-sm font-semibold text-zinc-700 transition hover:border-emerald-500 hover:text-emerald-700 hover:scale-[1.02]"
            >
              Explorar todos os assuntos →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
