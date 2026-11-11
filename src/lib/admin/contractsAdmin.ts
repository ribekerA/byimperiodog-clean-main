/**
 * Leitura dos contratos para o admin.
 *
 * A tabela `contracts` de producao tem um nucleo de colunas que sempre existe e
 * tres grupos que dependem de migracao (validade do link, assinatura do
 * comprador, ZapSign). Pedir uma coluna que nao existe derruba a consulta
 * inteira (erro 42703), e a tela mostrava "Nenhum contrato ainda" por causa disso.
 * Aqui o nucleo e lido sozinho e cada grupo e lido a parte: o que falta vira
 * aviso na tela em vez de lista vazia.
 *
 * Sem `server-only` de proposito: o cliente do banco entra por parametro, e a
 * tela (cliente) usa os tipos e o leitor de valor em reais.
 */

export const CONTRACT_BASE_COLUMNS =
  "id,code,status,signed_at,created_at,payload,hemograma_path,laudo_path,total_price_cents,lead_id";

export const CONTRACT_OPTIONAL_COLUMNS = {
  expiry: ["expires_at"],
  signature: ["signature_path"],
  zapsign: ["zapsign_doc_token", "zapsign_sign_link", "zapsign_status", "signed_pdf_url"],
} as const;

export const CONTRACT_LIST_LIMIT = 2000;

export type ContractFeature = keyof typeof CONTRACT_OPTIONAL_COLUMNS;
export type ContractFeatures = Record<ContractFeature, boolean>;

export type ContractRow = {
  id: string;
  code: string;
  status: string;
  signed_at: string | null;
  created_at: string;
  payload: Record<string, unknown> | null;
  hemograma_path: string | null;
  laudo_path: string | null;
  total_price_cents: number | null;
  lead_id: string | null;
  expires_at?: string | null;
  signature_path?: string | null;
  zapsign_doc_token?: string | null;
  zapsign_sign_link?: string | null;
  zapsign_status?: string | null;
  signed_pdf_url?: string | null;
};

type QueryError = { code?: string; message?: string };
type QueryResult = { data: unknown[] | null; error: QueryError | null };
type Query = PromiseLike<QueryResult> & {
  order(column: string, options?: { ascending?: boolean }): Query;
  limit(count: number): Query;
};
export type ContractsClient = { from(table: string): { select(columns: string): Query } };

/** Coluna inexistente no Postgres. */
export const MISSING_COLUMN = "42703";

export function isMissingColumn(error: unknown): boolean {
  return ((error ?? {}) as QueryError).code === MISSING_COLUMN;
}

function read(sb: ContractsClient, columns: string): Query {
  return sb
    .from("contracts")
    .select(columns)
    .order("created_at", { ascending: false })
    .limit(CONTRACT_LIST_LIMIT);
}

export async function listContracts(
  sb: ContractsClient,
): Promise<{ items: ContractRow[]; features: ContractFeatures }> {
  const base = await read(sb, CONTRACT_BASE_COLUMNS);
  if (base.error) throw base.error;
  const items = (base.data ?? []) as ContractRow[];
  const byId = new Map(items.map((item) => [item.id, item]));

  const features: ContractFeatures = { expiry: false, signature: false, zapsign: false };
  const groups = Object.keys(CONTRACT_OPTIONAL_COLUMNS) as ContractFeature[];

  await Promise.all(
    groups.map(async (group) => {
      const columns = CONTRACT_OPTIONAL_COLUMNS[group];
      const extra = await read(sb, ["id", ...columns].join(","));
      if (extra.error) {
        // So a falta da coluna vira "recurso desligado"; outra falha e falha de leitura.
        if (isMissingColumn(extra.error)) return;
        throw extra.error;
      }
      features[group] = true;
      for (const row of (extra.data ?? []) as Array<Record<string, unknown>>) {
        const target = byId.get(String(row.id));
        if (!target) continue;
        for (const column of columns) {
          (target as Record<string, unknown>)[column] = row[column] ?? null;
        }
      }
    }),
  );

  return { items, features };
}

/**
 * Valor digitado em reais -> centavos. Aceita "4500", "4.500", "4.500,00",
 * "4500,5" e "R$ 4.500,00". Devolve null quando nao e um valor.
 *
 * O ponto so e separador decimal quando nao ha virgula e ele nao esta em
 * posicao de milhar: "4.500" sao quatro mil e quinhentos, nao quatro e meio.
 */
export function parseReaisToCents(input: string): number | null {
  const text = input.replace(/r\$/i, "").replace(/\s/g, "");
  if (!text || !/^[\d.,]+$/.test(text)) return null;

  let normalized: string;
  if (text.includes(",")) {
    if (!/^\d{1,3}(\.\d{3})*,\d{1,2}$|^\d+,\d{1,2}$/.test(text)) return null;
    normalized = text.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    normalized = text.replace(/\./g, "");
  } else if (/^\d+(\.\d{1,2})?$/.test(text)) {
    normalized = text;
  } else {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  const cents = Math.round(value * 100);
  return cents > 100_000_000 ? null : cents;
}

const PAYLOAD_LABELS: Record<string, string> = {
  nome: "Nome",
  cpf: "CPF",
  rg: "RG",
  email: "E-mail",
  telefone: "Telefone",
  endereco: "Endereço",
  nascimento: "Nascimento",
  nome_filhote: "Filhote",
  cor: "Cor",
  sexo: "Sexo",
  nascimento_filhote: "Nascimento do filhote",
};

/** Campos preenchidos do contrato, com rotulo legivel. Campo vazio fica de fora. */
export function payloadEntries(payload: Record<string, unknown> | null | undefined): Array<{ key: string; label: string; value: string }> {
  if (!payload || typeof payload !== "object") return [];
  return Object.entries(payload)
    .filter(([, value]) => (typeof value === "string" || typeof value === "number") && String(value).trim() !== "")
    .map(([key, value]) => ({
      key,
      label: PAYLOAD_LABELS[key] ?? key.replace(/_/g, " "),
      value: String(value).trim(),
    }));
}

export function payloadText(payload: Record<string, unknown> | null | undefined, key: string): string {
  const value = payload?.[key];
  return typeof value === "string" ? value.trim() : "";
}
