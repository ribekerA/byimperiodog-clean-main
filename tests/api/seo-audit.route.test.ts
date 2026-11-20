import { beforeEach, describe, expect, it, vi } from "vitest";

const { listPosts, supabaseFrom } = vi.hoisted(() => ({
  listPosts: vi.fn(),
  supabaseFrom: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({ requireAdmin: () => null }));
vi.mock("@/lib/db", () => ({ blogRepo: { listPosts } }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: () => ({ from: supabaseFrom }),
}));

import { GET } from "../../app/api/admin/seo/audit/route";

function post(overrides: Record<string, unknown> = {}) {
  return {
    slug: "artigo",
    title: "Título que o template publica como H1",
    seo_title: "Título SEO válido para o artigo de teste",
    seo: { description: "Descrição suficiente para passar pela validação de tamanho." },
    excerpt: "",
    content: "conteúdo ".repeat(350),
    coverUrl: "/capa.jpg",
    coverAlt: "Capa do artigo",
    ...overrides,
  };
}

describe("/api/admin/seo/audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseFrom.mockImplementation((table: string) =>
      table === "redirects"
        ? { select: () => ({ eq: async () => ({ data: [] }) }) }
        : { insert: vi.fn().mockResolvedValue({ error: null }) },
    );
  });

  it("uses the page title as its H1 and does not warn about optional FAQ schema", async () => {
    listPosts.mockResolvedValue({
      items: [
        post({ slug: "saude-spitz-alemao-anao" }),
        post({ slug: "adestramento-spitz-alemao-anao" }),
      ],
    });

    const response = await GET(new Request("http://localhost/api/admin/seo/audit"));
    const { issues } = await response.json();

    expect(issues.filter((issue: { issue: string }) => issue.issue.includes("H1"))).toEqual([]);
    expect(issues.some((issue: { issue: string }) => issue.issue.includes("FAQ"))).toBe(false);
  });

  it("warns when the page title that supplies its H1 is missing", async () => {
    listPosts.mockResolvedValue({
      items: [
        post({
          title: null,
          content: `# Heading rebaixado no corpo\n\n${"conteúdo ".repeat(350)}`,
        }),
      ],
    });

    const response = await GET(new Request("http://localhost/api/admin/seo/audit"));
    const { issues } = await response.json();

    expect(issues).toContainEqual(
      expect.objectContaining({
        page: "/blog/artigo",
        issue: "Título H1 faltando na página",
      }),
    );
  });
});
