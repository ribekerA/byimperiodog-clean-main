"use client";

/**
 * "Avise-me da próxima ninhada" — remarketing orgânico.
 *
 * Quem olha a vitrine e ainda não chamou no WhatsApp saía do site sem deixar
 * contato. Aqui a pessoa escolhe cor e sexo e deixa nome e WhatsApp; o contato
 * cai em /admin/leads como qualquer outro, com a combinação na mensagem.
 *
 * O que este componente NÃO promete, e por quê (ver o histórico do antigo
 * NotifyMeButton): nada no site dispara o aviso. Quem avisa é a equipe, quando
 * nasce a ninhada — o usuário aprovou a lista sabendo disso em 17/11/2026. Por
 * isso o texto não fala em aviso automático, prazo, posição na fila nem
 * reserva, e não diz que algum filhote "está disponível".
 *
 * `page_type: "notify_me"` é o valor que a rota /api/leads já reconhece como
 * lista de espera: o contato é gravado, mas a sequência de vendas com IA não
 * dispara — quem pediu aviso de ninhada não pediu abordagem de venda agora.
 */

import { useEffect, useId, useState } from "react";

import { CORES_DIVULGADAS } from "@/domain/pricing";
import { getClickId } from "@/lib/gclid";
import { confirmedLeadId } from "@/lib/lead-confirmation";
import { sendGA4 } from "@/lib/track";

type Sexo = "femea" | "macho" | "tanto_faz";

const SEXOS: { valor: Sexo; rotulo: string }[] = [
  { valor: "femea", rotulo: "Fêmea" },
  { valor: "macho", rotulo: "Macho" },
  { valor: "tanto_faz", rotulo: "Tanto faz" },
];

const QUALQUER_COR = "";

function normalizarSexo(valor: string | undefined): Sexo {
  if (valor === "female" || valor === "femea") return "femea";
  if (valor === "male" || valor === "macho") return "macho";
  return "tanto_faz";
}

function normalizarCor(valor: string | undefined): string {
  const cor = (valor ?? "").toLowerCase();
  return (CORES_DIVULGADAS as readonly string[]).includes(cor) ? cor : QUALQUER_COR;
}

function rotuloCor(cor: string): string {
  return cor.charAt(0).toUpperCase() + cor.slice(1);
}

/** "branco fêmea", "macho", "laranja" ou "" — usado na mensagem e no sucesso. */
function descreverCombinacao(cor: string, sexo: Sexo): string {
  const partes = [cor, sexo === "femea" ? "fêmea" : sexo === "macho" ? "macho" : ""].filter(Boolean);
  return partes.join(" ");
}

type Props = {
  /** Cor já escolhida na página (filtro, página de cor ou do filhote). */
  cor?: string;
  /** Aceita o vocabulário da vitrine (female/male) e o das URLs (femea/macho). */
  sexo?: string;
  /** De onde veio o cadastro, gravado em page_intent. */
  origem: string;
  className?: string;
};

type Etapa = "form" | "enviando" | "sucesso";

