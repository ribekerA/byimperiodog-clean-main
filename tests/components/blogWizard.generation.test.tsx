import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { adminFetchMock } = vi.hoisted(() => ({ adminFetchMock: vi.fn() }));

vi.mock("@/lib/adminFetch", () => ({ adminFetch: adminFetchMock }));
vi.mock("@/components/admin/BlogSubnav", () => ({ BlogSubnav: () => null }));

import WizardPage from "../../app/(admin)/admin/(protected)/blog/editor/wizard/page";

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("geração no wizard do blog", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(() => cleanup());

  it("carrega o artigo persistido quando a geração retorna só o post_id", async () => {
    adminFetchMock
      .mockResolvedValueOnce(response({ ok: true, outline: [{ heading: "Introdução" }] }))
      .mockResolvedValueOnce(response({
        ok: true,
        post_id: "post-1",
        slug: "guia-spitz",
        title: "Guia de Spitz Alemão",
        excerpt: "Resumo do artigo",
      }))
      .mockResolvedValueOnce(response({
        id: "post-1",
        slug: "guia-spitz",
        title: "Guia de Spitz Alemão",
        excerpt: "Resumo do artigo",
        content_mdx: "# Conteúdo salvo no banco",
      }))
      .mockResolvedValueOnce(response({
        suggestions: { seo_title: "SEO title", seo_description: "SEO description" },
      }));

    render(<WizardPage />);
    fireEvent.change(screen.getByLabelText(/Tópico principal/), { target: { value: "Cuidados com Spitz" } });
    fireEvent.click(screen.getByLabelText(/Gerar imagem de capa/));
    fireEvent.click(screen.getByRole("button", { name: /Gerar outline/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Gerar artigo completo/ }));

    expect(await screen.findByDisplayValue("# Conteúdo salvo no banco")).toBeTruthy();
    expect(adminFetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/admin/blog?id=post-1",
      { cache: "no-store" },
    );
  });
});
