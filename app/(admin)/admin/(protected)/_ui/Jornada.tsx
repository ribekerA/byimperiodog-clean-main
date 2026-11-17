// Jornada de configuracao: checklist com progresso.
//
// O progresso so conta o que a tela consegue comprovar. Cada etapa recebe
// `feito` calculado do estado real (API, banco, variavel de ambiente) -- nada
// de ponto, medalha ou numero inventado. Uma barra a 100% que mente e pior do
// que nenhuma barra: a pessoa para de configurar achando que terminou.

import { Check, Lock, Sparkles, Trophy } from "lucide-react";
import type { ReactNode } from "react";

export type EtapaJornada = {
  id: string;
  titulo: string;
  descricao: string;
  feito: boolean;
  /** Texto curto do que esta faltando antes desta etapa poder ser feita. */
  bloqueadoPor?: string;
  /** Botao ou link mostrado na etapa atual. */
  acao?: ReactNode;
  /** Detalhe mostrado quando a etapa ja esta feita (ex.: "conta 316-551-9817"). */
  resultado?: ReactNode;
};

type EstadoEtapa = "feito" | "atual" | "bloqueado" | "pendente";

function nivel(pct: number): { rotulo: string; classe: string } {
  if (pct >= 100) return { rotulo: "Tudo pronto", classe: "bg-emerald-100 text-emerald-800" };
  if (pct >= 60) return { rotulo: "Quase la", classe: "bg-[var(--brand-tint-100)] text-[var(--brand)]" };
  if (pct > 0) return { rotulo: "Em andamento", classe: "bg-amber-100 text-amber-900" };
  return { rotulo: "Comecando", classe: "bg-slate-100 text-slate-700" };
}

