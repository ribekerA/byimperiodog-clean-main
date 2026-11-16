// Acoes de conversao da conta -- e de onde sai o AW- e os labels da tag.
//
// Este arquivo existe por um motivo bem concreto. O label de conversao
// (`AbC-D_efGhIjKlM`) nao esta em lugar nenhum da interface do Google Ads como
// texto que se possa copiar: ele vem embutido no "snippet de evento" que o
// painel manda instalar no site. Quem configura a mao abre o snippet, acha o
// `send_to`, copia o trecho depois da barra e cola no admin -- e um label
// copiado errado produz exatamente o pior defeito possivel: a tag carrega, o
// site nao acusa erro nenhum, e NENHUMA conversao chega ao Google Ads. A
// campanha otimiza no escuro por semanas antes de alguem desconfiar.
//
// Lendo `conversion_action.tag_snippets` pela API, o `send_to` vem de dentro da
// propria conta. Nao ha o que digitar errado.
//
// Ver tambem src/lib/pixels.ts, que guarda esses valores, e
// src/lib/conversions.ts, que os usa no disparo.

import { consultar, type LinhaGaql } from "./client";

export type AcaoDeConversao = {
  id: string;
  nome: string;
  status: string;
  tipo: string;
  categoria: string;
  principalParaMeta: boolean;
  /** ID de conversao no formato AW-123456789, lido do snippet. */
  idConversao: string | null;
  /** Label da acao, lido do snippet. */
  label: string | null;
  /** `AW-123456789/label`, exatamente como vai no send_to do gtag. */
  sendTo: string | null;
};

const CAMPOS =
  "conversion_action.id, conversion_action.name, conversion_action.status, " +
  "conversion_action.type, conversion_action.category, conversion_action.primary_for_goal, " +
  "conversion_action.tag_snippets";

/**
 * Tira o `send_to` de dentro do snippet de evento.
 *
 * O snippet e HTML com um <script> dentro, e o valor aparece como
 * 'send_to': 'AW-123456789/AbC-D_efG'. A regex aceita aspas simples ou duplas
 * porque o Google ja mudou isso de formato antes.
 */
export function extrairSendTo(snippet: string | null | undefined): {
  idConversao: string | null;
  label: string | null;
  sendTo: string | null;
} {
  const vazio = { idConversao: null, label: null, sendTo: null };
  if (!snippet) return vazio;
  const achado = snippet.match(/['"]send_to['"]\s*:\s*['"]([^'"]+)['"]/);
  if (!achado) return vazio;
  const sendTo = achado[1].trim();
  const barra = sendTo.indexOf("/");
  if (barra === -1) {
    // Conversao configurada sem label (acontece em acoes importadas do GA4):
    // o ID ainda serve, o label fica nulo e quem chamar sabe que nao da para
    // disparar essa acao pelo gtag.
    return { idConversao: sendTo || null, label: null, sendTo };
  }
  const idConversao = sendTo.slice(0, barra).trim();
  const label = sendTo.slice(barra + 1).trim();
  return {
    idConversao: idConversao || null,
    label: label || null,
    sendTo,
  };
}

function linhaParaAcao(linha: LinhaGaql): AcaoDeConversao | null {
  const bruto = linha.conversionAction;
  if (!bruto) return null;
  const id = String(bruto.id ?? "").trim();
  if (!id) return null;

  const snippets: Array<{ eventSnippet?: string }> = Array.isArray(bruto.tagSnippets)
    ? bruto.tagSnippets
    : [];
  // Varre todos os snippets porque o Google devolve um por formato de pagina
  // (HTML, AMP) e so alguns tem eventSnippet preenchido.
  let extraido = extrairSendTo(null);
  for (const snippet of snippets) {
    const tentativa = extrairSendTo(snippet.eventSnippet);
    if (tentativa.sendTo) {
      extraido = tentativa;
      break;
    }
  }

  return {
    id,
    nome: String(bruto.name ?? "").trim() || `Conversao ${id}`,
    status: String(bruto.status ?? "UNKNOWN"),
    tipo: String(bruto.type ?? "UNKNOWN"),
    categoria: String(bruto.category ?? "UNKNOWN"),
    principalParaMeta: bruto.primaryForGoal === true,
    ...extraido,
  };
}

/** Acoes de conversao habilitadas da conta, com o send_to ja decifrado. */
export async function listarAcoesDeConversao(opts: {
  userId: string;
  customerId: string;
  incluirRemovidas?: boolean;
}): Promise<AcaoDeConversao[]> {
  const filtro = opts.incluirRemovidas ? "" : " WHERE conversion_action.status != 'REMOVED'";
  const linhas = await consultar({
    userId: opts.userId,
    customerId: opts.customerId,
    gaql: `SELECT ${CAMPOS} FROM conversion_action${filtro} ORDER BY conversion_action.name`,
  });
  return linhas
    .map(linhaParaAcao)
    .filter((a): a is AcaoDeConversao => a !== null);
}

/**
 * Checa se duas acoes podem conviver na configuracao do site.
 *
 * O site dispara duas conversoes diferentes -- lead de formulario e clique de
 * WhatsApp -- e src/lib/pixels.ts documenta por que elas NUNCA podem
 * compartilhar label: o Google Ads perderia a distincao entre "mandou
 * mensagem" e "preencheu formulario", que e justamente o que separa um lance
 * bom de um ruim. Aqui essa regra deixa de ser comentario e passa a ser
 * verificacao antes de gravar.
 */
export function conflitoDeLabels(
  lead: AcaoDeConversao | null,
  whatsapp: AcaoDeConversao | null,
): string | null {
  if (!lead || !whatsapp) return null;
  if (lead.id === whatsapp.id) {
    return "Escolha duas acoes de conversao diferentes para lead e para WhatsApp.";
  }
  if (lead.label && whatsapp.label && lead.label === whatsapp.label) {
    return "As duas acoes compartilham o mesmo label, o que faria o Google Ads contar os dois disparos como a mesma conversao.";
  }
  if (lead.idConversao && whatsapp.idConversao && lead.idConversao !== whatsapp.idConversao) {
    return "As acoes pertencem a contas de conversao diferentes; o site so consegue carregar uma tag AW- por vez.";
  }
  return null;
}
