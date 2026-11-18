"use client";

import { AlertTriangle, Search } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { CodigoDoWhatsApp, CodigosLoad } from "@/lib/admin/whatsappRefs";

/**
 * Códigos curtos que vieram nas mensagens do WhatsApp ("cód. K7M2Q").
 *
 * Todo código nasce de um clique em anúncio do Google com aceite de cookies.
 * Quem atende cola o código da conversa na busca e marca a venda; isso só
 * grava a hora no banco, nada vai para o Google Ads. Venda de quem veio pelo
 * Instagram, pela busca orgânica ou direto não tem código e não aparece aqui.
 */

const CARD = "rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5";
const TH = "py-2 pr-3 text-xs font-medium text-[var(--text-muted)]";
const TD = "py-2 pr-3";
const numero = new Intl.NumberFormat("pt-BR");
const quando = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const CLIQUE: Record<NonNullable<CodigoDoWhatsApp["clique"]>, string> = {
  gclid: "Anúncio (computador ou Android)",
  wbraid: "Anúncio (iPhone)",
  gbraid: "Anúncio (iPhone)",
};

function formatar(iso: string | null): string {
  if (!iso) return "";
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? "" : quando.format(data);
}

async function lerErro(res: Response, padrao: string): Promise<string> {
  try {
    const corpo = (await res.json()) as { error?: unknown };
    return typeof corpo.error === "string" ? corpo.error : padrao;
  } catch {
    return padrao;
  }
}

function BotaoVenda({
  codigo,
  ocupado,
  onAlternar,
}: {
  codigo: CodigoDoWhatsApp;
  ocupado: boolean;
  onAlternar: (codigo: CodigoDoWhatsApp) => void;
}) {
  return (
    <button
      type="button"
      className="btn-outline whitespace-nowrap px-3 py-1 text-xs"
      aria-disabled={ocupado}
      aria-label={codigo.vendaEm ? `Desfazer venda do código ${codigo.ref}` : `Marcar venda no código ${codigo.ref}`}
      onClick={() => {
        if (!ocupado) onAlternar(codigo);
      }}
    >
      {codigo.vendaEm ? "Desfazer" : "Marcar venda"}
    </button>
  );
}

