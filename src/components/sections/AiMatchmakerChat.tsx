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

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { PawConfettiButton } from "@/components/motion/PawConfetti";
import PuppyMatcherQuiz from "@/components/sections/PuppyMatcherQuiz";
import { staticPuppies } from "@/content/puppies-static";
import { buildWhatsAppLink } from "@/lib/whatsapp";

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

const MATCHES_REGEX      = /<MATCHES>([\s\S]*?)<\/MATCHES>/;
const COLLECT_LEAD_REGEX = /<COLLECT_LEAD\s*\/>/;

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
  return text.replace(MATCHES_REGEX, "").replace(COLLECT_LEAD_REGEX, "").trim();
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style:              "currency",
    currency:           "BRL",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const EASE = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number];

// ─── Sugestões pós-match ──────────────────────────────────────────────────────

const POST_MATCH_SUGGESTIONS = [
  "Como funciona a reserva?",
  "Tem parcelamento?",
  "Como é a entrega?",
  "Posso visitar o canil?",
];

// ─── Formulário de lead inline ────────────────────────────────────────────────

function LeadInlineForm({ onSubmit }: { onSubmit: (nome: string, telefone: string) => Promise<boolean> }) {
  const [nome,      setNome]      = useState("");
  const [telefone,  setTelefone]  = useState("");
  const [done,      setDone]      = useState(false);
  const [sending,   setSending]   = useState(false);
  const [failed,    setFailed]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().length < 2 || telefone.replace(/\D/g, "").length < 10) return;
    setSending(true);
    setFailed(false);
    const ok = await onSubmit(nome.trim(), telefone.replace(/\D/g, ""));
    setSending(false);
    if (ok) setDone(true);
    else setFailed(true);
  };

  if (done) {
    return (
      <div className="mx-2 my-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status" aria-live="polite">
        ✅ Perfeito, {nome.split(" ")[0]}! A criadora vai entrar em contato pelo WhatsApp em breve. 🐾
      </div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="mx-2 my-3 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <p className="mb-3 text-sm font-semibold text-zinc-800">
        Deixe seu contato — a criadora fala com você hoje:
      </p>
      {failed && (
        <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700" role="alert">
          Não conseguimos salvar seu contato agora. Tente novamente.
        </p>
      )}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          aria-label="Seu nome"
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
          required
        />
        <input
          type="tel"
          inputMode="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value.replace(/\D/g, "").slice(0, 11))}
          placeholder="WhatsApp com DDD (ex: 11999887766)"
          aria-label="Seu WhatsApp"
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
          required
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60"
        >
          {sending ? "Enviando..." : "Quero ser contactada pela criadora"}
        </button>
      </div>
      <p className="mt-2 text-center text-[10px] text-zinc-400">
        Seus dados são protegidos. Respondemos em até 30 min no horário comercial.
      </p>
    </motion.form>
  );
}

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
        <div className={`relative aspect-square overflow-hidden bg-zinc-100 ${isPrimary ? "mt-5" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImg}
            alt={`${puppy.name} — Spitz Alemão Anão ${corLabel} ${sexLabel}`}
            className="h-full w-full object-cover object-top transition duration-500 hover:scale-105"
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
  const [messages,       setMessages]       = useState<Message[]>([OPENING_MESSAGE]);
  const [input,          setInput]          = useState("");
  const [streaming,      setStreaming]       = useState(false);
  const [matchedPuppies, setMatchedPuppies] = useState<Puppy[]>([]);
  const [useFallback,    setUseFallback]    = useState(false);
  const [streamingId,    setStreamingId]    = useState<string | null>(null);
  const [showLeadForm,   setShowLeadForm]   = useState(false);
  const [leadSubmitted,  setLeadSubmitted]  = useState(false);
  const [listening,    setListening]    = useState(false);
  const [voiceActive,  setVoiceActive]  = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceAlert,   setVoiceAlert]   = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const confirmResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bottomRef         = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLInputElement>(null);
  const voiceActiveRef    = useRef(false);
  const startListeningRef = useRef<() => void>(() => {});
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const silenceTimerRef   = useRef<number | null>(null);
  const maxTimerRef       = useRef<number | null>(null);
  const instanceId        = useId();
  const reduced           = useReducedMotion();

  // ── Scroll para o fim quando nova mensagem chega ───────────────────────────
  useEffect(() => {
    if (!reduced) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, streaming, matchedPuppies, reduced]);

  // ── Síntese de voz (TTS) — AI fala a resposta ────────────────────────────

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!("speechSynthesis" in window)) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const clean = text.replace(/<[^>]+>/g, "").replace(/[*_~`#]/g, "").trim();
    if (!clean) { onEnd?.(); return; }
    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(clean);
      utt.lang  = "pt-BR";
      utt.rate  = 1.05;
      utt.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const ptBR = voices.find((v) => v.lang.startsWith("pt") && v.name.toLowerCase().includes("female"))
        ?? voices.find((v) => v.lang.startsWith("pt"))
        ?? null;
      if (ptBR) utt.voice = ptBR;
      utt.onend   = () => setTimeout(() => onEnd?.(), 400);
      utt.onerror = () => setTimeout(() => onEnd?.(), 400);
      window.speechSynthesis.speak(utt);
    };
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { doSpeak(); return; }
    // Vozes ainda não carregaram — aguarda evento ou timeout
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      doSpeak();
    };
    setTimeout(doSpeak, 600);
  }, []);

  // ── Envia mensagem ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      // Para qualquer TTS em andamento antes de enviar
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();

      const userMsg: Message = {
        id:      `${instanceId}-user-${Date.now()}`,
        role:    "user",
        content: text.trim(),
      };

      const allMessages = [...messages, userMsg];
      setMessages(allMessages);
      setInput("");
      setStreaming(true);

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

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

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

        // Extrai matches — só na primeira vez
        const found = parseMatches(full);
        if (found.length > 0) {
          setMatchedPuppies((prev) => prev.length > 0 ? prev : found);
        }
        if (COLLECT_LEAD_REGEX.test(full) && !leadSubmitted && matchedPuppies.length > 0) {
          setShowLeadForm(true);
        }

        // Modo voz: lê a resposta e depois reinicia o microfone
        if (voiceActiveRef.current) {
          const displayText = stripMatches(full);
          speak(displayText, () => {
            if (!voiceActiveRef.current) return;
            startListeningRef.current();
          });
        }
      } catch (err) {
        console.error("[Matchmaker] stream error:", err);
        if (messages.length <= 1) { setUseFallback(true); return; }
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
        if (!voiceActiveRef.current) inputRef.current?.focus();
      }
    },
    [messages, streaming, instanceId, leadSubmitted, speak]
  );

  // ── Grava áudio e transcreve via Groq Whisper ─────────────────────────────
  const startListening = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const content = "🎙️ Seu navegador não suporta gravação de áudio. Use Chrome, Edge ou Safari.";
      setMessages((prev) => [...prev, {
        id:      `voice-nosupport-${Date.now()}`,
        role:    "assistant" as const,
        content,
      }]);
      setVoiceAlert(content);
      voiceActiveRef.current = false;
      setVoiceActive(false);
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name ?? "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        const content = "🎙️ Permissão do microfone negada. Clique no ícone ⓘ na barra de endereço → Microfone → Permitir.";
        setMessages((prev) => [...prev, {
          id:      `voice-denied-${Date.now()}`,
          role:    "assistant" as const,
          content,
        }]);
        setVoiceAlert(content);
      }
      voiceActiveRef.current = false;
      setVoiceActive(false);
      return;
    }

    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
      .find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      if (maxTimerRef.current)     clearTimeout(maxTimerRef.current);
      setListening(false);

      if (chunks.length === 0 || !voiceActiveRef.current) return;

      setTranscribing(true);
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        const ext  = (recorder.mimeType || "").includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `audio.${ext}`, { type: blob.type });
        const form = new FormData();
        form.append("audio", file);

        const res  = await fetch("/api/transcribe", { method: "POST", body: form });
        const data = await res.json() as { text?: string };
        if (data.text?.trim()) {
          sendMessage(data.text.trim());
        } else if (voiceActiveRef.current) {
          setTimeout(() => { if (voiceActiveRef.current) startListeningRef.current(); }, 400);
        }
      } catch {
        if (voiceActiveRef.current) {
          setTimeout(() => { if (voiceActiveRef.current) startListeningRef.current(); }, 600);
        }
      } finally {
        setTranscribing(false);
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start(200);
    setListening(true);

    // Detecção de silêncio via Web Audio API
    const audioCtx = new AudioContext();
    const source   = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const dataArr = new Uint8Array(analyser.frequencyBinCount);
    let silenceStart: number | null = null;
    const SILENCE_THRESHOLD = 8;
    const SILENCE_DURATION  = 1800;

    silenceTimerRef.current = window.setInterval(() => {
      analyser.getByteFrequencyData(dataArr);
      const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;
      if (avg < SILENCE_THRESHOLD) {
        if (!silenceStart) silenceStart = Date.now();
        else if (Date.now() - silenceStart > SILENCE_DURATION) {
          if (recorder.state === "recording") recorder.stop();
          audioCtx.close();
        }
      } else {
        silenceStart = null;
      }
    }, 100);

    maxTimerRef.current = window.setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
      audioCtx.close();
    }, 15000);
  }, [sendMessage]);

  // Mantém ref atualizada para evitar stale closure em sendMessage
  startListeningRef.current = startListening;

  // ── Toggle modo voz conversacional ────────────────────────────────────────
  const toggleVoice = useCallback(() => {
    if (voiceActiveRef.current) {
      voiceActiveRef.current = false;
      setVoiceActive(false);
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      if (maxTimerRef.current)     clearTimeout(maxTimerRef.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setListening(false);
      setTranscribing(false);
    } else {
      voiceActiveRef.current = true;
      setVoiceActive(true);
      startListening();
    }
  }, [startListening]);

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

        {voiceAlert && (
          <div className="sr-only" role="alert" aria-live="assertive">
            {voiceAlert}
          </div>
        )}

        {voiceActive && (
          <div className="sr-only" role="status" aria-live="polite">
            {listening ? "Ouvindo... fale agora" : transcribing ? "Transcrevendo sua fala..." : ""}
          </div>
        )}

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

          {/* Formulário inline de lead — aparece quando IA pede <COLLECT_LEAD/> */}
          <AnimatePresence>
            {showLeadForm && !leadSubmitted && (
              <LeadInlineForm
                onSubmit={async (nome, telefone) => {
                  try {
                    const res = await fetch("/api/leads", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        nome,
                        telefone,
                        consent_lgpd: true,
                        consent_timestamp: new Date().toISOString(),
                        consent_version: "1.0",
                        page_type: "ai_matchmaker",
                        page_slug: matchedPuppies[0]?.slug,
                        cor_preferida: (matchedPuppies[0] as { cor?: string })?.cor ?? matchedPuppies[0]?.color,
                      }),
                    });
                    if (!res.ok) return false;
                    setLeadSubmitted(true);
                    return true;
                  } catch {
                    return false;
                  }
                }}
              />
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Input — sempre visível, contexto muda pós-match */}
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
              placeholder={
                listening
                  ? "🎙️ Ouvindo... fale agora"
                  : transcribing
                  ? "✍️ Transcrevendo sua fala..."
                  : streaming
                  ? "Equipe digitando..."
                  : hasMatch
                  ? "Tem alguma dúvida? Pode perguntar..."
                  : "Digite ou use o microfone..."
              }
              disabled={streaming || transcribing}
              aria-label="Sua mensagem"
              className={`min-h-[44px] flex-1 rounded-xl border bg-zinc-50 px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 disabled:opacity-60 transition-colors ${
                listening
                  ? "border-emerald-400 bg-emerald-50 focus:border-emerald-400 focus:ring-emerald-300/40 ring-2 ring-emerald-200"
                  : "border-zinc-200 focus:border-emerald-400 focus:ring-emerald-300/40"
              }`}
            />

            {/* Botão microfone — modo voz conversacional (Chrome/Edge) */}
            <motion.button
              type="button"
              onClick={toggleVoice}
              aria-label={voiceActive ? "Desligar modo voz" : "Ativar modo voz conversacional"}
              aria-pressed={voiceActive}
              title={voiceActive ? "Clique para desligar a voz" : "Modo voz: fale e a Ju responde"}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                listening
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-200"
                  : transcribing
                  ? "bg-amber-400 text-white"
                  : voiceActive
                  ? "bg-emerald-100 border border-emerald-400 text-emerald-700"
                  : "border border-zinc-200 bg-white text-zinc-500 hover:border-emerald-300 hover:text-emerald-600"
              }`}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              {listening ? (
                <motion.span className="flex items-end gap-[2px] h-4" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.span key={i} className="w-[3px] rounded-full bg-white"
                      animate={{ height: ["6px", "16px", "6px"] }}
                      transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1, ease: "easeInOut" }} />
                  ))}
                </motion.span>
              ) : (
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="1" width="6" height="11" rx="3" />
                  <path d="M19 10a7 7 0 0 1-14 0" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="9" y1="23" x2="15" y2="23" />
                </svg>
              )}
            </motion.button>

            <motion.button
              type="submit"
              disabled={!input.trim() || streaming}
              aria-label="Enviar mensagem"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              whileTap={!input.trim() || streaming ? {} : { scale: 0.88 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </motion.button>
          </form>

          {/* Sugestões pré-match — só na 1ª mensagem */}
          {messages.length === 1 && !streaming && !hasMatch && (
            <motion.div className="mt-2 flex flex-wrap gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              {["🏢 Moro em apartamento", "👶 Tenho filhos pequenos", "🐾 Primeira vez com cão", "🎁 É um presente"].map((s) => (
                <button key={s} type="button" onClick={() => sendMessage(s)}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
                  {s}
                </button>
              ))}
            </motion.div>
          )}

          {/* Sugestões pós-match — dúvidas comuns */}
          {hasMatch && !streaming && (
            <motion.div className="mt-2 flex flex-wrap gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              {POST_MATCH_SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => sendMessage(s)}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Barra inferior com recomeçar */}
        {hasMatch && (
          <div className="flex items-center justify-end border-t border-zinc-100 bg-zinc-50 px-4 py-2">
            <button
              type="button"
              onClick={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  confirmResetTimeout.current = setTimeout(() => setConfirmReset(false), 3000);
                  return;
                }
                if (confirmResetTimeout.current) clearTimeout(confirmResetTimeout.current);
                setConfirmReset(false);
                setMessages([OPENING_MESSAGE]);
                setMatchedPuppies([]);
                setShowLeadForm(false);
                setLeadSubmitted(false);
                setInput("");
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className={`text-xs transition ${confirmReset ? "font-semibold text-rose-600" : "text-zinc-400 hover:text-emerald-600"}`}
            >
              {confirmReset ? "Clique de novo para confirmar" : "↺ Recomeçar"}
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
