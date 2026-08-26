/**
 * Engajamento de mídia — o painel que responde "qual foto ou vídeo desperta
 * mais interesse?".
 *
 * Lê a tabela `media_likes` e cruza com o registro de mídia
 * (src/domain/media-registry.ts) para ter miniatura, título, filhote e link
 * público de cada id. O registro é derivado do catálogo estático, então o
 * painel nunca mostra uma mídia que a loja não publica mais.
 *
 * Banco fora do ar NÃO é zero curtida: `resumoDeEngajamento` devolve `null`
 * quando não consegue apurar, e aqui isso vira um aviso explícito em vez de
 * três zeros com cara de verdade.
 */

import { Heart, Image as ImageIcon, Video } from "lucide-react";
import type { Metadata } from "next";

import { staticPuppies } from "@/content/puppies-static";
import { midiaRegistrada } from "@/domain/media-registry";
import { resumoDeEngajamento, type MidiaMaisCurtida } from "@/lib/media-likes/repo";


export const metadata: Metadata = {
  title: "Engajamento de mídia | Admin",
  robots: { index: false, follow: false },
};

export const revalidate = 0;

const TOPO = 10;

type Filtro = "todos" | "fotos" | "videos";

function lerFiltro(valor: string | string[] | undefined): Filtro {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  return bruto === "fotos" || bruto === "videos" ? bruto : "todos";
}

/** Nome do filhote a partir do slug guardado em `context_id`. */
const NOME_DO_FILHOTE = new Map(staticPuppies.map((p) => [p.slug, p.name]));

function rotuloDoContexto(linha: MidiaMaisCurtida): string {
  const registro = midiaRegistrada(linha.mediaId);
  const contextId = linha.contextId ?? registro?.contextId ?? null;
  if (!contextId) return "—";
  return NOME_DO_FILHOTE.get(contextId) ?? contextId;
}

function ehVideo(linha: MidiaMaisCurtida): boolean {
  if (linha.mediaType) return linha.mediaType === "video";
  return midiaRegistrada(linha.mediaId)?.mediaType === "video";
}

function AbaDeFiltro({ atual, valor, texto }: { atual: Filtro; valor: Filtro; texto: string }) {
  const ativo = atual === valor;
  return (
    <a
      href={valor === "todos" ? "/admin/media-engagement" : `/admin/media-engagement?tipo=${valor}`}
      aria-current={ativo ? "page" : undefined}
      className={`inline-flex min-h-[40px] items-center rounded-full border px-4 text-sm font-semibold transition ${
        ativo
          ? "border-transparent bg-[var(--brand)] text-white"
          : "border-[var(--border)] bg-white text-[var(--text-muted)] hover:text-[var(--text)]"
      }`}
    >
      {texto}
    </a>
  );
}

