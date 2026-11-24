/**
 * Export de vendas do WhatsApp para importação de conversões de cliques no
 * Google Ads (modelo "Importar de cliques").
 *
 * Só entra venda com gclid e com valor. wbraid/gbraid ficam de fora: o modelo
 * que usamos só tem a coluna Google Click ID. Quem chamar conta quantas ficaram
 * de fora e mostra no painel.
 */

export const NOME_DA_CONVERSAO = "Venda | WhatsApp";
export const CABECALHO_DO_CSV = [
  "Google Click ID",
  "Conversion Name",
  "Conversion Time",
  "Conversion Value",
  "Conversion Currency",
] as const;

export type VendaParaExport = {
  gclid: string;
  /** Instante da marcação da venda, ISO 8601 (UTC). */
  vendaEm: string;
  valor: number;
};

const FUSO_DE_BRASILIA_MS = 3 * 3_600_000; // sem horário de verão desde 2019
const GCLID_VALIDO = /^[A-Za-z0-9_-]{1,200}$/;

/** "yyyy-MM-dd HH:mm:ss" no horário de Brasília. */
export function horaDeBrasilia(iso: string): string {
  const deslocada = new Date(new Date(iso).getTime() - FUSO_DE_BRASILIA_MS);
  return deslocada.toISOString().slice(0, 19).replace("T", " ");
}

function campo(valor: string): string {
  return /[",\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

export function montarCsvDeVendas(vendas: VendaParaExport[]): string {
  const linhas = ["Parameters:TimeZone=-0300", CABECALHO_DO_CSV.join(",")];
  for (const venda of vendas) {
    linhas.push(
      [venda.gclid, NOME_DA_CONVERSAO, horaDeBrasilia(venda.vendaEm), venda.valor.toFixed(2), "BRL"]
        .map(campo)
        .join(","),
    );
  }
  return `${linhas.join("\r\n")}\r\n`;
}

/** Separa as vendas em exportáveis e contadas de fora. */
export function separarVendasParaExport(
  vendas: { gclid: string | null; wbraid: string | null; gbraid: string | null; vendaEm: string; valor: number | null }[],
): { exportaveis: VendaParaExport[]; semGclid: number; semValor: number } {
  const exportaveis: VendaParaExport[] = [];
  let semGclid = 0;
  let semValor = 0;
  for (const venda of vendas) {
    if (!venda.gclid || !GCLID_VALIDO.test(venda.gclid)) {
      semGclid += 1;
      continue;
    }
    if (venda.valor === null || !Number.isFinite(venda.valor)) {
      semValor += 1;
      continue;
    }
    exportaveis.push({ gclid: venda.gclid, vendaEm: venda.vendaEm, valor: venda.valor });
  }
  return { exportaveis, semGclid, semValor };
}
