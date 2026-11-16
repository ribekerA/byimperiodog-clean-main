"use client";

// Lista de campanhas com metricas, pausar/reativar e troca de orcamento.
//
// Campanha pausada e campanha recem-criada aparecem aqui com metrica zerada, e
// nao somem: a lista vem de uma consulta sem filtro de data (ver
// src/lib/google-ads/campaigns.ts). Era justamente o caso em que a tela mais
// precisa ser consultada.

import { useCallback, useEffect, useState } from "react";

import { Aviso, Botao, Cartao, PERIODOS_TELA, Selo, entradaClasse, lerErro, numero, porcentagem, reais } from "./ui";

type Metricas = {
  impressoes: number;
  cliques: number;
  custo: number;
  conversoes: number;
  ctr: number;
  cpcMedio: number;
  custoPorConversao: number;
};

type Campanha = {
  id: string;
  resourceName: string;
  nome: string;
  status: string;
  canal: string;
  estrategiaDeLance: string;
  orcamentoResourceName: string | null;
  orcamentoDiario: number;
  metricas: Metricas;
};

const CANAL_TELA: Record<string, string> = {
  SEARCH: "Pesquisa",
  DISPLAY: "Display",
  SHOPPING: "Shopping",
  VIDEO: "Video",
  PERFORMANCE_MAX: "Performance Max",
  LOCAL: "Local",
  DEMAND_GEN: "Demand Gen",
};

