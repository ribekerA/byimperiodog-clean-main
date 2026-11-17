"use client";

// Tela do Google Ads: conectar, escolher a conta e operar.
//
// A ordem da tela segue a ordem em que as coisas falham:
//
// 1. Variaveis de ambiente. Sem GOOGLE_CLIENT_ID/SECRET o botao de conectar
//    nao tem para onde ir -- o consentimento nem comeca. Por isso o
//    diagnostico vem antes do botao.
//    O developer token saiu dessa conta: desde 09/09/2026 o nivel de acesso
//    pertence ao projeto do Google Cloud, nao a um token. Projeto em nivel
//    "Test" conecta e autentica, mas so responde por conta de teste -- na tela
//    isso aparece como conta conectada devolvendo lista vazia, que e o engano
//    mais caro desta integracao.
// 2. O aviso de escopo. A API do Google Ads nao tem escopo somente-leitura --
//    `adwords` e um escopo unico de leitura e escrita. Quem autoriza aqui
//    autoriza criar campanha, mexer em orcamento e pausar anuncio. Isso fica
//    escrito antes do clique, nao depois.
// 3. A conta. Login com acesso a varias contas nao define qual delas e esta;
//    tudo nas outras abas depende dessa escolha.

import { Megaphone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CabecalhoPagina } from "../../_ui/CabecalhoPagina";
import { Jornada, type EtapaJornada } from "../../_ui/Jornada";

import { PainelCampanhas } from "./PainelCampanhas";
import { PainelConversoes, type Gravado } from "./PainelConversoes";
import { PainelNovaCampanha } from "./PainelNovaCampanha";
import { PainelOtimizacao } from "./PainelOtimizacao";
import { Aviso, Botao, Cartao, lerErro } from "./ui";

type Status = {
  configuracao: { pronto: boolean; faltando: string[]; versao: string; loginCustomerId: string | null };
  conectado: boolean;
  conta: { id: string; nome: string | null; moeda: string | null; contaDeTeste: boolean } | null;
  escopoDeEscrita: boolean;
};

type Conta = {
  id: string;
  idFormatado: string;
  nome: string;
  moeda: string | null;
  gerenciador: boolean;
  contaDeTeste: boolean;
  selecionada: boolean;
};

const ABAS = [
  { chave: "conversoes", titulo: "Conversoes do site" },
  { chave: "campanhas", titulo: "Campanhas" },
  { chave: "nova", titulo: "Nova campanha" },
  { chave: "otimizacao", titulo: "Otimizacao" },
] as const;

type Aba = (typeof ABAS)[number]["chave"];

