import { describe, expect, it } from "vitest";

import { horaDeBrasilia, montarCsvDeVendas, separarVendasParaExport } from "@/lib/admin/whatsappVendasCsv";

describe("export de vendas do WhatsApp para o Google Ads", () => {
  it("converte o instante UTC para a hora de Brasília", () => {
    expect(horaDeBrasilia("2026-11-24T14:27:00.000Z")).toBe("2026-11-24 11:27:00");
    expect(horaDeBrasilia("2026-11-25T02:30:00.000Z")).toBe("2026-11-24 23:30:00");
  });

  it("monta o CSV no modelo de importação com o cabeçalho de fuso", () => {
    const csv = montarCsvDeVendas([
      { gclid: "Cj0KCQ-abc_123", vendaEm: "2026-11-24T14:27:00.000Z", valor: 4500 },
    ]);
    expect(csv).toBe(
      [
        "Parameters:TimeZone=-0300",
        "Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency",
        "Cj0KCQ-abc_123,Venda | WhatsApp,2026-11-24 11:27:00,4500.00,BRL",
        "",
      ].join("\r\n"),
    );
  });

  it("deixa de fora vendas sem gclid (wbraid/gbraid) e sem valor, e conta cada uma", () => {
    const resultado = separarVendasParaExport([
      { gclid: "Cj0K1", wbraid: null, gbraid: null, vendaEm: "2026-11-24T14:00:00.000Z", valor: 6500 },
      { gclid: null, wbraid: "wb1", gbraid: null, vendaEm: "2026-11-24T14:00:00.000Z", valor: 6500 },
      { gclid: null, wbraid: null, gbraid: "gb1", vendaEm: "2026-11-24T14:00:00.000Z", valor: 6500 },
      { gclid: "Cj0K2", wbraid: null, gbraid: null, vendaEm: "2026-11-24T14:00:00.000Z", valor: null },
    ]);
    expect(resultado.exportaveis).toHaveLength(1);
    expect(resultado.semGclid).toBe(2);
    expect(resultado.semValor).toBe(1);
  });

  it("escapa campos com aspas ou vírgula", () => {
    const csv = montarCsvDeVendas([{ gclid: "a,b", vendaEm: "2026-11-24T14:00:00.000Z", valor: 1 }]);
    expect(csv).toContain('"a,b",Venda | WhatsApp');
  });
});
