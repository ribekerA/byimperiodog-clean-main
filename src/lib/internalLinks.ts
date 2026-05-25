export type LinkSuggestion = { href: string; anchor: string; reason: string };

/**
 * Sugere links internos simples com base em tags e título.
 * Retorna até `limit` recomendações.
 */
export function suggestInternalLinks(title: string, tags: string[] = [], limit = 3): LinkSuggestion[] {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const suggestions: LinkSuggestion[] = [];
  // Prioritize tag pages
  for (const t of tags.slice(0, 5)) {
    suggestions.push({ href: `${base}/blog?tag=${encodeURIComponent(t)}`, anchor: `Posts sobre ${t}`, reason: `Conteúdo relacionado por tag: ${t}` });
    if (suggestions.length >= limit) return suggestions.slice(0, limit);
  }
  // Fallback: link to main blog and filhotes
  suggestions.push({ href: `${base}/blog`, anchor: "Leia mais no blog", reason: "Página principal do blog" });
  if (suggestions.length < limit) suggestions.push({ href: `${base}/filhotes`, anchor: "Veja nossos filhotes", reason: "Ponto de conversão para filhotes" });
  return suggestions.slice(0, limit);
}
