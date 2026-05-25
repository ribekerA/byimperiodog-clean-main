import { afterEach, describe, expect, it, vi } from "vitest";

async function loadDbWithSupabase(mock: () => unknown) {
  vi.doMock("@/lib/supabaseAdmin", () => ({
    supabaseAdmin: mock,
  }));
  const module = await import("@/lib/db");
  return module;
}

describe("db repositories", () => {
  afterEach(() => {
    vi.unmock("@/lib/supabaseAdmin");
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns fallback when supabase client is unavailable", async () => {
    const { blogRepo, commentRepo, mediaRepo, analyticsRepo, settingsRepo } = await loadDbWithSupabase(() => {
      throw new Error("supabase unavailable");
    });

    const posts = await blogRepo.listPosts();
    expect(posts.items).toEqual([]);
    const comments = await commentRepo.listComments();
    expect(comments.items).toEqual([]);
    const media = await mediaRepo.listAssets();
    expect(media.items).toEqual([]);
    const events = await analyticsRepo.listEvents();
    expect(events.items).toEqual([]);
    const settings = await settingsRepo.getSettings();
    expect(settings).toBeNull();
  });

  it("maps basic post data from supabase rows", async () => {
    const chainResult = {
      data: [
        {
          id: "p1",
          slug: "primeiro-post",
          title: "Primeiro Post",
          excerpt: "Resumo",
          status: "published",
          cover_url: "https://cdn.example.com/cover.jpg",
          tags: ["lulu", "filhotes"],
          created_at: "2025-10-24T10:00:00.000Z",
          updated_at: "2025-10-25T10:00:00.000Z",
        },
      ],
      error: null,
      count: 1,
    };

    const builder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      then: (resolve: (value: typeof chainResult) => void) => resolve(chainResult),
    };

    const mockClient = {
      from: vi.fn().mockReturnValue(builder),
    };

    const { blogRepo } = await loadDbWithSupabase(() => mockClient);
    const result = await blogRepo.listPosts();

    expect(mockClient.from).toHaveBeenCalledWith("blog_posts");
    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: "p1",
      slug: "primeiro-post",
      title: "Primeiro Post",
      tags: [{ slug: "lulu" }, { slug: "filhotes" }],
    });
  });
});
