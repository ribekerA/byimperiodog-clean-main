/**
 * @vitest-environment node
 *
 * O ambiente precisa ser o node, e nao o happy-dom: o happy-dom implementa a
 * regra do NAVEGADOR de que `Cookie` e header proibido e o descarta em
 * silencio. Como metade do que se testa aqui e justamente o cookie do
 * visitante, no happy-dom a rota receberia toda requisicao como se fosse a
 * primeira visita e os testes de identidade passariam a medir nada.
 */
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MEDIA_REGISTRY } from "@/domain/media-registry";

/**
 * A API de curtidas é a única porta de escrita da tabela `media_likes` — o
 * navegador anônimo não fala com o Supabase direto. Então é aqui que ficam as
 * garantias:
 *
 *  • id que não existe no registro não entra na tabela (senão qualquer um
 *    infla o painel do admin com mídia inventada);
 *  • `visitor_hash` nunca sai na resposta;
 *  • banco indisponível responde 503, jamais `{ count: 0 }`;
 *  • ler contagem não cria cookie; só curtir cria.
 */

const contarCurtidas = vi.fn();
const alternarCurtida = vi.fn();

vi.mock("@/lib/media-likes/repo", () => ({
  contarCurtidas: (...args: unknown[]) => contarCurtidas(...args),
  alternarCurtida: (...args: unknown[]) => alternarCurtida(...args),
  resumoDeEngajamento: vi.fn(),
}));

const SEGREDO = "segredo-de-teste-com-tamanho-suficiente";

// Ids reais, tirados do próprio registro — se o catálogo mudar, o teste
// acompanha em vez de apontar para uma foto que não existe mais.
const registros = [...MEDIA_REGISTRY.values()];
const VIDEO = registros.find((m) => m.mediaType === "video")!;
const FOTO = registros.find((m) => m.mediaType === "image")!;

function get(ids: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(`http://localhost:3000/api/media-likes?ids=${encodeURIComponent(ids)}`, {
    headers,
  });
}

function post(corpo: unknown, opcoes: { cookie?: string; ip?: string } = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  if (opcoes.cookie) headers.set("cookie", opcoes.cookie);
  headers.set("x-forwarded-for", opcoes.ip ?? `10.0.0.${Math.floor(Math.random() * 250) + 1}`);
  return new NextRequest("http://localhost:3000/api/media-likes/toggle", {
    method: "POST",
    headers,
    body: JSON.stringify(corpo),
  });
}

beforeEach(() => {
  contarCurtidas.mockReset();
  alternarCurtida.mockReset();
  vi.stubEnv("MEDIA_LIKE_SECRET", SEGREDO);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/media-likes", () => {
  it("devolve a contagem em lote e nada além de mediaId, count e liked", async () => {
    const { GET } = await import("../../app/api/media-likes/route");
    contarCurtidas.mockResolvedValue([
      { mediaId: VIDEO.mediaId, count: 12, liked: true },
      { mediaId: FOTO.mediaId, count: 3, liked: false },
    ]);

    const resposta = await GET(get(`${VIDEO.mediaId},${FOTO.mediaId}`));
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.items).toHaveLength(2);
    for (const item of corpo.items) {
      expect(Object.keys(item).sort()).toEqual(["count", "liked", "mediaId"]);
    }
    expect(JSON.stringify(corpo)).not.toMatch(/visitor|hash/i);
  });

  it("descarta id que não existe no registro antes de consultar o banco", async () => {
    const { GET } = await import("../../app/api/media-likes/route");
    contarCurtidas.mockResolvedValue([{ mediaId: VIDEO.mediaId, count: 1, liked: false }]);

    await GET(get(`${VIDEO.mediaId},foto:inventada-por-alguem,gallery:nao-existe`));

    expect(contarCurtidas).toHaveBeenCalledTimes(1);
    expect(contarCurtidas.mock.calls[0][0]).toEqual([VIDEO.mediaId]);
  });

  it("com todos os ids inválidos, responde lista vazia sem tocar no banco", async () => {
    const { GET } = await import("../../app/api/media-likes/route");

    const resposta = await GET(get("foto:nada,gallery:nada"));

    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ items: [] });
    expect(contarCurtidas).not.toHaveBeenCalled();
  });

  it("banco fora do ar é 503, não zero curtida", async () => {
    const { GET } = await import("../../app/api/media-likes/route");
    contarCurtidas.mockResolvedValue(null);

    const resposta = await GET(get(VIDEO.mediaId));
    const corpo = await resposta.json();

    expect(resposta.status).toBe(503);
    expect(corpo).toEqual({ error: "indisponivel" });
    expect(corpo.items).toBeUndefined();
  });

  it("não cria cookie: quem só olha a contagem sai como entrou", async () => {
    const { GET } = await import("../../app/api/media-likes/route");
    contarCurtidas.mockResolvedValue([{ mediaId: VIDEO.mediaId, count: 1, liked: false }]);

    const resposta = await GET(get(VIDEO.mediaId));

    expect(resposta.headers.get("set-cookie")).toBeNull();
    expect(resposta.headers.get("Cache-Control")).toBe("no-store");
    // Sem cookie na requisição, não há visitante para consultar.
    expect(contarCurtidas.mock.calls[0][1]).toBeNull();
  });

  it("com cookie, pergunta pelo hash do visitante — nunca pelo token", async () => {
    const { GET } = await import("../../app/api/media-likes/route");
    const { hashDoVisitante } = await import("@/lib/media-likes/identity");
    contarCurtidas.mockResolvedValue([{ mediaId: VIDEO.mediaId, count: 1, liked: true }]);

    const token = "token-opaco-de-teste-1234567890";
    await GET(get(VIDEO.mediaId, `bid_visitante=${token}`));

    const hashUsado = contarCurtidas.mock.calls[0][1];
    expect(hashUsado).toBe(hashDoVisitante(token));
    expect(hashUsado).not.toBe(token);
  });
});