export function CodigosDoWhatsApp({ load }: { load: CodigosLoad }) {
  const [codigos, setCodigos] = useState<CodigoDoWhatsApp[]>(load.status === "ok" ? load.codigos : []);
  const [achado, setAchado] = useState<CodigoDoWhatsApp | null>(null);
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [vendaDisponivel, setVendaDisponivel] = useState(load.status === "ok" ? load.vendaDisponivel : false);

  async function procurar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!texto.trim() || ocupado) return;
    setOcupado("busca");
    setAviso("");
    setAchado(null);
    try {
      const res = await fetch(`/api/admin/whatsapp/codigos?ref=${encodeURIComponent(texto.trim())}`, { cache: "no-store" });
      if (!res.ok) {
        setAviso(await lerErro(res, "Não foi possível procurar agora."));
        return;
      }
      const corpo = (await res.json()) as { codigo: CodigoDoWhatsApp; vendaDisponivel: boolean };
      setAchado(corpo.codigo);
      setVendaDisponivel(corpo.vendaDisponivel);
      setAviso(`Código ${corpo.codigo.ref} encontrado.`);
    } catch {
      setAviso("Não foi possível procurar agora.");
    } finally {
      setOcupado(null);
    }
  }

  async function alternar(codigo: CodigoDoWhatsApp) {
    setOcupado(codigo.ref);
    setAviso("");
    try {
      const res = await fetch("/api/admin/whatsapp/codigos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref: codigo.ref, vendido: !codigo.vendaEm }),
      });
      if (!res.ok) {
        if (res.status === 409) setVendaDisponivel(false);
        setAviso(await lerErro(res, "Não foi possível gravar agora."));
        return;
      }
      const { codigo: novo } = (await res.json()) as { codigo: CodigoDoWhatsApp };
      setCodigos((lista) => lista.map((item) => (item.ref === novo.ref ? novo : item)));
      setAchado((atual) => (atual?.ref === novo.ref ? novo : atual));
      setAviso(novo.vendaEm ? `Venda marcada no código ${novo.ref}.` : `Venda desfeita no código ${novo.ref}.`);
    } catch {
      setAviso("Não foi possível gravar agora.");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <section aria-labelledby="dash-codigos" className={CARD}>
      <h2 id="dash-codigos" className="text-base font-semibold text-[var(--text)]">
        Códigos do WhatsApp (anúncio)
      </h2>
      <p className="mb-3 text-sm text-[var(--text-muted)]">
        O código aparece no fim da mensagem, como “(cód. K7M2Q)”, só para quem veio de anúncio do Google e aceitou
        cookies. Venda marcada aqui é venda ligada a anúncio; quem veio pelo Instagram, pela busca orgânica ou direto
        não tem código. Marcar venda só fica registrado no painel, nada vai para o Google Ads.
      </p>

      {load.status === "nao_configurado" ? (
        <p role="status" className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-muted)]">
          O painel não está ligado ao banco de dados, então os códigos não foram lidos.
        </p>
      ) : load.status === "erro" ? (
        <div role="status" className="flex gap-3 rounded-xl border border-[#ecd09a] bg-[#fff8e8] p-4 text-sm text-[#4f3000]">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <span className="font-semibold">Códigos não lidos agora.</span> {load.motivo}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-[var(--text)]">
            {numero.format(load.resumo.codigos7)} {load.resumo.codigos7 === 1 ? "código" : "códigos"} em 7 dias,{" "}
            {numero.format(load.resumo.codigos14)} em 14 dias.
            {vendaDisponivel
              ? ` Vendas marcadas: ${numero.format(load.resumo.vendas14)} em 14 dias, ${numero.format(load.resumo.vendasTotal)} no total.`
              : ""}
          </p>

          {!vendaDisponivel ? (
            <p role="note" className="mb-3 rounded-xl border border-[#ecd09a] bg-[#fff8e8] p-3 text-sm text-[#4f3000]">
              Para marcar venda, falta rodar no banco o SQL{" "}
              <span className="font-mono text-xs">20261118160000_whatsapp_refs_venda.sql</span>. A lista funciona sem ele.
            </p>
          ) : null}

          <form role="search" onSubmit={procurar} className="mb-3 flex flex-wrap items-end gap-2">
            <label className="flex min-w-[12rem] flex-1 flex-col text-sm text-[var(--text)]">
              Procurar código
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="K7M2Q ou cole a mensagem"
                autoComplete="off"
                spellCheck={false}
                className="mt-1 rounded-lg border border-[var(--border)] px-3 py-2 font-mono text-sm uppercase"
              />
            </label>
            <button type="submit" className="btn-outline inline-flex items-center gap-1 text-sm" aria-disabled={ocupado === "busca"}>
              <Search aria-hidden="true" className="h-4 w-4" />
              Procurar
            </button>
          </form>

          <p role="status" aria-live="polite" className="mb-2 min-h-[1.25rem] text-sm text-[var(--text)]">
            {aviso}
          </p>

          {achado ? (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] p-3 text-sm">
              <span className="font-mono font-semibold">{achado.ref}</span>
              <span className="text-[var(--text-muted)]">{formatar(achado.criadoEm)}</span>
              <span className="text-[var(--text-muted)]">{achado.pagina ?? "página não registrada"}</span>
              {achado.vendaEm ? <span>Venda marcada em {formatar(achado.vendaEm)}</span> : null}
              {vendaDisponivel ? (
                <BotaoVenda codigo={achado} ocupado={ocupado !== null} onAlternar={alternar} />
              ) : null}
            </div>
          ) : null}

          {codigos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-muted)]">
              Nenhum código registrado ainda.
            </p>
          ) : (
            // Em tela estreita a tabela rola de lado; o foco no bloco deixa rolar pelo teclado.
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            <div role="region" aria-label="Códigos recentes" tabIndex={0} className="overflow-x-auto rounded-md">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Os {codigos.length} códigos mais recentes</caption>
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th scope="col" className={TH}>Quando</th>
                    <th scope="col" className={TH}>Código</th>
                    <th scope="col" className={TH}>Página</th>
                    <th scope="col" className={TH}>Filhote</th>
                    <th scope="col" className={TH}>Clique</th>
                    <th scope="col" className={TH}>Venda</th>
                  </tr>
                </thead>
                <tbody>
                  {codigos.map((codigo) => (
                    <tr key={codigo.ref} className="border-b border-[var(--border)] last:border-0">
                      <td className={`${TD} whitespace-nowrap tabular-nums`}>{formatar(codigo.criadoEm)}</td>
                      <td className={`${TD} font-mono font-semibold`}>{codigo.ref}</td>
                      <td className={`${TD} max-w-[14rem] truncate`}>{codigo.pagina ?? "—"}</td>
                      <td className={TD}>{codigo.filhote ?? "—"}</td>
                      <td className={`${TD} whitespace-nowrap`}>{codigo.clique ? CLIQUE[codigo.clique] : "—"}</td>
                      <td className={`${TD} whitespace-nowrap`}>
                        {codigo.vendaEm ? <span className="mr-2">{formatar(codigo.vendaEm)}</span> : null}
                        {vendaDisponivel ? (
                          <BotaoVenda codigo={codigo} ocupado={ocupado !== null} onAlternar={alternar} />
                        ) : codigo.vendaEm ? null : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
