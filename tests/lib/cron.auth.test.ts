import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { autorizarCron } from "@/lib/cron/auth";

// O portao do cron decide quem pode publicar post agendado e rodar a fila de
// follow-up. Sem teste, um refactor que troque o header ou inverta a condicao
// abre esses endpoints para a internet inteira sem ninguem perceber.

const SEGREDO = "segredo-de-teste-1234567890";
const original = process.env.CRON_SECRET;

function requisicao(headers: Record<string, string> = {}) {
  return new Request("https://byimperiodog.com.br/api/cron/autosales-due", { headers });
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

  // Sem segredo a rota recusa. Producao ja tem CRON_SECRET configurado (um
  // segredo errado volta 401 la), entao fechar aqui nao derruba agendamento
  // nenhum — e impede que apagar a variavel por engano deixe publicacao e fila
  // de vendas abertas para quem descobrir a URL.
  it("sem CRON_SECRET definido, recusa", () => {
    delete process.env.CRON_SECRET;
    expect(autorizarCron(requisicao())?.status).toBe(401);
  });

  it("CRON_SECRET so com espacos conta como ausente e tambem recusa", () => {
    process.env.CRON_SECRET = "   ";
    expect(autorizarCron(requisicao())?.status).toBe(401);
  });

  it("segredo certo continua passando mesmo com a porta fechada por padrao", () => {
    expect(autorizarCron(requisicao({ "x-cron-secret": SEGREDO }))).toBeNull();
  });
});
