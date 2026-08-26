"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MediaContextoTipo, MediaTipo } from "@/domain/media-registry";
import { trackMediaLike } from "@/lib/events";


/**
 * Estado das curtidas de uma lista de mídias.
 *
 * Uma chamada por página, não uma por foto: o componente que já conhece todos
 * os ids da tela passa a lista inteira e recebe tudo de uma vez. É o que evita
 * o N+1 na página do filhote e na /galeria.
 *
 * A contagem chega DEPOIS do conteúdo principal, de propósito — nenhuma foto
 * espera o número para aparecer. Como o espaço do contador já está reservado no
 * botão, o número surgir não empurra nada (nada de CLS).
 *
 * Falha na API não vira zero. Vira `indisponivel`, e o botão some. Um "0"
 * mostrado por engano é um número inventado como qualquer outro.
 */

export type EstadoDeCurtida = { count: number; liked: boolean };

export type AlvoDeCurtida = {
  mediaId: string;
  mediaType: MediaTipo;
  contextType?: MediaContextoTipo;
  contextId?: string;
};

export type Curtidas = {
  estados: Record<string, EstadoDeCurtida>;
  carregando: boolean;
  indisponivel: boolean;
  alternar: (alvo: AlvoDeCurtida) => void;
};

type Resposta = { items?: { mediaId: string; count: number; liked: boolean }[] };

export function useMediaLikes(mediaIds: string[]): Curtidas {
  // A lista costuma ser recriada a cada render pelo componente pai. Sem a
  // chave estável o efeito refaria a busca em todo render.
  const chave = useMemo(() => [...new Set(mediaIds)].filter(Boolean).sort().join(","), [mediaIds]);

  const [estados, setEstados] = useState<Record<string, EstadoDeCurtida>>({});
  const [carregando, setCarregando] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);
  // Um clique por mídia por vez: o segundo clique antes da resposta do
  // primeiro é ignorado em vez de virar duas escritas cruzadas.
  const emVoo = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!chave) {
      setCarregando(false);
      return;
    }
    const controlador = new AbortController();
    let vivo = true;

    (async () => {
      try {
        const resp = await fetch(`/api/media-likes?ids=${encodeURIComponent(chave)}`, {
          signal: controlador.signal,
        });
        if (!resp.ok) throw new Error(String(resp.status));
        const json = (await resp.json()) as Resposta;
        if (!vivo) return;
        const mapa: Record<string, EstadoDeCurtida> = {};
        for (const item of json.items ?? []) {
          mapa[item.mediaId] = { count: item.count, liked: item.liked };
        }
        setEstados(mapa);
        setIndisponivel(false);
      } catch (erro) {
        if (!vivo || (erro as Error)?.name === "AbortError") return;
        setIndisponivel(true);
      } finally {
        if (vivo) setCarregando(false);
      }
    })();

    return () => {
      vivo = false;
      controlador.abort();
    };
  }, [chave]);

  const alternar = useCallback((alvo: AlvoDeCurtida) => {
    if (emVoo.current.has(alvo.mediaId)) return;
    emVoo.current.add(alvo.mediaId);

    let anterior: EstadoDeCurtida | undefined;
    setEstados((atual) => {
      anterior = atual[alvo.mediaId];
      const base = anterior ?? { count: 0, liked: false };
      const curtido = !base.liked;
      return {
        ...atual,
        [alvo.mediaId]: {
          liked: curtido,
          count: Math.max(0, base.count + (curtido ? 1 : -1)),
        },
      };
    });

    (async () => {
      try {
        const resp = await fetch("/api/media-likes/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaId: alvo.mediaId,
            mediaType: alvo.mediaType,
            contextType: alvo.contextType ?? null,
            contextId: alvo.contextId ?? null,
          }),
        });
        if (!resp.ok) throw new Error(String(resp.status));
        const json = (await resp.json()) as { liked: boolean; count: number };
        // O número do servidor manda. O otimismo serviu para a resposta ser
        // imediata; a verdade é a que o banco devolveu.
        setEstados((atual) => ({
          ...atual,
          [alvo.mediaId]: { liked: json.liked, count: json.count },
        }));
        trackMediaLike({
          mediaId: alvo.mediaId,
          mediaType: alvo.mediaType,
          contextType: alvo.contextType,
          contextId: alvo.contextId,
          curtiu: json.liked,
        });
      } catch {
        // Desfaz. Deixar o coração aceso depois de a escrita falhar seria
        // mostrar uma curtida que não existe no banco.
        setEstados((atual) => {
          const copia = { ...atual };
          if (anterior) copia[alvo.mediaId] = anterior;
          else delete copia[alvo.mediaId];
          return copia;
        });
      } finally {
        emVoo.current.delete(alvo.mediaId);
      }
    })();
  }, []);

  return { estados, carregando, indisponivel, alternar };
}
