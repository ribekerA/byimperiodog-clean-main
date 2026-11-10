import { BRAND, FOUNDING_YEAR } from "../../domain/config";

/**
 * Quem assina os artigos do blog.
 *
 * Nomes e apresentação informados pela responsável em 10/11/2026: os dois
 * criam a raça desde o ano de fundação e se alternam na assinatura. Nada além
 * disso é dito aqui: sem cargo, formação, registro profissional ou foto, que
 * não foram informados e não se inventam.
 *
 * O nome de cada artigo fica no campo `author` do próprio arquivo em
 * content/posts. Este cadastro só reconhece o nome e empresta a apresentação.
 * Nome que não está aqui (inclusive o da empresa) não vira pessoa: o artigo
 * continua assinado pela empresa, como antes.
 */
export interface AutorDoBlog {
  name: string;
  description: string;
  /** Pessoa da própria empresa: nos dados estruturados sai com `worksFor`. */
  daEquipe: true;
}

const APRESENTACAO = `Cria o Spitz Alemão Anão (Lulu da Pomerânia) desde ${FOUNDING_YEAR} na ${BRAND.name}, com amor e carinho.`;

export const AUTORES_DO_BLOG: readonly AutorDoBlog[] = [
  { name: "Karen Cristina", description: APRESENTACAO, daEquipe: true },
  { name: "Arthur Ribeker", description: APRESENTACAO, daEquipe: true },
];

export function autorDoBlog(nome: string | null | undefined): AutorDoBlog | null {
  const procurado = nome?.trim().toLowerCase();
  if (!procurado) return null;
  return AUTORES_DO_BLOG.find((a) => a.name.toLowerCase() === procurado) ?? null;
}
