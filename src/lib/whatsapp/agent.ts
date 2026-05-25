/**
 * WhatsApp Agent — Orquestrador de Skills
 *
 * Classifica a intenção da mensagem via OpenAI e roda a skill adequada.
 * Skills disponíveis: saudacao | mostrar_filhotes | responder_faq | escalar_humano
 */

import OpenAI from "openai";

import { staticPuppies } from "@/content/puppies-static";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentIntent =
  | "saudacao"
  | "mostrar_filhotes"
  | "responder_faq"
  | "escalar_humano";

export interface IncomingMessage {
  phone: string;       // E.164 sem "+", ex: "5511999999999"
  name?: string;       // Nome do contato (opcional, vem da API)
  text: string;        // Texto da mensagem
  messageId?: string;  // ID único da mensagem (deduplicação)
}

export interface AgentResponse {
  reply: string;
  intent: AgentIntent;
  escalate: boolean;
}

// ─── FAQ estático ─────────────────────────────────────────────────────────────

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "qual o preço / valor / quanto custa",
    a: "Os filhotes variam de R$ 3.500 a R$ 5.500 dependendo da cor e sexo. O valor inclui pedigree CBKC, laudo cardiológico, vacinação, microchip, mentoria vitalícia e enxoval.",
  },
  {
    q: "pedigree cbkc incluso",
    a: "Sim! Todos os nossos filhotes têm pedigree CBKC oficial incluso no valor. Você recebe a documentação antes de confirmar a reserva.",
  },
  {
    q: "entrega transporte frete envio",
    a: "Orientamos sobre transporte seguro. Você pode buscar pessoalmente em Bragança Paulista/SP ou usarmos uma transportadora especializada em pets. O frete é por conta do comprador.",
  },
  {
    q: "cor raça spitz pomerania lulu",
    a: "Criamos Spitz Alemão Anão (Lulu da Pomerânia). Temos filhotes nas cores creme, laranja, preto e chocolate. Cada cor tem características únicas!",
  },
  {
    q: "reserva como reservar entrada",
    a: "A reserva é feita com entrada de 30%. Após confirmada, o filhote fica exclusivamente seu até a entrega. Fale comigo para verificar disponibilidade!",
  },
  {
    q: "mentoria suporte apoio dúvidas",
    a: "Oferecemos mentoria vitalícia direto com a criadora via WhatsApp — alimentação, comportamento, saúde, rotina. Você nunca fica sozinho!",
  },
  {
    q: "saúde vacinação laudo exame",
    a: "Todos os filhotes têm vacinação completa em dia, laudo cardiológico, microchip e acompanhamento veterinário desde o nascimento.",
  },
  {
    q: "localização onde fica endereço",
    a: "Somos de Bragança Paulista, SP. Atendemos pessoalmente com agendamento prévio. Clientes de todo o Brasil são atendidos via transportadora.",
  },
];

// ─── Skill: Mostrar filhotes ───────────────────────────────────────────────────

function skillMostrarFilhotes(text: string): string {
  const available = (staticPuppies as any[]).filter(
    (p) => p.status !== "sold" && p.status !== "vendido"
  );

  if (available.length === 0) {
    return (
      "No momento não temos filhotes disponíveis, mas você pode entrar na lista de espera para a próxima ninhada! " +
      "Quer garantir seu lugar com prioridade? 🐾"
    );
  }

  // Detectar preferência de cor ou sexo na mensagem
  const lower = text.toLowerCase();
  let filtered = available;

  if (lower.includes("fêmea") || lower.includes("femea") || lower.includes("fêmeas")) {
    filtered = available.filter((p) => p.sex === "female" || p.sex === "femea");
  } else if (lower.includes("macho") || lower.includes("machos")) {
    filtered = available.filter((p) => p.sex === "male" || p.sex === "macho");
  }

  for (const cor of ["creme", "laranja", "preto", "chocolate", "branco"]) {
    if (lower.includes(cor)) {
      const byColor = filtered.filter((p) =>
        (p.color ?? p.cor ?? "").toLowerCase().includes(cor)
      );
      if (byColor.length > 0) filtered = byColor;
      break;
    }
  }

  const list = filtered.slice(0, 4);
  const lines = list.map((p) => {
    const cor = p.cor ?? p.color ?? "";
    const sexo = p.sex === "female" ? "Fêmea" : "Macho";
    const preco =
      p.priceCents || p.price_cents
        ? `R$ ${((p.priceCents ?? p.price_cents) / 100).toLocaleString("pt-BR")}`
        : "Sob consulta";
    const status =
      p.status === "reserved" || p.status === "reservado" ? " ⏳ *Reservado*" : " ✅ *Disponível*";
    return `🐾 *${p.name}* — ${cor} ${sexo} — ${preco}${status}`;
  });

  const extra =
    filtered.length > 4
      ? `\n\n_...e mais ${filtered.length - 4} filhotes. Acesse o catálogo completo: byimperiodog.com.br/filhotes_`
      : "";

  return (
    `Ótima notícia! Temos *${available.length} filhotes* disponíveis agora 🎉\n\n` +
    lines.join("\n") +
    extra +
    "\n\nQual te interessou? Posso enviar fotos e vídeos exclusivos! 📸"
  );
}

// ─── Skill: Responder FAQ ─────────────────────────────────────────────────────

