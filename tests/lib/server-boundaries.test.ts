import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { escapeXml } from "@/lib/xml";

describe("fronteiras públicas e privadas", () => {
  it("obriga o Next a bloquear importação do administrador no navegador", () => {
    expect(readFileSync("src/lib/supabaseAdmin.ts", "utf8")).toContain('import "server-only"');
    const client = readFileSync("app/(admin)/admin/(protected)/leads/LeadsCRM.tsx", "utf8");
    expect(client).toContain('import { LEAD_STATUS_OPTIONS } from "./lead-status"');
    expect(client).not.toMatch(/import \{[^}]+\} from "\.\/queries"/);
  });
  it("não lê tokens CAPI junto das configurações públicas", () => {
    const source = readFileSync("src/lib/getSettings.ts", "utf8");
    expect(source).not.toContain('.select("*")');
    expect(source).not.toMatch(/fb_capi_token|tiktok_api_token/);
  });
  it("escapa parâmetros e marcação em XML sem alterar URLs normais", () => {
    expect(escapeXml('https://example.test/photo?a=1&b="two"')).toBe('https://example.test/photo?a=1&amp;b=&quot;two&quot;');
    expect(escapeXml("<script>'x'</script>")).toBe("&lt;script&gt;&apos;x&apos;&lt;/script&gt;");
  });
});
