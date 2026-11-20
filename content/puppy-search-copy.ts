import { CORES_DIVULGADAS, formatarPreco, type CorDivulgada, TABELA_DE_PRECOS } from "@/domain/pricing";

type PuppySearchInput = { slug: string; color: string; sex: string; priceCents: number; description?: string };

/** Título, anúncio e texto público usam o preço da própria referência. */
export function puppySearchCopy(puppy: PuppySearchInput) {
  if (!(CORES_DIVULGADAS as readonly string[]).includes(puppy.color)) return undefined;
  const color = TABELA_DE_PRECOS[puppy.color as CorDivulgada].label;
  const sex = puppy.sex === "female" ? "Fêmea" : "Macho";
  const price = formatarPreco(puppy.priceCents);
  if (puppy.slug === "spitz-alemao-anao-merle-femea") {
    return {
      heading: "Lulu da Pomerânia Fêmea Merle Olhos Azuis",
      metadataDescription: `Fêmea Merle Olhos Azuis, Lulu da Pomerânia (Spitz Alemão Anão), a partir de ${price} no PIX. Fotos reais, sem pedigree CBKC; consulte as opções atuais.`,
      sectionTitle: "Fêmea Merle Olhos Azuis: fotos, preço e reserva",
      introduction: `${puppy.description} O valor publicado é a partir de ${price} no PIX. Disponibilidade e condições da reserva são confirmadas no atendimento.`,
    };
  }
  const maleName = puppy.slug === "spitz-alemao-anao-chocotan-macho"
    ? "Macho ChocoTan"
    : puppy.slug === "spitz-alemao-anao-particolor-chocolate-macho"
      ? "Macho Particolor Chocolate"
      : undefined;
  if (maleName) {
    return {
      heading: "Lulu da Pomerânia " + maleName,
      metadataDescription: maleName + ", Lulu da Pomerânia (Spitz Alemão Anão), a partir de " + price + " no PIX. Galeria com 8 fotos reais; consulte as opções atuais.",
      sectionTitle: maleName + ": fotos, preço e reserva",
      introduction: puppy.description + " O valor publicado é a partir de " + price + " no PIX. Disponibilidade e condições da reserva são confirmadas no atendimento.",
    };
  }
  // Acessorio nao entra no nome publicado. Sao duas fichas de femea laranja e
  // duas de femea branca, e sem esta troca cada par teria o mesmo title, H1 e
  // description.
  const segundaFicha = puppy.slug.endsWith("-laco-rosa") || puppy.slug.endsWith("-femea-2");
  const [nomePrincipal, outroNome] = segundaFicha
    ? ["Lulu da Pomerânia", "Spitz Alemão Anão"]
    : ["Spitz Alemão Anão", "Lulu da Pomerânia"];
  const heading = `${segundaFicha ? "Lulu da Pomerânia (Spitz Alemão Anão)" : "Spitz Alemão Anão (Lulu da Pomerânia)"} ${color} ${sex}`;
  if (puppy.slug === "spitz-alemao-anao-preto-macho") {
    return {
      heading,
      metadataDescription: "Referência visual de Spitz Alemão Anão preto macho (Lulu da Pomerânia). Fotos reais; consulte opções e valores atuais em Bragança Paulista, SP.",
      sectionTitle: "Lulu da Pomerânia preto macho: fotos e consulta de opções",
      introduction: "Esta galeria é uma referência visual permanente. O valor cadastrado não confirma uma oferta atual nem a disponibilidade do animal fotografado. Consulte os filhotes e seus preços no atendimento.",
    };
  }
  return {
    heading,
    metadataDescription: `${nomePrincipal} ${color.toLowerCase()} ${sex.toLowerCase()} (${outroNome}) a partir de ${price} no PIX. Fotos reais; consulte as opções em Bragança Paulista, SP.`,
    sectionTitle: `Lulu da Pomerânia ${color.toLowerCase()} ${sex.toLowerCase()}: fotos, preço e reserva`,
    introduction: `${puppy.description ?? `Veja esta referência de Spitz Alemão Anão ${color.toLowerCase()} ${sex.toLowerCase()}, também conhecido como Lulu da Pomerânia.`} O valor publicado é a partir de ${price} no PIX. As fotos são referências permanentes; disponibilidade e condições da reserva são confirmadas no atendimento.`,
  };
}
