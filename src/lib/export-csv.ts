// PATH: src/lib/export-csv.ts
/**
 * Exporta dados para CSV com UTF-8 BOM (compatível Excel)
 */

export interface CSVColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

export function exportToCSV<T>(
  data: T[],
  columns: CSVColumn<T>[],
  filename: string
): void {
  if (data.length === 0) {
    throw new Error('Nenhum dado para exportar');
  }

  // Cabeçalhos
  const headers = columns.map((col) => escapeCSV(col.header)).join(',');

  // Linhas
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = col.accessor(row);
      return escapeCSV(value);
    }).join(',')
  );

  // CSV completo com BOM UTF-8 (para Excel reconhecer acentos)
  const BOM = '\uFEFF';
  const csv = BOM + [headers, ...rows].join('\n');

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Se contém vírgula, aspas ou quebra de linha, envolve em aspas e escapa aspas duplas
  if (/[,"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
