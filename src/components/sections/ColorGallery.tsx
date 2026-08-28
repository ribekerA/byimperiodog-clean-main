import Image from "next/image";
import Link from "next/link";

import { aPartirDe, type CorDivulgada, formatarPreco } from "@/domain/pricing";

// Esta vitrine mostra as quatro cores escolhidas para a home. Cinza-Lobo já não
// era divulgado e o Particolor foi retirado daqui por decisão comercial. O
// valor de cada card vem de domain/pricing em vez de ser digitado no componente.
//
// A ordem é a da tabela de preços, do valor mais acessível ao mais caro: quem
// chega por esta seção lê os cards antes de abrir a tabela, e as duas listas
// discordarem de ordem faz a mais barata parecer estar em lugares diferentes.
const COLORS = [
  {
    slug: "laranja",
    cor: "laranja",
    label: "Laranja",
    tagline: "A cor icônica da raça",
    image: "/filhotes/laranja/laranja-femea-01.jpg",
    glowColor: "rgba(249,115,22,0.18)",
  },
  {
    slug: "creme",
    cor: "creme",
    label: "Creme",
    tagline: "Pelagem cor de marfim",
    image: "/filhotes/creme/creme-femea-01.jpg",
    glowColor: "rgba(243,181,98,0.18)",
  },
  {
    slug: "preto",
    cor: "preto",
    label: "Preto",
    tagline: "Pelagem preta uniforme",
    image: "/filhotes/preto/preto-filhote-flores-01.jpg",
    glowColor: "rgba(161,161,170,0.12)",
  },
  {
    slug: "branco",
    cor: "branco",
    label: "Branco",
    tagline: "Pelagem branca e uniforme",
    image: "/filhotes/branco/branco-femea-jardim-01.jpg",
    glowColor: "rgba(255,255,255,0.20)",
  },
] as const satisfies readonly { cor: CorDivulgada; [k: string]: unknown }[];

export default function ColorGallery() {
  return (
    <section className="bg-zinc-950 py-20 sm:py-28 overflow-hidden" aria-labelledby="colors-heading">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">

        {/* Header */}
        <div className="mx-auto mb-12 max-w-xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">
            Cores da raça
          </p>
          {/* Esta galeria e o chat de qualificação ficam a uma seção de
              distância na home e usavam o MESMO h2, palavra por palavra. Duas
              seções diferentes com o mesmo título confundem quem lê e quem
              indexa. Aqui o título passa a dizer o que a seção é: as cores. */}
          <h2 id="colors-heading" className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            As cores do Spitz Alemão Anão
          </h2>
          <p className="mt-3 text-zinc-400">
            Cada cor tem o seu valor de partida. Clique para ver as fotos reais de cada uma.
          </p>
        </div>

        {/* Grid de cores — cada card com delay individual */}
        {/* Quatro cores divulgadas nesta vitrine, em uma única linha no desktop. */}
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {COLORS.map((cor) => (
            <li key={cor.slug}>
              <Link
                href={`/filhotes/cor/${cor.slug}`}
                className="group relative block overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/5 transition-all duration-300 hover:ring-emerald-500/60 hover:scale-[1.03]"
                style={{ boxShadow: `0 8px 40px ${cor.glowColor}` }}
              >
                {/* Imagem */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={cor.image}
                    alt={`Spitz Alemão Anão ${cor.label}`}
                    fill
                    sizes="(max-width: 1024px) calc(50vw - 28px), 231px"
                    className="object-cover transition duration-500 group-hover:scale-108"
                  />
                  {/* Gradiente */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,0.90) 100%)",
                    }}
                    aria-hidden="true"
                  />
                  {/* O selo saiu em 26/08/2026 com os campos `badge` e
                      `badgeClass`. Ele dizia "Disponível" em três cores,
                      "Disponibilidade limitada" no creme e "Ninhadas
                      esporádicas" no preto — estoque e escassez declarados na
                      home, sobre fotos que ficam publicadas para sempre. O card
                      já mostra a tagline da pelagem e o valor de partida; o
                      selo só acrescentava a parte que não era verdade. */}
                </div>

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/55">{cor.tagline}</p>
                  <p className="mt-0.5 text-lg font-bold text-white">{cor.label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-emerald-400">
                    {formatarPreco(aPartirDe(cor.cor))}
                  </p>
                </div>

                {/* Seta — aparece no hover (desktop only: touch devices don't hover) */}
                <div
                  className="absolute right-3 top-3 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5"
                  aria-hidden="true"
                >
                  →
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
