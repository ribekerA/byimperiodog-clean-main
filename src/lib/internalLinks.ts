import { SEARCH_TOPICS } from "@/content/search-topics";

export type LinkSuggestion = { href: string; anchor: string; reason: string };

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Sugere destinos editoriais reais por intenção; não cria páginas de tag vazias. */
export function suggestInternalLinks(title: string, tags: string[] = [], limit = 3): LinkSuggestion[] {
  const terms = normalize([title, ...tags].join(" "));
  const scored = SEARCH_TOPICS.map((topic) => {
    const vocabulary = [topic.label, topic.description, ...topic.queries].map(normalize);
    const score = vocabulary.reduce((total, phrase) => total + phrase.split(/\s+/).filter((word) => word.length > 3 && terms.includes(word)).length, 0);
    return { topic, score };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score);

  const chosen = scored.slice(0, limit).map(({ topic }) => ({ href: topic.href, anchor: topic.label, reason: `Página principal da intenção ${topic.id}` }));
  if (!chosen.some((link) => link.href === "/filhotes") && chosen.length < limit) chosen.push({ href: "/filhotes", anchor: "Filhotes, fotos e valores", reason: "Vitrine comercial atual" });
  if (!chosen.some((link) => link.href === "/comprar-spitz-anao") && chosen.length < limit) chosen.push({ href: "/comprar-spitz-anao", anchor: "Compra, contrato e reserva", reason: "Jornada de compra segura" });
  return chosen.slice(0, limit);
}
