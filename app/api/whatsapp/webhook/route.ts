export const dynamic = "force-dynamic";
/**
 * WhatsApp Webhook — Meta Cloud API
 *
 * GET  /api/whatsapp/webhook  → verificação do webhook Meta
 * POST /api/whatsapp/webhook  → recebe mensagens e responde com o agente
 *
 * Variáveis de ambiente necessárias:
 *   WA_VERIFY_TOKEN       — token de verificação definido no painel Meta
 *   WA_APP_SECRET         — App Secret do app Meta, usado para conferir a
 *                           assinatura X-Hub-Signature-256 de cada POST
 *   WA_ACCESS_TOKEN       — token de acesso permanente (Meta System User)
 *   WA_PHONE_NUMBER_ID    — ID do número de telefone no Meta Business
 *
 * Sobre a assinatura: até esta rodada o POST era aberto. Quem soubesse a URL
 * podia mandar um corpo no formato da Meta e fazer o site (a) rodar o agente
 * de IA, que custa crédito por chamada, e (b) enviar mensagem de WhatsApp para
 * o número que escolhesse, pela conta do canil. O POST agora exige a
 * assinatura HMAC que a Meta manda em todo webhook, e recusa a requisição
 * quando WA_APP_SECRET não estiver configurado — falhar fechado é proposital,
 * porque o modo aberto é justamente o defeito corrigido.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { runAgent } from "@/lib/whatsapp/agent";

const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN ?? "";
const APP_SECRET = process.env.WA_APP_SECRET ?? "";
const ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN ?? "";
const PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID ?? "";

const META_GRAPH_URL = "https://graph.facebook.com/v19.0";

// Deduplication cache (in-memory, resets on cold start).
//
// Continua sendo por instância: em serverless não há memória compartilhada, e
// isso está registrado no relatório. O que mudou é que o Set deixou de crescer
// sem limite — um webhook movimentado (ou alguém repetindo ids diferentes)
// fazia a instância acumular string até estourar.
const processedIds = new Set<string>();
const LIMITE_DEDUP = 5_000;

function marcarProcessado(id: string) {
  if (processedIds.size >= LIMITE_DEDUP) {
    // Descarta o mais antigo. Set em JS preserva ordem de inserção.
    const maisAntigo = processedIds.values().next().value;
    if (maisAntigo !== undefined) processedIds.delete(maisAntigo);
  }
  processedIds.add(id);
}

/** Telefone em log vira 5511•••••3239: o suficiente para casar com o
 *  atendimento, sem despejar o número inteiro do cliente no log da Netlify. */
function mascararTelefone(telefone: string): string {
  if (telefone.length <= 8) return "•".repeat(telefone.length);
  return telefone.slice(0, 4) + "•".repeat(telefone.length - 8) + telefone.slice(-4);
}

/** Confere o X-Hub-Signature-256 que a Meta envia: HMAC-SHA256 do corpo cru,
 *  com o App Secret, no formato sha256=<hex>. */
function assinaturaConfere(corpoCru: string, cabecalho: string | null): boolean {
  if (!APP_SECRET || !cabecalho) return false;

  const esperada = "sha256=" + createHmac("sha256", APP_SECRET).update(corpoCru, "utf8").digest("hex");
  const bufEsperada = Buffer.from(esperada, "utf8");
  const bufRecebida = Buffer.from(cabecalho, "utf8");
  if (bufEsperada.length !== bufRecebida.length) return false;
  return timingSafeEqual(bufEsperada, bufRecebida);
}

// ─── GET — Verificação do webhook Meta ────────────────────────────────────────