describe("POST /api/media-likes/toggle", () => {
  it("curte e devolve o número do servidor, sem vazar identidade", async () => {
    const { POST } = await import("../../app/api/media-likes/toggle/route");
    alternarCurtida.mockResolvedValue({ ok: true, liked: true, count: 13 });

    const resposta = await POST(post({ mediaId: VIDEO.mediaId, mediaType: "video" }));
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo).toEqual({ mediaId: VIDEO.mediaId, liked: true, count: 13 });
    expect(JSON.stringify(corpo)).not.toMatch(/visitor|hash|token/i);
  });

  it("recusa id que não está no registro", async () => {
    const { POST } = await import("../../app/api/media-likes/toggle/route");

    const resposta = await POST(post({ mediaId: "foto:inventada", mediaType: "image" }));

    expect(resposta.status).toBe(404);
    expect(await resposta.json()).toEqual({ error: "midia_desconhecida" });
    expect(alternarCurtida).not.toHaveBeenCalled();
  });

  it("recusa quando o tipo não bate com o registro", async () => {
    const { POST } = await import("../../app/api/media-likes/toggle/route");

    // Vídeo real, declarado como imagem.
    const resposta = await POST(post({ mediaId: VIDEO.mediaId, mediaType: "image" }));

    expect(resposta.status).toBe(404);
    expect(alternarCurtida).not.toHaveBeenCalled();
  });

  it("recusa corpo malformado", async () => {
    const { POST } = await import("../../app/api/media-likes/toggle/route");

    const semTipo = await POST(post({ mediaId: VIDEO.mediaId }));
    expect(semTipo.status).toBe(400);

    const tipoInvalido = await POST(post({ mediaId: VIDEO.mediaId, mediaType: "gif" }));
    expect(tipoInvalido.status).toBe(400);

    expect(alternarCurtida).not.toHaveBeenCalled();
  });

  it("cria o cookie no primeiro gesto real e não o recria depois", async () => {
    const { POST } = await import("../../app/api/media-likes/toggle/route");
    alternarCurtida.mockResolvedValue({ ok: true, liked: true, count: 1 });

    const primeira = await POST(post({ mediaId: FOTO.mediaId, mediaType: "image" }));
    const cookie = primeira.headers.get("set-cookie") ?? "";

    expect(cookie).toContain("bid_visitante=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain(`Max-Age=${180 * 24 * 60 * 60}`);

    const segunda = await POST(
      post({ mediaId: FOTO.mediaId, mediaType: "image" }, { cookie: "bid_visitante=token-ja-existente-1234567890" })
    );
    expect(segunda.headers.get("set-cookie")).toBeNull();
  });

  it("grava no banco o hash, jamais o token do cookie", async () => {
    const { POST } = await import("../../app/api/media-likes/toggle/route");
    const { hashDoVisitante } = await import("@/lib/media-likes/identity");
    alternarCurtida.mockResolvedValue({ ok: true, liked: true, count: 1 });

    const token = "token-opaco-de-teste-1234567890";
    await POST(post({ mediaId: FOTO.mediaId, mediaType: "image" }, { cookie: `bid_visitante=${token}` }));

    const argumento = alternarCurtida.mock.calls[0][0] as Record<string, unknown>;
    expect(argumento.visitorHash).toBe(hashDoVisitante(token));
    expect(argumento.visitorHash).not.toBe(token);
    // O contexto vem do registro quando o cliente não manda.
    expect(argumento.contextType).toBe(FOTO.contextType);
    expect(argumento.contextId).toBe(FOTO.contextId);
    // Nem IP nem qualquer outro rastro de pessoa.
    expect(Object.keys(argumento)).toEqual(
      expect.arrayContaining(["mediaId", "mediaType", "contextType", "contextId", "visitorHash"])
    );
    expect(Object.keys(argumento)).not.toContain("ip");
  });

  it("sem MEDIA_LIKE_SECRET a curtida fica indisponível em vez de anônima de verdade", async () => {
    const { POST } = await import("../../app/api/media-likes/toggle/route");
    vi.stubEnv("MEDIA_LIKE_SECRET", "");

    const resposta = await POST(post({ mediaId: FOTO.mediaId, mediaType: "image" }));

    expect(resposta.status).toBe(503);
    expect(alternarCurtida).not.toHaveBeenCalled();
  });

  it("falha de escrita é 503, não uma curtida fantasma", async () => {
    const { POST } = await import("../../app/api/media-likes/toggle/route");
    alternarCurtida.mockResolvedValue({ ok: false });

    const resposta = await POST(post({ mediaId: FOTO.mediaId, mediaType: "image" }));

    expect(resposta.status).toBe(503);
    expect(await resposta.json()).toEqual({ error: "indisponivel" });
  });

  it("corta enxurrada: 30 por minuto por IP", async () => {
    const { POST } = await import("../../app/api/media-likes/toggle/route");
    alternarCurtida.mockResolvedValue({ ok: true, liked: true, count: 1 });

    const ip = "203.0.113.77";
    for (let i = 0; i < 30; i += 1) {
      const r = await POST(post({ mediaId: FOTO.mediaId, mediaType: "image" }, { ip }));
      expect(r.status).toBe(200);
    }

    const excedente = await POST(post({ mediaId: FOTO.mediaId, mediaType: "image" }, { ip }));
    expect(excedente.status).toBe(429);
  });
});
