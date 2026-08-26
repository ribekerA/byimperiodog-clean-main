import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMediaLikes } from "@/hooks/useMediaLikes";

(globalThis as unknown as { React?: typeof React }).React = React;

const trackMediaLike = vi.fn();
vi.mock("@/lib/events", () => ({
  trackMediaLike: (...args: unknown[]) => trackMediaLike(...args),
}));

/**
 * O hook é onde mora a promessa de que a contagem exibida é a contagem real.
 *
 * Três coisas ele não pode fazer, e cada uma tem teste aqui:
 *  • pedir uma vez por foto (N+1 numa página com quinze mídias);
 *  • transformar erro de rede em "0 curtidas";
 *  • deixar o coração aceso depois de a escrita falhar no servidor.
 */

type Chamada = { url: string; init?: RequestInit };

let chamadas: Chamada[] = [];
let fetchMock: ReturnType<typeof vi.fn>;

function ok(corpo: unknown) {
  return { ok: true, status: 200, json: async () => corpo } as unknown as Response;
}
function falha(status: number) {
  return { ok: false, status, json: async () => ({ error: "indisponivel" }) } as unknown as Response;
}

beforeEach(() => {
  chamadas = [];
  trackMediaLike.mockClear();
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    chamadas.push({ url: String(url), init });
    return ok({ items: [] });
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const IDS = ["gallery:spitz-branco", "foto:filhotes/branco-01"];

describe("leitura em lote", () => {
  it("faz UMA chamada para a lista inteira — nada de uma por foto", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      chamadas.push({ url: String(url) });
      return ok({
        items: [
          { mediaId: IDS[0], count: 12, liked: true },
          { mediaId: IDS[1], count: 3, liked: false },
        ],
      });
    });

    const { result } = renderHook(() => useMediaLikes(IDS));

    await waitFor(() => expect(result.current.carregando).toBe(false));

    expect(chamadas).toHaveLength(1);
    expect(result.current.estados[IDS[0]]).toEqual({ count: 12, liked: true });
    expect(result.current.estados[IDS[1]]).toEqual({ count: 3, liked: false });
    expect(result.current.indisponivel).toBe(false);
  });

  it("deduplica e ordena os ids, então a mesma tela não refaz a busca", async () => {
    const { rerender } = renderHook(({ ids }) => useMediaLikes(ids), {
      initialProps: { ids: ["b", "a", "b", ""] },
    });

    await waitFor(() => expect(chamadas).toHaveLength(1));
    expect(chamadas[0].url).toBe(`/api/media-likes?ids=${encodeURIComponent("a,b")}`);

    // Mesmo conteúdo, array novo e outra ordem: não pode virar segunda chamada.
    rerender({ ids: ["a", "b"] });
    await waitFor(() => expect(chamadas).toHaveLength(1));
  });

  it("não chama a API quando não há mídia na tela", async () => {
    const { result } = renderHook(() => useMediaLikes([]));
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(chamadas).toHaveLength(0);
  });

  it("API fora do ar vira 'indisponível', nunca um mapa de zeros", async () => {
    fetchMock.mockImplementation(async () => falha(503));

    const { result } = renderHook(() => useMediaLikes(IDS));

    await waitFor(() => expect(result.current.indisponivel).toBe(true));
    expect(result.current.estados).toEqual({});
    expect(result.current.estados[IDS[0]]).toBeUndefined();
  });

  it("erro de rede também vira 'indisponível'", async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error("rede caiu");
    });

    const { result } = renderHook(() => useMediaLikes(IDS));

    await waitFor(() => expect(result.current.indisponivel).toBe(true));
    expect(result.current.estados).toEqual({});
  });
});