export default function GoogleAdsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [contas, setContas] = useState<Conta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [trocando, setTrocando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>("conversoes");
  const [gravado, setGravado] = useState<{ production: Gravado; staging: Gravado } | null>(null);
  // Separado de `erro`: este diz que o ESTADO nao foi lido, e a jornada deixa
  // de mostrar "pendente" -- em 16/11/2026 a rota caiu por falta da chave de
  // criptografia e a tela mandava configurar credenciais que ja existiam.
  const [falhaStatus, setFalhaStatus] = useState<string | null>(null);

  const carregarStatus = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const r = await fetch("/api/admin/google-ads/status", { cache: "no-store" });
      if (!r.ok) {
        const { mensagem } = await lerErro(r);
        setErro(mensagem);
        setFalhaStatus(`A verificacao respondeu ${r.status}.`);
        setStatus(null);
        return;
      }
      setStatus((await r.json()) as Status);
      setFalhaStatus(null);
    } catch {
      setErro("Nao foi possivel ler o estado da conexao.");
      setFalhaStatus("A verificacao nao respondeu.");
      setStatus(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarContas = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/google-ads/contas", { cache: "no-store" });
      if (!r.ok) {
        const { mensagem } = await lerErro(r);
        setErro(mensagem);
        setContas([]);
        return;
      }
      const d = await r.json();
      setContas(Array.isArray(d.contas) ? d.contas : []);
    } catch {
      setErro("Nao foi possivel listar as contas do Google Ads.");
    }
  }, []);

  useEffect(() => {
    void carregarStatus();
  }, [carregarStatus]);

  useEffect(() => {
    if (status?.conectado && status.configuracao.pronto) void carregarContas();
  }, [status?.conectado, status?.configuracao.pronto, carregarContas]);

  useEffect(() => {
    // O callback do OAuth volta com ?connected=google_ads. Sem esta leitura, a
    // tela abriria igual antes e depois de conectar.
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "google_ads") {
      setAviso("Conta Google conectada. Escolha abaixo qual conta de anuncios este painel vai gerenciar.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function escolherConta(customerId: string) {
    setTrocando(true);
    setErro(null);
    setAviso(null);
    try {
      const r = await fetch("/api/admin/google-ads/contas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });
      if (!r.ok) {
        const { mensagem } = await lerErro(r);
        setErro(mensagem);
        return;
      }
      const d = await r.json();
      setAviso(`Agora operando a conta ${d.nome ?? customerId}.`);
      await Promise.all([carregarStatus(), carregarContas()]);
    } catch {
      setErro("Nao foi possivel trocar de conta.");
    } finally {
      setTrocando(false);
    }
  }

  const pronto = status?.configuracao.pronto === true;
  const conectado = status?.conectado === true;
  const temConta = Boolean(status?.conta);
  const prod = gravado?.production;
  const conversoesGravadas = Boolean(prod?.googleAdsId && prod.lead && prod.whatsapp);

  function irPara(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Cada etapa so conta como feita pelo que a API devolve agora. A gravacao
  // das conversoes e conferida relendo pixels_settings, nao pela resposta do
  // botao: se a gravacao nao persistir, a etapa continua aberta.
  const etapas: EtapaJornada[] = [
    {
      id: "credenciais",
      titulo: "Credenciais do Google no ambiente",
      descricao: "GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET definidos na Netlify, do mesmo cliente OAuth do GA4 e do GTM.",
      feito: pronto,
      resultado: status ? <>API {status.configuracao.versao}</> : undefined,
      acao: (
        <Botao tipo="secundario" onClick={() => irPara("ads-conexao")}>
          Ver o que falta
        </Botao>
      ),
    },
    {
      id: "login",
      titulo: "Conectar a conta Google",
      descricao: "Autoriza o painel a ler e operar a conta de anuncios. O acesso tambem escreve.",
      feito: conectado,
      bloqueadoPor: !pronto ? "credenciais no ambiente" : undefined,
      resultado: "login autorizado",
      acao: (
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a
          href="/api/integrations/google_ads/login"
          className="inline-block rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Conectar conta Google
        </a>
      ),
    },
    {
      id: "conta",
      titulo: "Escolher a conta de anuncios",
      descricao: "Um login pode ver varias contas. As abas abaixo operam so a escolhida.",
      feito: temConta,
      bloqueadoPor: !conectado ? "conectar a conta Google" : undefined,
      resultado: status?.conta ? (
        <NomeDaConta nome={status.conta.nome} id={status.conta.id} />
      ) : undefined,
      acao: <Botao onClick={() => irPara("ads-conexao")}>Escolher conta</Botao>,
    },
    {
      id: "conversoes",
      titulo: "Gravar as conversoes do site em producao",
      descricao: "ID AW- e os labels de lead e de WhatsApp, lidos da conta e gravados na configuracao do site.",
      feito: conversoesGravadas,
      bloqueadoPor: !temConta ? "escolher a conta de anuncios" : undefined,
      resultado: prod?.googleAdsId ? (
        <>
          <span className="font-mono">{prod.googleAdsId}</span> · lead e WhatsApp configurados
        </>
      ) : undefined,
      acao: (
        <Botao
          onClick={() => {
            setAba("conversoes");
            setTimeout(() => irPara("ads-abas"), 50);
          }}
        >
          Abrir conversoes
        </Botao>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        sobretitulo="Plataforma"
        titulo="Google Ads"
        icone={<Megaphone className="h-6 w-6" />}
        descricao="Le as conversoes da conta e grava o ID AW- no site, mostra o desempenho das campanhas, cria campanha de pesquisa e corta gasto que nao converte."
        acoes={
          <Botao tipo="secundario" onClick={() => void carregarStatus()} disabled={carregando}>
            {carregando ? "Verificando..." : "Verificar de novo"}
          </Botao>
        }
      />

      {erro ? <Aviso tom="erro">{erro}</Aviso> : null}
      {aviso ? <Aviso tom="ok">{aviso}</Aviso> : null}

      <Jornada
        titulo="Configuracao do Google Ads"
        etapas={etapas}
        carregando={carregando && !status}
        naoVerificado={falhaStatus}
        mensagemFinal="Conta conectada e conversoes gravadas em producao. Confira nas abas abaixo se as campanhas estao recebendo as conversoes."
      />

      <div id="ads-conexao" className="scroll-mt-20">
      <Cartao
        titulo="Conexao"
        descricao="Estado das credenciais, do login e da conta escolhida."
        acao={
          <Botao tipo="secundario" onClick={() => void carregarStatus()} disabled={carregando}>
            {carregando ? "..." : "Verificar"}
          </Botao>
        }
      >
        <div className="space-y-4">
          {status ? (
            <>
              {!pronto ? (
                <Aviso tom="alerta" titulo="Faltam credenciais no ambiente">
                  <p>
                    Sem elas o botao de conectar nao tem para onde ir: o consentimento do Google nem comeca.
                    Defina estas variaveis na Netlify e refaca o deploy:
                  </p>
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 font-mono text-xs">
                    {status.configuracao.faltando.map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                  <p className="mt-2">
                    O par sai do mesmo cliente OAuth que ja serve GA4 e GTM, no projeto do Google Cloud onde
                    a Google Ads API esta habilitada. O nivel de acesso e do projeto, nao de um token: em
                    nivel &quot;Test&quot; a conexao funciona e so responde por conta de teste.
                  </p>
                </Aviso>
              ) : null}

              <dl className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <dt className="text-xs text-[var(--text-muted)]">Credenciais</dt>
                  <dd className="font-medium text-[var(--text)]">{pronto ? "completas" : "incompletas"}</dd>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <dt className="text-xs text-[var(--text-muted)]">Login Google</dt>
                  <dd className="font-medium text-[var(--text)]">{conectado ? "conectado" : "nao conectado"}</dd>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <dt className="text-xs text-[var(--text-muted)]">Versao da API</dt>
                  <dd className="font-mono text-sm text-[var(--text)]">{status.configuracao.versao}</dd>
                </div>
              </dl>

              <Aviso tom="alerta" titulo="Este acesso tambem escreve">
                A API do Google Ads nao oferece escopo de leitura. O mesmo consentimento que le o desempenho
                permite criar campanha, alterar orcamento, pausar anuncio e aplicar recomendacao. Quem usa
                este painel mexe em dinheiro da conta de anuncios.
              </Aviso>

              {!conectado ? (
                <div>
                  {/* O login do OAuth e uma rota de API que responde com redirect para o Google.
                      next/link faria navegacao do lado do cliente e o redirect nunca sairia do app. */}
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                  <a
                    href="/api/integrations/google_ads/login"
                    className={`inline-block rounded-full px-4 py-2 text-sm font-semibold transition ${
                      pronto
                        ? "bg-[var(--brand)] text-white hover:opacity-90"
                        : "pointer-events-none bg-slate-200 text-slate-500"
                    }`}
                    aria-disabled={!pronto}
                  >
                    Conectar conta Google
                  </a>
                  {!pronto ? (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      O botao libera quando as variaveis acima estiverem no ambiente.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[var(--border)] p-4">
                    <p className="text-sm font-semibold text-[var(--text)]">Conta em uso</p>
                    {status.conta ? (
                      <p className="text-sm text-[var(--text-muted)]">
                        <NomeDaConta nome={status.conta.nome} id={status.conta.id} />
                        {status.conta.moeda ? ` · ${status.conta.moeda}` : ""}
                        {status.conta.contaDeTeste ? " · conta de teste" : ""}
                      </p>
                    ) : (
                      <p className="text-sm text-amber-800">
                        Nenhuma conta escolhida. As outras abas ficam vazias ate escolher uma.
                      </p>
                    )}
                  </div>

                  {contas.length > 0 ? (
                    <ul className="space-y-2">
                      {contas.map((c) => (
                        <li
                          key={c.id}
                          className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[var(--text)]">
                              {c.nome}{" "}
                              {c.gerenciador ? (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                                  gerenciadora
                                </span>
                              ) : null}
                              {c.contaDeTeste ? (
                                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-800">
                                  teste
                                </span>
                              ) : null}
                            </p>
                            <p className="font-mono text-xs text-[var(--text-muted)]">
                              {c.idFormatado}
                              {c.moeda ? ` · ${c.moeda}` : ""}
                            </p>
                          </div>
                          {c.selecionada ? (
                            <span className="flex-shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                              em uso
                            </span>
                          ) : c.gerenciador ? (
                            <span className="flex-shrink-0 text-xs text-[var(--text-muted)]">
                              conta gerenciadora nao tem campanha propria
                            </span>
                          ) : (
                            <Botao tipo="secundario" onClick={() => void escolherConta(c.id)} disabled={trocando}>
                              Usar esta
                            </Botao>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {/* O login do OAuth e uma rota de API que responde com redirect para o Google.
                      next/link faria navegacao do lado do cliente e o redirect nunca sairia do app. */}
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                  <a
                    href="/api/integrations/google_ads/login"
                    className="inline-block text-sm text-[var(--brand)] underline"
                  >
                    Reconectar com outra conta Google
                  </a>
                </div>
              )}
            </>
          ) : carregando ? (
            <p className="text-sm text-[var(--text-muted)]">Verificando...</p>
          ) : falhaStatus ? (
            <p className="text-sm text-[var(--text-muted)]">
              Sem leitura da conexao agora. Use &quot;Verificar&quot; para tentar de novo; se continuar, a causa
              costuma ser variavel de ambiente do servidor ou sessao do painel expirada.
            </p>
          ) : null}
        </div>
      </Cartao>
      </div>

      {conectado && pronto && temConta ? (
        <>
          <nav
            id="ads-abas"
            className="flex scroll-mt-20 gap-1 overflow-x-auto rounded-2xl border border-[var(--border)] bg-white p-1 shadow-sm"
            aria-label="Secoes do Google Ads"
          >
            {ABAS.map((a) => (
              <button
                key={a.chave}
                type="button"
                onClick={() => setAba(a.chave)}
                aria-current={aba === a.chave ? "page" : undefined}
                className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  aba === a.chave
                    ? "bg-[var(--brand)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:bg-[var(--brand-tint-50)] hover:text-[var(--brand)]"
                }`}
              >
                {a.titulo}
              </button>
            ))}
          </nav>

          {aba === "conversoes" ? <PainelConversoes onGravadoLido={setGravado} /> : null}
          {aba === "campanhas" ? <PainelCampanhas /> : null}
          {aba === "nova" ? <PainelNovaCampanha onCriou={() => setAba("campanhas")} /> : null}
          {aba === "otimizacao" ? <PainelOtimizacao /> : null}
        </>
      ) : null}
    </div>
  );
}

/** Nome da conta sem repetir o ID quando o "nome" e so o proprio ID formatado. */
function NomeDaConta({ nome, id }: { nome?: string | null; id: string }) {
  const digitos = (s: string) => s.replace(/\D/g, "");
  const nomeEhId = !nome || digitos(nome) === digitos(id);
  if (nomeEhId) {
    return <span className="font-mono">{id.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3")}</span>;
  }
  return (
    <>
      {nome} · <span className="font-mono">{id}</span>
    </>
  );
}