export default function AvisoDeNinhada({ cor, sexo, origem, className }: Props) {
  const idTitulo = useId();
  const idNome = useId();
  const idFone = useId();

  const [corEscolhida, setCorEscolhida] = useState(() => normalizarCor(cor));
  const [sexoEscolhido, setSexoEscolhido] = useState<Sexo>(() => normalizarSexo(sexo));
  const [nome, setNome] = useState("");
  const [fone, setFone] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>("form");
  const [erro, setErro] = useState(false);

  // Na vitrine o filtro muda depois da montagem: a escolha do formulário
  // acompanha, porque mexer no filtro também é dizer o que se procura.
  useEffect(() => setCorEscolhida(normalizarCor(cor)), [cor]);
  useEffect(() => setSexoEscolhido(normalizarSexo(sexo)), [sexo]);

  const digitos = fone.replace(/\D/g, "");
  const podeEnviar = nome.trim().length >= 2 && digitos.length >= 10 && consentimento && etapa === "form";
  const combinacao = descreverCombinacao(corEscolhida, sexoEscolhido);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEnviar) return;
    setEtapa("enviando");
    setErro(false);
    try {
      const resposta = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: digitos,
          cor_preferida: corEscolhida || undefined,
          sexo_preferido: sexoEscolhido,
          mensagem: `Aviso de próxima ninhada: ${combinacao || "qualquer cor e sexo"}.`,
          consent_lgpd: true,
          consent_timestamp: new Date().toISOString(),
          consent_version: "1.0",
          page_type: "notify_me",
          page_intent: `aviso_ninhada_${origem}`,
          page: typeof window !== "undefined" ? window.location.pathname : undefined,
          // Não é conversão do Ads (é aviso futuro, não pedido de compra), mas o
          // click id fica gravado para uma venda posterior virar conversão offline.
          gclid: getClickId(),
        }),
        keepalive: true,
      });
      await confirmedLeadId(resposta);
      sendGA4("aviso_ninhada", { color: corEscolhida || "any", sex: sexoEscolhido, origin: origem });
      setEtapa("sucesso");
    } catch {
      setErro(true);
      setEtapa("form");
    }
  };

  return (
    <section
      aria-labelledby={idTitulo}
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-6 ${className ?? ""}`}
    >
      <h2 id={idTitulo} className="titulo-editorial text-xl text-[var(--text)] sm:text-2xl">
        Avise-me da próxima ninhada de Lulu da Pomerânia
      </h2>

      {etapa === "sucesso" ? (
        <p role="status" className="mt-3 text-sm leading-relaxed text-[var(--text)]">
          Anotado, {nome.trim().split(/\s+/)[0]}: quando nascer uma ninhada de Lulu da Pomerânia
          {combinacao ? ` com a combinação ${combinacao}` : ""}, a equipe chama você no WhatsApp.
        </p>
      ) : (
        <form onSubmit={enviar} className="mt-3 space-y-4" noValidate>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            Escolha a cor e o sexo do Lulu da Pomerânia que você procura e deixe seu WhatsApp: quando nascer uma
            ninhada de Lulu da Pomerânia com essa combinação, a equipe chama você.
          </p>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-[var(--text)]">Cor</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="chip-filtro" aria-pressed={corEscolhida === QUALQUER_COR}
                onClick={() => setCorEscolhida(QUALQUER_COR)}>
                Qualquer cor
              </button>
              {CORES_DIVULGADAS.map((c) => (
                <button key={c} type="button" className="chip-filtro" aria-pressed={corEscolhida === c}
                  onClick={() => setCorEscolhida(c)}>
                  {rotuloCor(c)}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-[var(--text)]">Sexo</legend>
            <div className="flex flex-wrap gap-2">
              {SEXOS.map(({ valor, rotulo }) => (
                <button key={valor} type="button" className="chip-filtro" aria-pressed={sexoEscolhido === valor}
                  onClick={() => setSexoEscolhido(valor)}>
                  {rotulo}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={idNome} className="mb-1 block text-sm font-semibold text-[var(--text)]">Seu nome</label>
              <input id={idNome} type="text" autoComplete="given-name" maxLength={120} value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]" />
            </div>
            <div>
              <label htmlFor={idFone} className="mb-1 block text-sm font-semibold text-[var(--text)]">WhatsApp com DDD</label>
              <input id={idFone} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="11 99999-9999"
                value={fone} onChange={(e) => setFone(e.target.value.replace(/[^\d\s()-]/g, "").slice(0, 16))}
                className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]" />
            </div>
          </div>

          <label className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
            <input type="checkbox" checked={consentimento} onChange={(e) => setConsentimento(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0" />
            <span>
              Autorizo o contato pelo WhatsApp sobre ninhadas de Lulu da Pomerânia, conforme a{" "}
              <a href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer" className="underline">
                Política de Privacidade
              </a>
              .
            </span>
          </label>

          {erro && (
            <p role="alert" className="text-sm text-rose-700">
              Não foi possível guardar seu aviso de Lulu da Pomerânia; tente de novo.
            </p>
          )}

          <button type="submit" disabled={!podeEnviar}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-base font-bold text-[var(--brand-foreground)] transition hover:brightness-110 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 sm:w-auto">
            {etapa === "enviando" ? "Enviando…" : "Quero ser avisado"}
          </button>

          <p className="text-xs text-[var(--text-muted)]">
            O aviso de ninhada de Lulu da Pomerânia não é reserva e não tem custo.
          </p>
        </form>
      )}
    </section>
  );
}
