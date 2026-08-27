import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { acceptAllConsent, rejectAllConsent } from "@/lib/consent";
import { trackContactPageView, trackPuppyPageView } from "@/lib/events";

/**
 * Visualizar não é converter.
 *
 * A página do filhote disparava `lead_filhote` no mount — no simples
 * carregamento da página. Se esse evento virasse conversão no GA4 ou fosse
 * importado para o Google Ads, o Lances Inteligentes enxergaria quase 100% dos
 * cliques como convertidos e perderia qualquer critério para separar clique bom
 * de clique ruim. Este arquivo trava a distinção nos dois sentidos: a view sai
 * com nome de view, e nenhum evento de view pode voltar a ter nome de lead.
 */

let chamadasGtag: Array<{ nome: string; params: Record<string, unknown> }> = [];

function eventos(nome: string) {
  return chamadasGtag.filter((c) => c.nome === nome);
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  chamadasGtag = [];
  (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];

  (window as unknown as { gtag: (...args: unknown[]) => void }).gtag = (...args: unknown[]) => {
    if (args[0] === "event") {
      chamadasGtag.push({
        nome: String(args[1]),
        params: (args[2] ?? {}) as Record<string, unknown>,
      });
    }
  };

  acceptAllConsent();
});

afterEach(() => {
  vi.useRealTimers();
  delete (window as unknown as { gtag?: unknown }).gtag;
});

describe("view de página de filhote", () => {
  it("sai como view_puppy_reference, nunca como lead", () => {
    trackPuppyPageView({ puppySlug: "spitz-branco-femea", puppyColor: "branco", puppySex: "femea" });

    expect(eventos("view_puppy_reference")).toHaveLength(1);
    expect(eventos("view_puppy_reference")[0].params).toMatchObject({
      placement: "puppy_page",
      item_id: "spitz-branco-femea",
      puppy_color: "branco",
      puppy_sex: "femea",
    });

    const nomesDeConversao = chamadasGtag.filter(
      (c) => c.nome.startsWith("lead") || c.nome === "generate_lead" || c.nome === "conversion",
    );
    expect(nomesDeConversao).toEqual([]);
  });

  it("um mount é exatamente um evento por rota de medição", () => {
    trackPuppyPageView({ puppySlug: "spitz-branco-femea" });

    expect(eventos("view_puppy_reference")).toHaveLength(1);
    const doDataLayer = ((window as unknown as { dataLayer: Array<Record<string, unknown>> }).dataLayer)
      .filter((entrada) => entrada && entrada.event === "view_puppy_reference");
    expect(doDataLayer).toHaveLength(1);
  });

  it("não carrega dado pessoal", () => {
    trackPuppyPageView({ puppySlug: "spitz-branco-femea", puppyColor: "branco", puppySex: "femea" });

    const chaves = Object.keys(eventos("view_puppy_reference")[0].params);
    const proibidas = ["email", "phone", "telefone", "nome", "name", "cpf", "whatsapp", "ip", "user_id"];
    expect(chaves.filter((k) => proibidas.some((p) => k.toLowerCase().includes(p)))).toEqual([]);
  });

  it("não mede nada sem consentimento de analytics", () => {
    rejectAllConsent();
    trackPuppyPageView({ puppySlug: "spitz-branco-femea" });
    trackContactPageView();

    expect(chamadasGtag).toEqual([]);
  });

  it("espera o gtag aparecer em vez de disparar no vazio", () => {
    vi.useFakeTimers();
    delete (window as unknown as { gtag?: unknown }).gtag;

    trackPuppyPageView({ puppySlug: "spitz-branco-femea" });
    expect(chamadasGtag).toEqual([]);

    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag = (...args: unknown[]) => {
      if (args[0] === "event") {
        chamadasGtag.push({ nome: String(args[1]), params: (args[2] ?? {}) as Record<string, unknown> });
      }
    };
    vi.advanceTimersByTime(1000);

    expect(eventos("view_puppy_reference")).toHaveLength(1);
  });

  it("desiste depois do teto de espera, sem ficar tentando para sempre", () => {
    vi.useFakeTimers();
    delete (window as unknown as { gtag?: unknown }).gtag;

    trackPuppyPageView({ puppySlug: "spitz-branco-femea" });
    vi.advanceTimersByTime(30_000);

    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag = (...args: unknown[]) => {
      if (args[0] === "event") {
        chamadasGtag.push({ nome: String(args[1]), params: (args[2] ?? {}) as Record<string, unknown> });
      }
    };
    vi.advanceTimersByTime(30_000);

    expect(chamadasGtag).toEqual([]);
  });
});

describe("view de página de contato", () => {
  it("abrir a página de contato não é pedir contato", () => {
    trackContactPageView();

    expect(eventos("view_contact_page")).toHaveLength(1);
    expect(chamadasGtag.filter((c) => c.nome.startsWith("lead"))).toEqual([]);
  });
});

describe("nenhum evento de pageview tem nome de conversão", () => {
  it("o código não emite eventos chamados lead_*", () => {
    const raiz = process.cwd();
    const extensoes = new Set([".ts", ".tsx"]);

    function arquivos(dir: string): string[] {
      const saida: string[] = [];
      for (const entrada of readdirSync(dir, { withFileTypes: true })) {
        const caminho = join(dir, entrada.name);
        if (entrada.isDirectory()) {
          if (entrada.name === "node_modules" || entrada.name === ".next") continue;
          saida.push(...arquivos(caminho));
        } else if (extensoes.has(extname(entrada.name))) {
          saida.push(caminho);
        }
      }
      return saida;
    }

    // O alvo e o NOME DO EVENTO passado a uma chamada de analytics -- nao a
    // palavra lead_ onde quer que ela apareca. Tabela lead_interactions,
    // coluna lead_id, utm lead_funnel e o webhook lead_form_submit (que sai
    // de uma submissao real, nao de um carregamento de pagina) sao todos
    // legitimos e continuam permitidos.
    //
    // generate_lead tambem fica: e o nome padrao do GA4 para envio de
    // formulario, e o formulario e uma acao do visitante.
    const emissaoDeLead = [
      /gtag\(\s*['"]event['"]\s*,\s*['"]lead_/,
      /sendGA4\(\s*['"]lead_/,
      /\.event\(\s*['"]lead_/,
      /fireEvent\(\s*['"]lead_/,
      /event\s*:\s*['"]lead_/,
      /eventName=["{]\s*['"]?lead_/,
    ];

    const culpados: string[] = [];
    for (const pasta of ["app", "src"]) {
      for (const caminho of arquivos(join(raiz, pasta))) {
        const texto = readFileSync(caminho, "utf8");
        const acusa = texto
          .split(/\r?\n/)
          .some(
            (linha) =>
              emissaoDeLead.some((padrao) => padrao.test(linha)) &&
              !/^\s*(\/\/|\*|\/\*)/.test(linha),
          );
        if (acusa) culpados.push(relative(raiz, caminho).split("\\").join("/"));
      }
    }

    expect(culpados).toEqual([]);
  });
});
