import Image from "next/image";
import Link from "next/link";

import { aPartirDe, type CorDivulgada, formatarPreco } from "@/domain/pricing";

// O card do Cinza-Lobo (Wolf Sable) saiu daqui: a cor deixou de ser divulgada.
// Sobraram as quatro cores da tabela comercial, e o `price` de cada uma passou a
// vir de domain/pricing em vez de ser digitado — o branco anunciava "fêmea
// R$ 9.500" enquanto as outras diziam "a partir de", comparando maçã com
// laranja no mesmo grid.
const COLORS = [
  {
    slug: "branco",
    cor: "branco",
    label: "Branco",
    tagline: "Pelagem branca e uniforme",
    image: "/filhotes/branco/branco-femea-jardim-01.jpg",
    badge: "Disponível",
    badgeClass: "bg-zinc-100 text-zinc-800",
    glowColor: "rgba(255,255,255,0.20)",
  },
  {
    slug: "creme",
    cor: "creme",
    label: "Creme",
    tagline: "Pelagem cor de marfim",
    image: "/filhotes/creme/creme-femea-01.jpg",
    badge: "Disponibilidade limitada",
    badgeClass: "bg-[var(--accent)] text-[var(--accent-foreground)]",
    glowColor: "rgba(243,181,98,0.18)",
  },
  {
    slug: "laranja",
    cor: "laranja",
    label: "Laranja",
    tagline: "A cor icônica da raça",
    image: "/filhotes/laranja/laranja-femea-01.jpg",
    badge: "Disponível",
    badgeClass: "bg-emerald-500 text-white",
    glowColor: "rgba(249,115,22,0.18)",
  },
  {
    slug: "preto",
    cor: "preto",
    label: "Preto",
    tagline: "Elegância e disponibilidade limitada",
    image: "/filhotes/preto/preto-filhote-flores-01.jpg",
    badge: "Ninhadas esporádicas",
    badgeClass: "bg-zinc-800 text-white",
    glowColor: "rgba(161,161,170,0.12)",
  },
] as const satisfies readonly { cor: CorDivulgada; [k: string]: unknown }[];

export default function ColorGallery() {
  return (
    <section className="bg-zinc-950 py-20 sm:py-28 overflow-hidden" aria-labelledby="colors-heading">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">

        {/* Header */}
        <div className="mx-auto mb-12 max-w-xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">
            Cores disponíveis
          </p>
          {/* Esta galeria e o chat de qualificação ficam a uma seção de
              distância na home e usavam o MESMO h2, palavra por palavra. Duas
              seções diferentes com o mesmo título confundem quem lê e quem
              indexa. Aqui o título passa a dizer o que a seção é: as cores. */}
          <h2 id="colors-heading" className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            As cores do Spitz Alemão Anão
          </h2>
          <p className="mt-3 text-zinc-400">
            Cada cor tem disponibilidade e preço próprios. Clique para explorar.
          </p>
        </div>

        {/* Grid de cores — cada card com delay individual */}
        {/* lg:grid-cols-4 acompanha as quatro cores divulgadas. Com cinco
            colunas e quatro cards a linha ficava com um vão à direita. */}
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
                    sizes="(max-width: 1024px) calc(50vw - 28px), 292px"
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
                  {/* Badge */}
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${cor.badgeClass}`}
                  >
                    {cor.badge}
                  </span>
                </div>

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/55">{cor.tagline}</p>
                  <p className="mt-0.5 text-lg font-bold text-white">{cor.label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-emerald-400">
                    a partir de {formatarPreco(aPartirDe(cor.cor))}
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
