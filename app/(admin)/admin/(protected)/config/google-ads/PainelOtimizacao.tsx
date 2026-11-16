"use client";

// Termos de busca e recomendacoes: a parte da tela que corta gasto.
//
// O relatorio de termos de busca e o unico lugar que mostra o que a pessoa
// digitou no Google antes de gastar o dinheiro. Um canil com palavra-chave
// "lulu da pomerania" paga por "lulu da pomerania para doacao" e por "lulu da
// pomerania gratis" enquanto ninguem bloquear. Aqui o termo que custou e nao
// converteu vira palavra negativa num clique.
//
// As recomendacoes do Google vem separadas em duas listas de proposito. Boa
// parte delas aumenta gasto -- ativar rede de parceiros, ativar display,
// subir orcamento -- e aplicar "todas" num clique desfaz a configuracao com
// que a campanha foi criada. As que aumentam gasto exigem confirmacao.

import { useCallback, useEffect, useState } from "react";

import { Aviso, Botao, Cartao, PERIODOS_TELA, entradaClasse, lerErro, numero, reais } from "./ui";

type Termo = {
  termo: string;
  palavraChave: string | null;
  campanhaNome: string | null;
  grupoNome: string | null;
  impressoes: number;
  cliques: number;
  custo: number;
  conversoes: number;
  desperdicio: boolean;
};

type Recomendacao = {
  resourceName: string;
  tipo: string;
  titulo: string;
  campanhaNome: string | null;
  grupoNome: string | null;
  aumentaGasto: boolean;
  impactoCliques: number | null;
  impactoCusto: number | null;
  impactoConversoes: number | null;
};

type CampanhaSimples = { id: string; nome: string; resourceName: string };

