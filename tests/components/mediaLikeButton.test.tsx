import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MediaLikeButton } from "@/components/media/MediaLikeButton";
import type { Curtidas, EstadoDeCurtida } from "@/hooks/useMediaLikes";

// Componentes compilados com o runtime classico procuram React no escopo global.
(globalThis as unknown as { React?: typeof React }).React = React;

/**
 * O coração vive sempre em cima de outra coisa clicável — o card que abre a
 * galeria, o slide que avança o Reel. Metade destes testes existe por causa
 * disso: tocar no coração precisa curtir e mais nada.
 *
 * A outra metade guarda a regra que não se negocia: número que ninguém apurou
 * não vira zero na tela.
 */

const ALVO = { mediaId: "gallery:spitz-branco", mediaType: "video" as const };

function curtidas(over: Partial<Curtidas> = {}, estado?: EstadoDeCurtida): Curtidas {
  return {
    estados: estado ? { [ALVO.mediaId]: estado } : {},
    carregando: false,
    indisponivel: false,
    alternar: vi.fn(),
    ...over,
  };
}

afterEach(cleanup);

describe("MediaLikeButton", () => {
  it("descreve a mídia no rótulo — leitor de tela não ouve dez 'curtir'", () => {
    render(
      <MediaLikeButton curtidas={curtidas({}, { count: 12, liked: false })} alvo={ALVO} rotulo="o vídeo Spitz Branco" />
    );

    const botao = screen.getByRole("button", { name: "Curtir o vídeo Spitz Branco" });
    expect(botao).toHaveAttribute("aria-pressed", "false");
    expect(botao).toHaveTextContent("12");
  });

  it("vira estado pressionado quando curtido, e o rótulo passa a oferecer o inverso", () => {
    render(
      <MediaLikeButton curtidas={curtidas({}, { count: 13, liked: true })} alvo={ALVO} rotulo="o vídeo Spitz Branco" />
    );

    const botao = screen.getByRole("button", { name: "Remover curtida de o vídeo Spitz Branco" });
    expect(botao).toHaveAttribute("aria-pressed", "true");
    expect(botao).toHaveTextContent("13");
  });

  it("não abre a galeria nem avança o Reel: o clique morre no coração", () => {
    const cliqueDoCard = vi.fn();
    const mouseDownDoCard = vi.fn();
    const alternar = vi.fn();

    render(
      // O card real é um <button>; aqui um <div> com o mesmo papel, porque
      // <button> dentro de <button> é HTML inválido e o React reclama.
      <div onClick={cliqueDoCard} onMouseDown={mouseDownDoCard} data-testid="card">
        <MediaLikeButton curtidas={curtidas({ alternar }, { count: 1, liked: false })} alvo={ALVO} rotulo="a foto" />
      </div>
    );

    fireEvent.mouseDown(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));

    expect(alternar).toHaveBeenCalledTimes(1);
    expect(alternar).toHaveBeenCalledWith(ALVO);
    expect(cliqueDoCard).not.toHaveBeenCalled();
    expect(mouseDownDoCard).not.toHaveBeenCalled();
  });

  it("some quando a contagem está indisponível, em vez de mostrar zero", () => {
    const { container } = render(
      <MediaLikeButton curtidas={curtidas({ indisponivel: true })} alvo={ALVO} rotulo="a foto" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("enquanto o número não chega, mostra o coração sem número — não '0'", () => {
    render(<MediaLikeButton curtidas={curtidas({ carregando: true })} alvo={ALVO} rotulo="a foto" />);

    const botao = screen.getByRole("button");
    expect(botao).toBeInTheDocument();
    expect(botao.textContent?.trim()).toBe("");
    expect(botao.textContent).not.toContain("0");
  });

  it("reserva a largura do contador — o número chegar não empurra o layout", () => {
    render(<MediaLikeButton curtidas={curtidas({ carregando: true })} alvo={ALVO} rotulo="a foto" />);

    const vaga = screen.getByRole("button").querySelector("span");
    expect(vaga?.className).toContain("min-w-");
    expect(vaga?.className).toContain("tabular-nums");
  });

  it("tem alvo de toque de 44x44, o mínimo das WCAG", () => {
    render(<MediaLikeButton curtidas={curtidas({}, { count: 3, liked: false })} alvo={ALVO} rotulo="a foto" />);

    const classe = screen.getByRole("button").className;
    expect(classe).toContain("min-h-[44px]");
    expect(classe).toContain("min-w-[44px]");
  });

  it("não é link nem CTA de WhatsApp — curtir jamais vira conversão de anúncio", () => {
    render(<MediaLikeButton curtidas={curtidas({}, { count: 3, liked: false })} alvo={ALVO} rotulo="a foto" />);

    const botao = screen.getByRole("button");
    expect(botao.tagName).toBe("BUTTON");
    expect(botao).toHaveAttribute("type", "button");
    expect(botao).not.toHaveAttribute("href");
    expect(botao).not.toHaveAttribute("data-wa-cta");
  });
});
