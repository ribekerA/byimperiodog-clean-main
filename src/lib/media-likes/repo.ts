import type { MediaContextoTipo, MediaTipo } from "@/domain/media-registry";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabaseAdmin";


/**
 * Acesso à tabela `media_likes`.
 *
 * Uma regra atravessa este arquivo inteiro: **banco indisponível não é zero
 * curtida**. `supabaseAdmin()` devolve um stub que responde `{ data: [] }`
 * quando falta credencial — sem a checagem explícita de `hasServiceRoleKey()`,
 * a tela mostraria "0" com a mesma confiança com que mostra um zero real. Por
 * isso todo retorno daqui é ou um número apurado, ou `null` dizendo "não sei".
 * Quem consome decide entre esconder o coração e mostrar indisponível — nunca
 * inventar.
 */

export type ContagemDeMidia = { mediaId: string; count: number; liked: boolean };

type LinhaContagem = { media_id: string; total: number | string };

function cliente() {
  if (!hasServiceRoleKey()) return null;
  const db = supabaseAdmin() as unknown as {
    rpc?: (nome: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
    from: (tabela: string) => any;
  };
  return typeof db.rpc === "function" ? db : null;
}

/**
 * Contagem + estado do visitante para uma lista de ids, em duas idas ao banco
 * no total — independente de quantas mídias a página tenha. É o que §31 pede
 * ao proibir N+1.
 */
export async function contarCurtidas(
  mediaIds: string[],
  visitorHash: string | null,
): Promise<ContagemDeMidia[] | null> {
  const ids = [...new Set(mediaIds)];
  if (ids.length === 0) return [];

  const db = cliente();
  if (!db || !db.rpc) return null;

  try {
    const { data, error } = await db.rpc("media_likes_contagem", { ids });
    if (error) return null;

    const totais = new Map<string, number>();
    for (const linha of (data as LinhaContagem[] | null) ?? []) {
      totais.set(linha.media_id, Number(linha.total) || 0);
    }

    const meus = new Set<string>();
    if (visitorHash) {
      const { data: minhas, error: erroMinhas } = await db
        .from("media_likes")
        .select("media_id")
        .eq("visitor_hash", visitorHash)
        .in("media_id", ids);
      // Falha aqui não invalida a contagem: o número continua certo, só o
      // coração fica apagado até a próxima leitura.
      if (!erroMinhas) {
        for (const linha of (minhas as { media_id: string }[] | null) ?? []) {
          meus.add(linha.media_id);
        }
      }
    }

    return ids.map((mediaId) => ({
      mediaId,
      count: totais.get(mediaId) ?? 0,
      liked: meus.has(mediaId),
    }));
  } catch {
    return null;
  }
}

export type ResultadoDoToggle =
  | { ok: true; liked: boolean; count: number }
  | { ok: false };

/**
 * Curtir vira insert; descurtir vira delete. O índice único
 * `(media_id, visitor_hash)` é quem garante que dois cliques simultâneos não
 * viram duas linhas — o insert que perder a corrida volta como conflito e o
 * estado final é lido do banco, não deduzido daqui.
 */
export async function alternarCurtida(entrada: {
  mediaId: string;
  mediaType: MediaTipo;
  contextType?: MediaContextoTipo | null;
  contextId?: string | null;
  visitorHash: string;
}): Promise<ResultadoDoToggle> {
  const db = cliente();
  if (!db) return { ok: false };

  try {
    const { data: existente, error: erroBusca } = await db
      .from("media_likes")
      .select("id")
      .eq("media_id", entrada.mediaId)
      .eq("visitor_hash", entrada.visitorHash)
      .maybeSingle();
    if (erroBusca) return { ok: false };

    let liked: boolean;
    if (existente) {
      const { error } = await db
        .from("media_likes")
        .delete()
        .eq("media_id", entrada.mediaId)
        .eq("visitor_hash", entrada.visitorHash);
      if (error) return { ok: false };
      liked = false;
    } else {
      const { error } = await db.from("media_likes").insert({
        media_id: entrada.mediaId,
        media_type: entrada.mediaType,
        context_type: entrada.contextType ?? null,
        context_id: entrada.contextId ?? null,
        visitor_hash: entrada.visitorHash,
      });
      if (error) {
        // 23505 = violação do índice único: alguém já inseriu no mesmo
        // instante. O clique não se perdeu — o estado final é "curtido".
        const codigo = (error as { code?: string }).code;
        if (codigo !== "23505") return { ok: false };
      }
      liked = true;
    }

    const contagem = await contarCurtidas([entrada.mediaId], entrada.visitorHash);
    const atual = contagem?.[0];
    if (!atual) return { ok: false };
    return { ok: true, liked, count: atual.count };
  } catch {
    return { ok: false };
  }
}

export type MidiaMaisCurtida = {
  mediaId: string;
  total: number;
  mediaType: MediaTipo | null;
  contextType: string | null;
  contextId: string | null;
};

/** Painel do admin: totais e ranking. Uma varredura, agregada em memória. */
export async function resumoDeEngajamento(): Promise<
  { total: number; fotos: number; videos: number; ranking: MidiaMaisCurtida[] } | null
> {
  const db = cliente();
  if (!db) return null;

  try {
    const { data, error } = await db
      .from("media_likes")
      .select("media_id, media_type, context_type, context_id")
      .limit(20000);
    if (error) return null;

    const linhas = (data as {
      media_id: string;
      media_type: MediaTipo;
      context_type: string | null;
      context_id: string | null;
    }[] | null) ?? [];

    const porMidia = new Map<string, MidiaMaisCurtida>();
    let fotos = 0;
    let videos = 0;

    for (const linha of linhas) {
      if (linha.media_type === "video") videos += 1;
      else fotos += 1;

      const atual = porMidia.get(linha.media_id);
      if (atual) atual.total += 1;
      else
        porMidia.set(linha.media_id, {
          mediaId: linha.media_id,
          total: 1,
          mediaType: linha.media_type ?? null,
          contextType: linha.context_type,
          contextId: linha.context_id,
        });
    }

    const ranking = [...porMidia.values()].sort((a, b) => b.total - a.total);
    return { total: linhas.length, fotos, videos, ranking };
  } catch {
    return null;
  }
}
