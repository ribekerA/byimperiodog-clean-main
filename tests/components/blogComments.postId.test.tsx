import { cleanup, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Componentes compilados com o runtime clássico procuram React no escopo global.
(globalThis as unknown as { React?: typeof React }).React = React;

import Comments from "@/components/blog/Comments";
import { isCommentablePostId } from "@/lib/blog/commentable";

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ push: () => {} }),
}));

const UUID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

let chamadas: string[] = [];

beforeEach(() => {
  chamadas = [];
  vi.stubGlobal("fetch", (url: string) => {
    chamadas.push(String(url));
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ items: [], nextCursor: null }),
    } as Response);
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("isCommentablePostId", () => {
  it("aceita uuid e recusa slug, vazio e nulo", () => {
    expect(isCommentablePostId(UUID)).toBe(true);
    expect(isCommentablePostId("guia-spitz-alemao")).toBe(false);
    expect(isCommentablePostId("")).toBe(false);
    expect(isCommentablePostId(null)).toBe(false);
    expect(isCommentablePostId(undefined)).toBe(false);
  });
});

describe("Comments — artigo de arquivo não pode pedir comentário", () => {
  it("com slug no lugar do uuid não chama a API e não desenha nada", async () => {
    // blog_comments.post_id e uuid com FK para blog_posts; os 30 artigos MDX nao
    // tem linha la. Antes disso, todo carregamento de artigo disparava
    // GET /api/blog/comments?post_id=<slug> e voltava 400 "post_id inválido".
    const { container } = render(<Comments postId="guia-spitz-alemao" />);
    await new Promise((r) => setTimeout(r, 50));
    expect(chamadas).toEqual([]);
    expect(container.innerHTML).toBe("");
  });

  it("com uuid de verdade continua carregando os comentários", async () => {
    render(<Comments postId={UUID} />);
    await waitFor(() => expect(chamadas.length).toBe(1));
    expect(chamadas[0]).toContain(`post_id=${UUID}`);
    await waitFor(() => expect(screen.getByText("Seja o primeiro a comentar!")).toBeTruthy());
  });
});
