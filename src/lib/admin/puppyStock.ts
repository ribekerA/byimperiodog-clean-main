/**
 * Leitura do estoque de filhotes para as regras de sugestao (recomendacao,
 * cruzamento e analise do lead).
 *
 * As tres regras consultavam colunas que nao existem em `puppies` (`sex`,
 * `city`, `state`, `slug`) e filtravam o status com valores fora do enum
 * `puppy_status`. O banco recusava a consulta e a regra respondia "nenhum
 * filhote" sem acusar erro. Este arquivo guarda, num lugar so, as colunas que
 * existem e a traducao da linha para o formato que as regras comparam.
 *
 * Sem acesso a rede nem ao banco: pode ser importado de qualquer lado.
 */

import {
  type AdminPuppyStatus,
  type DbPuppyStatus,
  type PuppySex,
  foldText,
  fromDbPuppyStatus,
  parsePuppySex,
  toDbPuppyStatus,
} from "./puppyAdmin";

/** Colunas de `puppies` que existem na producao e que as regras usam. */
export const STOCK_PUPPY_SELECT = "id,name,nome,color,cor,sexo,gender,price_cents,preco,cidade,estado,status";

export type StockPuppy = {
  id: string;
  name: string;
  color: string | null;
  sex: PuppySex | null;
  priceCents: number | null;
  city: string | null;
  state: string | null;
  status: AdminPuppyStatus;
};

/**
 * Valores do enum `puppy_status` para usar em `.in("status", ...)`.
 * O enum so aceita os quatro valores em portugues; qualquer outro texto faz o
 * banco recusar a consulta inteira (erro 22P02).
 */
export function stockStatusValues(statuses: readonly AdminPuppyStatus[]): DbPuppyStatus[] {
  const values: DbPuppyStatus[] = [];
  for (const status of statuses) {
    const db = toDbPuppyStatus(status);
    if (db && !values.includes(db)) values.push(db);
  }
  return values;
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function cents(row: Record<string, unknown>): number | null {
  const direct = Number(row.price_cents);
  if (Number.isFinite(direct) && direct > 0) return Math.round(direct);
  const reais = Number(row.preco);
  if (Number.isFinite(reais) && reais > 0) return Math.round(reais * 100);
  return null;
}

/** Traduz uma linha de `puppies` (com os nomes de coluna em uso) para o formato das regras. */
export function rowToStockPuppy(input: unknown): StockPuppy | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;
  const id = text(row.id);
  if (!id) return null;
  return {
    id,
    name: text(row.nome) ?? text(row.name) ?? "Filhote sem nome",
    color: text(row.color) ?? text(row.cor),
    sex: parsePuppySex(row.sexo) ?? parsePuppySex(row.gender) ?? parsePuppySex(row.sex),
    priceCents: cents(row),
    city: text(row.cidade) ?? text(row.city),
    state: text(row.estado) ?? text(row.state),
    status: fromDbPuppyStatus(row.status),
  };
}

export function rowsToStockPuppies(rows: readonly unknown[] | null | undefined): StockPuppy[] {
  const result: StockPuppy[] = [];
  for (const row of rows ?? []) {
    const puppy = rowToStockPuppy(row);
    if (puppy) result.push(puppy);
  }
  return result;
}

/** Cor pedida aparece na cor do filhote (ou o contrario), sem contar acento nem caixa. */
export function sameColor(wanted: unknown, puppyColor: unknown): boolean {
  const a = foldText(wanted);
  const b = foldText(puppyColor);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

/** Sexo pedido pelo lead ("macho", "femea", "male"...) bate com o do filhote. */
export function sameSex(wanted: unknown, puppySex: PuppySex | null): boolean {
  const parsed = parsePuppySex(wanted);
  return parsed !== null && parsed === puppySex;
}

export function sameCity(wanted: unknown, puppyCity: unknown): boolean {
  const a = foldText(wanted);
  const b = foldText(puppyCity);
  return Boolean(a) && a === b;
}

/** Mediana dos precos preenchidos; 0 quando nenhum filhote tem preco. */
export function medianPriceCents(puppies: readonly Pick<StockPuppy, "priceCents">[]): number {
  const prices = puppies
    .map((puppy) => puppy.priceCents ?? 0)
    .filter((price) => price > 0)
    .sort((a, b) => a - b);
  if (!prices.length) return 0;
  const middle = Math.floor(prices.length / 2);
  return prices.length % 2 ? prices[middle] : Math.round((prices[middle - 1] + prices[middle]) / 2);
}
