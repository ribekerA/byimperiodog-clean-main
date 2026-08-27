// Fonte unica do status de filhote.
//
// O projeto tinha duas linguas para o mesmo conceito e nenhum lugar que
// mandasse nas duas. O admin persiste em portugues ("disponivel"), o catalogo
// estatico e os componentes publicos falam ingles ("available"), e cada
// consumidor reinventava a conversao no meio do arquivo. O custo disso nao era
// teorico: `app/api/admin/seo/sitemap/route.ts` consultava
// `.eq("status", "available")` numa tabela onde o admin so grava "disponivel",
// entao a consulta devolvia zero linha sempre.
//
// Decisao registrada aqui para nao ser redecidida em cada arquivo:
//
//   - canonico interno  -> ingles  (available | reserved | sold | ...)
//   - persistido no BD  -> portugues ("disponivel", "reservado", ...)
//
// O portugues ficou porque e o que ja esta gravado nas linhas existentes;
// trocar os valores persistidos exigiria uma migration de dados. O que nao
// pode continuar existindo e a conversao solta: quem le status passa por
// `normalizePuppyStatus`, quem escreve passa por `toDbStatus`.

/** Status canonico interno. Toda logica de dominio fala esta lingua. */
export const PUPPY_STATUS = ["available", "reserved", "sold", "coming_soon", "unavailable"] as const;

export type PuppyStatus = (typeof PUPPY_STATUS)[number];

/** Como cada status canonico e gravado no Supabase. */
const STATUS_TO_DB: Record<PuppyStatus, string> = {
  available: "disponivel",
  reserved: "reservado",
  sold: "vendido",
  coming_soon: "em_breve",
  unavailable: "indisponivel",
};

/**
 * Tudo que ja apareceu gravado, digitado ou importado, mapeado para o
 * canonico. Inclui as formas acentuadas e as variantes com hifen/espaco porque
 * elas existem de fato nas linhas antigas -- nao sao hipotese.
 */
const ALIASES: ReadonlyMap<string, PuppyStatus> = new Map([
  ["available", "available"],
  ["disponivel", "available"],
  ["disponível", "available"],
  ["reserved", "reserved"],
  ["reservado", "reserved"],
  ["reservada", "reserved"],
  ["sold", "sold"],
  ["vendido", "sold"],
  ["vendida", "sold"],
  ["coming_soon", "coming_soon"],
  ["em_breve", "coming_soon"],
  ["embreve", "coming_soon"],
  ["pendente", "coming_soon"],
  ["pending", "coming_soon"],
  ["unavailable", "unavailable"],
  ["indisponivel", "unavailable"],
  ["indisponível", "unavailable"],
  ["arquivado", "unavailable"],
  ["archived", "unavailable"],
]);

/**
 * Converte qualquer forma conhecida para o status canonico.
 *
 * Devolve `available` para valor ausente porque e o comportamento que o
 * catalogo ja tinha em todos os pontos de leitura -- mudar o default aqui
 * esconderia filhote publicado por causa de um campo vazio. Valor **presente e
 * desconhecido** e outra coisa: cai em `unavailable`, para que um status
 * digitado errado no admin tire o filhote da vitrine em vez de anuncia-lo.
 */
export function normalizePuppyStatus(value?: string | null): PuppyStatus {
  if (value === null || value === undefined || value === "") return "available";
  const slug = String(value).trim().toLowerCase().replace(/[\s-]+/g, "_");
  return ALIASES.get(slug) ?? ALIASES.get(String(value).trim().toLowerCase()) ?? "unavailable";
}

/**
 * Filtro `.or()` do PostgREST para um conjunto de status canonicos.
 *
 * Existe porque a consulta ingenua esta errada e parece certa. Escrever
 * `.eq("status", "available")` ou `.or("status.eq.available,...")` contra a
 * tabela `puppies` devolve zero linha ou quase: o admin grava em portugues
 * ("disponivel"), e ha linhas antigas com acento e com a forma inglesa. A
 * consulta nao acusa erro nenhum -- so retorna menos do que deveria, e quem le
 * o resultado conclui que o estoque acabou.
 *
 * Isso ja aconteceu tres vezes no projeto: o sitemap do painel saia sem
 * filhote, o AutoSales oferecia ao lead um estoque que nao era o do site, e o
 * recomendador so enxergava linha com status nulo. Por isso a lista de formas
 * sai daqui, de ALIASES -- a mesma tabela que `normalizePuppyStatus` usa para
 * ler -- e nao de uma string escrita a mao em cada arquivo.
 *
 * Quem puder filtrar em memoria deve preferir `isAvailable`; este helper e
 * para a consulta que precisa filtrar no banco, por causa de `limit`.
 */
export function statusOrFilter(
  canonicos: readonly PuppyStatus[],
  opcoes?: { incluirNulo?: boolean },
): string {
  const formas = new Set<string>();
  for (const [alias, canonico] of ALIASES) {
    if (canonicos.includes(canonico)) formas.add(alias);
  }
  const partes = [...formas].map((forma) => `status.eq.${forma}`);
  if (opcoes?.incluirNulo) partes.unshift("status.is.null");
  return partes.join(",");
}

/** Forma a gravar no Supabase. Aceita qualquer alias na entrada. */
export function toDbStatus(value?: string | null): string {
  return STATUS_TO_DB[normalizePuppyStatus(value)];
}

/** `true` somente quando o filhote pode ser comprado agora. */
export function isAvailable(value?: string | null): boolean {
  return normalizePuppyStatus(value) === "available";
}

/** Reservado: existe, aparece, mas nao esta a venda para outra pessoa. */
export function isReserved(value?: string | null): boolean {
  return normalizePuppyStatus(value) === "reserved";
}

export function isSold(value?: string | null): boolean {
  return normalizePuppyStatus(value) === "sold";
}

/**
 * Fora da vitrine comercial: vendido, indisponivel ou ainda por vir.
 *
 * Usado por quem precisa da pergunta "posso oferecer isto?" -- que nao e a
 * negacao de `isAvailable`, porque reservado tambem nao pode ser oferecido.
 */
export function isUnavailable(value?: string | null): boolean {
  return !isAvailable(value);
}

/*
 * Aqui existia `schemaAvailability()`, que traduzia o status interno para
 * `schema.org/InStock`, `PreOrder` ou `SoldOut`. Ela ficou sem nenhum chamador
 * quando o `Product`/`Offer` saiu das paginas de vitrine: a vitrine e evergreen
 * e nao publica estoque. Uma funcao pronta que ainda sabe escrever `InStock` e
 * um convite a reintroduzir o problema no proximo componente de catalogo -- por
 * isso ela foi removida, e nao apenas deixada de lado.
 *
 * O status continua existindo no admin (`STATUS_LABEL` abaixo), que e onde ele
 * sempre pertenceu: decisao interna de atendimento, nunca dado publico.
 */

/** Rotulo em portugues para exibicao. */
export const STATUS_LABEL: Record<PuppyStatus, string> = {
  available: "Disponível",
  reserved: "Reservado",
  sold: "Vendido",
  coming_soon: "Em breve",
  unavailable: "Indisponível",
};
