"use client";

// Criacao de campanha de pesquisa: orcamento, segmentacao, grupo, anuncio e
// palavras-chave de uma vez.
//
// Tres coisas desta tela sao deliberadas:
//
// - O contador de caracteres fica VISIVEL em cada titulo e descricao. O Google
//   recusa o anuncio inteiro por um titulo de 31 caracteres, e descobrir isso
//   no erro da API e descobrir tarde.
// - O botao "Conferir no Google" manda a criacao com validateOnly: o Google
//   valida orcamento minimo, politica de conteudo e limites, e nao grava nada.
// - A campanha nasce pausada. Campanha de pesquisa gasta a partir do minuto em
//   que entra no ar.

import { useState } from "react";

import { Aviso, Botao, Campo, Cartao, ListaDeProblemas, entradaClasse, lerErro } from "./ui";

const LIMITE_TITULO = 30;
const LIMITE_DESCRICAO = 90;

type LocalSugerido = { id: string; nome: string; tipo: string; alcance: number };

function Contador({ texto, limite }: { texto: string; limite: number }) {
  const excedeu = texto.length > limite;
  return (
    <span className={`text-xs ${excedeu ? "font-semibold text-red-700" : "text-[var(--text-muted)]"}`}>
      {texto.length}/{limite}
    </span>
  );
}

