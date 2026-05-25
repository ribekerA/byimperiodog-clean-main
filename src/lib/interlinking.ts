/**
 * @module lib/interlinking
 * Lógica central de interlinking interno (breadcrumbs, relacionados, blocos estratégicos)
 * Desacoplado da UI; retorna estruturas simples para consumo nas páginas.
 */

import type { Puppy } from "@/domain/puppy";

// 1) Breadcrumbs globais
export type Crumb = { name: string; url: string };

export const Breadcrumbs = {
  home(): Crumb { return { name: "Início", url: "https://www.byimperiodog.com.br/" }; },
  filhotes(): Crumb { return { name: "Filhotes", url: "https://www.byimperiodog.com.br/filhotes" }; },
  spitzPorCor(): Crumb { return { name: "Spitz por Cor", url: "https://www.byimperiodog.com.br/spitz-anao/cor" }; },
  spitzPorCidade(): Crumb { return { name: "Spitz por Cidade", url: "https://www.byimperiodog.com.br/spitz-anao" }; },
  blog(): Crumb { return { name: "Blog", url: "https://www.byimperiodog.com.br/blog" }; },
  color(colorSlug: string): Crumb { return { name: colorSlug, url: `https://www.byimperiodog.com.br/spitz-anao/cor/${colorSlug}` }; },
  city(citySlug: string, label?: string): Crumb { return { name: label || citySlug, url: `https://www.byimperiodog.com.br/spitz-anao/${citySlug}` }; },
  puppy(puppy: Pick<Puppy, "slug" | "title">): Crumb { return { name: puppy.title, url: `https://www.byimperiodog.com.br/filhotes/${puppy.slug}` }; },
  post(slug: string, title: string): Crumb { return { name: title, url: `https://www.byimperiodog.com.br/blog/${slug}` }; },
};

// Helper para compor listas comuns
export const buildDetailCrumbs = (puppy: Puppy, extra?: Crumb[]): Crumb[] => {
  const base = [Breadcrumbs.home(), Breadcrumbs.filhotes(), Breadcrumbs.puppy({ slug: puppy.slug, title: puppy.title })];
  if (extra?.length) return [...base, ...extra];
  return base;
};

export const buildColorCrumbs = (color: string): Crumb[] => [
  Breadcrumbs.home(),
  Breadcrumbs.spitzPorCor(),
  Breadcrumbs.color(color),
];

export const buildCityCrumbs = (citySlug: string, label?: string): Crumb[] => [
  Breadcrumbs.home(),
  Breadcrumbs.spitzPorCidade(),
  Breadcrumbs.city(citySlug, label),
];

// 2) Filhotes relacionados (mesma cor > mesma UF > faixa de preço ~20%)
export function getRelatedPuppies(current: Puppy, all: Puppy[], limit = 6): Puppy[] {
  const available = all.filter((p) => p.status === "available" && p.id !== current.id);
  const sameColor = available.filter((p) => p.color === current.color);
  const sameState = available.filter((p) => p.state === current.state);
  const withinPrice = available.filter((p) => {
    const delta = Math.abs(p.priceCents - current.priceCents);
    return delta / current.priceCents <= 0.2; // +-20%
  });

  // Mescla por prioridade sem duplicar
  const map = new Map<string, Puppy>();
  for (const list of [sameColor, sameState, withinPrice, available]) {
    for (const p of list) if (!map.has(p.id)) map.set(p.id, p);
    if (map.size >= limit) break;
  }
  return Array.from(map.values()).slice(0, limit);
}

// 3) Blocos estratégicos em páginas de COR
export function buildColorLinkBlocks(color: string, puppies: Puppy[]) {
  const catalog = { label: "Ver catálogo geral", href: "/filhotes" };
  const cities = Array.from(new Set(puppies.map((p) => `${p.city}/${p.state}`))).slice(0, 6);
  const cityLinks = cities.map((c) => ({ label: `Spitz em ${c}`, href: `/spitz-anao/${c.split("/")[0].toLowerCase().replace(/\s+/g, "-")}` }));
  const blogLinks: Array<{ label: string; href: string }> = [
    { label: `Cuidados com Spitz ${color}`, href: `/blog/cuidados-spitz-${color}` },
  ];
  return { catalog, cityLinks, blogLinks };
}

// 4) Blocos estratégicos em páginas de CIDADE
export function buildCityLinkBlocks(citySlug: string, puppies: Puppy[]) {
  const catalog = { label: "Ver catálogo geral", href: "/filhotes" };
  const colors = Array.from(new Set(puppies.map((p) => p.color))).slice(0, 6);
  const colorLinks = colors.map((color) => ({ label: `Spitz ${color} em ${citySlug}`, href: `/spitz-anao/cor/${color}` }));
  const blogLinks: Array<{ label: string; href: string }> = [
    { label: `Comprar Spitz em ${citySlug}`, href: `/blog/comprar-spitz-${citySlug}` },
  ];
  return { catalog, colorLinks, blogLinks };
}

// 5) Links contextuais em posts de BLOG
export function buildBlogContextLinks(options?: { colors?: string[]; cities?: string[] }) {
  const base = [
    { label: "Catálogo de Filhotes", href: "/filhotes" },
    { label: "Comprar Spitz Anão", href: "/comprar-spitz-anao" },
  ];
  const colorLinks = (options?.colors || []).map((c) => ({ label: `Spitz ${c}`, href: `/spitz-anao/cor/${c}` }));
  const cityLinks = (options?.cities || []).map((c) => ({ label: `Spitz em ${c}`, href: `/spitz-anao/${c}` }));
  return [...base, ...colorLinks, ...cityLinks];
}
