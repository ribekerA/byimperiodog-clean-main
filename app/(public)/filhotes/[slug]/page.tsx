import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PuppyCinematicGallery from "@/components/catalog/PuppyCinematicGallery";
import {
  ClientOnlyPuppyReviews,
  ClientOnlyPuppyStickyFloatingCTA,
} from "@/components/catalog/PuppyClientOnly";
import PuppyDetailPanel from "@/components/catalog/PuppyDetailPanel";
import { RelatedPages } from "@/components/common/RelatedPages";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { TiltCard } from "@/components/motion/TiltCard";
import ViewEventTracker from "@/components/ViewEventTracker";
import { staticPuppies } from "@/content/puppies-static";
import { puppySearchCopy } from "@/content/puppy-search-copy";
import { formatarPreco } from "@/domain/pricing";
import { getPuppyBySlug } from "@/lib/catalog-utils";
import { focoDaFoto } from "@/lib/photo-focus";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildBreadcrumbLD, buildVitrinePageLD } from "@/lib/structured-data";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// UrgencyCountdown, PuppyViewerCount e VisitorActivityToast foram removidos.
// Os tres exibiam atividade que nunca aconteceu:
//  • UrgencyCountdown derivava um "reservado em" por hash do slug e contava
//    24h para uma expiracao de reserva que nao existe em lugar nenhum.
//  • PuppyViewerCount caia numa "simulacao organica" de 3 a 12 pessoas vendo
//    agora sempre que o Realtime do Supabase nao respondia.
//  • VisitorActivityToast sorteava nome e cidade de listas fixas para anunciar
//    "Fulana de Campinas favoritou este filhote".
// Anuncio de escassez e de demanda so pode sair de dado real e verificavel.
//
// Esta pagina e permanente (26/08/2026). Ela nao remove foto, nao muda URL,
// nao vira 404 e nao muda de canonical quando o animal fotografado sai: ela
// representa a combinacao de cor e sexo, e o que existe hoje se confirma no
// atendimento. Por isso sairam daqui o rotulo de status, o ramo "vendido", o
// filtro que escondia relacionados vendidos, a contagem de disponiveis por cor
// e o NotifyMeButton que substituia o CTA.

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> };

// ─── Static params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return staticPuppies.map((p) => ({ slug: p.slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const puppy = getPuppyBySlug(params.slug);
  if (!puppy) return { title: "Filhote não encontrado" };

  const sexLabel = puppy.sex === "female" ? "Fêmea" : "Macho";
  const corLabel = (puppy as any).cor ?? puppy.color ?? "";
  const searchCopy = puppySearchCopy(puppy);
  // O título repetia cor e sexo duas vezes ("Spitz Cinza-Lobo (Wolf Sable)
  // Fêmea — Spitz Alemão Anão (Lulu da Pomerânia) Cinza-Lobo Fêmea"): 109
  // caracteres com o sufixo da marca, cortado na busca e com a palavra "Spitz"
  // três vezes. O nome do filhote já traz cor e sexo; só falta o sinônimo pelo
  // qual a raça é mais pesquisada.
  // O sinônimo só entra quando cabe. "Spitz Cinza-Lobo (Wolf Sable) Fêmea —
  // Lulu da Pomerânia" dava 72 caracteres com o sufixo da marca, e o Google
  // cortava exatamente em cima do sinônimo — que era a única razão de ele
  // estar ali. Nos nomes curtos ele ajuda quem pesquisa por "Lulu"; nos longos
  // o próprio nome do filhote já diz cor, sexo e raça.
  const tituloCompleto = `${puppy.name} — Lulu da Pomerânia`;
  const priceCents = (puppy as any).priceCents ?? (puppy as any).price_cents;
  const title = searchCopy
    ? `${searchCopy.heading} | ${formatarPreco(priceCents)}`
    : tituloCompleto.length <= 45 ? tituloCompleto : puppy.name;
  const description =
    (puppy as any).description ??
    `Filhote de Spitz Alemão Anão (Lulu da Pomerânia) ${corLabel} ${sexLabel} em Bragança Paulista, SP. Registro oficial, consulta veterinária e mentoria pós-venda.`;
  const descricaoBusca = resumirParaBusca(searchCopy?.metadataDescription ?? description);
  const firstImage = puppy.images?.find((img: string) => !img.endsWith(".mp4"));

  // A rota /og/filhote/[slug] nunca chegou a devolver imagem: quebrava no
  // Satori ("Expected <div> to have explicit display: flex"), buscava a foto em
  // outro domínio e baixava fonte de emoji em tempo
  // de requisição. Estas 8 páginas ficavam sem og:image no WhatsApp. A foto do
  // próprio filhote é arquivo estático, sempre responde e compartilha melhor.
  // Sem width/height: a foto do filhote não é 1200×630, e declarar essa medida
  // fazia o WhatsApp recortar errado.
  const ogImages = firstImage ? [{ url: firstImage, alt: puppy.name }] : [OG_DEFAULT_IMAGE];

  return {
    title,
    description: descricaoBusca,
    alternates: { canonical: `/filhotes/${puppy.slug}` },
    openGraph: {
      title,
      description: descricaoBusca,
      type:   "website",
      url:    `/filhotes/${puppy.slug}`,
      images: ogImages,
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description: descricaoBusca,
      images:      ogImages,
    },
  };
}

