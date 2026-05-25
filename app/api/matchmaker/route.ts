export const dynamic = "force-dynamic";

/**
 * POST /api/matchmaker
 *
 * Chat com skills para o Matchmaker de filhotes.
 * Groq via OpenAI SDK (API-compatível).
 *
 * Body: { messages: Array<{ role: "user"|"assistant", content: string }> }
 * Response: text/plain stream
 */

import OpenAI from "openai";
import type { NextRequest } from "next/server";

// ─── Catálogo ──────────────────────────────────────────────────────────────────

const CATALOG = `
FILHOTES DISPONÍVEIS — By Império Dog (Bragança Paulista, SP):
Todos acompanham: pedigree CBKC • vacinação completa • microchip • laudo cardiológico • enxoval • mentoria vitalícia

SLUG                                    | Nome                 | Sexo   | Cor         | Preço
spitz-alemao-anao-creme-femea           | Spitz Creme Fêmea    | Fêmea  | Creme       | R$15.000
spitz-alemao-anao-preto-femea           | Spitz Preto Fêmea    | Fêmea  | Preto       | R$13.000
spitz-alemao-anao-laranja-femea         | Spitz Laranja Fêmea  | Fêmea  | Laranja     | R$10.000
spitz-alemao-anao-wolf-sable-femea      | Wolf Sable Fêmea     | Fêmea  | Wolf Sable  | R$11.000
spitz-alemao-anao-creme-macho           | Spitz Creme Macho    | Macho  | Creme       | R$9.000
spitz-alemao-anao-preto-macho           | Spitz Preto Macho    | Macho  | Preto       | R$8.000
spitz-alemao-anao-laranja-macho         | Spitz Laranja Macho  | Macho  | Laranja     | R$7.000
spitz-alemao-anao-wolf-sable-macho      | Wolf Sable Macho     | Macho  | Wolf Sable  | R$7.500

PERSONALIDADE POR COR:
- Creme: pelagem sedosa creme/marfim, temperamento dócil e carinhoso, a mais valorizada
- Laranja: cor clássica do Spitz, alegre e extrovertido, ama interagir com crianças
- Preto: elegante e leal, vínculo muito profundo com o tutor, protetor
- Wolf Sable: pelagem bicolor rara (cinza/preto), muito inteligente e expressivo

FRETE/ENTREGA: entregamos em todo o Brasil com cuidado especializado
PARCELAMENTO: consultar condições com a equipe via WhatsApp
`;

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você faz parte da equipe da By Império Dog, criador premium de Spitz Alemão Anão há mais de 10 anos em Bragança Paulista, SP.

Você conversa com pessoas interessadas em adotar um filhote e ajuda a encontrar o match certo para o perfil delas. Você é atencioso, caloroso e conhece profundamente a raça.

${CATALOG}

## SKILLS — o que você sabe fazer:

### SKILL 1 — Recomendar filhote
Quando o visitante compartilhar informações sobre estilo de vida (moradia, família, rotina), analise e recomende o filhote mais adequado.
Antes de recomendar, faça no máximo 2-3 perguntas curtas para entender o perfil.
Quando tiver informação suficiente, finalize com o bloco MATCHES (veja formato abaixo).

### SKILL 2 — Informar preços
Se perguntarem sobre preço, informe o valor do filhote específico ou da cor de interesse.
Mencione que todos incluem pedigree, vacinas, microchip e mentoria.

### SKILL 3 — Explicar a raça
Se perguntarem sobre características, temperamento, tamanho, cuidados ou saúde do Spitz Alemão Anão:
- Adultos: 2–3,5 kg, pelagem dupla (requer escovação semanal)
- Muito inteligentes, adaptam bem a apartamento, baixa energia física mas alta social
- Vivem 12–16 anos, são saudáveis com boa criação
- Não gostam de ficar sozinhos por muito tempo

### SKILL 4 — Informar sobre o processo de adoção
Se perguntarem como funciona: o interessado entra em contato via WhatsApp, a criadora faz uma entrevista rápida para conhecer a família, fecha reserva com sinal e combina a entrega.

### SKILL 5 — Lidar com dúvidas e objeções
- "É caro demais": explique o que está incluído (vacinas, pedigree, microchip, mentoria vitalícia) e o custo de adquirir separado vs. tudo incluso
- "Tenho apartamento pequeno": tranquilize, o Spitz se adapta muito bem
- "Nunca tive cachorro": diga que a mentoria vitalícia é exatamente para isso
- "Viajo muito": pergunte quanto tempo fica fora e ajude a avaliar

## FORMATO DA RECOMENDAÇÃO FINAL
Quando tiver informação suficiente para indicar os filhotes, inclua ao final da mensagem exatamente este bloco — uma linha só, sem nada antes ou depois do bloco:

<MATCHES>slug-principal,slug-alternativa-1,slug-alternativa-2</MATCHES>

Use os slugs EXATOS da tabela acima. Liste de 1 a 3 slugs separados por vírgula, começando pelo mais adequado ao perfil.
Exemplo real: <MATCHES>spitz-alemao-anao-creme-femea,spitz-alemao-anao-laranja-femea</MATCHES>

## TOM E ESTILO
- Fale como um membro real da equipe, não como atendente virtual ou IA
- Use "a gente", "nossos filhotes", "aqui no canil" — nunca "eu sou uma IA"
- Tom: amigável, próximo, como amigo que entende de cão — não formal, não vendedor
- Português brasileiro coloquial (pode usar "né", "tá", "que tal")
- Máximo 3-4 frases por mensagem — seja direto e humano
- Emojis: 0-1 por mensagem, só quando natural
- Se a conversa fugir do tema (filhotes/raça/adoção): redirecione gentilmente`;

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let messages: Array<{ role: "user" | "assistant"; content: string }>;

  try {
    const body = await req.json();
    messages = body.messages ?? [];
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes("placeholder")) {
    return new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const stream = await client.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      messages:    [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      stream:      true,
      max_tokens:  500,
      temperature: 0.82,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content ?? "";
            if (token) controller.enqueue(encoder.encode(token));
          }
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.controller.abort();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type":      "text/plain; charset=utf-8",
        "Cache-Control":     "no-cache, no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: unknown) {
    console.error("[Matchmaker] Groq error:", err);
    return new Response(JSON.stringify({ error: "AI service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