export function PainelNovaCampanha({ onCriou }: { onCriou?: () => void }) {
  const [nome, setNome] = useState("");
  const [orcamento, setOrcamento] = useState("30");
  const [estrategia, setEstrategia] = useState("MAXIMIZE_CLICKS");
  const [lanceCpc, setLanceCpc] = useState("2");
  const [titulos, setTitulos] = useState(["", "", ""]);
  const [descricoes, setDescricoes] = useState(["", ""]);
  const [urlFinal, setUrlFinal] = useState("");
  const [palavras, setPalavras] = useState("");
  const [correspondencia, setCorrespondencia] = useState("PHRASE");
  const [negativas, setNegativas] = useState("");
  const [buscaLocal, setBuscaLocal] = useState("");
  const [locais, setLocais] = useState<LocalSugerido[]>([]);
  const [escolhidos, setEscolhidos] = useState<LocalSugerido[]>([]);
  const [buscandoLocal, setBuscandoLocal] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [problemas, setProblemas] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);

  function trocarTitulo(i: number, valor: string) {
    setTitulos((atual) => atual.map((t, idx) => (idx === i ? valor : t)));
  }
  function trocarDescricao(i: number, valor: string) {
    setDescricoes((atual) => atual.map((d, idx) => (idx === i ? valor : d)));
  }

  async function buscarLocais() {
    if (!buscaLocal.trim()) return;
    setBuscandoLocal(true);
    setErro(null);
    try {
      const r = await fetch(`/api/admin/google-ads/locais?q=${encodeURIComponent(buscaLocal)}`, {
        cache: "no-store",
      });
      if (!r.ok) {
        const { mensagem } = await lerErro(r);
        setErro(mensagem);
        return;
      }
      const d = await r.json();
      setLocais(Array.isArray(d.locais) ? d.locais.slice(0, 12) : []);
    } catch {
      setErro("Nao foi possivel buscar os locais.");
    } finally {
      setBuscandoLocal(false);
    }
  }

  function montarCorpo(somenteValidar: boolean) {
    const listaPalavras = palavras
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((texto) => ({ texto, correspondencia }));
    const listaNegativas = negativas
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);

    return {
      nome: nome.trim(),
      orcamentoDiario: Number(orcamento.replace(",", ".")) || 0,
      estrategia,
      lanceCpc: estrategia === "MANUAL_CPC" ? Number(lanceCpc.replace(",", ".")) || 0 : null,
      locais: escolhidos.map((l) => l.id),
      anuncio: {
        titulos: titulos.map((t) => t.trim()).filter(Boolean),
        descricoes: descricoes.map((d) => d.trim()).filter(Boolean),
        urlFinal: urlFinal.trim(),
      },
      palavrasChave: listaPalavras,
      negativas: listaNegativas,
      somenteValidar,
    };
  }

  async function enviar(somenteValidar: boolean) {
    setEnviando(true);
    setProblemas([]);
    setErro(null);
    setResultado(null);
    try {
      const r = await fetch("/api/admin/google-ads/campanhas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(montarCorpo(somenteValidar)),
      });
      if (!r.ok) {
        const lido = await lerErro(r);
        setProblemas(lido.problemas);
        if (lido.problemas.length === 0) setErro(lido.mensagem);
        return;
      }
      const d = await r.json();
      setResultado(d.aviso ?? "Pronto.");
      if (!somenteValidar) onCriou?.();
    } catch {
      setErro("Nao foi possivel enviar a campanha.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Cartao
      titulo="Nova campanha de pesquisa"
      descricao="Cria orcamento, campanha, segmentacao, grupo, anuncio e palavras-chave numa unica operacao."
    >
      <div className="space-y-5">
        {erro ? <Aviso tom="erro">{erro}</Aviso> : null}
        <ListaDeProblemas problemas={problemas} />
        {resultado ? <Aviso tom="ok">{resultado}</Aviso> : null}

        <Aviso tom="info" titulo="Como ela nasce">
          Pausada, so na rede de pesquisa do Google (sem parceiros e sem display) e segmentada para os locais
          escolhidos abaixo. Rede de parceiros e display ficam desligadas de proposito: elas espalham o
          orcamento por inventario que nao e busca no Google.
        </Aviso>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nome da campanha">
            <input className={entradaClasse} value={nome} onChange={(e) => setNome(e.target.value)} />
          </Campo>
          <Campo label="Orcamento diario (R$)" ajuda="O gasto real do mes pode variar ate 2x o diario em um dia.">
            <input
              className={entradaClasse}
              inputMode="decimal"
              value={orcamento}
              onChange={(e) => setOrcamento(e.target.value)}
            />
          </Campo>
          <Campo
            label="Estrategia de lance"
            ajuda="Sem conversao registrada na conta, Maximizar cliques entrega mais que Maximizar conversoes."
          >
            <select className={entradaClasse} value={estrategia} onChange={(e) => setEstrategia(e.target.value)}>
              <option value="MAXIMIZE_CLICKS">Maximizar cliques</option>
              <option value="MAXIMIZE_CONVERSIONS">Maximizar conversoes</option>
              <option value="MANUAL_CPC">CPC manual</option>
            </select>
          </Campo>
          {estrategia === "MANUAL_CPC" ? (
            <Campo label="Lance maximo por clique (R$)">
              <input
                className={entradaClasse}
                inputMode="decimal"
                value={lanceCpc}
                onChange={(e) => setLanceCpc(e.target.value)}
              />
            </Campo>
          ) : null}
        </div>

        <fieldset className="space-y-3 rounded-2xl border border-[var(--border)] p-4">
          <legend className="px-1 text-sm font-semibold text-[var(--text)]">Onde anunciar</legend>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1 space-y-1">
              <span className="block text-sm font-medium text-[var(--text)]">Cidade ou regiao</span>
              <input
                className={entradaClasse}
                placeholder="Braganca Paulista, Jundiai, Atibaia"
                value={buscaLocal}
                onChange={(e) => setBuscaLocal(e.target.value)}
              />
            </label>
            <Botao tipo="secundario" onClick={() => void buscarLocais()} disabled={buscandoLocal}>
              {buscandoLocal ? "Buscando..." : "Buscar"}
            </Botao>
          </div>
          {locais.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {locais.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setEscolhidos((atual) => (atual.some((e) => e.id === l.id) ? atual : [...atual, l]))
                    }
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--surface)]"
                  >
                    + {l.nome} <span className="text-[var(--text-muted)]">({l.tipo.toLowerCase()})</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {escolhidos.map((l) => (
              <span
                key={l.id}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-tint-100)] px-3 py-1 text-xs text-[var(--brand)]"
              >
                {l.nome}
                <button
                  type="button"
                  aria-label={`Remover ${l.nome}`}
                  onClick={() => setEscolhidos((atual) => atual.filter((e) => e.id !== l.id))}
                  className="font-bold"
                >
                  x
                </button>
              </span>
            ))}
          </div>
          {escolhidos.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">
              Sem escolha, a campanha segmenta o Brasil inteiro.
            </p>
          ) : null}
        </fieldset>

        <fieldset className="space-y-3 rounded-2xl border border-[var(--border)] p-4">
          <legend className="px-1 text-sm font-semibold text-[var(--text)]">Anuncio</legend>

          <Campo label="URL final" ajuda="A pagina que o clique abre.">
            <input
              className={entradaClasse}
              placeholder="https://byimperiodog.com.br/filhotes"
              value={urlFinal}
              onChange={(e) => setUrlFinal(e.target.value)}
            />
          </Campo>

          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--text)]">Titulos (minimo 3, ate 30 caracteres cada)</p>
            {titulos.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={entradaClasse}
                  value={t}
                  maxLength={60}
                  onChange={(e) => trocarTitulo(i, e.target.value)}
                  aria-label={`Titulo ${i + 1}`}
                />
                <Contador texto={t} limite={LIMITE_TITULO} />
                {titulos.length > 3 ? (
                  <button
                    type="button"
                    aria-label={`Remover titulo ${i + 1}`}
                    className="text-sm text-red-700"
                    onClick={() => setTitulos((a) => a.filter((_, idx) => idx !== i))}
                  >
                    remover
                  </button>
                ) : null}
              </div>
            ))}
            {titulos.length < 15 ? (
              <Botao tipo="secundario" onClick={() => setTitulos((a) => [...a, ""])}>
                Adicionar titulo
              </Botao>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--text)]">Descricoes (minimo 2, ate 90 caracteres cada)</p>
            {descricoes.map((d, i) => (
              <div key={i} className="flex items-start gap-2">
                <textarea
                  className={entradaClasse}
                  rows={2}
                  maxLength={180}
                  value={d}
                  onChange={(e) => trocarDescricao(i, e.target.value)}
                  aria-label={`Descricao ${i + 1}`}
                />
                <Contador texto={d} limite={LIMITE_DESCRICAO} />
                {descricoes.length > 2 ? (
                  <button
                    type="button"
                    aria-label={`Remover descricao ${i + 1}`}
                    className="text-sm text-red-700"
                    onClick={() => setDescricoes((a) => a.filter((_, idx) => idx !== i))}
                  >
                    remover
                  </button>
                ) : null}
              </div>
            ))}
            {descricoes.length < 4 ? (
              <Botao tipo="secundario" onClick={() => setDescricoes((a) => [...a, ""])}>
                Adicionar descricao
              </Botao>
            ) : null}
          </div>
        </fieldset>

        <fieldset className="space-y-3 rounded-2xl border border-[var(--border)] p-4">
          <legend className="px-1 text-sm font-semibold text-[var(--text)]">Palavras-chave</legend>
          <Campo
            label="Uma por linha"
            ajuda="Correspondencia de frase e o padrao. Ampla gasta com busca sem relacao nenhuma."
          >
            <textarea
              className={entradaClasse}
              rows={5}
              value={palavras}
              onChange={(e) => setPalavras(e.target.value)}
              placeholder={"lulu da pomerania filhote\nspitz alemao anao preco"}
            />
          </Campo>
          <Campo label="Tipo de correspondencia">
            <select
              className={entradaClasse}
              value={correspondencia}
              onChange={(e) => setCorrespondencia(e.target.value)}
            >
              <option value="PHRASE">Frase</option>
              <option value="EXACT">Exata</option>
              <option value="BROAD">Ampla</option>
            </select>
          </Campo>
          <Campo
            label="Palavras negativas (uma por linha)"
            ajuda="O que nao deve custar clique: gratis, barato, resgate, abrigo."
          >
            <textarea
              className={entradaClasse}
              rows={4}
              value={negativas}
              onChange={(e) => setNegativas(e.target.value)}
              placeholder={"gratis\ndoacao\nadotar\nresgate"}
            />
          </Campo>
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <Botao tipo="secundario" onClick={() => void enviar(true)} disabled={enviando}>
            {enviando ? "..." : "Conferir no Google"}
          </Botao>
          <Botao onClick={() => void enviar(false)} disabled={enviando}>
            {enviando ? "Criando..." : "Criar campanha pausada"}
          </Botao>
        </div>
      </div>
    </Cartao>
  );
}
