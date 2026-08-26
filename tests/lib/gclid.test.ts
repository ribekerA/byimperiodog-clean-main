import { beforeEach, describe, expect, it, vi } from "vitest";

import { acceptAllConsent, rejectAllConsent } from "@/lib/consent";
import { captureClickId, getClickId } from "@/lib/gclid";

const STORAGE_KEY = "bid_click_id";
const SESSION_KEY = "bid_click_id_sessao";

describe("click id de mídia paga", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
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

  // O gclid identifica um clique de anúncio: guardá-lo por 90 dias é
  // armazenamento de publicidade e depende de escolha. Sem consentimento ele
  // vale só para esta visita — o suficiente para o formulário enviado agora
  // registrar de onde a pessoa veio, sem deixar rastro de 90 dias.
  it("sem consentimento de marketing, não persiste por 90 dias", () => {
    rejectAllConsent();
    window.history.replaceState({}, "", "/?gclid=sem-consentimento");

    captureClickId();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(SESSION_KEY)).toBe("sem-consentimento");
    expect(getClickId()).toBe("sem-consentimento");
  });

  it("com consentimento de marketing, persiste por 90 dias", () => {
    acceptAllConsent();
    window.history.replaceState({}, "", "/?gclid=com-consentimento");

    captureClickId();

    const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    expect(guardado?.id).toBe("com-consentimento");
    expect(getClickId()).toBe("com-consentimento");
  });

  it("promove o identificador da sessão quando o consentimento vem depois", () => {
    rejectAllConsent();
    window.history.replaceState({}, "", "/?gclid=aceito-depois");
    captureClickId();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    // O visitante navegou para outra página e só então aceitou os cookies.
    window.history.replaceState({}, "", "/filhotes");
    acceptAllConsent();
    captureClickId();

    const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    expect(guardado?.id).toBe("aceito-depois");
  });
});
