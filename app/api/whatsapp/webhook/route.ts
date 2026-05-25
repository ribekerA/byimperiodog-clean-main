export const dynamic = "force-dynamic";
/**
 * WhatsApp Webhook — Meta Cloud API
 *
 * GET  /api/whatsapp/webhook  → verificação do webhook Meta
 * POST /api/whatsapp/webhook  → recebe mensagens e responde com o agente
 *
 * Variáveis de ambiente necessárias:
 *   WA_VERIFY_TOKEN       — token de verificação definido no painel Meta
 *   WA_ACCESS_TOKEN       — token de acesso permanente (Meta System User)
 *   WA_PHONE_NUMBER_ID    — ID do número de telefone no Meta Business
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { runAgent } from "@/lib/whatsapp/agent";

const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN ?? "byimperiodog_verify";
const ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN ?? "";
const PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID ?? "";

const META_GRAPH_URL = "https://graph.facebook.com/v19.0";

// Deduplication cache (in-memory, resets on cold start)
const processedIds = new Set<string>();

// ─── GET — Verificação do webhook Meta ────────────────────────────────────────

export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─── POST — Recebe e processa mensagens ───────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
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
        if (messageId) processedIds.add(messageId);

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
    console.info(`[WA Agent] 🚨 Escalonado para humano — ${phone} (${name ?? "sem nome"})`);
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
    console.error(`[WA Agent] Erro ao enviar para ${to}: ${err}`);
  }
}
