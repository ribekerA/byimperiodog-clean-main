"use client";

/**
 * AiMatchmakerChat — Substitui o PuppyMatcherQuiz com IA conversacional.
 *
 * Features:
 *  • Chat estilo messenger com bolhas animadas
 *  • Streaming de tokens — texto aparece palavra a palavra
 *  • Typing indicator (3 pontos pulsantes) durante geração
 *  • Parsing de <MATCHES>slug1,slug2</MATCHES> → cards com dados reais do catálogo
 *  • Fallback automático para quiz estático se Groq indisponível
 *  • Acessível (aria-live, roles, teclado)
 */

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import PuppyMatcherQuiz from "@/components/sections/PuppyMatcherQuiz";
import { PawConfettiButton } from "@/components/motion/PawConfetti";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { staticPuppies } from "@/content/puppies-static";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type Puppy = (typeof staticPuppies)[number];

// ─── Constantes ───────────────────────────────────────────────────────────────

const OPENING_MESSAGE: Message = {
  id:      "opening",
  role:    "assistant",
  content: "Oi! Aqui é a equipe da By Império Dog 🐾 A gente criou esse chat pra ajudar você a descobrir qual Spitz combina mais com o seu estilo de vida. Me conta: você mora em casa ou apartamento, e tem crianças ou outros animais em casa?",
};

const MATCHES_REGEX = /<MATCHES>([\s\S]*?)<\/MATCHES>/;

function parseMatches(text: string): Puppy[] {
  const m = text.match(MATCHES_REGEX);
  if (!m) return [];
  const slugs = m[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return slugs
    .map((slug) => staticPuppies.find((p) => p.slug === slug))
    .filter((p): p is Puppy => !!p);
}

function stripMatches(text: string): string {
  return text.replace(MATCHES_REGEX, "").trim();
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style:              "currency",
    currency:           "BRL",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const EASE = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number];

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5" aria-label="Equipe digitando">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-emerald-500"
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function BotBubble({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  const displayContent = stripMatches(content);
  return (
    <div className="flex items-end gap-2.5">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-base shadow-sm"
        aria-hidden="true"
      >
        🐾
      </div>
      <motion.div
        className="max-w-[80%] rounded-2xl rounded-bl-sm border border-zinc-100 bg-white px-4 py-3 shadow-sm"
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        {isStreaming && !displayContent ? (
          <TypingDots />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
            {displayContent}
            {isStreaming && (
              <span
                className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-zinc-400 align-middle"
                aria-hidden="true"
              />
            )}
          </p>
        )}
      </motion.div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <motion.div
        className="max-w-[80%] rounded-2xl rounded-br-sm bg-emerald-600 px-4 py-3 shadow-sm"
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: EASE }}
      >
        <p className="text-sm leading-relaxed text-white">{content}</p>
      </motion.div>
    </div>
  );
}

// ─── MatchCard: usa dados REAIS do catálogo ───────────────────────────────────