/**
 * Encurta o texto do filhote para a busca sem cortar palavra pela metade.
 *
 * A meta description saía de description.slice(0, 160) e seis das nove fichas
 * terminavam assim: "...confirmar disponibilidade, documentação e cond".
 * O texto inteiro continua na página, dentro do PuppyHero — quem corta é só o
 * resumo que vai para o Google. Aqui ele fecha na última frase que couber, e
 * só recorre ao corte por palavra quando nem a primeira frase cabe.
 */
function resumirParaBusca(texto: string, limite = 158) {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo;

  const cortado = limpo.slice(0, limite);
  const fimDeFrase = Math.max(
    cortado.lastIndexOf(". "),
    cortado.lastIndexOf("! "),
    cortado.lastIndexOf("? "),
  );
  if (fimDeFrase > limite / 2) return cortado.slice(0, fimDeFrase + 1);

  return cortado.slice(0, cortado.lastIndexOf(" ")).replace(/[,;:—-]$/, "") + "…";
}

// ─── Mapa de cor → glow (TiltCard dos relacionados) ──────────────────────────

const COLOR_GLOW: Record<string, string> = {
  creme:        "rgba(243,181,98,0.45)",
  laranja:      "rgba(249,115,22,0.40)",
  preto:        "rgba(161,161,170,0.30)",
  "wolf-sable": "rgba(99,102,241,0.35)",
  branco:       "rgba(255,255,255,0.30)",
};
const DEFAULT_GLOW = "rgba(52,211,153,0.30)";

// ─── Página ────────────────────────────────────────────────────────────────────

