import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Toda rota que grava tem que dizer quem pode gravar.
 *
 * O projeto tem 111 rotas de escrita sob `app/api`. Contar na mão qual delas
 * ficou aberta é um trabalho que se refaz a cada rota nova e que já falhou:
 * `/api/qa/embed-missing` e `/api/search/reindex` rodaram por meses aceitando
 * um token que estava escrito no próprio arquivo, em repositório público.
 *
 * O teste não julga se o guard é o certo para aquela rota — isso é leitura
 * humana. Ele responde uma pergunta mais simples e que dá para automatizar:
 * *existe algum controle de acesso ou de frequência neste arquivo?* Uma rota
 * de POST sem nenhum é sempre um defeito, mesmo quando o corpo parece inócuo.
 *
 * Quem precisar abrir uma exceção escreve o motivo em EXCECOES. É de propósito
 * que custe uma linha de justificativa.
 */

const RAIZ = resolve(__dirname, "..", "..");
const API = join(RAIZ, "app", "api");

/** Handlers que mudam estado. GET fica de fora: leitura tem outras regras. */
const ESCREVE = /export\s+(async\s+)?(function|const)\s+(POST|PUT|PATCH|DELETE)\b/;

/**
 * O que conta como controle. A lista é ampla porque o projeto usa camadas
 * diferentes conforme a rota: sessão assinada do admin, token de operação
 * interna, segredo de cron, assinatura de webhook e limite por IP.
 */
const GUARDAS: ReadonlyArray<RegExp> = [
  /requireAdmin/,
  /internalGuard|verifyInternalToken/,
  /x-admin-token|ADMIN_TOKEN|CRON_SECRET|INTERNAL_API_TOKEN/,
  /verifyAdminSession/,
  /signature|assinatura|hmac/i,
  /headers\.get\(['"]authorization/i,
  /limiteDeTaxa|checkRateLimit|rateLimit\(/,
  // Limitadores escritos dentro do próprio arquivo (media-likes, comentários).
  // Só entra identificador de código. A lista já teve `in-memory rate limiter`,
  // que era um comentário: reescrever o comentário derrubava o teste sem que
  // nada da proteção tivesse mudado — e, pior, um comentário colado numa rota
  // aberta teria aprovado ela. Comentário não é guarda.
  /dentroDoLimite|MAX_POR_JANELA|checkRate\(/,
];

const EXCECOES: ReadonlyArray<{ rota: string; motivo: string }> = [
  {
    rota: "app/api/admin/logout/route.ts",
    motivo:
      "só apaga cookies de sessão. Exigir sessão para encerrar sessão deixaria " +
      "quem tem cookie expirado sem saída, e não há dado nem custo do outro lado.",
  },
];

function rotas(dir: string, achados: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      rotas(caminho, achados);
      continue;
    }
    if (/^route\.tsx?$/.test(nome)) achados.push(caminho);
  }
  return achados;
}

describe("controle de acesso nas rotas de escrita", () => {
  const arquivos = rotas(API);

  it("encontra o conjunto de rotas que se espera auditar", () => {
    expect(arquivos.length).toBeGreaterThan(100);
  });

  it("nenhuma rota de POST/PUT/PATCH/DELETE fica sem guard nem sem limite", () => {
    const desprotegidas: string[] = [];

    for (const caminho of arquivos) {
      const rel = relative(RAIZ, caminho).split(sep).join("/");
      if (EXCECOES.some((e) => e.rota === rel)) continue;

      const fonte = readFileSync(caminho, "utf8");
      if (!ESCREVE.test(fonte)) continue;
      if (GUARDAS.some((re) => re.test(fonte))) continue;

      desprotegidas.push(rel);
    }

    expect(
      desprotegidas,
      "Rota de escrita sem controle de acesso nem limite de frequência. " +
        "Use requireAdmin (painel), internalGuard (manutenção) ou limiteDeTaxa " +
        "de src/lib/limitePublico.ts (rota pública).",
    ).toEqual([]);
  });

  it("não sobra exceção apontando para arquivo que não existe mais", () => {
    const presentes = new Set(arquivos.map((c) => relative(RAIZ, c).split(sep).join("/")));
    const orfas = EXCECOES.filter((e) => !presentes.has(e.rota)).map((e) => e.rota);
    expect(orfas).toEqual([]);
  });
});