function MatchCard({ puppy, isPrimary, index }: { puppy: Puppy; isPrimary: boolean; index: number }) {
  const coverImg = puppy.images.find((img) => !img.endsWith(".mp4")) ?? puppy.images[0];
  const corLabel = (puppy as { cor?: string }).cor ?? puppy.color;
  const sexLabel = puppy.sex === "female" ? "Fêmea" : "Macho";
  const priceCents = (puppy as { priceCents?: number }).priceCents ?? (puppy as { price_cents?: number }).price_cents ?? 0;

  const waLink = buildWhatsAppLink({
    message:      `Olá! Fiz o quiz do site e o match indicado foi o ${puppy.name}. Quero saber mais sobre disponibilidade!`,
    utmSource:    "site",
    utmMedium:    "ai_matchmaker",
    utmCampaign:  "match_recommendation",
    utmContent:   puppy.slug,
  });

  return (
    <motion.article
      className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-md transition-all ${
        isPrimary
          ? "border-emerald-300 ring-2 ring-emerald-200 shadow-emerald-100"
          : "border-zinc-200"
      }`}
      initial={{ opacity: 0, y: 20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 24, delay: index * 0.1 }}
    >
      {isPrimary && (
        <div className="absolute left-0 right-0 top-0 z-10 bg-emerald-500 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-white">
          ✨ Melhor match
        </div>
      )}

      <Link href={`/filhotes/${puppy.slug}`} tabIndex={-1} aria-hidden="true">
        <div className={`relative aspect-[4/3] overflow-hidden bg-zinc-100 ${isPrimary ? "mt-5" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImg}
            alt={`${puppy.name} — Spitz Alemão Anão ${corLabel} ${sexLabel}`}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
            loading="lazy"
          />
          <span
            className={`absolute left-2 bottom-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow ${
              puppy.status === "available" ? "bg-emerald-500" : "bg-amber-500"
            }`}
          >
            {puppy.status === "available" ? "Disponível" : "Reservado"}
          </span>
          <span className="absolute right-2 bottom-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {sexLabel}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{corLabel}</p>
          <Link href={`/filhotes/${puppy.slug}`}>
            <h3 className="mt-0.5 text-sm font-bold text-zinc-900 hover:text-emerald-700 transition">
              {puppy.name}
            </h3>
          </Link>
        </div>

        {priceCents > 0 && (
          <p className="text-lg font-extrabold text-emerald-700">{formatPrice(priceCents)}</p>
        )}
        <p className="text-[9px] text-zinc-400 -mt-1">registro oficial incluso</p>

        <PawConfettiButton
          href={waLink}
          rel="noreferrer"
          target="_blank"
          className="mt-auto flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow hover:bg-emerald-700"
          emojis="mixed"
          count={12}
          aria-label={`Entrar em contato sobre ${puppy.name}`}
        >
          <WhatsAppIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Tenho interesse!
        </PawConfettiButton>

        <Link
          href={`/filhotes/${puppy.slug}`}
          className="text-center text-[10px] font-medium text-zinc-400 hover:text-emerald-600"
        >
          Ver galeria →
        </Link>
      </div>
    </motion.article>
  );
}