export function PainelOtimizacao() {
  const [campanhas, setCampanhas] = useState<CampanhaSimples[]>([]);
  const [campanhaId, setCampanhaId] = useState("");
  const [periodo, setPeriodo] = useState<string>("LAST_30_DAYS");
  const [termos, setTermos] = useState<Termo[]>([]);
  const [resumoTermos, setResumoTermos] = useState<{
    termos: number;
    termosSemConversao: number;
    custoSemConversao: number;
  } | null>(null);
  const [marcados, setMarcados] = useState<string[]>([]);
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [emAcao, setEmAcao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmacao, setConfirmacao] = useState<{ recomendacao: Recomendacao; texto: string } | null>(null);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      try {
        const r = await fetch("/api/admin/google-ads/campanhas?periodo=LAST_7_DAYS", { cache: "no-store" });
        if (!r.ok || !vivo) return;
        const d = await r.json();
        if (vivo && Array.isArray(d.campanhas)) {
          setCampanhas(
            d.campanhas.map((c: CampanhaSimples) => ({
              id: c.id,
              nome: c.nome,
              resourceName: c.resourceName,
            })),
          );
        }
      } catch {
        // A lista de campanhas aqui e so para filtrar e para escolher onde a
        // negativa entra. Falhar nela nao impede ver os termos da conta toda.
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    setMarcados([]);
    const filtroCampanha = campanhaId ? `&campanhaId=${encodeURIComponent(campanhaId)}` : "";
    try {
      const [rTermos, rRec] = await Promise.all([
        fetch(`/api/admin/google-ads/termos?periodo=${encodeURIComponent(periodo)}${filtroCampanha}`, {
          cache: "no-store",
        }),
        fetch("/api/admin/google-ads/recomendacoes", { cache: "no-store" }),
      ]);

      if (rTermos.ok) {
        const d = await rTermos.json();
        setTermos(Array.isArray(d.termos) ? d.termos : []);
        setResumoTermos(d.resumo ?? null);
      } else {
        const { mensagem } = await lerErro(rTermos);
        setErro(mensagem);
        setTermos([]);
        setResumoTermos(null);
      }

      if (rRec.ok) {
        const d = await rRec.json();
        setRecomendacoes(Array.isArray(d.recomendacoes) ? d.recomendacoes : []);
      } else {
        setRecomendacoes([]);
      }
    } catch {
      setErro("Nao foi possivel carregar os dados de otimizacao.");
    } finally {
      setCarregando(false);
    }
  }, [periodo, campanhaId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const campanhaEscolhida = campanhas.find((c) => c.id === campanhaId) ?? null;

  async function adicionarNegativas() {
    if (!campanhaEscolhida) {
      setErro("Escolha a campanha que vai receber as palavras negativas.");
      return;
    }
    if (marcados.length === 0) return;
    setEmAcao(true);
    setErro(null);
    setAviso(null);
    try {
      const r = await fetch("/api/admin/google-ads/palavras-chave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campanhaResourceName: campanhaEscolhida.resourceName,
          negativas: marcados,
        }),
      });
      if (!r.ok) {
        const { mensagem } = await lerErro(r);
        setErro(mensagem);
        return;
      }
      setAviso(
        `${marcados.length} palavra(s) negativa(s) adicionada(s) em "${campanhaEscolhida.nome}". Elas param de custar a partir de agora -- o gasto que ja aconteceu continua no relatorio.`,
      );
      setMarcados([]);
      await carregar();
    } catch {
      setErro("Nao foi possivel adicionar as negativas.");
    } finally {
      setEmAcao(false);
    }
  }

  async function agirNaRecomendacao(
    rec: Recomendacao,
    acao: "aplicar" | "descartar",
    confirmado?: boolean,
  ) {
    setEmAcao(true);
    setErro(null);
    setAviso(null);
    try {
      const r = await fetch("/api/admin/google-ads/recomendacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceName: rec.resourceName,
          acao,
          ...(confirmado ? { confirmarAumentoDeGasto: true } : {}),
        }),
      });
      if (r.status === 409) {
        const corpo = await r.json().catch(() => ({}) as Record<string, unknown>);
        setConfirmacao({
          recomendacao: rec,
          texto:
            typeof corpo.aviso === "string"
              ? corpo.aviso
              : "Esta recomendacao aumenta o gasto da conta. Confirme para aplicar.",
        });
        return;
      }
      if (!r.ok) {
        const { mensagem } = await lerErro(r);
        setErro(mensagem);
        return;
      }
      setConfirmacao(null);
      setAviso(acao === "aplicar" ? `Aplicado: ${rec.titulo}.` : `Descartado: ${rec.titulo}.`);
      await carregar();
    } catch {
      setErro("Nao foi possivel falar com o Google Ads.");
    } finally {
      setEmAcao(false);
    }
  }

  const semRisco = recomendacoes.filter((r) => !r.aumentaGasto);
  const comRisco = recomendacoes.filter((r) => r.aumentaGasto);

  return (
    <div className="space-y-5">
      {erro ? <Aviso tom="erro">{erro}</Aviso> : null}
      {aviso ? <Aviso tom="ok">{aviso}</Aviso> : null}

      <Cartao
        titulo="Termos de busca"
        descricao="O que foi digitado no Google antes do clique. O que custou e nao converteu aparece marcado."
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <select className={entradaClasse} value={campanhaId} onChange={(e) => setCampanhaId(e.target.value)}>
              <option value="">Todas as campanhas</option>
              {campanhas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <select className={entradaClasse} value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              {PERIODOS_TELA.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.label}
                </option>
              ))}
            </select>
            <Botao tipo="secundario" onClick={() => void carregar()} disabled={carregando}>
              {carregando ? "..." : "Atualizar"}
            </Botao>
          </div>
        }
      >
        <div className="space-y-4">
          {resumoTermos ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Termos no periodo</p>
                <p className="text-xl font-semibold text-[var(--text)]">{numero(resumoTermos.termos)}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Termos sem conversao</p>
                <p className="text-xl font-semibold text-[var(--text)]">
                  {numero(resumoTermos.termosSemConversao)}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3">
                <p className="text-xs text-amber-900">Gasto sem conversao</p>
                <p className="text-xl font-semibold text-amber-900">{reais(resumoTermos.custoSemConversao)}</p>
              </div>
            </div>
          ) : null}

          {marcados.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <span className="text-sm text-[var(--text)]">
                {marcados.length} termo(s) marcado(s) para bloquear
                {campanhaEscolhida ? ` em "${campanhaEscolhida.nome}"` : ""}.
              </span>
              <Botao onClick={() => void adicionarNegativas()} disabled={emAcao || !campanhaEscolhida}>
                {emAcao ? "Adicionando..." : "Adicionar como negativas"}
              </Botao>
              <Botao tipo="secundario" onClick={() => setMarcados([])}>
                Limpar
              </Botao>
              {!campanhaEscolhida ? (
                <span className="text-sm text-amber-800">
                  Escolha a campanha acima: a palavra negativa entra numa campanha, nao na conta.
                </span>
              ) : null}
            </div>
          ) : null}

          {termos.length === 0 && !carregando ? (
            <Aviso tom="info">
              Sem termo de busca no periodo. Isso e normal enquanto nenhuma campanha teve impressao.
            </Aviso>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                    <th className="w-10 py-2" scope="col">
                      <span className="sr-only">Bloquear</span>
                    </th>
                    <th className="py-2" scope="col">Termo</th>
                    <th className="py-2" scope="col">Campanha</th>
                    <th className="py-2 text-right" scope="col">Cliques</th>
                    <th className="py-2 text-right" scope="col">Custo</th>
                    <th className="py-2 text-right" scope="col">Conversoes</th>
                  </tr>
                </thead>
                <tbody>
                  {termos.map((t) => (
                    <tr
                      key={`${t.termo}-${t.campanhaNome ?? ""}-${t.grupoNome ?? ""}`}
                      className={`border-b border-[var(--border)] ${t.desperdicio ? "bg-amber-50/60" : ""}`}
                    >
                      <td className="py-2">
                        <input
                          type="checkbox"
                          aria-label={`Bloquear "${t.termo}"`}
                          checked={marcados.includes(t.termo)}
                          onChange={(e) =>
                            setMarcados((atual) =>
                              e.target.checked
                                ? [...new Set([...atual, t.termo])]
                                : atual.filter((m) => m !== t.termo),
                            )
                          }
                        />
                      </td>
                      <td className="py-2">
                        <span className="font-medium text-[var(--text)]">{t.termo}</span>
                        {t.palavraChave ? (
                          <span className="block text-xs text-[var(--text-muted)]">
                            entrou por: {t.palavraChave}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 text-xs text-[var(--text-muted)]">{t.campanhaNome ?? "-"}</td>
                      <td className="py-2 text-right">{numero(t.cliques)}</td>
                      <td className={`py-2 text-right ${t.desperdicio ? "font-semibold text-amber-900" : ""}`}>
                        {reais(t.custo)}
                      </td>
                      <td className="py-2 text-right">{numero(t.conversoes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Cartao>

      <Cartao
        titulo="Recomendacoes do Google"
        descricao="Separadas entre o que nao mexe no gasto e o que aumenta o gasto da conta."
      >
        <div className="space-y-4">
          {confirmacao ? (
            <Aviso tom="alerta" titulo="Esta recomendacao aumenta o gasto">
              <p>{confirmacao.texto}</p>
              <p className="mt-1 font-medium">{confirmacao.recomendacao.titulo}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Botao
                  tipo="perigo"
                  onClick={() => void agirNaRecomendacao(confirmacao.recomendacao, "aplicar", true)}
                  disabled={emAcao}
                >
                  Entendi, aplicar
                </Botao>
                <Botao tipo="secundario" onClick={() => setConfirmacao(null)}>
                  Cancelar
                </Botao>
              </div>
            </Aviso>
          ) : null}

          {recomendacoes.length === 0 && !carregando ? (
            <Aviso tom="info">
              Nenhuma recomendacao agora. O Google gera recomendacao com base em historico; conta nova fica
              sem nenhuma por alguns dias.
            </Aviso>
          ) : null}

          {semRisco.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Sem efeito no gasto</h3>
              <ul className="space-y-2">
                {semRisco.map((r) => (
                  <li
                    key={r.resourceName}
                    className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text)]">{r.titulo}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {r.campanhaNome ?? "conta"}
                        {r.grupoNome ? ` / ${r.grupoNome}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 gap-2">
                      <Botao onClick={() => void agirNaRecomendacao(r, "aplicar")} disabled={emAcao}>
                        Aplicar
                      </Botao>
                      <Botao tipo="secundario" onClick={() => void agirNaRecomendacao(r, "descartar")} disabled={emAcao}>
                        Descartar
                      </Botao>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {comRisco.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-amber-900">Aumentam o gasto</h3>
              <ul className="space-y-2">
                {comRisco.map((r) => (
                  <li
                    key={r.resourceName}
                    className="flex flex-col gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-amber-900">{r.titulo}</p>
                      <p className="text-xs text-amber-800">
                        {r.campanhaNome ?? "conta"}
                        {r.grupoNome ? ` / ${r.grupoNome}` : ""}
                        {typeof r.impactoCusto === "number" && r.impactoCusto !== 0
                          ? ` -- o Google estima ${reais(r.impactoCusto)} de custo a mais`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 gap-2">
                      <Botao tipo="perigo" onClick={() => void agirNaRecomendacao(r, "aplicar")} disabled={emAcao}>
                        Aplicar
                      </Botao>
                      <Botao tipo="secundario" onClick={() => void agirNaRecomendacao(r, "descartar")} disabled={emAcao}>
                        Descartar
                      </Botao>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </Cartao>
    </div>
  );
}
