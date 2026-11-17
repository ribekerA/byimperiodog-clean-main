"use client";

/**
 * TesteDeAfinidade — o bloco "Encontre o filhote" da home.
 *
 * Substituiu o chat como primeira tela (pedido de 17/11/2026: "esse quiz está
 * morto"). O chat abria com uma caixa de texto vazia, e caixa vazia pede que a
 * pessoa saiba o que perguntar; quatro cartões grandes pedem só um toque.
 *
 * O que mantém o bloco vivo:
 *  • a vitrine ao lado da pergunta se filtra a cada toque — a pessoa vê as
 *    fotos reais sumindo e ficando conforme responde;
 *  • a barra de perfil sobe 25% por resposta, com as patas acendendo;
 *  • as teclas 1 a 4 respondem, e cada resposta avança sozinha;
 *  • no fim, as respostas viram uma mensagem pronta para o WhatsApp.
 *
 * O que ele NÃO faz: dizer qual filhote é o certo para a pessoa, nem dizer o
 * que está disponível. A vitrine é referência visual permanente
 * (content/puppies-static.ts), e quem confirma o que existe é o atendimento.
 * As perguntas de moradia e convívio não filtram nada: elas entram na
 * mensagem para a equipe já começar a conversa sabendo o contexto.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { type ComponentProps, type ComponentType, useCallback, useEffect, useMemo, useState } from "react";

import StaticPuppyCard from "@/components/catalog/StaticPuppyCard";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { PawConfettiButton } from "@/components/motion/PawConfetti";
import { puppiesPublicados } from "@/content/puppies-static";
import { PISO_FEMEA, PISO_MACHO, textoAPartirDeNoPix } from "@/domain/pricing";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { trackCTAClick } from "@/lib/events";
import { capaDoCartao, focoDaFoto } from "@/lib/photo-focus";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type Filhote = (typeof puppiesPublicados)[number];

type Opcao = {
  value: string;
  label: string;
  /** Linha miúda embaixo do rótulo. */
  detalhe?: string;
  emoji?: string;
  /** Foto real da vitrine, usada nos cartões de cor. */
  foto?: string;
  /** Trecho que entra na mensagem do WhatsApp. */
  frase: string;
};

type Pergunta = {
  id: "moradia" | "convivio" | "cor" | "sexo";
  titulo: string;
  opcoes: Opcao[];
};

const VERDE = "#0a3f25";
const OURO = "#e3bb64";

function fotoDe(p: Filhote | undefined): string | undefined {
  if (!p) return undefined;
  const foto = p.images.find((img) => !img.endsWith(".mp4")) ?? p.images[0];
  return capaDoCartao(foto) ?? foto;
}

function sexoDe(p: Filhote): "female" | "male" {
  return p.sex === "female" ? "female" : "male";
}

// As cores saem da vitrine publicada, não de uma lista escrita aqui: uma cor
// sem foto publicada viraria um cartão que filtra para zero.
const CORES_NA_VITRINE: Opcao[] = Array.from(
  new Map(puppiesPublicados.map((p) => [p.color, p])).values(),
).map((p) => ({
  value: p.color,
  label: p.cor,
  foto: fotoDe(p),
  frase: `na cor ${p.cor.toLowerCase()}`,
}));