function Anel({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const preenchido = (Math.max(0, Math.min(100, pct)) / 100) * c;
  return (
    <div className="relative h-16 w-16 flex-shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--brand-tint-100)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={pct >= 100 ? "var(--success, #15803d)" : "var(--brand)"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${preenchido} ${c}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums text-[var(--text)]">
        {pct}%
      </span>
    </div>
  );
}

export function Jornada({
  titulo = "Jornada de configuracao",
  subtitulo,
  etapas,
  carregando = false,
  mensagemFinal = "Tudo configurado. O progresso volta a cair sozinho se alguma etapa deixar de valer.",
  idTitulo = "jornada-titulo",
  naoVerificado,
}: {
  /**
   * Motivo de a tela nao ter conseguido ler o estado (rota caiu, sessao
   * expirou). Com ele, nenhuma etapa aparece como pendente ou concluida:
   * "nao consegui conferir" e diferente de "falta configurar", e mostrar o
   * segundo no lugar do primeiro manda a pessoa mexer no que ja esta certo.
   */
  naoVerificado?: string | null;
  /** Id do titulo; precisa ser outro quando duas jornadas dividem a pagina. */
  idTitulo?: string;
  titulo?: string;
  subtitulo?: string;
  etapas: EtapaJornada[];
  carregando?: boolean;
  mensagemFinal?: string;
}) {
  const total = etapas.length;
  const feitas = etapas.filter((e) => e.feito).length;
  const pct = total === 0 ? 0 : Math.round((feitas / total) * 100);
  const semLeitura = !carregando && Boolean(naoVerificado);
  const nv = semLeitura ? { rotulo: "Sem verificacao", classe: "bg-slate-100 text-slate-700" } : nivel(pct);
  const indiceAtual = etapas.findIndex((e) => !e.feito && !e.bloqueadoPor);

  const estados: EstadoEtapa[] = etapas.map((e, i) => {
    if (e.feito) return "feito";
    if (e.bloqueadoPor) return "bloqueado";
    return i === indiceAtual ? "atual" : "pendente";
  });

  return (
    <section
      className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-sm"
      aria-labelledby={idTitulo}
      aria-busy={carregando || undefined}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--brand-tint-50)] to-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {semLeitura ? (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-[6px] border-slate-200 text-lg font-bold text-slate-500">
              ?
            </div>
          ) : (
            <Anel pct={carregando ? 0 : pct} />
          )}
          <div>
            <h2 id={idTitulo}className="text-lg font-semibold text-[var(--text)]">
              {titulo}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {carregando
                ? "Conferindo o estado atual..."
                : semLeitura
                  ? "Nao consegui conferir o estado agora"
                  : subtitulo ?? `${feitas} de ${total} etapas concluidas`}
            </p>
          </div>
        </div>
        {!carregando ? (
          <span className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-semibold sm:self-center ${nv.classe}`}>
            {semLeitura ? null : pct >= 100 ? <Trophy className="h-3.5 w-3.5" aria-hidden /> : <Sparkles className="h-3.5 w-3.5" aria-hidden />}
            {nv.rotulo}
          </span>
        ) : null}
      </div>

      <div
        className="flex gap-1 px-5 pt-4"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={carregando || semLeitura ? 0 : feitas}
        aria-label={semLeitura ? "Progresso nao verificado" : `${feitas} de ${total} etapas concluidas`}
      >
        {etapas.map((e) => (
          <span
            key={e.id}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
              !carregando && !semLeitura && e.feito ? "bg-[var(--brand)]" : "bg-[var(--brand-tint-100)]"
            }`}
          />
        ))}
      </div>

      <ol className="space-y-2 p-5">
        {etapas.map((e, i) => {
          // Sem leitura, toda etapa fica neutra: sem "proximo passo", sem
          // cadeado e sem botao, porque nada disso foi comprovado.
          const estado = carregando || semLeitura ? "pendente" : estados[i];
          return (
            <li
              key={e.id}
              className={`flex gap-3 rounded-2xl border p-3 transition-colors ${
                estado === "atual"
                  ? "border-[var(--accent)] bg-amber-50/60 shadow-sm"
                  : estado === "feito"
                    ? "border-transparent bg-[var(--surface-2)]/50"
                    : "border-transparent"
              }`}
              aria-current={estado === "atual" ? "step" : undefined}
            >
              <span
                className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  estado === "feito"
                    ? "bg-[var(--brand)] text-white"
                    : estado === "atual"
                      ? "bg-[var(--accent)] text-[var(--text)] ring-4 ring-amber-100"
                      : "border border-[var(--border)] bg-white text-[var(--text-muted)]"
                }`}
                aria-hidden
              >
                {estado === "feito" ? (
                  <Check className="h-4 w-4" />
                ) : estado === "bloqueado" ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  i + 1
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`text-sm font-semibold ${
                      estado === "feito" ? "text-[var(--text-muted)]" : "text-[var(--text)]"
                    }`}
                  >
                    {e.titulo}
                  </p>
                  {estado === "atual" ? (
                    <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text)]">
                      Proximo passo
                    </span>
                  ) : null}
                  {estado === "feito" ? (
                    <span className="text-xs font-medium text-[var(--brand)]">concluida</span>
                  ) : null}
                  <span className="sr-only">
                    {semLeitura
                      ? "(nao verificada)"
                      : estado === "feito"
                        ? "(concluida)"
                        : estado === "bloqueado"
                          ? "(bloqueada)"
                          : "(pendente)"}
                  </span>
                </div>
                {estado === "feito" && e.resultado ? (
                  <div className="mt-0.5 text-xs text-[var(--text-muted)]">{e.resultado}</div>
                ) : (
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">{e.descricao}</p>
                )}
                {estado === "bloqueado" && e.bloqueadoPor ? (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Antes: {e.bloqueadoPor}</p>
                ) : null}
                {estado === "atual" && e.acao ? <div className="mt-3 flex flex-wrap gap-2">{e.acao}</div> : null}
              </div>
            </li>
          );
        })}
      </ol>

      {semLeitura ? (
        <p className="border-t border-[var(--border)] bg-amber-50 px-5 py-3 text-sm text-amber-900" role="status">
          {naoVerificado} Isso nao quer dizer que falta configurar: as etapas acima ficam sem marcacao ate a
          verificacao responder.
        </p>
      ) : null}

      {!carregando && !semLeitura && pct >= 100 ? (
        <p className="border-t border-[var(--border)] bg-emerald-50 px-5 py-3 text-sm text-emerald-900">{mensagemFinal}</p>
      ) : null}
    </section>
  );
}