function MatchGrid({ puppies }: { puppies: Puppy[] }) {
  return (
    <motion.div
      className="mx-2 mt-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
        {puppies.length === 1 ? "Seu match perfeito" : `${puppies.length} opções para você`}
      </p>

      {/* Mobile: scroll horizontal snap quando 3 cards */}
      {puppies.length === 3 ? (
        <div className="sm:hidden">
          <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {puppies.map((puppy, i) => (
              <li key={puppy.slug} className="w-[72vw] max-w-[220px] shrink-0 snap-start">
                <MatchCard puppy={puppy} isPrimary={i === 0} index={i} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Desktop (e mobile quando ≤2 cards) */}
      <div
        className={`gap-3 ${
          puppies.length === 3 ? "hidden sm:grid sm:grid-cols-3" :
          puppies.length === 2 ? "grid grid-cols-2" :
          "grid grid-cols-1 mx-auto max-w-xs"
        }`}
      >
        {puppies.map((puppy, i) => (
          <MatchCard key={puppy.slug} puppy={puppy} isPrimary={i === 0} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AiMatchmakerChat() {
  const [messages,      setMessages]      = useState<Message[]>([OPENING_MESSAGE]);
  const [input,         setInput]         = useState("");
  const [streaming,     setStreaming]      = useState(false);
  const [matchedPuppies, setMatchedPuppies] = useState<Puppy[]>([]);
  const [useFallback,   setUseFallback]   = useState(false);
  const [streamingId,   setStreamingId]   = useState<string | null>(null);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const instanceId = useId();
  const reduced    = useReducedMotion();

  // ── Scroll para o fim quando nova mensagem chega ───────────────────────────
  useEffect(() => {
    if (!reduced) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, streaming, matchedPuppies, reduced]);

  // ── Envia mensagem ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      const userMsg: Message = {
        id:      `${instanceId}-user-${Date.now()}`,
        role:    "user",
        content: text.trim(),
      };

      const allMessages = [...messages, userMsg];
      setMessages(allMessages);
      setInput("");
      setStreaming(true);

      // Placeholder para mensagem da bot (streaming)
      const botId = `${instanceId}-bot-${Date.now()}`;
      setStreamingId(botId);
      setMessages((prev) => [...prev, { id: botId, role: "assistant", content: "" }]);

      try {
        const res = await fetch("/api/matchmaker", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            messages: allMessages.map(({ role, content }) => ({ role, content })),
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let   full    = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;

          setMessages((prev) =>
            prev.map((m) => (m.id === botId ? { ...m, content: full } : m))
          );
        }

        // Extrai e valida matches usando dados REAIS do catálogo
        const found = parseMatches(full);
        if (found.length > 0) {
          setMatchedPuppies(found);
        }
      } catch (err) {
        console.error("[Matchmaker] stream error:", err);
        if (messages.length <= 1) {
          setUseFallback(true);
          return;
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId
              ? { ...m, content: "Desculpe, tive um problema. Pode tentar novamente?" }
              : m
          )
        );
      } finally {
        setStreaming(false);
        setStreamingId(null);
        inputRef.current?.focus();
      }
    },
    [messages, streaming, instanceId]
  );

  // ── Fallback para quiz estático ────────────────────────────────────────────
  if (useFallback) return <PuppyMatcherQuiz />;

  const hasMatch            = matchedPuppies.length > 0;
  const isLastMsgStreaming  = streaming && streamingId === messages[messages.length - 1]?.id;

  return (
    <section
      className="mx-auto max-w-2xl px-4 py-16 sm:px-6"
      aria-labelledby="matchmaker-heading"
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
          Fale com a gente
        </p>
        <h2
          id="matchmaker-heading"
          className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-4xl"
        >
          Qual Spitz combina com você?
        </h2>
        <p className="mt-2 text-sm text-zinc-500 sm:text-base">
          Responda algumas perguntas e a nossa equipe indica o filhote ideal
        </p>
      </div>

      {/* Chat window */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-xl">

        {/* Topbar */}
        <div className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-lg shadow-sm">
            🐾
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900">By Império Dog</p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <p className="text-[11px] text-emerald-600">respondendo agora</p>
            </div>
          </div>
          <div className="ml-auto text-[11px] text-zinc-400">Bragança Paulista, SP</div>
        </div>

        {/* Messages */}
        <div
          className="flex max-h-[420px] min-h-[220px] flex-col gap-4 overflow-y-auto p-4 [scrollbar-width:thin] sm:max-h-[500px] sm:min-h-[240px]"
          role="log"
          aria-live="polite"
          aria-label="Conversa com a equipe By Império Dog"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div key={msg.id} layout={!reduced}>
                {msg.role === "assistant" ? (
                  <BotBubble
                    content={msg.content}
                    isStreaming={
                      streaming && idx === messages.length - 1 && isLastMsgStreaming
                    }
                  />
                ) : (
                  <UserBubble content={msg.content} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Grid de filhotes recomendados */}
          <AnimatePresence>
            {hasMatch && !streaming && (
              <MatchGrid puppies={matchedPuppies} />
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!hasMatch && (
          <div className="border-t border-zinc-200 bg-white p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={streaming ? "Equipe digitando..." : "Digite sua mensagem..."}
                disabled={streaming}
                aria-label="Sua mensagem"
                className="min-h-[44px] flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300/40 disabled:opacity-60"
              />
              <motion.button
                type="submit"
                disabled={!input.trim() || streaming}
                aria-label="Enviar mensagem"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                whileTap={!input.trim() || streaming ? {} : { scale: 0.88 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
              >
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </motion.button>
            </form>

            {/* Sugestões rápidas — só antes da 1ª troca */}
            {messages.length === 1 && !streaming && (
              <motion.div
                className="mt-2 flex flex-wrap gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {[
                  "🏢 Moro em apartamento",
                  "👶 Tenho filhos pequenos",
                  "🐾 Primeira vez com cão",
                  "🎁 É um presente",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    {suggestion}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Após o match — ações pós-recomendação */}
        {hasMatch && (
          <div className="flex items-center justify-between border-t border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs text-zinc-400">
              Gostou das sugestões? Fale com a gente pelo WhatsApp!
            </p>
            <button
              type="button"
              onClick={() => {
                setMessages([OPENING_MESSAGE]);
                setMatchedPuppies([]);
                setInput("");
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className="ml-4 shrink-0 text-xs text-zinc-400 hover:text-emerald-600 transition"
            >
              ↺ Recomeçar
            </button>
          </div>
        )}
      </div>

      {/* Fallback manual */}
      <p className="mt-3 text-center text-xs text-zinc-400">
        Prefere escolher direto?{" "}
        <button
          type="button"
          onClick={() => setUseFallback(true)}
          className="underline hover:text-emerald-600"
        >
          Ver quiz de múltipla escolha →
        </button>
      </p>
    </section>
  );
}
