"use client";

import { Heart } from "lucide-react";

import type { AlvoDeCurtida, Curtidas } from "@/hooks/useMediaLikes";

/**
 * Coração de curtida sobre uma foto ou vídeo.
 *
 * Regras que o botão precisa respeitar por estar sempre em cima de outra coisa
 * clicável (o card que abre a galeria, o slide que avança o Reel):
 *
 *  • `stopPropagation` no clique — tocar no coração curte, e só. Não abre o
 *    lightbox, não abre o player, não passa o vídeo.
 *  • Alvo de 44x44 no mínimo, que é o mínimo de toque das WCAG.
 *  • `aria-pressed` diz se está curtido; o `aria-label` descreve a mídia, para
 *    quem usa leitor de tela não ouvir dez botões chamados "curtir".
 *  • Largura do contador reservada (`tabular-nums` + `min-w`), então o número
 *    chegar depois não empurra nada — sem CLS.
 *  • Não é <a>, não tem href de WhatsApp e não carrega `data-wa-cta`: o
 *    ouvinte de clique do WhatsApp não o enxerga, e curtir nunca vira
 *    conversão de anúncio.
 *
 * Quando a API não responde, o botão não aparece. Mostrar "0" seria afirmar
 * uma contagem que ninguém apurou.
 */

type Props = {
  curtidas: Curtidas;
  alvo: AlvoDeCurtida;
  /** Descrição curta da mídia — entra no rótulo acessível. */
  rotulo: string;
  className?: string;
};

export function MediaLikeButton({ curtidas, alvo, rotulo, className = "" }: Props) {
  if (curtidas.indisponivel) return null;

  const estado = curtidas.estados[alvo.mediaId];
  const curtido = estado?.liked ?? false;
  const total = estado?.count;

  return (
    <button
      type="button"
      aria-pressed={curtido}
      aria-label={curtido ? `Remover curtida de ${rotulo}` : `Curtir ${rotulo}`}
      onClick={(evento) => {
        evento.preventDefault();
        evento.stopPropagation();
        curtidas.alternar(alvo);
      }}
      // O mousedown do card também abre coisa em alguns lugares; segurar os
      // dois eventos evita que o toque no coração dispare a ação de baixo.
      onMouseDown={(evento) => evento.stopPropagation()}
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full bg-black/45 px-3 text-white backdrop-blur-sm transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${className}`}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${curtido ? "fill-rose-500 text-rose-500" : "text-white"}`}
        aria-hidden
      />
      {/* `min-w` guarda o lugar do número antes de ele existir. */}
      <span className="min-w-[1.5ch] text-sm font-semibold tabular-nums" aria-hidden>
        {total === undefined ? "" : total}
      </span>
    </button>
  );
}

export default MediaLikeButton;
