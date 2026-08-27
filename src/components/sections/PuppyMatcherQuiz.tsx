"use client";

import Link from "next/link";
import { useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { puppiesPublicados } from "@/content/puppies-static";
import { textoAPartirDe } from "@/domain/pricing";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type Step = 0 | 1 | 2 | 3; // 3 = resultado

const PARA_QUEM = [
  { value: "familia", label: "Família com crianças", emoji: "👨‍👩‍👧" },
  { value: "apartamento", label: "Moro em apartamento", emoji: "🏢" },
  { value: "primeira_vez", label: "Primeira vez com cão", emoji: "🐣" },
  { value: "presente", label: "Presente especial", emoji: "🎁" },
];

const CORES = [
  { value: "branco", label: "Branco", emoji: "🕊️" },
  { value: "creme", label: "Creme (marfim)", emoji: "🤍" },
  { value: "laranja", label: "Laranja (icônico)", emoji: "🧡" },
  { value: "preto", label: "Preto (elegante)", emoji: "🖤" },
];

// As descrições diziam que a fêmea cria "vínculo mais profundo com a família" e
// que o macho tem "temperamento alegre e brincalhão". Nada sustenta isso: são
// dois filhotes da mesma ninhada, e o site estava vendendo personalidade por
// sexo num botão de filtro. O que separa os dois na comunicação é o preço, que
// é público e verificável na tabela — é isso que fica.
const SEXOS = [
  { value: "female", label: "Fêmea", desc: "Preço maior na mesma cor", emoji: "♀️" },
  { value: "male", label: "Macho", desc: "Preço menor na mesma cor", emoji: "♂️" },
  { value: "qualquer", label: "Tanto faz", desc: "Quero conhecer todas as opções", emoji: "✨" },
];

const MESSAGES: Record<string, string> = {
  familia: "Preciso de um Spitz para uma família com crianças",
  apartamento: "Moro em apartamento e quero um Spitz compacto",
  primeira_vez: "É minha primeira vez com um cão",
  presente: "Quero presentear alguém especial com um Spitz",
};

// Matching client-side usando puppiesPublicados
function findMatch(cor: string, sexo: string) {
  const available = (puppiesPublicados as any[]).filter(
    (p) => p.status !== "sold" && p.status !== "vendido"
  );

  // Tenta match exato de cor + sexo
  const exact = available.filter((p) => {
    const pColor = (p.color ?? p.cor ?? "").toLowerCase();
    const pSex = p.sex ?? p.gender ?? "";
    const corMatch = pColor === cor || pColor.includes(cor.replace("-", " "));
    const sexMatch = sexo === "qualquer" || pSex === sexo;
    return corMatch && sexMatch;
  });

  if (exact.length > 0) return exact[0];

  // Fallback: só por cor
  const byCor = available.filter((p) => {
    const pColor = (p.color ?? p.cor ?? "").toLowerCase();
    return pColor === cor || pColor.includes(cor.replace("-", " "));
  });
  if (byCor.length > 0) return byCor[0];

  // Fallback: qualquer disponível
  return available[0] ?? null;
}

export default function PuppyMatcherQuiz() {
  const [step, setStep] = useState<Step>(0);
  const [paraQuem, setParaQuem] = useState("");
  const [cor, setCor] = useState("");
  const [sexo, setSexo] = useState("");

  const match = step === 3 ? findMatch(cor, sexo) : null;
  const corLabel = CORES.find((c) => c.value === cor)?.label ?? cor;
  const sexoLabel = SEXOS.find((s) => s.value === sexo)?.label ?? sexo;

  const baseWaLink = buildWhatsAppLink({
    message: match
      ? `Olá! ${MESSAGES[paraQuem] ?? "Quero um Spitz"}. Prefiro a cor ${corLabel} ${sexoLabel !== "Tanto faz" ? `(${sexoLabel})` : ""}. Vi ${match.name} na vitrine do site e gostaria de conhecer as opções atuais dessa combinação.`
      : `Olá! ${MESSAGES[paraQuem] ?? "Quero um Spitz"}. Prefiro a cor ${corLabel}. Gostaria de conhecer as opções atuais.`,
    utmSource: "site",
    utmMedium: "quiz",
    utmCampaign: "matcher_quiz",
    utmContent: `${paraQuem}_${cor}_${sexo}`,
  });
  const waLink = useWhatsAppLink(baseWaLink);

  const coverImg = match?.images?.find((img: string) => !img.endsWith(".mp4")) ?? match?.images?.[0];
  const matchPrice = match?.priceCents ?? match?.price_cents;

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6" aria-labelledby="quiz-heading">
      <div className="mb-8 text-center">
        {/* Mesmo título e mesmo subtítulo do chat: este quiz é o fallback dele
            e aparece no mesmo lugar da página quando a IA está indisponível.
            Duas versões do bloco não podem prometer coisas diferentes. */}
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Encontre seu filhote</p>
        <h2 id="quiz-heading" className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Encontre o filhote que combina com suas preferências
        </h2>
        <p className="mt-3 text-zinc-600">
          Spitz Alemão Anão. 3 perguntas rápidas para filtrar
          a vitrine por cor e sexo.
        </p>
      </div>

      {/* Progress */}
      {step < 3 && (
        <div className="mb-8 flex gap-2" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={3}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-2 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-emerald-500" : "bg-zinc-200"}`} />
          ))}
        </div>
      )}

      {/* Step 0 — Para quem */}
      {step === 0 && (
        <fieldset>
          <legend className="mb-5 text-lg font-semibold text-zinc-900">Para quem é o filhote?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {PARA_QUEM.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setParaQuem(opt.value); setStep(1); }}
                className={`flex items-center gap-3 rounded-xl border-2 px-5 py-4 text-left text-sm font-medium transition ${
                  paraQuem === opt.value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                }`}
              >
                <span className="text-xl" aria-hidden="true">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* Step 1 — Cor */}
      {step === 1 && (
        <fieldset>
          <legend className="mb-5 text-lg font-semibold text-zinc-900">Qual cor te atrai mais?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {CORES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setCor(opt.value); setStep(2); }}
                className={`flex items-center gap-3 rounded-xl border-2 px-5 py-4 text-left text-sm font-medium transition ${
                  cor === opt.value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                }`}
              >
                <span className="text-xl" aria-hidden="true">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setStep(0)} className="mt-4 text-sm text-zinc-500 hover:text-zinc-600">
            ← Voltar
          </button>
        </fieldset>
      )}

      {/* Step 2 — Sexo */}
      {step === 2 && (
        <fieldset>
          <legend className="mb-5 text-lg font-semibold text-zinc-900">Macho ou Fêmea?</legend>
          <div className="grid gap-3">
            {SEXOS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setSexo(opt.value); setStep(3); }}
                className={`flex items-start gap-3 rounded-xl border-2 px-5 py-4 text-left transition ${
                  sexo === opt.value
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-zinc-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
                }`}
              >
                <span className="mt-0.5 text-xl" aria-hidden="true">{opt.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{opt.label}</p>
                  <p className="text-xs text-zinc-500">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setStep(1)} className="mt-4 text-sm text-zinc-500 hover:text-zinc-600">
            ← Voltar
          </button>
        </fieldset>
      )}

      {/* Step 3 — Resultado */}
      {step === 3 && (
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-md sm:p-8">
          {/* "Seu match encontrado" dava ao resultado de um filtro de cor e
              sexo o status de veredito. O que a tela mostra é um filhote que
              atende ao que foi escolhido — e é isso que ela passa a dizer. */}
          {/* Dizia "Filhote disponível ✓" sobre um filtro de cor e sexo:
              o quiz não consulta estoque nenhum, ele escolhe uma foto da
              vitrine que combina com o que a pessoa respondeu. */}
          <p className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-emerald-600">
            Referência na vitrine
          </p>

          {match ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {/* Foto */}
              {coverImg && (
                <Link href={`/filhotes/${match.slug}`} className="shrink-0 block">
                  <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-2xl bg-zinc-100 sm:h-44 sm:w-44">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverImg} alt={match.name} className="h-full w-full object-cover transition hover:scale-105" />
                    {/* O selo verde "Disponível" saiu daqui: a foto continua publicada depois que o filhote encontra a família dele. */}
                  </div>
                </Link>
              )}

              {/* Info */}
              <div className="flex flex-1 flex-col gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{match.cor ?? match.color}</p>
                  <h3 className="mt-0.5 text-xl font-bold text-zinc-900">{match.name}</h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    {match.sex === "female" ? "Fêmea" : "Macho"} · Spitz Alemão Anão · Bragança Paulista, SP
                  </p>
                </div>
                {matchPrice > 0 && (
                  <p className="text-2xl font-extrabold text-[var(--accent-ink)]">
                    {textoAPartirDe(matchPrice)}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700"
                  >
                    <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
                    Consultar opções atuais
                  </a>
                  <Link
                    href={`/filhotes/${match.slug}`}
                    className="text-center text-xs font-medium text-zinc-500 hover:text-emerald-600 hover:underline"
                  >
                    Ver galeria completa →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Sem match — fallback */
            <div className="text-center">
              <p className="mb-4 text-sm text-zinc-600">
                Ainda não há foto de <strong>{corLabel}</strong> publicada nesse recorte da vitrine. Fale com a equipe para conhecer as opções atuais.
              </p>
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[48px] items-center gap-2.5 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700"
              >
                <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
                Consultar opções atuais
              </a>
            </div>
          )}

          <button
            type="button"
            onClick={() => { setStep(0); setParaQuem(""); setCor(""); setSexo(""); }}
            className="mt-5 w-full text-center text-xs text-zinc-500 hover:text-zinc-600"
          >
            ↺ Refazer o quiz
          </button>
        </div>
      )}
    </section>
  );
}