function skillResponderFaq(text: string): string | null {
  const lower = text.toLowerCase();
  for (const item of FAQ) {
    const keywords = item.q.split(" / ");
    if (keywords.some((kw) => lower.includes(kw))) {
      return item.a;
    }
  }
  return null;
}

// ─── Skill: Saudação ─────────────────────────────────────────────────────────

function skillSaudacao(name?: string): string {
  const firstName = name ? ` ${name.trim().split(" ")[0]}` : "";
  return (
    `Olá${firstName}! 🐾 Seja bem-vindo(a) à *By Império Dog* — criação familiar de Spitz Alemão Anão (Lulu da Pomerânia).\n\n` +
    `Como posso te ajudar hoje?\n\n` +
    `1️⃣ Ver filhotes disponíveis\n` +
    `2️⃣ Saber sobre preços e condições\n` +
    `3️⃣ Dúvidas sobre raça, saúde ou documentação\n` +
    `4️⃣ Falar com a criadora\n\n` +
    `É só digitar o número ou me contar o que você procura! 😊`
  );
}

// ─── Skill: Escalar para humano ───────────────────────────────────────────────

function skillEscalarHumano(name?: string): string {
  const firstName = name ? ` ${name.trim().split(" ")[0]}` : "";
  return (
    `Claro${firstName}! Vou chamar a criadora agora para falar diretamente com você. ` +
    `Um momento, ela responderá em breve! 🐾\n\n` +
    `_(Atendimento humano ativado — aguarde algumas mensagens)_`
  );
}

// ─── Classificador de intenção ────────────────────────────────────────────────

async function classifyIntent(text: string): Promise<AgentIntent> {
  const lower = text.toLowerCase();

  // Regras heurísticas rápidas (evita chamada OpenAI desnecessária)
  if (/^(oi|olá|ola|bom dia|boa tarde|boa noite|hey|hi|hello|opa|oii)\b/.test(lower)) {
    return "saudacao";
  }
  if (/filhot|disponí|catalogo|catálogo|ver filh|quero ver|tem filh|mostre|lista/.test(lower)) {
    return "mostrar_filhotes";
  }
  if (/\b(falar|humano|criadora|pessoa|atendente|atendimento|ajuda real|não entendi)\b/.test(lower)) {
    return "escalar_humano";
  }
  if (/\b(preço|preco|valor|quanto|custo|custa|parcel|pedi|pedigree|vaccin|saúde|saude|raça|raca|entrega|transport|reserv|entrada|document)\b/.test(lower)) {
    return "responder_faq";
  }

  // Fallback: classificação com OpenAI para mensagens ambíguas
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 20,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Você é um classificador de intenção para um chatbot de venda de filhotes Spitz Alemão. " +
            "Retorne SOMENTE uma das opções: saudacao | mostrar_filhotes | responder_faq | escalar_humano. " +
            "Use escalar_humano quando a mensagem não se encaixa nas outras categorias ou pede atendimento pessoal.",
        },
        { role: "user", content: text },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim().toLowerCase() ?? "";
    if (raw.includes("mostrar_filhotes")) return "mostrar_filhotes";
    if (raw.includes("responder_faq")) return "responder_faq";
    if (raw.includes("escalar_humano")) return "escalar_humano";
    return "saudacao";
  } catch {
    return "saudacao";
  }
}

// ─── Salvar lead no Supabase ──────────────────────────────────────────────────

async function upsertWhatsAppLead(phone: string, name?: string, intent?: string) {
  try {
    const sb = supabaseAdmin();

    // Avoid duplicate rows within the last 1 hour for the same phone
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existing } = await sb
      .from("leads")
      .select("id")
      .eq("telefone", phone)
      .gte("created_at", since)
      .limit(1)
      .maybeSingle();

    if (existing) return; // Already logged this session

    await sb.from("leads").insert({
      telefone: phone,
      nome: name ?? null,
      source: "whatsapp_agent",
      status: "novo",
      page_type: "whatsapp",
      page_intent: intent ?? null,
      consent_lgpd: true,
      consent_version: "wa_implicit_1.0",
      consent_timestamp: new Date().toISOString(),
    });
  } catch {
    // Non-critical — don't let lead saving block the reply
  }
}

// ─── Orquestrador principal ───────────────────────────────────────────────────

export async function runAgent(msg: IncomingMessage): Promise<AgentResponse> {
  const intent = await classifyIntent(msg.text);

  // Try FAQ first for faq intent (rule-based, fast)
  let reply: string;
  let escalate = false;

  switch (intent) {
    case "mostrar_filhotes":
      reply = skillMostrarFilhotes(msg.text);
      break;

    case "responder_faq": {
      const faqAnswer = skillResponderFaq(msg.text);
      if (faqAnswer) {
        reply =
          faqAnswer +
          "\n\nTem mais dúvidas ou quer ver os filhotes disponíveis? É só perguntar! 🐾";
      } else {
        // FAQ não encontrou resposta — tenta mostrar filhotes ou escalona
        reply = skillMostrarFilhotes(msg.text);
      }
      break;
    }

    case "escalar_humano":
      reply = skillEscalarHumano(msg.name);
      escalate = true;
      break;

    case "saudacao":
    default:
      reply = skillSaudacao(msg.name);
      break;
  }

  // Save lead asynchronously (fire-and-forget)
  upsertWhatsAppLead(msg.phone, msg.name, intent).catch(() => null);

  return { reply, intent, escalate };
}
