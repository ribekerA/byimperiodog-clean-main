import { beforeEach, describe, expect, it, vi } from "vitest";

import { appendClickIdToWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { captureClickId, getClickId } from "@/lib/gclid";

const STORAGE_KEY = "bid_click_id";

describe("click id de mídia paga", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
    vi.restoreAllMocks();
  });

  it.each(["gclid", "wbraid", "gbraid"])("captura %s da query string", (key) => {
    window.history.replaceState({}, "", `/?${key}=click-123`);

    captureClickId();

    expect(getClickId()).toBe("click-123");
  });

  it("prioriza gclid quando mais de um identificador está presente", () => {
    window.history.replaceState({}, "", "/?wbraid=braid-1&gclid=gclid-1");

    captureClickId();

    expect(getClickId()).toBe("gclid-1");
  });

  it("descarta identificador com mais de 90 dias", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ id: "antigo", timestamp: Date.now() - 91 * 24 * 60 * 60 * 1000 }),
    );

    expect(getClickId()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("descarta timestamp inválido no futuro", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ id: "futuro", timestamp: Date.now() + 60_000 }),
    );

    expect(getClickId()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("não lança quando o storage está bloqueado", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => captureClickId()).not.toThrow();
    expect(getClickId()).toBeNull();
  });

  it("acrescenta apenas os últimos oito caracteres à mensagem", () => {
    const result = appendClickIdToWhatsAppLink(
      "https://wa.me/5511999999999?text=Ol%C3%A1",
      "prefixo-12345678",
    );

    const url = new URL(result);
    expect(url.searchParams.get("text")).toBe("Olá\n\n[ref: 12345678]");
  });
});
