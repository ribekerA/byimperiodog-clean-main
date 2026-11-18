import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { acceptAllConsent, rejectAllConsent } from "@/lib/consent";
import { captureClickId } from "@/lib/gclid";
import { FORMATO_DO_REF, anexarRefAoLink, gerarRef, hrefComRef } from "@/lib/whatsapp-ref";

const LINK = "https://wa.me/5511968633239?text=Ol%C3%A1%21%20Vi%20a%20Branca";

function link(href = LINK) {
  const a = document.createElement("a");
  a.href = href;
  return a;
}

function chegarPorAnuncio(gclid = "Cj0KCQabc_DEF-123") {
  window.history.replaceState(null, "", `/filhotes?gclid=${gclid}`);
  captureClickId();
  window.history.replaceState(null, "", "/filhotes");
}

let beacon: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  beacon = vi.fn(() => true);
  Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("código curto do WhatsApp", () => {
  it("gera 5 caracteres sem letras ou números confundíveis", () => {
    for (let i = 0; i < 200; i++) expect(gerarRef()).toMatch(FORMATO_DO_REF);
    expect(gerarRef(() => new Uint8Array([0, 0, 0, 0, 0]))).toBe("22222");
  });

  it("acrescenta o código ao texto com espaço codificado, sem '+'", () => {
    const novo = hrefComRef(LINK, "K7M2Q")!;
    expect(new URL(novo).searchParams.get("text")).toBe("Olá! Vi a Branca (cód. K7M2Q)");
    expect(novo).not.toContain("+");
    expect(hrefComRef(novo, "K7M2Q")).toBe(novo);
  });

  it("sem aceite de marketing não mexe no link nem avisa o servidor", () => {
    rejectAllConsent();
    chegarPorAnuncio();
    const a = link();
    expect(anexarRefAoLink(a, null)).toBeNull();
    expect(a.href).toBe(LINK);
    expect(beacon).not.toHaveBeenCalled();
  });

  it("sem clique de anúncio guardado não mexe no link", () => {
    acceptAllConsent();
    const a = link();
    expect(anexarRefAoLink(a, null)).toBeNull();
    expect(a.href).toBe(LINK);
    expect(beacon).not.toHaveBeenCalled();
  });

  it("veio de anúncio: código na mensagem, gclid só no servidor, um código por sessão", async () => {
    acceptAllConsent();
    chegarPorAnuncio("Cj0KCQabc_DEF-123");

    const a = link();
    const ref = anexarRefAoLink(a, "branca-femea")!;
    expect(ref).toMatch(FORMATO_DO_REF);
    expect(a.href).toContain(encodeURIComponent(`(cód. ${ref})`));
    expect(a.href).not.toContain("Cj0KCQ");

    expect(beacon).toHaveBeenCalledTimes(1);
    const [url, blob] = beacon.mock.calls[0]!;
    expect(url).toBe("/api/whatsapp/ref");
    const corpo = JSON.parse(await (blob as Blob).text());
    expect(corpo).toEqual({
      ref,
      gclid: "Cj0KCQabc_DEF-123",
      wbraid: null,
      gbraid: null,
      page: "/filhotes",
      puppySlug: "branca-femea",
    });

    // Mesmo botão de novo: mesmo código, sem novo registro.
    const b = link();
    expect(anexarRefAoLink(b, "branca-femea")).toBe(ref);
    expect(beacon).toHaveBeenCalledTimes(1);

    // Outro filhote: mesmo código, registro novo para saber qual foi.
    expect(anexarRefAoLink(link(), "creme-macho")).toBe(ref);
    expect(beacon).toHaveBeenCalledTimes(2);
  });
});
