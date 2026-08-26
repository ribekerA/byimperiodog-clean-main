import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SegredoAusenteError,
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
  hashDoVisitante,
  mesmoHash,
  novoToken,
  opcoesDoCookie,
  temSegredoConfigurado,
} from "@/lib/media-likes/identity";

/**
 * A identidade de quem curte é a parte deste recurso que toca dado pessoal.
 *
 * O que estes testes protegem, em uma frase cada:
 *  • o banco nunca recebe o token, só o HMAC;
 *  • trocar o segredo invalida os hashes antigos (é o que dá sentido a girar
 *    a chave se ela vazar);
 *  • sem segredo configurado nada funciona — não há fallback embutido, porque
 *    segredo no código é segredo público;
 *  • o cookie sai HttpOnly, SameSite=Lax, Path=/ e Secure em produção.
 */

const SEGREDO = "segredo-de-teste-com-tamanho-suficiente";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("segredo do HMAC", () => {
  it("não tem fallback: sem MEDIA_LIKE_SECRET, nada de hash", () => {
    vi.stubEnv("MEDIA_LIKE_SECRET", "");
    expect(temSegredoConfigurado()).toBe(false);
    expect(() => hashDoVisitante("qualquer-token")).toThrow(SegredoAusenteError);
  });

  it("recusa segredo curto demais para ser levado a sério", () => {
    vi.stubEnv("MEDIA_LIKE_SECRET", "curto");
    expect(temSegredoConfigurado()).toBe(false);
    expect(() => hashDoVisitante("qualquer-token")).toThrow(SegredoAusenteError);
  });

  it("aceita segredo de 16 caracteres ou mais", () => {
    vi.stubEnv("MEDIA_LIKE_SECRET", SEGREDO);
    expect(temSegredoConfigurado()).toBe(true);
  });
});

describe("hash do visitante", () => {
  it("é determinístico — o mesmo token sempre encontra a própria curtida", () => {
    vi.stubEnv("MEDIA_LIKE_SECRET", SEGREDO);
    const token = novoToken();
    expect(hashDoVisitante(token)).toBe(hashDoVisitante(token));
  });

  it("não devolve o token: o que vai ao banco é opaco", () => {
    vi.stubEnv("MEDIA_LIKE_SECRET", SEGREDO);
    const token = novoToken();
    const hash = hashDoVisitante(token);

    expect(hash).not.toContain(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("muda quando o segredo muda — girar a chave invalida o que existia", () => {
    vi.stubEnv("MEDIA_LIKE_SECRET", SEGREDO);
    const token = "token-fixo-para-comparar";
    const comSegredoA = hashDoVisitante(token);

    vi.stubEnv("MEDIA_LIKE_SECRET", `${SEGREDO}-outro`);
    expect(hashDoVisitante(token)).not.toBe(comSegredoA);
  });

  it("separa visitantes diferentes", () => {
    vi.stubEnv("MEDIA_LIKE_SECRET", SEGREDO);
    expect(hashDoVisitante(novoToken())).not.toBe(hashDoVisitante(novoToken()));
  });

  it("gera token aleatório e longo o bastante", () => {
    const a = novoToken();
    const b = novoToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
    // base64url — nada de `+`, `/` ou `=` para escapar em cookie.
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("comparação de hashes", () => {
  it("compara iguais e diferentes sem estourar em tamanhos distintos", () => {
    expect(mesmoHash("abc", "abc")).toBe(true);
    expect(mesmoHash("abc", "abd")).toBe(false);
    expect(mesmoHash("abc", "abcd")).toBe(false);
    expect(mesmoHash("", "")).toBe(true);
  });
});

describe("cookie do visitante", () => {
  it("é de primeira parte, ilegível pelo JavaScript da página", () => {
    const opcoes = opcoesDoCookie();
    expect(opcoes.httpOnly).toBe(true);
    expect(opcoes.sameSite).toBe("lax");
    expect(opcoes.path).toBe("/");
  });

  it("tem validade de 180 dias, a mesma que a política de privacidade informa", () => {
    expect(VISITOR_COOKIE_MAX_AGE).toBe(180 * 24 * 60 * 60);
    expect(opcoesDoCookie().maxAge).toBe(VISITOR_COOKIE_MAX_AGE);
  });

  it("só é Secure em produção — em dev o site roda em http", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(opcoesDoCookie().secure).toBe(true);

    vi.stubEnv("NODE_ENV", "development");
    expect(opcoesDoCookie().secure).toBe(false);
  });

  it("mantém o nome que a política de privacidade cita", () => {
    // Se o nome mudar aqui, o texto de /politica-de-privacidade passa a
    // descrever um cookie que não existe.
    expect(VISITOR_COOKIE).toBe("bid_visitante");
  });
});
