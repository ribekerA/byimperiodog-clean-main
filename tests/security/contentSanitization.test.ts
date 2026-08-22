import { compile } from "@mdx-js/mdx";
import { describe, expect, it } from "vitest";

import {
  escapeHtml,
  remarkMdxSecurityPlugin,
  safeJsonLdStringify,
  sanitizeMdxUrl,
} from "@/lib/contentSecurity";
import {
  renderWebStoryAmpHtml,
  sanitizeWebStoryUrl,
  webStoryInputSchema,
} from "@/lib/webStoryAmp";

describe("content sanitization", () => {
  it("removes executable MDX nodes, raw JSX and unsafe protocols before compilation", async () => {
    const source = `
# Conteúdo seguro

{globalThis.__xss = "executed"}

<script>globalThis.__script_xss = true</script>

<a href="javascript:alert(1)" onClick={() => alert(1)}>texto preservado</a>

[link perigoso](javascript:alert%281%29)

![imagem perigosa](data:text/html;base64,PHNjcmlwdD4=)

[link seguro](https://example.com/artigo)
`;

    const compiled = String(
      await compile(source, {
        outputFormat: "function-body",
        remarkPlugins: [remarkMdxSecurityPlugin],
      })
    );

    expect(compiled).toContain("Conteúdo seguro");
    expect(compiled).toContain("texto preservado");
    expect(compiled).toContain("https://example.com/artigo");
    expect(compiled).not.toContain("globalThis");
    expect(compiled).not.toContain("javascript:");
    expect(compiled).not.toContain("data:text/html");
    expect(compiled).not.toContain("onClick");
  });

  it("accepts navigation links but rejects executable and data URLs", () => {
    expect(sanitizeMdxUrl("/blog/artigo")).toBe("/blog/artigo");
    expect(sanitizeMdxUrl("https://example.com")).toBe("https://example.com");
    expect(sanitizeMdxUrl("mailto:contato@example.com")).toBe("mailto:contato@example.com");
    expect(sanitizeMdxUrl("java%73cript:alert(1)")).toBeUndefined();
    expect(sanitizeMdxUrl("vbscript:msgbox(1)")).toBeUndefined();
    expect(sanitizeMdxUrl("data:text/html,<script>alert(1)</script>")).toBeUndefined();
    expect(sanitizeMdxUrl("data:image/svg+xml,<svg/>", "image")).toBeUndefined();
    expect(sanitizeMdxUrl("/images/filhote.jpg", "image")).toBe("/images/filhote.jpg");
  });

  it("escapes HTML and prevents JSON-LD script breakouts without corrupting JSON", () => {
    const attack = "</script><script>globalThis.__jsonld_xss=true</script> & \u2028";
    const serialized = safeJsonLdStringify({ name: attack });

    expect(escapeHtml(`<img src=x onerror="alert(1)">`)).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("<script>");
    expect(serialized).toContain("\\u003c/script\\u003e");
    expect(JSON.parse(serialized)).toEqual({ name: attack });
  });
});
describe("Web Story AMP rendering", () => {
  it("escapes database fields and discards unsafe media URLs", () => {
    const html = renderWebStoryAmpHtml(
      {
        title: `Filhote </title><script id="attack">alert(1)</script>`,
        slug: `story\" onmouseover=\"alert(1)`,
        publisher: `Canil\" onload=\"alert(1)`,
        poster_url: "javascript:alert(1)",
        logo_url: "data:image/svg+xml,<svg onload=alert(1)>",
        pages: [
          {
            type: "image",
            media_url: `https://cdn.example.com/photo.jpg\" onerror=\"alert(1)`,
            text: `<img src=x onerror="alert(1)">`,
          },
          {
            type: "video",
            media_url: "https://cdn.example.com/video.mp4",
            text: "Página segura",
          },
        ],
      },
      "https://byimperiodog.com.br"
    );

    expect(html).not.toContain(`<script id="attack">`);
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("data:image/svg+xml");
    expect(html).not.toContain(`<img src=x onerror="alert(1)">`);
    expect(html).not.toContain("onmouseover=");
    expect(html).toContain("&lt;/title&gt;&lt;script id=&quot;attack&quot;&gt;");
    expect(html).toContain("https://cdn.example.com/video.mp4");
    expect(html).toContain("Página segura");
  });

  it("validates write payloads and permits HTTPS or local assets only", () => {
    const valid = webStoryInputSchema.safeParse({
      title: "Primeiro Spitz",
      slug: "primeiro-spitz",
      publisher: "By Império Dog",
      poster_url: "https://cdn.example.com/poster.jpg",
      logo_url: "/logo.png",
      status: "published",
      pages: [{ type: "image", media_url: "/clientes/ana.jpeg", duration: 5 }],
    });
    const invalid = webStoryInputSchema.safeParse({
      title: "Story insegura",
      slug: "story-insegura",
      publisher: "By Império Dog",
      poster_url: "javascript:alert(1)",
      logo_url: "/logo.png",
      pages: [{ type: "image", media_url: "data:text/html,<script>alert(1)</script>" }],
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
    expect(sanitizeWebStoryUrl("https://cdn.example.com/photo.jpg")).toBe(
      "https://cdn.example.com/photo.jpg"
    );
    expect(sanitizeWebStoryUrl("/clientes/ana.jpeg")).toBe("/clientes/ana.jpeg");
    expect(sanitizeWebStoryUrl("javascript:alert(1)")).toBeUndefined();
  });
});
