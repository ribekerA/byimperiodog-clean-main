import vm from "node:vm";

import { describe, expect, it } from "vitest";

import { SCRIPT_DO_TEMA, faseDoNatal, faseNoDia } from "@/lib/temporada";

// Roda o script do <head> num ambiente falso, com o relógio e a URL dados.
function rodarScript(dataIso: string, busca = "") {
  const attrs: Record<string, string> = {};
  const guardado: Record<string, string> = {};
  const RealDate = Date;
  const agora = new RealDate(dataIso);
  class DataFixa extends RealDate {
    constructor(...a: unknown[]) {
      if (a.length === 0) super(agora.getTime());
      else super(...(a as [number]));
    }
  }
  vm.runInNewContext(SCRIPT_DO_TEMA, {
    Date: DataFixa,
    Intl,
    URLSearchParams,
    location: { search: busca },
    sessionStorage: {
      getItem: (k: string) => guardado[k] ?? null,
      setItem: (k: string, v: string) => { guardado[k] = v; },
    },
    document: { documentElement: { setAttribute: (k: string, v: string) => { attrs[k] = v; } } },
  });
  return attrs;
}

describe("tema de Natal", () => {
  it("segue as datas aprovadas: 1º/12 a 25/12 família, 26/12 a 31/12 festas", () => {
    expect(faseNoDia(1130)).toBeNull();
    expect(faseNoDia(1201)).toBe("familia");
    expect(faseNoDia(1225)).toBe("familia");
    expect(faseNoDia(1226)).toBe("festas");
    expect(faseNoDia(1231)).toBe("festas");
    expect(faseNoDia(101)).toBeNull();
    expect(faseNoDia(106)).toBeNull();
    expect(faseNoDia(107)).toBeNull();
    expect(faseNoDia(715)).toBeNull();
  });

  it("usa o horário de Brasília na virada do dia", () => {
    // 02:00 UTC de 1º/12 ainda é 30/11 em Brasília.
    expect(faseDoNatal(new Date("2026-12-01T02:00:00Z"))).toBeNull();
    expect(faseDoNatal(new Date("2026-12-01T03:00:00Z"))).toBe("familia");
    expect(faseDoNatal(new Date("2027-01-01T02:59:00Z"))).toBe("festas");
    expect(faseDoNatal(new Date("2027-01-01T03:00:00Z"))).toBeNull();
  });

  it("o script do <head> concorda com faseDoNatal em todos os dias do ano", () => {
    const inicio = new Date("2026-01-01T15:00:00Z").getTime();
    for (let i = 0; i < 365; i++) {
      const dia = new Date(inicio + i * 86_400_000);
      const fase = faseDoNatal(dia);
      const attrs = rodarScript(dia.toISOString());
      expect(attrs["data-natal-fase"] ?? null, dia.toISOString()).toBe(fase);
      expect(attrs["data-tema"] ?? null).toBe(fase ? "natal" : null);
    }
  });

  it("aceita a prévia por ?tema= fora da data", () => {
    expect(rodarScript("2026-11-17T15:00:00Z", "?tema=natal")["data-natal-fase"]).toBe("familia");
    expect(rodarScript("2026-11-17T15:00:00Z", "?tema=festas")["data-natal-fase"]).toBe("festas");
    expect(rodarScript("2026-12-10T15:00:00Z", "?tema=normal")["data-tema"]).toBeUndefined();
  });
});