export default async function MediaEngagementPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const filtro = lerFiltro(searchParams?.tipo);
  const contextoPedido = (() => {
    const bruto = searchParams?.contexto;
    const valor = Array.isArray(bruto) ? bruto[0] : bruto;
    return valor?.trim() || null;
  })();

  const resumo = await resumoDeEngajamento();

  if (!resumo) {
    return (
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Engajamento de mídia</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Curtidas nas fotos dos filhotes e nos vídeos da galeria.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">Contagem indisponível no momento.</p>
          <p className="mt-2">
            O painel não conseguiu ler a tabela <code className="font-mono">media_likes</code>. Isso
            acontece quando a migração ainda não foi aplicada no banco ou quando a chave de serviço
            do Supabase não está configurada neste ambiente.
          </p>
          <p className="mt-2">
            Nenhum número é exibido aqui enquanto não houver leitura real — zero inventado seria pior
            do que não mostrar nada.
          </p>
        </div>
      </div>
    );
  }

  const porTipo = resumo.ranking.filter((linha) => {
    if (filtro === "fotos") return !ehVideo(linha);
    if (filtro === "videos") return ehVideo(linha);
    return true;
  });

  // Contextos que realmente têm curtida — a lista sai dos dados, não de uma
  // enumeração escrita à mão que envelhece junto com o catálogo.
  const contextos = [...new Set(porTipo.map(rotuloDoContexto).filter((c) => c !== "—"))].sort();

  const linhas = (contextoPedido
    ? porTipo.filter((linha) => rotuloDoContexto(linha) === contextoPedido)
    : porTipo
  ).slice(0, TOPO);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Engajamento de mídia</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Curtidas nas fotos dos filhotes e nos vídeos da galeria. Cada visitante conta uma vez por
          mídia. Curtida é sinal de interesse — não é avaliação e não vira nota em lugar nenhum.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Heart className="h-3.5 w-3.5" aria-hidden />
            Curtidas no total
          </p>
          <p className="mt-1 text-3xl font-bold text-[var(--text)]">{resumo.total}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <ImageIcon className="h-3.5 w-3.5" aria-hidden />
            Em fotos
          </p>
          <p className="mt-1 text-3xl font-bold text-[var(--text)]">{resumo.fotos}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Video className="h-3.5 w-3.5" aria-hidden />
            Em vídeos
          </p>
          <p className="mt-1 text-3xl font-bold text-[var(--text)]">{resumo.videos}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <AbaDeFiltro atual={filtro} valor="todos" texto="Todos" />
        <AbaDeFiltro atual={filtro} valor="fotos" texto="Fotos" />
        <AbaDeFiltro atual={filtro} valor="videos" texto="Vídeos" />
      </div>

      {contextos.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Filhote</span>
          <a
            href={filtro === "todos" ? "/admin/media-engagement" : `/admin/media-engagement?tipo=${filtro}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              contextoPedido
                ? "border-[var(--border)] bg-white text-[var(--text-muted)] hover:text-[var(--text)]"
                : "border-transparent bg-zinc-800 text-white"
            }`}
          >
            Todos
          </a>
          {contextos.map((contexto) => {
            const params = new URLSearchParams();
            if (filtro !== "todos") params.set("tipo", filtro);
            params.set("contexto", contexto);
            const ativo = contextoPedido === contexto;
            return (
              <a
                key={contexto}
                href={`/admin/media-engagement?${params.toString()}`}
                aria-current={ativo ? "page" : undefined}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  ativo
                    ? "border-transparent bg-zinc-800 text-white"
                    : "border-[var(--border)] bg-white text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {contexto}
              </a>
            );
          })}
        </div>
      )}

      {/* Ranking */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">
          Top {TOPO} — mídias mais curtidas
        </h2>

        {linhas.length === 0 ? (
          <p className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--text-muted)]">
            Nenhuma curtida registrada com esse filtro ainda.
          </p>
        ) : (
          <div className="overflow-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <caption className="sr-only">Mídias mais curtidas</caption>
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">Mídia</th>
                  <th scope="col" className="px-4 py-3 text-left">Tipo</th>
                  <th scope="col" className="px-4 py-3 text-left">Filhote / contexto</th>
                  <th scope="col" className="px-4 py-3 text-right">Curtidas</th>
                  <th scope="col" className="px-4 py-3 text-left">Página</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-white">
                {linhas.map((linha) => {
                  const registro = midiaRegistrada(linha.mediaId);
                  const video = ehVideo(linha);
                  const capa = video ? registro?.poster : registro?.src;
                  return (
                    <tr key={linha.mediaId}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {capa ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={capa}
                              alt=""
                              loading="lazy"
                              className="h-14 w-11 flex-none rounded-lg object-cover ring-1 ring-[var(--border)]"
                            />
                          ) : (
                            <span
                              className="flex h-14 w-11 flex-none items-center justify-center rounded-lg bg-zinc-100 text-zinc-400"
                              aria-hidden
                            >
                              <ImageIcon className="h-4 w-4" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[var(--text)]">
                              {registro?.titulo ?? linha.mediaId}
                            </p>
                            <p className="truncate font-mono text-[11px] text-[var(--text-muted)]">
                              {linha.mediaId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {video ? "Vídeo" : "Foto"}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{rotuloDoContexto(linha)}</td>
                      <td className="px-4 py-3 text-right text-base font-bold text-[var(--text)]">
                        {linha.total}
                      </td>
                      <td className="px-4 py-3">
                        {registro ? (
                          <a
                            href={registro.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--brand)] underline underline-offset-2"
                          >
                            {registro.url}
                          </a>
                        ) : (
                          <span className="text-[var(--text-muted)]">
                            fora do catálogo atual
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
