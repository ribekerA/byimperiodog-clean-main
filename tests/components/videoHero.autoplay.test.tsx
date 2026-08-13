import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Componentes compilados com o runtime clássico procuram React no escopo global.
(globalThis as unknown as { React?: typeof React }).React = React;

import VideoHero from "@/components/sections/VideoHero";

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === "string" ? src : ""} alt={alt} {...rest} />
  ),
}));

// O vídeo de fundo tem 26 MB. Só quem não está em Save-Data, nem em 2g/3g, nem
// pediu menos movimento é que deve baixá-lo sozinho. O contrato que dá para
// medir é este: o componente não pode chamar video.play() nesses casos.
let chamadasDePlay = 0;

function ligarConexao(conn: { saveData?: boolean; effectiveType?: string } | undefined) {
  Object.defineProperty(window.navigator, "connection", {
    configurable: true,
    get: () => conn,
  });
}

function ligarMovimento(reduzido: boolean) {
  window.matchMedia = ((consulta: string) => ({
    matches: /prefers-reduced-motion/.test(consulta) ? reduzido : false,
    media: consulta,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  chamadasDePlay = 0;
  HTMLMediaElement.prototype.play = function play() {
    chamadasDePlay += 1;
    return Promise.resolve();
  };
  HTMLMediaElement.prototype.pause = function pause() {};
  ligarConexao({ saveData: false, effectiveType: "4g" });
  ligarMovimento(false);
});

afterEach(() => {
  // O vitest deste projeto roda sem `globals: true`, entao o cleanup automatico
  // do testing-library nao existe: sem isto o DOM de um teste sobra no seguinte
  // e o getByRole acha dois botoes "Reproduzir vídeo".
  cleanup();
  vi.restoreAllMocks();
});

const esperaOcioso = () => new Promise((r) => setTimeout(r, 400));

describe("VideoHero — quem baixa os 26 MB do vídeo de fundo", () => {
  it("em 4g comum, sem Save-Data e sem preferência de movimento, o vídeo começa sozinho", async () => {
    render(<VideoHero />);
    await esperaOcioso();
    await waitFor(() => expect(chamadasDePlay).toBeGreaterThan(0));
  });

  it("com Save-Data ligado não chama play e mostra o botão de reproduzir", async () => {
    ligarConexao({ saveData: true, effectiveType: "4g" });
    render(<VideoHero />);
    await esperaOcioso();
    expect(chamadasDePlay).toBe(0);
    expect(screen.getByRole("button", { name: "Reproduzir vídeo" })).toBeTruthy();
  });

  it("em 3g não chama play", async () => {
    ligarConexao({ saveData: false, effectiveType: "3g" });
    render(<VideoHero />);
    await esperaOcioso();
    expect(chamadasDePlay).toBe(0);
  });

  it("em 2g e slow-2g não chama play", async () => {
    for (const tipo of ["2g", "slow-2g"]) {
      chamadasDePlay = 0;
      ligarConexao({ saveData: false, effectiveType: tipo });
      const { unmount } = render(<VideoHero />);
      await esperaOcioso();
      expect(chamadasDePlay, `effectiveType=${tipo}`).toBe(0);
      unmount();
    }
  });

  it("com prefers-reduced-motion não chama play", async () => {
    ligarMovimento(true);
    render(<VideoHero />);
    await esperaOcioso();
    expect(chamadasDePlay).toBe(0);
  });

  it("bloqueado, um canplay tardio não pode ligar o vídeo pelas costas", async () => {
    // Regressão real: os listeners são registrados antes da checagem, então com
    // o arquivo em cache o canplay dispara sozinho — mesmo com preload=metadata
    // — e o handler dava play em quem tinha pedido para não baixar.
    ligarConexao({ saveData: true, effectiveType: "4g" });
    const { container } = render(<VideoHero />);
    await esperaOcioso();
    const video = container.querySelector("video");
    expect(video).toBeTruthy();
    fireEvent(video as HTMLVideoElement, new Event("canplay"));
    await esperaOcioso();
    expect(chamadasDePlay).toBe(0);
  });

  it("bloqueado, o botão continua sendo o caminho de quem quer assistir", async () => {
    ligarConexao({ saveData: true, effectiveType: "4g" });
    render(<VideoHero />);
    await esperaOcioso();
    fireEvent.click(screen.getByRole("button", { name: "Reproduzir vídeo" }));
    await waitFor(() => expect(chamadasDePlay).toBe(1));
  });

  it("navigator.connection ausente (Safari/Firefox) não bloqueia ninguém", async () => {
    ligarConexao(undefined);
    render(<VideoHero />);
    await esperaOcioso();
    await waitFor(() => expect(chamadasDePlay).toBeGreaterThan(0));
  });
});
