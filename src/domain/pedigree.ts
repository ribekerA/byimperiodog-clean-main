/**
 * @module domain/pedigree
 * @description Quais cores saem com pedigree da CBKC — FONTE ÚNICA.
 *
 * Regra da responsável (18/11/2026): o que a CBKC aceita tem pedigree; o que
 * não aceita, não tem. A CBKC segue o padrão FCI nº 97 (20/09/2024), que só
 * admite as cores listadas nele e desqualifica qualquer outra.
 *
 * - Merle: não consta do padrão FCI nº 97, então não há pedigree CBKC.
 * - Chocolate: o marrom consta do padrão e é aceito pela CBKC, então sai com
 *   pedigree. Em 18/11/2026 ele entrou na lista por engano; a responsável
 *   corrigiu em 19/11/2026: só o Merle fica sem pedigree.
 *
 * Toda tela que diz "registro oficial incluso" pergunta aqui antes. O número de
 * canil na CBKC (980/15) continua valendo: ele é do canil, não de cada filhote.
 */

export const CORES_SEM_PEDIGREE_CBKC = ["merle"] as const;

export type CorSemPedigree = (typeof CORES_SEM_PEDIGREE_CBKC)[number];

export function temPedigreeCbkc(cor: string | null | undefined): boolean {
  const slug = String(cor ?? "").trim().toLowerCase();
  return !(CORES_SEM_PEDIGREE_CBKC as readonly string[]).includes(slug);
}

/** Frase curta para quem não tem pedigree: diz o que é, sem inventar papel. */
export const TEXTO_SEM_PEDIGREE =
  "Este filhote não sai com pedigree da CBKC. A documentação de cada filhote é informada no atendimento e escrita no contrato.";
