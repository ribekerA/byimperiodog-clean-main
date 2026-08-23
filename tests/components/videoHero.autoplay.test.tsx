import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Componentes compilados com o runtime clássico procuram React no escopo global.
(globalThis as unknown as { React?: typeof React }).React = React;

import VideoHero from "@/components/sections/VideoHero";

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    fill: _fill,
    preload: _preload,
    quality: _quality,
    ...rest
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    preload?: boolean;
    quality?: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === "string" ? src : ""} alt={alt} {...rest} />
  ),
}));

// O vídeo de fundo tem 26 MB. O contrato atual é mais simples e mais seguro:
// nenhuma conexão baixa esse arquivo decorativo sem uma ação explícita.
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

describe("VideoHero — download sob demanda do vídeo de 26 MB", () => {
  it.each(["4g", "3g", "2g", "slow-2g"])(
    "em %s mantém o MP4 fora do DOM até o clique",
    async (effectiveType) => {
      ligarConexao({ saveData: false, effectiveType });
      const { container } = render(<VideoHero />);
      await esperaOcioso();

      expect(chamadasDePlay).toBe(0);
      expect(container.querySelector("video")).toBeNull();
      expect(container.querySelector('img[fetchpriority="high"]')).toBeTruthy();
      expect(screen.getByRole("button", { name: "Reproduzir vídeo" })).toBeTruthy();
    },
  );

  it("Save-Data não baixa sozinho, mas o clique explícito continua funcionando", async () => {
    ligarConexao({ saveData: true, effectiveType: "4g" });
    const { container } = render(<VideoHero />);
    await esperaOcioso();
    expect(container.querySelector("video")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reproduzir vídeo" }));
    await waitFor(() => expect(chamadasDePlay).toBe(1));
    expect(container.querySelector('video[preload="none"]')).toBeTruthy();
  });

  it("prefers-reduced-motion também exige clique explícito", async () => {
    ligarMovimento(true);
    const { container } = render(<VideoHero />);
    await esperaOcioso();
    expect(chamadasDePlay).toBe(0);
    expect(container.querySelector("video")).toBeNull();
  });

  it("Safari/Firefox sem navigator.connection não recebem autoplay", async () => {
    ligarConexao(undefined);
    const { container } = render(<VideoHero />);
    await esperaOcioso();
    expect(chamadasDePlay).toBe(0);
    expect(container.querySelector("video")).toBeNull();
  });
});
