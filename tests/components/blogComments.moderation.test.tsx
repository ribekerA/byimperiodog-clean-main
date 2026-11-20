import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { adminFetchMock, toastPush } = vi.hoisted(() => ({
  adminFetchMock: vi.fn(),
  toastPush: vi.fn(),
}));

vi.mock("@/lib/adminFetch", () => ({ adminFetch: adminFetchMock }));
vi.mock("@/components/admin/BlogSubnav", () => ({ BlogSubnav: () => null }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ push: toastPush }) }));

import BlogCommentsModeration from "../../app/(admin)/admin/(protected)/blog/comments/page";

const comment = {
  id: "comment-1",
  post_id: "post-1",
  author_name: "Tutora",
  author_email: "tutora@example.com",
  body: "Comentário de teste.",
  approved: false,
  created_at: "2026-11-20T12:00:00.000Z",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("moderação de comentários do blog", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(() => cleanup());

  it("usa os campos da API e salva aprovação no registro correto", async () => {
    adminFetchMock
      .mockResolvedValueOnce(response([comment]))
      .mockResolvedValueOnce(response({ id: comment.id, post_id: comment.post_id, approved: true }));

    render(<BlogCommentsModeration />);
    expect(await screen.findByText("Tutora")).toBeTruthy();
    expect(screen.getByText("Comentário de teste.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Aprovar/ }));

    await waitFor(() => expect(adminFetchMock).toHaveBeenCalledTimes(2));
    expect(adminFetchMock).toHaveBeenLastCalledWith("/api/admin/blog/comments", expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ id: comment.id, approved: true }),
    }));
    await waitFor(() => expect(toastPush).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", message: "Comentário aprovado." }),
    ));
  });

  it("mostra falha de leitura em vez de tratá-la como lista vazia", async () => {
    adminFetchMock.mockResolvedValueOnce(response({ error: "Banco indisponível" }, 500));

    render(<BlogCommentsModeration />);

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("Banco indisponível")).toBeTruthy();
    expect(screen.queryByText("Nenhum comentário nesta categoria.")).toBeNull();
  });
});
