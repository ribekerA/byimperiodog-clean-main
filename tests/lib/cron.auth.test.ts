// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { autorizarCron } from "@/lib/cron/auth";

// O portao do cron decide quem pode publicar post agendado e rodar a fila de
// follow-up. Sem teste, um refactor que troque o header ou inverta a condicao
// abre esses endpoints para a internet inteira sem ninguem perceber.

const SEGREDO = "segredo-de-teste-1234567890";
const original = process.env.CRON_SECRET;

function requisicao(headers: Record<string, string> = {}, method = "GET") {
  return new Request("https://byimperiodog.com.br/api/cron/autosales-due", { headers, method });
}

describe("autorizarCron", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = SEGREDO;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  });

  it("libera com Authorization: Bearer correto", () => {
    expect(autorizarCron(requisicao({ authorization: `Bearer ${SEGREDO}` }))).toBeNull();
  });

  it("libera com x-cron-secret correto", () => {
    expect(autorizarCron(requisicao({ "x-cron-secret": SEGREDO }))).toBeNull();
  });

  it("aceita o esquema em qualquer caixa", () => {
    expect(autorizarCron(requisicao({ authorization: `bearer ${SEGREDO}` }))).toBeNull();
  });

  it("libera em POST, que e o outro metodo do agendador", () => {
    expect(autorizarCron(requisicao({ authorization: `Bearer ${SEGREDO}` }, "POST"))).toBeNull();
  });

  it("bloqueia sem header nenhum", async () => {
    const resposta = autorizarCron(requisicao());
    expect(resposta?.status).toBe(401);
  });

  it("bloqueia com segredo errado", () => {
    expect(autorizarCron(requisicao({ authorization: "Bearer errado" }))?.status).toBe(401);
  });

  it("bloqueia com segredo do tamanho certo mas conteudo errado", () => {
    const mesmoTamanho = "x".repeat(SEGREDO.length);
    expect(autorizarCron(requisicao({ authorization: `Bearer ${mesmoTamanho}` }))?.status).toBe(401);
  });

  it("bloqueia quando so o prefixo bate", () => {
    expect(autorizarCron(requisicao({ authorization: `Bearer ${SEGREDO.slice(0, 8)}` }))?.status).toBe(401);
  });

  // Os tres casos abaixo diziam o contrario ate agora: sem CRON_SECRET a funcao
  // devolvia null e a rota executava, "porque o segredo e opcional ate ser
  // criado". Na pratica isso deixava publicacao agendada e disparo de venda ao
  // alcance de quem descobrisse a URL. Falta de chave e falha de configuracao, e
  // falha de configuracao fecha a porta.
  it("sem CRON_SECRET definido, bloqueia com 503", () => {
    delete process.env.CRON_SECRET;
    expect(autorizarCron(requisicao())?.status).toBe(503);
  });

  it("bloqueia com 503 mesmo quando o chamador manda um segredo qualquer", () => {
    delete process.env.CRON_SECRET;
    const resposta = autorizarCron(requisicao({ authorization: "Bearer qualquer-coisa" }));
    expect(resposta?.status).toBe(503);
  });

  it("CRON_SECRET so com espacos conta como ausente", () => {
    process.env.CRON_SECRET = "   ";
    expect(autorizarCron(requisicao())?.status).toBe(503);
  });

  it("CRON_SECRET curto demais para ser chave tambem bloqueia", () => {
    process.env.CRON_SECRET = "curto";
    expect(autorizarCron(requisicao({ authorization: "Bearer curto" }))?.status).toBe(503);
  });

  it("recusa metodo que o agendador nao usa, antes de olhar o segredo", () => {
    expect(autorizarCron(requisicao({ authorization: `Bearer ${SEGREDO}` }, "DELETE"))?.status).toBe(405);
    delete process.env.CRON_SECRET;
    expect(autorizarCron(requisicao({}, "PUT"))?.status).toBe(405);
  });
});
