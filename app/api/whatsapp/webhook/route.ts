export const dynamic = "force-dynamic";
/**
 * WhatsApp Webhook — Meta Cloud API
 *
 * GET  /api/whatsapp/webhook  → verificação do webhook Meta
 * POST /api/whatsapp/webhook  → recebe mensagens e responde com o agente
 *
 * Variáveis de ambiente necessárias (nomes, nunca valores, ver .env.example):
 *   WA_VERIFY_TOKEN       — token de verificação definido no painel Meta
 *   WA_APP_SECRET         — App Secret do app Meta, usado na assinatura HMAC
 *   WA_ACCESS_TOKEN       — token de acesso permanente (Meta System User)
 *   WA_PHONE_NUMBER_ID    — ID do número de telefone no Meta Business
 *
 * O que mudou e por quê:
 *
 * 1. O POST era aberto. Não conferia `X-Hub-Signature-256`, então qualquer
 *    pessoa que soubesse a URL mandava um payload montado à mão e o site
 *    rodava o agente de IA e disparava mensagem pela conta comercial para o
 *    número que o payload escolhesse. Custo de API, custo de LLM e mensagem
 *    saindo em nome da marca — tudo sem autenticação nenhuma.
 *
 * 2. WA_VERIFY_TOKEN tinha valor padrão no código ("byimperiodog_verify").
 *    Segredo padrão em repositório é segredo público: bastava lê-lo para
 *    concluir a verificação do webhook da Meta. Agora, sem configuração, a
 *    rota responde 503 em vez de aceitar o valor de fábrica.
 *
 * 3. As comparações eram `===`. Agora são em tempo constante.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createLogger } from "@/lib/logger";
import { assinaturaMetaValida, comparacaoConstante } from "@/lib/webhookSignature";
import { runAgent } from "@/lib/whatsapp/agent";

const logger = createLogger("whatsapp:webhook");

const META_GRAPH_URL = "https://graph.facebook.com/v19.0";

/** Corpo maior que isto não é webhook da Meta: é tentativa de esgotar memória. */
const MAX_BODY_BYTES = 128 * 1024;

/** Mensagem com carimbo mais velho que isto é replay, não entrega atrasada. */
const JANELA_DE_REPLAY_SEGUNDOS = 10 * 60;

/**
 * Deduplicação em memória, com teto.
 *
 * Limitação conhecida e deliberada: em ambiente serverless cada instância tem o
 * próprio conjunto, então uma reentrega da Meta que caia em outra instância
 * ainda passa. A assinatura já impede replay de terceiros; o que sobra é a
 * própria Meta reenviando. Dedup à prova de instância exigiria tabela nova no
 * Supabase (`whatsapp_processed_messages`), que depende de acesso ao banco —
 * está registrado como pendência externa, não inventado aqui.
 *
 * O teto existe porque o Set anterior crescia sem limite enquanto a instância
 * vivesse.
 */
const TETO_DEDUP = 5000;
const processedIds = new Set<string>();

function jaProcessada(id: string): boolean {
  if (processedIds.has(id)) return true;
  if (processedIds.size >= TETO_DEDUP) {
    // Descarta o mais antigo: Set em JS preserva ordem de inserção.
    const maisAntigo = processedIds.values().next().value;
    if (maisAntigo !== undefined) processedIds.delete(maisAntigo);
  }
  processedIds.add(id);
  return false;
}

// ─── GET — Verificação do webhook Meta ────────────────────────────────────────

export function GET(req: NextRequest) {
  const esperado = process.env.WA_VERIFY_TOKEN?.trim();
  if (!esperado) {
    logger.error("WA_VERIFY_TOKEN nao configurado; verificacao recusada");
    return NextResponse.json({ error: "Webhook nao configurado" }, { status: 503 });
  }

  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token") ?? "";
  const challenge = searchParams.get("hub.challenge") ?? "";

  if (mode === "subscribe" && comparacaoConstante(token, esperado)) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─── POST — Recebe e processa mensagens ───────────────────────────────────────

export async function POST(req: NextRequest) {
  const appSecret = process.env.WA_APP_SECRET?.trim();
  if (!appSecret) {
    // Falha fechada: sem o segredo não há como distinguir a Meta de qualquer
    // outra pessoa, e nesse caso não processar é a única resposta correta.
    logger.error("WA_APP_SECRET nao configurado; webhook recusado");
    return NextResponse.json({ error: "Webhook nao configurado" }, { status: 503 });
  }

  const declarado = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declarado) && declarado > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  // Precisa do texto CRU: a assinatura cobre os bytes como chegaram, e
  // reserializar o JSON invalidaria toda assinatura legítima.
  const corpoCru = await req.text();
  if (corpoCru.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const assinado = await assinaturaMetaValida(
    appSecret,
    corpoCru,
    req.headers.get("x-hub-signature-256")
  );
  if (!assinado) {
    logger.warn("Webhook recusado por assinatura invalida ou ausente");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(corpoCru);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const agora = Math.floor(Date.now() / 1000);
  const entries = (body as any)?.entry ?? [];

  for (const entry of entries) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      if (!value || change.field !== "messages") continue;

      const messages: any[] = value.messages ?? [];
      const contacts: any[] = value.contacts ?? [];

      // O número de origem é o nosso, configurado no ambiente. Ler isso do
      // payload deixava o remetente escolher por qual número o site responde.
      const phoneNumberId = process.env.WA_PHONE_NUMBER_ID?.trim() ?? "";

      for (const message of messages) {
        // Processar apenas mensagens de texto
        if (message.type !== "text") continue;

        const carimbo = Number(message.timestamp ?? 0);
        if (Number.isFinite(carimbo) && carimbo > 0 && agora - carimbo > JANELA_DE_REPLAY_SEGUNDOS) {
          logger.warn("Mensagem fora da janela de replay descartada", {
            atrasoSegundos: agora - carimbo,
          });
          continue;
        }

        const messageId: string = message.id ?? "";
        if (messageId && jaProcessada(messageId)) continue;

        const from: string = message.from ?? "";
        const text: string = message.text?.body ?? "";
        if (!from || !text) continue;

        // Busca nome do contato
        const contact = contacts.find((c: any) => c.wa_id === from);
        const name: string | undefined = contact?.profile?.name;

        // Roda o agente (não bloqueia a resposta 200 — processa em background)
        processMessage({ phone: from, name, text, messageId, phoneNumberId }).catch((err) =>
          logger.error("Falha ao processar mensagem", { error: String(err) })
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
    logger.info("Conversa escalonada para atendimento humano", { name: name ?? "sem nome" });
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
  const accessToken = process.env.WA_ACCESS_TOKEN?.trim();
  if (!accessToken || !phoneNumberId) {
    logger.warn("WA_ACCESS_TOKEN ou WA_PHONE_NUMBER_ID nao configurados; envio ignorado");
    return;
  }

  const url = `${META_GRAPH_URL}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body, preview_url: false },
    }),
  });

  if (!res.ok) {
    // Sem o corpo do erro no log: a resposta da Meta ecoa trechos da requisição.
    logger.error("Erro ao enviar mensagem pela Meta", { status: res.status });
  }
}