describe("curtir e descurtir", () => {
  const alvo = { mediaId: IDS[0], mediaType: "video" as const, contextType: "gallery" as const, contextId: "spitz-branco" };

  async function montar(estadoInicial: { count: number; liked: boolean }) {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      chamadas.push({ url: String(url), init });
      return ok({ items: [{ mediaId: IDS[0], ...estadoInicial }] });
    });

    const utilitarios = renderHook(() => useMediaLikes([IDS[0]]));
    await waitFor(() => expect(utilitarios.result.current.carregando).toBe(false));
    return utilitarios;
  }

  it("sobe o número na hora e depois aceita o número do servidor", async () => {
    const { result } = await montar({ count: 12, liked: false });

    let liberar: (() => void) | null = null;
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      chamadas.push({ url: String(url), init });
      await new Promise<void>((resolve) => {
        liberar = resolve;
      });
      // O servidor devolve 20: alguém mais curtiu enquanto isso. É esse número
      // que vale, não o 13 do otimismo.
      return ok({ mediaId: IDS[0], liked: true, count: 20 });
    });

    act(() => result.current.alternar(alvo));

    // Antes da resposta: já apareceu curtido, com +1.
    expect(result.current.estados[IDS[0]]).toEqual({ count: 13, liked: true });

    await act(async () => {
      liberar?.();
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.estados[IDS[0]]).toEqual({ count: 20, liked: true }));

    const post = chamadas.at(-1);
    expect(post?.url).toBe("/api/media-likes/toggle");
    expect(post?.init?.method).toBe("POST");
    expect(JSON.parse(String(post?.init?.body))).toEqual({
      mediaId: IDS[0],
      mediaType: "video",
      contextType: "gallery",
      contextId: "spitz-branco",
    });
  });

  it("desfaz a curtida quando a escrita falha — coração aceso sem linha no banco, nunca", async () => {
    const { result } = await montar({ count: 12, liked: false });

    fetchMock.mockImplementation(async () => falha(503));

    await act(async () => {
      result.current.alternar(alvo);
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.estados[IDS[0]]).toEqual({ count: 12, liked: false }));
    expect(trackMediaLike).not.toHaveBeenCalled();
  });

  it("descurtir desce o número e nunca passa de zero", async () => {
    const { result } = await montar({ count: 1, liked: true });

    fetchMock.mockImplementation(async () => ok({ mediaId: IDS[0], liked: false, count: 0 }));

    act(() => result.current.alternar(alvo));
    expect(result.current.estados[IDS[0]]).toEqual({ count: 0, liked: false });

    await waitFor(() => expect(result.current.estados[IDS[0]]).toEqual({ count: 0, liked: false }));
  });

  it("ignora o segundo clique enquanto o primeiro está no ar", async () => {
    const { result } = await montar({ count: 12, liked: false });

    let liberar: (() => void) | null = null;
    let posts = 0;
    fetchMock.mockImplementation(async () => {
      posts += 1;
      await new Promise<void>((resolve) => {
        liberar = resolve;
      });
      return ok({ mediaId: IDS[0], liked: true, count: 13 });
    });

    act(() => result.current.alternar(alvo));
    act(() => result.current.alternar(alvo));

    expect(posts).toBe(1);
    // O otimismo do primeiro clique continua de pé — o segundo não inverteu nada.
    expect(result.current.estados[IDS[0]]).toEqual({ count: 13, liked: true });

    await act(async () => {
      liberar?.();
      await Promise.resolve();
    });
  });

  it("avisa a analytics só depois de o servidor confirmar, e sem dado de pessoa", async () => {
    const { result } = await montar({ count: 12, liked: false });

    fetchMock.mockImplementation(async () => ok({ mediaId: IDS[0], liked: true, count: 13 }));

    await act(async () => {
      result.current.alternar(alvo);
      await Promise.resolve();
    });

    await waitFor(() => expect(trackMediaLike).toHaveBeenCalledTimes(1));

    const payload = trackMediaLike.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toEqual({
      mediaId: IDS[0],
      mediaType: "video",
      contextType: "gallery",
      contextId: "spitz-branco",
      curtiu: true,
    });
    // Nada de identidade sai daqui.
    expect(Object.keys(payload)).not.toContain("visitorHash");
    expect(JSON.stringify(payload)).not.toMatch(/cookie|hash|ip/i);
  });
});
