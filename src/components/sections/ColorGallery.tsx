"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { ScrollReveal } from "@/components/motion/ScrollReveal";

const COLORS = [
  {
    slug: "creme",
    label: "Creme",
    tagline: "A cor mais valorizada",
    price: "a partir de R$ 9.000",
    image: "/filhotes/creme/creme-femea-01.jpg",
    badge: "Alta demanda",
    badgeClass: "bg-[var(--accent)] text-[var(--accent-foreground)]",
    glowColor: "rgba(243,181,98,0.18)",
  },
  {
    slug: "laranja",
    label: "Laranja",
    tagline: "A cor icônica da raça",
    price: "a partir de R$ 7.000",
    image: "/filhotes/laranja/laranja-femea-01.jpg",
    badge: "Disponível",
    badgeClass: "bg-emerald-500 text-white",
    glowColor: "rgba(249,115,22,0.18)",
  },
  {
    slug: "preto",
    label: "Preto",
    tagline: "Elegância e raridade",
    price: "a partir de R$ 8.000",
    image: "/filhotes/preto/preto-filhote-flores-01.jpg",
    badge: "Cor rara",
    badgeClass: "bg-zinc-800 text-white",
    glowColor: "rgba(161,161,170,0.12)",
  },
  {
    slug: "wolf-sable",
    label: "Wolf Sable",
    tagline: "O padrão mais exótico",
    price: "a partir de R$ 7.500",
    image: "/filhotes/wolf-sable/wolf-sable-femea-01.jpg",
    badge: "FCI reconhecido",
    badgeClass: "bg-blue-600 text-white",
    glowColor: "rgba(99,102,241,0.18)",
  },
] as const;

// Easing compartilhado — tipado como tupla para Framer Motion v12
const EASE = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number];

export default function ColorGallery() {
  const reduced = useReducedMotion();

  return (
    <section className="bg-zinc-950 py-20 sm:py-28 overflow-hidden" aria-labelledby="colors-heading">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">

        {/* Header */}
        <ScrollReveal className="mx-auto mb-12 max-w-xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">
            Cores disponíveis
          </p>
          <h2 id="colors-heading" className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Qual Spitz combina com você?
          </h2>
          <p className="mt-3 text-zinc-400">
            Cada cor tem disponibilidade e preço próprios. Clique para explorar.
          </p>
        </ScrollReveal>

        {/* Grid de cores — cada card com delay individual */}
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {COLORS.map((cor, i) => (
            <motion.li
              key={cor.slug}
              initial={reduced ? false : { opacity: 0, y: 48, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.65, delay: i * 0.14, ease: EASE }}
            >
              <Link
                href={`/filhotes/cor/${cor.slug}`}
                className="group relative block overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/5 transition-all duration-300 hover:ring-emerald-500/60 hover:scale-[1.03]"
                style={{
                  boxShadow: "0 0 0 0 transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px ${cor.glowColor}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 0 transparent";
                }}
              >
                {/* Imagem */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={cor.image}
                    alt={`Spitz Alemão Anão ${cor.label}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 320px"
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
                  <p className="mt-0.5 text-sm font-semibold text-emerald-400">{cor.price}</p>
                </div>

                {/* Seta — aparece no hover (desktop only: touch devices don't hover) */}
                <div
                  className="absolute right-3 top-3 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5"
                  aria-hidden="true"
                >
                  →
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