export default async function PuppyPage(props: Props) {
  const params = await props.params;
  const puppy = getPuppyBySlug(params.slug);
  if (!puppy) notFound();

  const sexLabel  = puppy.sex === "female" ? "Fêmea" : "Macho";
  const sexSlug   = puppy.sex === "female" ? "femea" : "macho";
  const corLabel  = (puppy as any).cor ?? puppy.color ?? "";
  const colorSlug = (puppy.color ?? (puppy as any).cor ?? "").toLowerCase();
  const searchCopy = puppySearchCopy(puppy);
  const description =
    (puppy as any).description ??
    `Filhote de Spitz Alemão Anão (Lulu da Pomerânia) ${corLabel} ${sexLabel} em Bragança Paulista, SP. Registro oficial, consulta veterinária e mentoria pós-venda.`;

  const waLink = buildWhatsAppLink({
    message: `Olá! Vi ${puppy.name} (${corLabel}, ${sexLabel}) na vitrine do site e gostaria de conhecer as opções atuais dessa combinação.`,
    utmSource: "site",
    utmMedium: "puppy_page",
    utmCampaign: "filhote_detalhe",
    utmContent: puppy.slug,
  });

  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");

  const pageLd       = buildVitrinePageLD(puppy as any);
  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início",    url: `${SITE_URL}/` },
    { name: "Filhotes",  url: `${SITE_URL}/filhotes` },
    { name: puppy.name,  url: `${SITE_URL}/filhotes/${puppy.slug}` },
  ]);

  const related = staticPuppies
    .filter((p) => p.slug !== puppy.slug && p.color === puppy.color)
    .slice(0, 3);

  const coverImage = puppy.images?.find((img: string) => !img.endsWith(".mp4"));

  return (
    <>
      {/* JSON-LD */}
      <script id="ld-webpage"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <script id="ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {/* GA4: view_puppy_reference — visualizacao da pagina de referencia.
          Nao e lead: lead e o clique em WhatsApp (whatsapp_click) ou o envio
          de formulario. */}
      <ViewEventTracker tipo="filhote" puppySlug={puppy.slug} puppyColor={colorSlug} puppySex={sexSlug} />

      <div className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-10 lg:pb-16">

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <nav aria-label="Navegação estrutural" className="mb-3 sm:mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
            <li><Link href="/" className="hover:text-emerald-700 hover:underline">Início</Link></li>
            <li aria-hidden="true" className="text-zinc-300">/</li>
            <li><Link href="/filhotes" className="hover:text-emerald-700 hover:underline">Filhotes</Link></li>
            <li aria-hidden="true" className="text-zinc-300">/</li>
            <li className="font-medium text-zinc-900" aria-current="page">{puppy.name}</li>
          </ol>
        </nav>

        {/* ── Grid principal ─────────────────────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-x-10">

          <div className="min-w-0 lg:col-start-2 lg:row-start-1">
            <PuppyDetailPanel
              summaryOnly
              name={puppy.name}
              heading={searchCopy?.heading}
              corLabel={corLabel}
              colorSlug={colorSlug}
              sexLabel={sexLabel}
              sexSlug={sexSlug}
              priceCents={puppy.priceCents ?? puppy.price_cents}
              description={description}
              waLink={waLink}
              slug={puppy.slug}
            />
          </div>

          {/* Galeria cinematográfica */}
          <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:row-span-2">
          <PuppyCinematicGallery
            images={puppy.images ?? []}
            puppyName={puppy.name}
            puppyColor={corLabel}
            puppySex={sexLabel}
            puppyId={puppy.slug}
          />
          </div>

          {/* Painel de detalhes */}
          {/* `min-w-0`: a coluna da galeria já tinha, esta não. Sem ela a
              trilha do grid cresce até o min-content do conteúdo mais rígido
              do painel, e qualquer texto que não quebre volta a estourar a
              largura da tela no celular. */}
          <div className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-start-2">
            <PuppyDetailPanel
              detailsOnly
              name={puppy.name}
              heading={searchCopy?.heading}
              corLabel={corLabel}
              colorSlug={colorSlug}
              sexLabel={sexLabel}
              sexSlug={sexSlug}
              priceCents={(puppy as any).priceCents ?? (puppy as any).price_cents}
              description={description}
              waLink={waLink}
              slug={puppy.slug}
            />
          </div>
        </div>

        {searchCopy && (
          <section
            className="mt-12 rounded-3xl border border-zinc-200 bg-white px-5 py-8 shadow-sm sm:mt-16 sm:px-8"
            aria-labelledby="search-landing-heading"
          >
            <div className="mx-auto max-w-4xl">
              <h2
                id="search-landing-heading"
                className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl"
              >
                {searchCopy.sectionTitle}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-700">
                {searchCopy.introduction}
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <h3 className="font-semibold text-zinc-900">Valor transparente</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {formatarPreco((puppy as any).priceCents ?? (puppy as any).price_cents)} publicado na página, sem esconder o preço. Condições de reserva são explicadas no atendimento.
                  </p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <h3 className="font-semibold text-zinc-900">Saúde e documentação</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Registro oficial, consulta veterinária, hemograma completo e protocolo vacinal em dia conforme a idade.
                  </p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <h3 className="font-semibold text-zinc-900">Atendimento direto</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Atendimento em Bragança Paulista, SP, com possibilidade de visita ou videochamada e suporte após a entrega.
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                <h3 className="font-semibold text-zinc-900">Como confirmar a disponibilidade?</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                  As fotos permanecem como referência real da combinação de cor e sexo. Fale com a equipe para conhecer as opções atuais antes de reservar.
                </p>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  data-wa-placement="product_detail"
                  data-wa-puppy={puppy.slug}
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Consultar opções atuais no WhatsApp
                </a>
              </div>
            </div>
          </section>
        )}

        <div className="mt-12">
          <RelatedPages links={[
            { href: `/filhotes/cor/${colorSlug}`, label: `Compare os filhotes ${corLabel}`, desc: "Veja outras referências desta cor e seus valores." },
            { href: "/filhotes", label: "Veja os filhotes disponíveis", desc: "Compare fotos, vídeos e valores individuais dos filhotes." },
            { href: "/comprar-spitz-anao", label: "Como comprar e reservar", desc: "Conheça as etapas e os documentos antes de decidir." },
            { href: "/blog/spitz-alemao-anao-entrega-brasil", label: "Entrega para todo o Brasil", desc: "Entenda documentação, transporte e atendimento para outros estados." },
          ]} />
        </div>

        {/* ── Avaliações das famílias ────────────────────────────────────── */}
        <ClientOnlyPuppyReviews puppySlug={puppy.slug} puppyName={puppy.name} />

        {/* ── Filhotes relacionados ──────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mt-14 sm:mt-20" aria-labelledby="related-heading">
            <ScrollReveal>
              <h2
                id="related-heading"
                className="mb-6 text-xl font-bold text-zinc-900"
              >
                Outros {corLabel} na vitrine
              </h2>
            </ScrollReveal>

            <StaggerContainer stagger={0.1} delay={0.05} margin="-40px">
              <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                {related.map((rel) => {
                  const relSex    = rel.sex === "female" ? "Fêmea" : "Macho";
                  const relCor    = (rel as any).cor ?? rel.color ?? "";
                  const relCorKey = (rel.color ?? relCor).toLowerCase();
                  const relImg    = rel.images?.find((img: string) => !img.endsWith(".mp4"));
                  const glowColor = COLOR_GLOW[relCorKey] ?? DEFAULT_GLOW;

                  return (
                    // O <li> vem POR FORA do StaggerItem, que renderiza uma
                    // <div>. Invertido, a <ul> passava a conter <div> direto e
                    // o <li> ficava dentro dela: o leitor de tela deixava de
                    // anunciar "lista de N itens" e o cascateamento continua
                    // igual, porque o framer-motion propaga variante por
                    // contexto de React, nao por vizinhanca no DOM.
                    <li key={rel.slug}>
                      <StaggerItem>
                        <TiltCard glowColor={glowColor} maxTilt={7}>
                          <Link
                            href={`/filhotes/${rel.slug}`}
                            className="group block overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:shadow-md"
                          >
                            <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
                              {relImg && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={relImg}
                                  alt={`Filhote ${rel.name}`}
                                  // Recorte medido por foto (src/lib/photo-focus):
                                  // aqui o quadro e quadrado e a foto e vertical, entao
                                  // sobra ainda menos margem para errar a ancora.
                                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                                  style={{ objectPosition: focoDaFoto(relImg) }}
                                  loading="lazy"
                                />
                              )}
                              <div
                                className="absolute inset-0"
                                style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.45) 100%)" }}
                                aria-hidden="true"
                              />
                              {/* right-3 + line-clamp: nomes longos como "Spitz
                                  Cinza-Lobo (Wolf Sable) Femea" saiam do card e
                                  eram cortados no meio da palavra pelo overflow. */}
                              <span className="absolute bottom-2 left-3 right-3 line-clamp-2 text-sm font-bold text-white drop-shadow">
                                {rel.name}
                              </span>
                            </div>
                            <div className="p-3">
                              <p className="text-sm text-zinc-500">{relCor} · {relSex}</p>
                              {(rel as any).priceCents > 0 && (
                                <p className="mt-1 text-sm font-bold text-emerald-700">
                                  {formatarPreco((rel as any).priceCents)}
                                </p>
                              )}
                            </div>
                          </Link>
                        </TiltCard>
                      </StaggerItem>
                    </li>
                  );
                })}
              </ul>
            </StaggerContainer>
          </section>
        )}

        {/* ── Voltar ────────────────────────────────────────────────────── */}
        <div className="mt-12 text-center">
          <Link
            href="/filhotes"
            className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-emerald-500 hover:text-emerald-700"
          >
            ← Ver toda a vitrine de filhotes
          </Link>
        </div>
      </div>

      {/* ── CTA flutuante (desktop card + mobile barra) ────────────────── */}
      <ClientOnlyPuppyStickyFloatingCTA
        name={puppy.name}
        coverImage={coverImage}
        priceCents={(puppy as any).priceCents ?? (puppy as any).price_cents}
        waLink={waLink}
      />
    </>
  );
}
