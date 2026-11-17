import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { config } from "../../proxy";

// O proxy só roda onde protege alguma coisa (17/11/2026). Este teste usa o
// próprio matcher do Next para garantir que nenhuma rota administrativa ficou
// de fora e que as páginas públicas não passam mais por ele.
const casa = (url: string) => unstable_doesMiddlewareMatch({ config, url });

describe("matcher do proxy", () => {
  it.each([
    "/admin",
    "/admin/login",
    "/admin/dashboard",
    "/admin/filhotes/editar/123",
    "/api/admin",
    "/api/admin/login",
    "/api/admin/leads/export",
    "/api/integrations/google/callback",
    "/api/ai/captions",
    "/api/ai/seo",
    "/api/tracking/select",
    "/api/tracking/settings",
    "/api/blog/import",
    "/api/blog/generate",
    "/api/analytics",
    "/api/rum",
    "/api/settings/tracking",
  ])("protege %s", (url) => {
    expect(casa(url)).toBe(true);
  });

  it.each([
    "/",
    "/filhotes",
    "/filhotes/sao-paulo",
    "/contato",
    "/disponiveis",
    "/blog",
    "/blog/qualquer-artigo",
    "/administracao-de-filhotes",
    "/api/leads",
  ])("deixa %s de fora", (url) => {
    expect(casa(url)).toBe(false);
  });
});
