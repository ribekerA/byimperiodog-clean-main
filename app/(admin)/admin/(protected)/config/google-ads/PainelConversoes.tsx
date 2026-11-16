"use client";

// Escolha das duas acoes de conversao e gravacao do AW- com os labels.
//
// E a tela que justifica a integracao inteira. O label de conversao nao existe
// como texto copiavel no painel do Google Ads: vem embutido no snippet de
// evento. Transcrever a mao erra, e o erro e invisivel -- a tag carrega, nenhum
// aviso aparece, e nenhuma conversao chega ao Ads. Aqui os dois labels sao
// lidos da propria conta e gravados em pixels_settings.

import { useCallback, useEffect, useState } from "react";

import { Aviso, Botao, Campo, Cartao, ListaDeProblemas, entradaClasse, lerErro } from "./ui";

type Acao = {
  id: string;
  nome: string;
  status: string;
  tipo: string;
  categoria: string;
  idConversao: string | null;
  label: string | null;
  sendTo: string | null;
};

export type Gravado = { googleAdsId: string | null; lead: string | null; whatsapp: string | null };

export function PainelConversoes({
  onMudou,
  onGravadoLido,
}: {
  onMudou?: () => void;
  /** Avisa a pagina o que esta gravado, para a jornada de configuracao. */
  onGravadoLido?: (gravado: { production: Gravado; staging: Gravado } | null) => void;
}) {
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [gravado, setGravado] = useState<{ production: Gravado; staging: Gravado } | null>(null);
  const [ambiente, setAmbiente] = useState<"production" | "staging">("production");
  const [lead, setLead] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [problemas, setProblemas] = useState<string[]>([]);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const r = await fetch("/api/admin/google-ads/conversoes", { cache: "no-store" });
      if (!r.ok) {
        const { mensagem } = await lerErro(r);
        setErro(mensagem);
        setAcoes([]);
        return;
      }
      const d = await r.json();
      setAcoes(Array.isArray(d.acoes) ? d.acoes : []);
      setGravado(d.gravado ?? null);
      onGravadoLido?.(d.gravado ?? null);
    } catch {
      setErro("Nao foi possivel falar com a API do Google Ads.");
    } finally {
      setCarregando(false);
    }
  }, [onGravadoLido]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const utilizaveis = acoes.filter((a) => a.label);
  const semLabel = acoes.filter((a) => !a.label);
  const atual = gravado?.[ambiente] ?? null;

  async function salvar() {
    setSalvando(true);
    setErro(null);
    setProblemas([]);
    setSucesso(null);
    try {
      const r = await fetch("/api/admin/google-ads/conversoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ambiente, acaoLead: lead, acaoWhatsApp: whatsapp }),
      });
      if (!r.ok) {
        const lido = await lerErro(r);
        setErro(lido.problemas.length > 0 ? null : lido.mensagem);
        setProblemas(lido.problemas);
        return;
      }
      const d = await r.json();
      setSucesso(
        `Gravado em ${ambiente === "production" ? "producao" : "staging"}: ${d.googleAdsId} com os labels de "${d.lead.nome}" e "${d.whatsapp.nome}".`,
      );
      await carregar();
      onMudou?.();
    } catch {
      setErro("Nao foi possivel gravar a configuracao.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Cartao
      titulo="Conversoes do site"
      descricao="O ID AW- e os dois labels sao lidos da conta e gravados na configuracao de pixels. Nada e digitado a mao."
      acao={
        <Botao tipo="secundario" onClick={() => void carregar()} disabled={carregando}>
          {carregando ? "Carregando..." : "Recarregar"}
        </Botao>
      }
    >
      <div className="space-y-4">
        {erro ? <Aviso tom="erro">{erro}</Aviso> : null}
        <ListaDeProblemas problemas={problemas} />
        {sucesso ? <Aviso tom="ok">{sucesso}</Aviso> : null}

        {atual ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
            <p className="font-semibold text-[var(--text)]">
              Gravado hoje em {ambiente === "production" ? "producao" : "staging"}
            </p>
            <dl className="mt-2 grid gap-2 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-[var(--text-muted)]">ID de conversao</dt>
                <dd className="font-mono text-[var(--text)]">{atual.googleAdsId ?? "nao configurado"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--text-muted)]">Label do lead</dt>
                <dd className="font-mono text-[var(--text)]">{atual.lead ? "configurado" : "nao configurado"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--text-muted)]">Label do WhatsApp</dt>
                <dd className="font-mono text-[var(--text)]">
                  {atual.whatsapp ? "configurado" : "nao configurado"}
                </dd>
              </div>
            </dl>
            {/* O valor do label nao e mostrado: e a chave que identifica a
                conversao, e esta tela e aberta em reuniao e compartilhada em
                tela cheia. Saber que esta configurado basta. */}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <Campo label="Ambiente" ajuda="Somente producao afeta o site publico.">
            <select
              className={entradaClasse}
              value={ambiente}
              onChange={(e) => setAmbiente(e.target.value === "staging" ? "staging" : "production")}
            >
              <option value="production">Producao</option>
              <option value="staging">Staging</option>
            </select>
          </Campo>

          <Campo label="Conversao de lead" ajuda="Disparada quando o formulario e enviado.">
            <select className={entradaClasse} value={lead} onChange={(e) => setLead(e.target.value)}>
              <option value="">Escolha uma acao</option>
              {utilizaveis.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </Campo>

          <Campo label="Conversao de WhatsApp" ajuda="Disparada no clique do botao de WhatsApp.">
            <select className={entradaClasse} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}>
              <option value="">Escolha uma acao</option>
              {utilizaveis.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <Aviso tom="alerta" titulo="As duas acoes precisam ser diferentes">
          Lead e WhatsApp sao conversoes distintas, com labels distintos. Reaproveitar o mesmo label faz o
          Google Ads contar &quot;mandou mensagem&quot; e &quot;preencheu formulario&quot; como a mesma coisa, e o
          lance passa a otimizar para a media das duas.
        </Aviso>

        <div className="flex items-center gap-3">
          <Botao onClick={() => void salvar()} disabled={salvando || !lead || !whatsapp}>
            {salvando ? "Gravando..." : "Gravar na configuracao do site"}
          </Botao>
          {lead && whatsapp && lead === whatsapp ? (
            <span className="text-sm text-red-700">Escolha duas acoes diferentes.</span>
          ) : null}
        </div>

        {semLabel.length > 0 ? (
          <Aviso tom="info" titulo={`${semLabel.length} acao(oes) sem label`}>
            <p>
              Estas acoes existem na conta mas nao tem label de conversao -- em geral sao importadas do GA4 ou
              configuradas sem snippet de evento. O site nao conseguiria dispara-las pelo gtag, por isso elas
              nao aparecem nas listas acima:
            </p>
            <ul className="mt-2 list-disc space-y-0.5 pl-5">
              {semLabel.map((a) => (
                <li key={a.id}>
                  {a.nome} <span className="text-xs">({a.tipo})</span>
                </li>
              ))}
            </ul>
          </Aviso>
        ) : null}

        {!carregando && acoes.length === 0 && !erro ? (
          <Aviso tom="alerta">
            Esta conta nao tem nenhuma acao de conversao. Crie uma no Google Ads (Objetivos &gt; Conversoes) e
            recarregue.
          </Aviso>
        ) : null}
      </div>
    </Cartao>
  );
}