export function PainelCampanhas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [periodo, setPeriodo] = useState<string>("LAST_30_DAYS");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [emAcao, setEmAcao] = useState<string | null>(null);
  const [editandoOrcamento, setEditandoOrcamento] = useState<string | null>(null);
  const [novoOrcamento, setNovoOrcamento] = useState("");
  // Ativar e trocar orcamento so vao adiante depois do sim: a rota responde 409
  // com o aviso e a tela repete o pedido com a confirmacao.
  const [confirmacao, setConfirmacao] = useState<{
    campanha: Campanha;
    acao: "ativar" | "orcamento";
    texto: string;
  } | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const r = await fetch(`/api/admin/google-ads/campanhas?periodo=${encodeURIComponent(periodo)}`, {
        cache: "no-store",
      });
      if (!r.ok) {
        const { mensagem } = await lerErro(r);
        setErro(mensagem);
        setCampanhas([]);
        return;
      }
      const d = await r.json();
      setCampanhas(Array.isArray(d.campanhas) ? d.campanhas : []);
    } catch {
      setErro("Nao foi possivel carregar as campanhas.");
    } finally {
      setCarregando(false);
    }
  }, [periodo]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function trocarStatus(c: Campanha, status: "ENABLED" | "PAUSED", confirmado?: boolean) {
    setEmAcao(c.id);
    setErro(null);
    setAviso(null);
    try {
      const r = await fetch("/api/admin/google-ads/campanhas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campanhaResourceName: c.resourceName,
          status,
          ...(confirmado ? { confirmarAtivacao: true } : {}),
        }),
      });
      if (r.status === 409) {
        const corpo = await r.json().catch(() => ({}) as Record<string, unknown>);
        setConfirmacao({
          campanha: c,
          acao: "ativar",
          texto:
            typeof corpo.aviso === "string"
              ? corpo.aviso
              : "Ativar poe a campanha no ar e ela comeca a gastar. Confirme para ativar.",
        });
        return;
      }
      setConfirmacao(null);
      if (!r.ok) {
        const { mensagem } = await lerErro(r);
        setErro(mensagem);
        return;
      }
      setAviso(`"${c.nome}" agora esta ${status === "ENABLED" ? "ativa" : "pausada"}.`);
      await carregar();
    } catch {
      setErro("Nao foi possivel alterar a campanha.");
    } finally {
      setEmAcao(null);
    }
  }

  async function salvarOrcamento(c: Campanha, confirmado?: boolean) {
    const valor = Number(novoOrcamento.replace(",", "."));
    if (!(valor > 0)) {
      setErro("Informe um orcamento diario maior que zero.");
      return;
    }
    if (!c.orcamentoResourceName) {
      setErro("Esta campanha nao expoe o orcamento pela API.");
      return;
    }
    setEmAcao(c.id);
    setErro(null);
    setAviso(null);
    try {
      const r = await fetch("/api/admin/google-ads/campanhas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orcamentoResourceName: c.orcamentoResourceName,
          orcamentoDiario: valor,
          ...(confirmado ? { confirmarOrcamento: true } : {}),
        }),
      });
      if (r.status === 409) {
        const corpo = await r.json().catch(() => ({}) as Record<string, unknown>);
        setConfirmacao({
          campanha: c,
          acao: "orcamento",
          texto:
            typeof corpo.aviso === "string"
              ? corpo.aviso
              : "Trocar o orcamento muda o gasto diario. Confirme para aplicar.",
        });
        return;
      }
      setConfirmacao(null);
      if (!r.ok) {
        const { mensagem } = await lerErro(r);
        setErro(mensagem);
        return;
      }
      const d = await r.json();
      const afetadas: string[] = Array.isArray(d.campanhasAfetadas) ? d.campanhasAfetadas : [];
      setAviso(
        afetadas.length > 1
          ? `Orcamento alterado para ${reais(valor)} por dia. Atencao: este orcamento e compartilhado e mudou para ${afetadas.length} campanhas (${afetadas.join(", ")}).`
          : `Orcamento de "${c.nome}" alterado para ${reais(valor)} por dia.`,
      );
      setEditandoOrcamento(null);
      setNovoOrcamento("");
      await carregar();
    } catch {
      setErro("Nao foi possivel alterar o orcamento.");
    } finally {
      setEmAcao(null);
    }
  }

  const totalCusto = campanhas.reduce((s, c) => s + c.metricas.custo, 0);
  const totalConversoes = campanhas.reduce((s, c) => s + c.metricas.conversoes, 0);

  return (
    <Cartao
      titulo="Campanhas"
      descricao="Desempenho no periodo escolhido. Campanha pausada tambem aparece, com metrica zerada."
      acao={
        <div className="flex items-center gap-2">
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
        {erro ? <Aviso tom="erro">{erro}</Aviso> : null}
        {aviso ? <Aviso tom="ok">{aviso}</Aviso> : null}

        {campanhas.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs text-[var(--text-muted)]">Gasto no periodo</p>
              <p className="text-xl font-semibold text-[var(--text)]">{reais(totalCusto)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs text-[var(--text-muted)]">Conversoes</p>
              <p className="text-xl font-semibold text-[var(--text)]">{numero(totalConversoes)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs text-[var(--text-muted)]">Custo por conversao</p>
              <p className="text-xl font-semibold text-[var(--text)]">
                {totalConversoes > 0 ? reais(totalCusto / totalConversoes) : "-"}
              </p>
            </div>
          </div>
        ) : null}

        {!carregando && campanhas.length === 0 && !erro ? (
          <Aviso tom="info">Esta conta ainda nao tem campanha. Crie a primeira na aba &quot;Nova campanha&quot;.</Aviso>
        ) : null}

        <div className="space-y-3">
          {campanhas.map((c) => (
            <article key={c.id} className="rounded-2xl border border-[var(--border)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold text-[var(--text)]">{c.nome}</h3>
                    <Selo status={c.status} />
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {CANAL_TELA[c.canal] ?? c.canal}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Orcamento {reais(c.orcamentoDiario)}/dia
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  {c.status === "ENABLED" ? (
                    <Botao tipo="secundario" onClick={() => void trocarStatus(c, "PAUSED")} disabled={emAcao === c.id}>
                      Pausar
                    </Botao>
                  ) : c.status === "PAUSED" ? (
                    <Botao onClick={() => void trocarStatus(c, "ENABLED")} disabled={emAcao === c.id}>
                      Ativar
                    </Botao>
                  ) : null}
                  {c.orcamentoResourceName ? (
                    <Botao
                      tipo="secundario"
                      onClick={() => {
                        setEditandoOrcamento(editandoOrcamento === c.id ? null : c.id);
                        setNovoOrcamento(String(c.orcamentoDiario || ""));
                      }}
                      disabled={emAcao === c.id}
                    >
                      Orcamento
                    </Botao>
                  ) : null}
                </div>
              </div>

              {editandoOrcamento === c.id ? (
                <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-[var(--surface)] p-3">
                  <label className="space-y-1">
                    <span className="block text-xs font-medium text-[var(--text)]">Orcamento diario (R$)</span>
                    <input
                      className={entradaClasse}
                      inputMode="decimal"
                      value={novoOrcamento}
                      onChange={(e) => {
                        // Valor mudou: a confirmacao pedida valia para o anterior.
                        setNovoOrcamento(e.target.value);
                        setConfirmacao(null);
                      }}
                    />
                  </label>
                  <Botao onClick={() => void salvarOrcamento(c)} disabled={emAcao === c.id}>
                    Salvar
                  </Botao>
                  <Botao tipo="secundario" onClick={() => setEditandoOrcamento(null)}>
                    Cancelar
                  </Botao>
                </div>
              ) : null}

              {confirmacao?.campanha.id === c.id ? (
                <div className="mt-3">
                  <Aviso
                    tom="alerta"
                    titulo={confirmacao.acao === "ativar" ? "Ativar esta campanha?" : "Trocar o orcamento?"}
                  >
                    <p>{confirmacao.texto}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Botao
                        tipo="perigo"
                        onClick={() =>
                          void (confirmacao.acao === "ativar"
                            ? trocarStatus(c, "ENABLED", true)
                            : salvarOrcamento(c, true))
                        }
                        disabled={emAcao === c.id}
                      >
                        {confirmacao.acao === "ativar" ? "Sim, ativar" : "Sim, aplicar"}
                      </Botao>
                      <Botao tipo="secundario" onClick={() => setConfirmacao(null)}>
                        Cancelar
                      </Botao>
                    </div>
                  </Aviso>
                </div>
              ) : null}

              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-6">
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Impressoes</dt>
                  <dd className="font-medium text-[var(--text)]">{numero(c.metricas.impressoes)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Cliques</dt>
                  <dd className="font-medium text-[var(--text)]">{numero(c.metricas.cliques)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">CTR</dt>
                  <dd className="font-medium text-[var(--text)]">{porcentagem(c.metricas.ctr)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Custo</dt>
                  <dd className="font-medium text-[var(--text)]">{reais(c.metricas.custo)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Conversoes</dt>
                  <dd className="font-medium text-[var(--text)]">{numero(c.metricas.conversoes)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Custo/conversao</dt>
                  <dd className="font-medium text-[var(--text)]">
                    {c.metricas.conversoes > 0 ? reais(c.metricas.custoPorConversao) : "-"}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </Cartao>
  );
}