const PERGUNTAS: Pergunta[] = [
  {
    id: "moradia",
    titulo: "Onde o seu Lulu da Pomerânia vai morar?",
    opcoes: [
      { value: "apartamento", label: "Apartamento", emoji: "🏢", frase: "Moro em apartamento" },
      { value: "casa_quintal", label: "Casa com quintal", emoji: "🏡", frase: "Moro em casa com quintal" },
      { value: "casa", label: "Casa sem quintal", emoji: "🏠", frase: "Moro em casa sem quintal" },
    ],
  },
  {
    id: "convivio",
    titulo: "Quem vai conviver com o Lulu da Pomerânia?",
    opcoes: [
      { value: "criancas", label: "Crianças pequenas", emoji: "🧸", frase: "tenho crianças pequenas em casa" },
      { value: "adultos", label: "Só adultos", emoji: "☕", frase: "em casa somos só adultos" },
      { value: "pets", label: "Outros animais", emoji: "🐾", frase: "tenho outros animais" },
      { value: "presente", label: "É um presente", emoji: "🎁", frase: "é para presentear alguém" },
    ],
  },
  {
    id: "cor",
    titulo: "Qual cor de Lulu da Pomerânia chama a sua atenção?",
    opcoes: [
      ...CORES_NA_VITRINE,
      { value: "qualquer", label: "Ainda não sei", emoji: "🎨", frase: "ainda sem cor definida" },
    ],
  },
  {
    id: "sexo",
    titulo: "Lulu da Pomerânia macho ou fêmea?",
    opcoes: [
      // O preço é o único dado que separa os dois na comunicação; sexo não
      // vende personalidade (ver o histórico em PuppyMatcherQuiz).
      { value: "female", label: "Fêmea", emoji: "♀", detalhe: textoAPartirDeNoPix(PISO_FEMEA), frase: "fêmea" },
      { value: "male", label: "Macho", emoji: "♂", detalhe: textoAPartirDeNoPix(PISO_MACHO), frase: "macho" },
      { value: "qualquer", label: "Tanto faz", emoji: "✨", detalhe: `${textoAPartirDeNoPix(PISO_MACHO)}`, frase: "macho ou fêmea" },
    ],
  },
];

type Respostas = Partial<Record<Pergunta["id"], string>>;

function filtrar(respostas: Respostas): Filhote[] {
  return puppiesPublicados.filter((p) => {
    const cor = respostas.cor;
    const sexo = respostas.sexo;
    if (cor && cor !== "qualquer" && p.color !== cor) return false;
    if (sexo && sexo !== "qualquer" && sexoDe(p) !== sexo) return false;
    return true;
  });
}

function opcaoDe(id: Pergunta["id"], value: string | undefined): Opcao | undefined {
  return PERGUNTAS.find((q) => q.id === id)?.opcoes.find((o) => o.value === value);
}

// ─── Peças visuais ────────────────────────────────────────────────────────────

function PataIcone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <ellipse cx="6" cy="9" rx="2.2" ry="2.8" />
      <ellipse cx="10" cy="5.5" rx="2.2" ry="2.8" />
      <ellipse cx="14" cy="5.5" rx="2.2" ry="2.8" />
      <ellipse cx="18" cy="9" rx="2.2" ry="2.8" />
      <path d="M12 11c-3.3 0-6 3.2-6 5.8 0 2 1.6 3.2 3.4 3.2 1 0 1.7-.5 2.6-.5s1.6.5 2.6.5c1.8 0 3.4-1.2 3.4-3.2C18 14.2 15.3 11 12 11z" />
    </svg>
  );
}

function BarraDePerfil({ passo, total }: { passo: number; total: number }) {
  const pct = Math.round((Math.min(passo, total) / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label="Perfil montado"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, #c9973f, ${OURO})` }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
        />
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <motion.span
            key={i}
            initial={false}
            animate={{ scale: i < passo ? 1 : 0.8, opacity: i < passo ? 1 : 0.3 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            style={{ color: i < passo ? OURO : "#fff" }}
          >
            <PataIcone className="h-4 w-4" />
          </motion.span>
        ))}
      </div>
      <span className="min-w-[3.2rem] text-right text-xs font-bold tabular-nums" style={{ color: OURO }}>
        {pct}%
      </span>
    </div>
  );
}

