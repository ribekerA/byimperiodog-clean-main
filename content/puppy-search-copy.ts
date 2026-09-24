import { CORES_DIVULGADAS, formatarPreco, type CorDivulgada, TABELA_DE_PRECOS } from "@/domain/pricing";

type PuppySearchInput = { slug: string; color: string; sex: string; priceCents: number; description?: string };

/** Título, anúncio e texto público usam o preço da própria referência. */
export function puppySearchCopy(puppy: PuppySearchInput) {
  if (!(CORES_DIVULGADAS as readonly string[]).includes(puppy.color)) return undefined;
  const color = TABELA_DE_PRECOS[puppy.color as CorDivulgada].label;
  const sex = puppy.sex === "female" ? "Fêmea" : "Macho";
  const price = formatarPreco(puppy.priceCents);
  const variant = puppy.slug.endsWith("-laco-rosa") ? " — Laço Rosa" : "";
  const heading = `Spitz Alemão Anão ${color} ${sex}${variant}`;
  return {
    heading,
    metadataDescription: `Spitz Alemão Anão ${color.toLowerCase()} ${sex.toLowerCase()}${variant} (Lulu da Pomerânia) por ${price}. Fotos reais; consulte as opções em Bragança Paulista, SP.`,
    sectionTitle: `Lulu da Pomerânia ${color.toLowerCase()} ${sex.toLowerCase()}: fotos, preço e reserva`,
    introduction: `${puppy.description ?? `Veja esta referência de Spitz Alemão Anão ${color.toLowerCase()} ${sex.toLowerCase()}, também conhecido como Lulu da Pomerânia.`} O valor publicado é ${price}. As fotos são referências permanentes; disponibilidade e condições da reserva são confirmadas no atendimento.`,
  };
}