export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Sem WA_VERIFY_TOKEN configurado ninguém verifica o webhook. Antes havia um
  // valor padrão escrito aqui — em repositório público, o que é o mesmo que não
  // ter verificação nenhuma.
  if (!VERIFY_TOKEN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─── POST — Recebe e processa mensagens ───────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!APP_SECRET) {
    console.error("[WA Agent] WA_APP_SECRET não configurado — webhook recusado.");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Corpo cru: a assinatura é sobre os bytes que chegaram, não sobre o objeto
  // reserializado.
  const corpoCru = await req.text();
  if (corpoCru.length > 512 * 1024) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  if (!assinaturaConfere(corpoCru, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = JSON.parse(corpoCru);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Aceitar confirmação de entrega imediatamente (não bloquear Meta)
  const entries = (body as any)?.entry ?? [];

  for (const entry of entries) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      if (!value || change.field !== "messages") continue;

      const messages: any[] = value.messages ?? [];
      const contacts: any[] = value.contacts ?? [];
      const phoneNumberId: string = value.metadata?.phone_number_id ?? PHONE_NUMBER_ID;

      for (const message of messages) {
        // Processar apenas mensagens de texto
        if (message.type !== "text") continue;

        const messageId: string = message.id ?? "";
        if (messageId && processedIds.has(messageId)) continue; // dedup
        if (messageId) marcarProcessado(messageId);

        const from: string = message.from ?? "";
        const text: string = message.text?.body ?? "";
        if (!from || !text) continue;

        // Busca nome do contato
        const contact = contacts.find((c: any) => c.wa_id === from);
        const name: string | undefined = contact?.profile?.name;

        // Roda o agente (não bloqueia a resposta 200 — processa em background)
        processMessage({ phone: from, name, text, messageId, phoneNumberId }).catch(
          (err) => console.error("[WA Agent] Error:", err)
        );
      }
    }
  }

  // Meta exige 200 rápido
  return NextResponse.json({ status: "ok" }, { status: 200 });
}

// ─── Processa mensagem e responde ─────────────────────────────────────────────

async function processMessage({
  phone,
  name,
  text,
  messageId,
  phoneNumberId,
}: {
  phone: string;
  name?: string;
  text: string;
  messageId: string;
  phoneNumberId: string;
}) {
  const { reply, escalate } = await runAgent({ phone, name, text, messageId });

  await sendWhatsAppMessage({ to: phone, body: reply, phoneNumberId });

  // Se escalou para humano, notifica internamente (log ou futura notificação push)
  if (escalate) {
    console.info(`[WA Agent] 🚨 Escalonado para humano — ${mascararTelefone(phone)}`);
  }
}

// ─── Envio de mensagem via Meta API ──────────────────────────────────────────

async function sendWhatsAppMessage({
  to,
  body,
  phoneNumberId,
}: {
  to: string;
  body: string;
  phoneNumberId: string;
}) {
  // Trava de resposta automática (26/08/2026).
  //
  // Esta rota respondia sozinha, pela conta de WhatsApp do canil, a quem
  // mandasse mensagem — com preço, lista de filhotes e convite para enviar
  // fotos. Isso é venda autônoma sem ninguém no meio, e a regra do projeto é a
  // oposta: quem fala de disponibilidade e de valor com o cliente é o
  // atendimento humano.
  //
  // O webhook continua recebendo, deduplicando, validando assinatura e
  // registrando o lead — só o ENVIO é que passa a exigir uma decisão explícita
  // de quem opera o canil. Sem WA_AGENT_AUTOREPLY=on nada sai. Falhar fechado
  // aqui é o comportamento desejado, não um bug a ser "consertado" depois.
  if (process.env.WA_AGENT_AUTOREPLY !== "on") {
    console.info("[WA Agent] Resposta automática desligada (WA_AGENT_AUTOREPLY != on). Nada enviado.");
    return;
  }

  if (!ACCESS_TOKEN || !phoneNumberId) {
    console.warn("[WA Agent] WA_ACCESS_TOKEN ou WA_PHONE_NUMBER_ID não configurados.");
    return;
  }

  const url = `${META_GRAPH_URL}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body, preview_url: false },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[WA Agent] Erro ao enviar para ${mascararTelefone(to)}: ${err}`);
  }
}