function VitrineAoVivo({ filhotes }: { filhotes: Filhote[] }) {
  const reduced = useReducedMotion();
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-3" aria-live="polite">
      <p className="mb-2 flex items-center justify-between text-xs text-white/70">
        <span>Vitrine do Lulu da Pomerânia ao vivo</span>
        <motion.span
          key={filhotes.length}
          initial={reduced ? false : { scale: 1.4, color: OURO }}
          animate={{ scale: 1, color: "rgba(255,255,255,0.9)" }}
          className="font-bold tabular-nums"
        >
          {filhotes.length} {filhotes.length === 1 ? "foto combina" : "fotos combinam"}
        </motion.span>
      </p>
      <motion.ul layout className="flex flex-wrap gap-1.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {filhotes.map((p) => {
            const foto = fotoDe(p);
            return (
              <motion.li
                key={p.slug}
                layout
                initial={reduced ? false : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="relative h-11 w-11 overflow-hidden rounded-xl ring-2 ring-white/20 sm:h-12 sm:w-12"
              >
                {foto && (
                  <Image
                    src={foto}
                    alt=""
                    fill
                    sizes="48px"
                    quality={50}
                    className="object-cover"
                    style={capaDoCartao(foto) ? undefined : { objectPosition: focoDaFoto(foto) }}
                  />
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}

function ChuvaDePatas() {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => {
        const x = (i * 37) % 100;
        return (
          <motion.span
            key={i}
            className="absolute top-0"
            style={{ left: `${x}%`, color: i % 2 ? OURO : "#ffffff" }}
            initial={{ y: -30, opacity: 0, rotate: 0 }}
            animate={{ y: 340, opacity: [0, 1, 1, 0], rotate: (i % 2 ? 1 : -1) * 90 }}
            transition={{ duration: 1.6 + (i % 4) * 0.2, delay: (i % 5) * 0.08, ease: "easeOut" }}
          >
            <PataIcone className="h-4 w-4" />
          </motion.span>
        );
      })}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

type ChatProps = { embutido?: boolean };

export default function TesteDeAfinidade() {
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [escolhaRecente, setEscolhaRecente] = useState<string | null>(null);
  const [Chat, setChat] = useState<ComponentType<ChatProps> | null>(null);
  const reduced = useReducedMotion();

  const total = PERGUNTAS.length;
  const terminou = passo >= total;
  const pergunta = PERGUNTAS[Math.min(passo, total - 1)];
  const filhotes = useMemo(() => filtrar(respostas), [respostas]);

  // Sem combinação exata, o resultado cai para a cor e depois para a vitrine
  // inteira: tela de resultado vazia é beco sem saída.
  const resultado = useMemo(() => {
    if (filhotes.length > 0) return filhotes.slice(0, 3);
    const soCor = filtrar({ cor: respostas.cor });
    return (soCor.length > 0 ? soCor : puppiesPublicados).slice(0, 3);
  }, [filhotes, respostas.cor]);

  const responder = useCallback(
    (valor: string) => {
      if (terminou || escolhaRecente) return;
      setEscolhaRecente(valor);
      setRespostas((r) => ({ ...r, [pergunta.id]: valor }));
      if (passo === 0) trackCTAClick("teste_afinidade_inicio", "home");
      window.setTimeout(
        () => {
          setEscolhaRecente(null);
          setPasso((p) => p + 1);
          if (passo + 1 >= total) trackCTAClick("teste_afinidade_fim", "home");
        },
        reduced ? 80 : 380,
      );
    },
    [terminou, escolhaRecente, pergunta.id, passo, total, reduced],
  );

  // Teclas 1 a 4 respondem a pergunta da vez — só quando o foco não está num
  // campo de texto (o chat embutido tem um).
  useEffect(() => {
    if (terminou) return;
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      const opcao = pergunta.opcoes[n - 1];
      if (opcao) responder(opcao.value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [terminou, pergunta, responder]);

  const recomecar = () => {
    setPasso(0);
    setRespostas({});
    setEscolhaRecente(null);
  };

  const abrirChat = () => {
    trackCTAClick("teste_afinidade_chat", "home");
    void import("@/components/sections/AiMatchmakerChat").then((m) => setChat(() => m.default));
  };

  const moradia = opcaoDe("moradia", respostas.moradia);
  const convivio = opcaoDe("convivio", respostas.convivio);
  const cor = opcaoDe("cor", respostas.cor);
  const sexo = opcaoDe("sexo", respostas.sexo);

  const resumo = [
    cor && cor.value !== "qualquer" ? cor.label : null,
    sexo && sexo.value !== "qualquer" ? sexo.label : null,
  ].filter(Boolean).join(" ");

  const mensagem =
    `Olá! Fiz o teste de afinidade no site. ${moradia?.frase ?? ""}` +
    `${convivio ? ` e ${convivio.frase}` : ""}. ` +
    `Procuro um Lulu da Pomerânia ${cor?.frase ?? ""}, ${sexo?.frase ?? ""}. Quais opções existem hoje?`;

  const waLink = useWhatsAppLink(
    buildWhatsAppLink({
      message: mensagem.replace(/\s+/g, " ").replace(" ,", ","),
      utmSource: "site",
      utmMedium: "teste_afinidade",
      utmCampaign: "home_match",
      utmContent: `${respostas.cor ?? "x"}_${respostas.sexo ?? "x"}`,
    }),
  );

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6" aria-labelledby="afinidade-heading">
      <div className="mb-7 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
          Teste de afinidade · 4 toques
        </p>
        <h2 id="afinidade-heading" className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Monte o perfil do seu Lulu da Pomerânia
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-600 sm:text-base">
          A cada toque, a vitrine do Spitz Alemão Anão (Lulu da Pomerânia) se filtra na hora, e no fim a equipe
          recebe o seu perfil pelo WhatsApp para confirmar o que existe hoje.
        </p>
      </div>

      <div
        className="relative overflow-hidden rounded-[28px] p-5 text-white shadow-2xl sm:p-7"
        style={{
          background: `radial-gradient(120% 90% at 100% 0%, #1d7a4a 0%, transparent 55%), linear-gradient(160deg, #17663d, ${VERDE} 70%)`,
          border: `2px solid ${OURO}55`,
        }}
      >
        {!terminou && <BarraDePerfil passo={passo} total={total} />}

        {/* Sem AnimatePresence aqui: com mode="wait", duas respostas seguidas
            deixavam a pergunta antiga presa na animação de saída — a barra
            andava e a tela não. A chave nova monta a próxima pergunta já
            entrando, e a antiga some na hora. */}
        <>
          {!terminou ? (
            <motion.fieldset
              key={pergunta.id}
              className="mt-6"
              initial={reduced ? false : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <legend className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: OURO }}>
                Pergunta {passo + 1} de {total}
              </legend>
              <p className="mb-5 text-xl font-bold leading-snug sm:text-2xl">{pergunta.titulo}</p>

              <div
                className={`grid gap-3 ${
                  pergunta.opcoes.length >= 4 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-3"
                } ${pergunta.id === "convivio" ? "sm:!grid-cols-4" : ""}`}
              >
                {pergunta.opcoes.map((o, i) => {
                  const marcada = escolhaRecente === o.value || (!escolhaRecente && respostas[pergunta.id] === o.value);
                  return (
                    <motion.button
                      key={o.value}
                      type="button"
                      onClick={() => responder(o.value)}
                      aria-pressed={marcada}
                      whileHover={reduced ? undefined : { y: -3 }}
                      whileTap={reduced ? undefined : { scale: 0.95 }}
                      animate={marcada && !reduced ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                      // Mola só aceita dois quadros; o pulso de três vai em curva.
                      transition={{ duration: 0.32, ease: "easeOut" }}
                      className={`group relative flex min-h-[64px] items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3bb64] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a3f25] ${
                        o.foto ? "flex-col !items-stretch !gap-2 !p-2" : ""
                      } ${
                        marcada
                          ? "border-[#e3bb64] bg-[#e3bb64]/15"
                          : "border-white/15 bg-white/[0.06] hover:border-[#e3bb64]/70 hover:bg-white/10"
                      }`}
                    >
                      {o.foto ? (
                        <span className="relative block aspect-square w-full overflow-hidden rounded-xl">
                          <Image
                            src={o.foto}
                            alt=""
                            fill
                            sizes="(min-width: 640px) 200px, 45vw"
                            quality={60}
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        </span>
                      ) : (
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl"
                          aria-hidden="true"
                        >
                          {o.emoji}
                        </span>
                      )}
                      <span className={`flex flex-1 flex-col ${o.foto ? "px-1 pb-1" : ""}`}>
                        <span className="text-sm font-bold sm:text-base">{o.label}</span>
                        {o.detalhe && <span className="mt-0.5 text-xs text-white/70">{o.detalhe}</span>}
                      </span>
                      <span
                        className="absolute right-2 top-2 hidden h-5 min-w-5 items-center justify-center rounded-md border border-white/20 px-1 text-[10px] font-bold text-white/60 sm:flex"
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                      <AnimatePresence>
                        {marcada && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-[#0a3f25]"
                            style={{ background: OURO }}
                            aria-hidden="true"
                          >
                            ✓
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-5">
                <VitrineAoVivo filhotes={filhotes} />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                {passo > 0 ? (
                  <button
                    type="button"
                    onClick={() => setPasso((p) => Math.max(0, p - 1))}
                    className="rounded-full px-2 py-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3bb64]"
                  >
                    ← Voltar
                  </button>
                ) : (
                  <span />
                )}
                <span className="hidden sm:inline">Dica: use as teclas 1 a {pergunta.opcoes.length}</span>
              </div>
            </motion.fieldset>
          ) : (
            <motion.div
              key="resultado"
              initial={reduced ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="relative"
            >
              <ChuvaDePatas />
              <div className="text-center">
                <motion.span
                  initial={reduced ? false : { scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
                  className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-[#0a3f25] shadow-lg"
                  style={{ background: OURO }}
                  aria-hidden="true"
                >
                  <PataIcone className="h-7 w-7" />
                </motion.span>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: OURO }}>
                  Perfil 100% montado
                </p>
                <h3 className="mt-1 text-xl font-bold sm:text-2xl">
                  Seu Lulu da Pomerânia{resumo ? `: ${resumo}` : ""}
                </h3>
              </div>

              {/* As respostas viram etiquetas: tocar numa volta para aquela
                  pergunta, sem perder as outras. */}
              <ul className="mt-4 flex flex-wrap justify-center gap-2">
                {PERGUNTAS.map((q, i) => {
                  const o = opcaoDe(q.id, respostas[q.id]);
                  if (!o) return null;
                  return (
                    <li key={q.id}>
                      <button
                        type="button"
                        onClick={() => setPasso(i)}
                        className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium transition hover:border-[#e3bb64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3bb64]"
                        aria-label={`Trocar a resposta: ${o.label}`}
                      >
                        {o.emoji ? `${o.emoji} ` : ""}
                        {o.label} <span aria-hidden="true" className="text-white/50">✎</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 flex flex-col items-center gap-2">
                <PawConfettiButton
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  data-wa-placement="content"
                  data-wa-puppy={resultado[0]?.slug}
                  emojis="paw"
                  count={16}
                  // Mesma regra de todo botão de WhatsApp principal: verde floresta com
                  // borda dourada (escolha de 17/11/2026).
                  className="inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-full border-2 border-[#e3bb64] bg-[linear-gradient(180deg,#1f7a48,#0a3f25)] px-7 text-base font-bold text-white shadow-[0_10px_30px_-8px_rgba(227,187,100,0.55)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a3f25]"
                >
                  <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
                  Enviar meu perfil no WhatsApp
                </PawConfettiButton>
                <p className="max-w-md text-center text-xs text-white/65">
                  A mensagem já vai pronta com as suas respostas sobre o Lulu da Pomerânia; a equipe confirma o
                  que existe hoje.
                </p>
              </div>

              <p className="mb-3 mt-7 text-center text-[11px] font-semibold uppercase tracking-widest text-white/70">
                {filhotes.length > 0
                  ? "Lulu da Pomerânia na vitrine com o seu perfil"
                  : "Sem foto exata dessa combinação de Lulu da Pomerânia: veja as mais próximas"}
              </p>
              <ul
                className={`grade-filhotes ${
                  resultado.length === 1
                    ? "!grid-cols-1 mx-auto max-w-[300px]"
                    : resultado.length === 2
                      ? "sm:!grid-cols-2 mx-auto sm:max-w-[460px]"
                      : ""
                }`}
              >
                {resultado.map((p, i) => (
                  <motion.li
                    key={p.slug}
                    initial={reduced ? false : { opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.25 + i * 0.1 }}
                  >
                    <StaticPuppyCard
                      {...(p as ComponentProps<typeof StaticPuppyCard>)}
                      waMedium="teste_afinidade"
                      waCampaign="home_match"
                      waPlacement="catalog_card"
                    />
                  </motion.li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
                <button
                  type="button"
                  onClick={recomecar}
                  className="rounded-full px-3 py-1.5 text-white/75 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3bb64]"
                >
                  ↺ Refazer o teste
                </button>
                {!Chat && (
                  <button
                    type="button"
                    onClick={abrirChat}
                    className="rounded-full border border-white/25 px-4 py-1.5 font-semibold hover:border-[#e3bb64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3bb64]"
                  >
                    Tirar uma dúvida no chat
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </>
      </div>

      {Chat ? (
        <div className="mt-6">
          <Chat embutido />
        </div>
      ) : (
        !terminou && (
          <p className="mt-4 text-center text-xs text-zinc-500">
            Prefere escrever do seu jeito?{" "}
            <button type="button" onClick={abrirChat} className="font-semibold underline hover:text-emerald-700">
              Abrir o chat
            </button>
          </p>
        )
      )}
    </section>
  );
}
