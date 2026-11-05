import { describe, expect, it } from "vitest";

import { validatePublicHttpsUrl } from "@/lib/safeOutboundUrl";

describe("destinos externos de webhook", () => {
  it.each([
    "http://example.com/hook",
    "https://localhost/hook",
    "https://127.0.0.1/hook",
    "https://10.1.2.3/hook",
    "https://169.254.169.254/latest/meta-data",
    "https://[::1]/hook",
    "https://user:password@example.com/hook",
    "https://example.com:8443/hook",
  ])("bloqueia destino inseguro: %s", async (url) => {
    await expect(validatePublicHttpsUrl(url)).rejects.toThrow();
  });
});
