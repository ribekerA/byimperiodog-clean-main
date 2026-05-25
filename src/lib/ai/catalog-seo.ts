/**
 * CatalogSEOAI
 * Gera textos curtos e otimizados para SEO/conversão nos cards do catálogo.
 * Tom premium e seguro, reforçando Spitz Alemão Anão (Lulu da Pomerânia).
 */

type Sex = "male" | "female" | string;
type Status = "available" | "reserved" | "sold" | string;

export type CatalogSeoInput = {
  id: string;
  name?: string;
  color?: string;
  sex?: Sex;
  city?: string;
  state?: string;
  ageDays?: number;
  priceCents?: number;
  status?: Status;
  brandTone?: "premium" | "standard";
  keywordsHint?: string[];
};

export type CatalogSeoOutput = {
  shortTitle: string;
  shortDescription: string;
  altText: string;
  seoKeywords: string[];
  focusedKeywords?: string[];
  structuredDataSnippets?: Record<string, unknown>;
  warnings?: string[];
};

const BLACKLIST = ["adocao", "adoção", "doacao", "doação", "liquidacao", "liquidação", "canil", "gratuito", "gratis"];

function sanitizeText(text: string): { text: string; warnings: string[] } {
  const warnings: string[] = [];
  let output = text;
  for (const term of BLACKLIST) {
    const regex = new RegExp(term, "ig");
    if (regex.test(output)) {
      output = output.replace(regex, "").replace(/\s{2,}/g, " ").trim();
      warnings.push(`Removido termo proibido: ${term}`);
    }
  }
  return { text: output.trim(), warnings };
}

function clampLength(text: string, max: number): string {
  if (text.length <= max) return text;
  const trimmed = text.slice(0, max - 1);
  const lastSpace = trimmed.lastIndexOf(" ");
  return (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed).trim();
}

function normalizeSex(sex?: Sex): "macho" | "femea" | null {
  if (!sex) return null;
  const v = sex.toLowerCase();
  if (v.includes("male") || v.includes("macho")) return "macho";
  if (v.includes("female") || v.includes("femea") || v.includes("fêmea")) return "femea";
  return null;
}

function formatPrice(priceCents?: number): string | null {
  if (!priceCents || priceCents <= 0) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

function buildKeywords(input: CatalogSeoInput, warnings: string[]): string[] {
  const keywords = new Set<string>();
  const sex = normalizeSex(input.sex);
  const color = input.color?.toLowerCase();
  const base = ["spitz alemão anão", "lulu da pomerânia", "filhote spitz", "by imperio dog"];
  base.forEach((k) => keywords.add(k));
  if (color) keywords.add(`spitz ${color}`);
  if (sex) keywords.add(`spitz ${sex}`);
  if (input.city) keywords.add(`spitz ${input.city.toLowerCase()}`);
  if (input.keywordsHint) input.keywordsHint.forEach((k) => keywords.add(k.toLowerCase()));
  return Array.from(keywords).filter(Boolean).slice(0, 8).map((k) => k.trim());
}

export function generateCatalogSeoCopy(input: CatalogSeoInput): CatalogSeoOutput {
  const warnings: string[] = [];
  const sex = normalizeSex(input.sex);
  const color = input.color ? input.color.trim() : "Cor em avaliacao";
  const city = input.city ? input.city.trim() : undefined;
  const price = formatPrice(input.priceCents);
  const status = (input.status || "available").toLowerCase();
  const brandTone = input.brandTone || "premium";

  // Short title
  const baseTitleParts = [
    input.name || "Filhote",
    color ? ` - ${color}` : "",
    sex ? ` (${sex === "macho" ? "Macho" : "Fêmea"})` : "",
  ];
  let shortTitle = `Spitz Alemão Anão ${baseTitleParts.join("")}`.replace(/\s+/g, " ").trim();
  shortTitle = clampLength(shortTitle, 60);

  // Description
  const descParts = [
    `${brandTone === "premium" ? "Curadoria premium" : "Seleção"} By Império Dog.`,
    color ? `Cor ${color}.` : "",
    sex ? `Sexo ${sex === "macho" ? "macho" : "fêmea"}.` : "",
    city ? `Atendimento ${city}.` : "",
    price ? `Investimento ${price}.` : "",
    status === "available" ? "Entrega combinada segura." : status === "reserved" ? "Em reserva confirmada." : "",
  ];
  let shortDescription = descParts.join(" ").replace(/\s+/g, " ").trim();
  shortDescription = clampLength(shortDescription, 120);

  // Alt text
  const altParts = [
    "Filhote Spitz Alemão Anão",
    color ? color : "",
    sex ? (sex === "macho" ? "macho" : "fêmea") : "",
    "By Império Dog",
    city ? `em ${city}` : "",
  ];
  let altText = altParts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  // Sanitize blacklist
  const titleSanitized = sanitizeText(shortTitle);
  shortTitle = titleSanitized.text;
  warnings.push(...titleSanitized.warnings);

  const descSanitized = sanitizeText(shortDescription);
  shortDescription = descSanitized.text;
  warnings.push(...descSanitized.warnings);

  const altSanitized = sanitizeText(altText);
  altText = altSanitized.text;
  warnings.push(...altSanitized.warnings);

  const seoKeywords = buildKeywords(input, warnings);
  const focusedKeywords = seoKeywords.slice(0, 5);

  // JSON-LD básico (snippet de Product)
  const structuredDataSnippets: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: shortTitle,
    description: shortDescription,
    brand: { "@type": "Brand", name: "By Império Dog" },
    category: "Spitz Alemão Anão / Lulu da Pomerânia",
    color,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (input.priceCents ?? 0) / 100,
      availability:
        status === "available"
          ? "https://schema.org/InStock"
          : status === "reserved"
            ? "https://schema.org/PreOrder"
            : "https://schema.org/OutOfStock",
    },
  };

  if (!input.color) warnings.push("Falta cor do filhote para SEO.");
  if (!input.sex) warnings.push("Falta sexo do filhote para SEO.");
  if (!input.city) warnings.push("Falta cidade para reforço local.");

  return {
    shortTitle,
    shortDescription,
    altText,
    seoKeywords,
    focusedKeywords,
    structuredDataSnippets,
    warnings: warnings.length ? warnings : undefined,
  };
}
