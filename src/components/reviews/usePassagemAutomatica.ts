"use client";

import { type DependencyList, useEffect, useRef, useState } from "react";

/**
 * Passagem automática de avaliações, com o que a torna aceitável de ler.
 *
 * Para com o mouse em cima, com foco de teclado, fora da tela, em aba oculta e a
 * pedido de quem lê, e já começa parada para quem pediu menos movimento. Só o
 * mouse pausa ao passar por cima: no toque, o "enter" fica preso depois do toque
 * e a passagem pararia de vez. Pelo mesmo motivo, só o foco visível conta.
 *
 * `reinicio` recomeça a contagem: quem passou uma à mão ganha o tempo inteiro
 * para ler a próxima.
 */
export function usePassagemAutomatica<T extends HTMLElement>(aoPassar: () => void, tempoMs: number, reinicio: DependencyList = []) {
  const raiz = useRef<T>(null);
  const [parado, setParado] = useState(false);
  const [emUso, setEmUso] = useState(false);
  const [naTela, setNaTela] = useState(false);
  const passar = useRef(aoPassar);

  useEffect(() => {
    passar.current = aoPassar;
  });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setParado(true);
    const el = raiz.current;
    if (!el) return;

    const entra = (e: PointerEvent) => { if (e.pointerType === "mouse") setEmUso(true); };
    const sai = (e: PointerEvent) => { if (e.pointerType === "mouse") setEmUso(false); };
    const foco = (e: FocusEvent) => { if ((e.target as Element).matches(":focus-visible")) setEmUso(true); };
    const semFoco = () => setEmUso(false);
    el.addEventListener("pointerenter", entra);
    el.addEventListener("pointerleave", sai);
    el.addEventListener("focusin", foco);
    el.addEventListener("focusout", semFoco);

    const observador = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([e]) => setNaTela(e.isIntersecting), { threshold: 0.2 });
    observador?.observe(el);

    return () => {
      el.removeEventListener("pointerenter", entra);
      el.removeEventListener("pointerleave", sai);
      el.removeEventListener("focusin", foco);
      el.removeEventListener("focusout", semFoco);
      observador?.disconnect();
    };
  }, []);

  const rodando = !parado && !emUso && naTela;

  useEffect(() => {
    if (!rodando) return;
    const relogio = window.setInterval(() => {
      if (document.visibilityState === "visible") passar.current();
    }, tempoMs);
    return () => window.clearInterval(relogio);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `reinicio` é a lista de dependências que quem chama escolhe
  }, [rodando, tempoMs, ...reinicio]);

  return { raiz, rodando, parado, alternaParado: () => setParado((p) => !p) };
}
