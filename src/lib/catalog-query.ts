/** Busca determinística da vitrine: não consulta nem presume estoque. */
export type CatalogQuery = {
  colors: string[];
  sexes: string[];
  maxPriceCents?: number;
  available: boolean;
  topic?: "location" | "reservation" | "documents";
  unsupported: boolean;
};

const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function parseCatalogQuery(input: string): CatalogQuery {
  const text = normalize(input.slice(0, 240));
  const colors = [
    ["branco", /\bbranc[oa]s?\b/], ["preto", /\bpret[oa]s?\b/],
    ["laranja", /\blaranjas?\b/], ["creme", /\bcremes?\b/],
    ["chocolate", /\bchocolates?\b/], ["particolor", /\bparticolors?\b/],
    ["wolf-sable", /\b(wolf[ -]sable|cinza[ -]lobo)\b/],
  ] as const;
  const sexes: string[] = [];
  if (/\b(femeas?|feminino|menininhas?)\b/.test(text)) sexes.push("female");
  if (/\b(machos?|machinhos?|masculino|menininhos?)\b/.test(text)) sexes.push("male");
  const budget = text.match(/\b(?:ate|no maximo|menos de)\s*(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[,.]\d{1,2})?)\s*(mil|k)?\b/);
  let maxPriceCents: number | undefined;
  if (budget) {
    const value = Number(budget[1].includes(",") || /\.\d{3}/.test(budget[1])
      ? budget[1].replace(/\./g, "").replace(",", ".") : budget[1]);
    if (Number.isFinite(value)) maxPriceCents = Math.round(value * (budget[2] ? 1000 : 1) * 100);
  }
  const topic = /\b(onde|localizacao|perto|atibaia|campinas|sao paulo|braganca|visita)\b/.test(text) ? "location"
    : /\breserv/.test(text) ? "reservation"
    : /\b(document|pedigree|vacina|hemograma)/.test(text) ? "documents" : undefined;
  const matchedColors = colors.filter(([, regex]) => regex.test(text)).map(([color]) => color);
  const available = /\b(disponiveis|disponivel|disponibilidade|tem|estoque)\b/.test(text);
  // Não interpretar negações/limites inferiores silenciosamente como preferência positiva.
  const unsupported = /\b(nao|exceto|sem|acima|mais de|entre)\b/.test(text)
    || (Boolean(text.trim()) && !matchedColors.length && !sexes.length && maxPriceCents === undefined && !topic && !available);
  return { colors: matchedColors, sexes, maxPriceCents, available, topic, unsupported };
}

export function matchesCatalogQuery(puppy: {
  color?: string; cor?: string; sex?: string; gender?: string;
  priceCents?: number; price_cents?: number;
}, query: CatalogQuery): boolean {
  if (query.unsupported) return false;
  if (query.colors.length && !query.colors.includes(normalize(puppy.color ?? puppy.cor ?? ""))) return false;
  if (query.sexes.length && !query.sexes.includes(puppy.sex ?? puppy.gender ?? "")) return false;
  const price = puppy.priceCents ?? puppy.price_cents;
  return query.maxPriceCents === undefined || (typeof price === "number" && Number.isFinite(price) && price > 0 && price <= query.maxPriceCents);
}
