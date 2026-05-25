"use client";

/**
 * PuppyReviews — Seção completa de avaliações de um filhote.
 *
 * Inclui:
 *  • Resumo agregado (nota média + barras de distribuição)
 *  • Lista de avaliações aprovadas (cards animados)
 *  • Formulário de envio inline com star picker
 *  • Graceful degradation quando Supabase indisponível
 */

import { AnimatePresence, motion, useInView } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { StarRating } from "./StarRating";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Review {
  id:            string;
  reviewer_name: string;
  reviewer_city: string | null;
  rating:        number;
  comment:       string;
  photo_url?:    string | null;
  created_at:    string;
}

interface Props {
  puppySlug: string;
  puppyName: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return "";
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
];

function avatarColor(name: string) {
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────

function ReviewCard({ review, index }: { review: Review; index: number }) {
  return (
    <motion.article
      className="flex flex-col gap-3 rounded-2xl bg-white p-5 ring-1 ring-zinc-900/5 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor(review.reviewer_name)}`}
          aria-hidden="true"
        >
          {getInitials(review.reviewer_name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="font-semibold text-zinc-900 truncate">{review.reviewer_name}</p>
            {review.reviewer_city && (
              <p className="text-xs text-zinc-400">{review.reviewer_city}</p>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <StarRating value={review.rating} size="sm" />
            <span className="text-xs text-zinc-400">{formatDate(review.created_at)}</span>
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-zinc-600">{review.comment}</p>

      {review.photo_url && (
        <div className="overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={review.photo_url}
            alt={`Foto de ${review.reviewer_name} com seu Spitz`}
            className="h-40 w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
    </motion.article>
  );
}

// ─── RatingSummary ────────────────────────────────────────────────────────────

function RatingSummary({ reviews }: { reviews: Review[] }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    pct:   Math.round((reviews.filter((r) => r.rating === stars).length / reviews.length) * 100),
  }));

  return (
    <div ref={ref} className="flex flex-col gap-6 rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-100 sm:flex-row sm:items-center sm:gap-10">
      {/* Big number */}
      <div className="text-center sm:text-left">
        <p className="text-6xl font-black tracking-tight text-zinc-900">{avg.toFixed(1)}</p>
        <StarRating value={avg} size="md" className="mt-1 justify-center sm:justify-start" />
        <p className="mt-1 text-sm text-zinc-500">
          {reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"}
        </p>
      </div>

      {/* Distribution bars */}
      <div className="flex-1 space-y-2">
        {dist.map(({ stars, count, pct }) => (
          <div key={stars} className="flex items-center gap-2.5">
            <span className="w-4 shrink-0 text-xs font-semibold text-zinc-500 tabular-nums">{stars}</span>
            <span className="text-amber-400 text-xs" aria-hidden="true">★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200">
              <motion.div
                className="h-full rounded-full bg-amber-400"
                initial={{ width: 0 }}
                animate={inView ? { width: `${pct}%` } : { width: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: (5 - stars) * 0.07 }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs text-zinc-400 tabular-nums">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ReviewForm ───────────────────────────────────────────────────────────────

const STAR_LABELS = ["", "Ruim", "Regular", "Bom", "Muito bom", "Excelente"];

function ReviewForm({
  puppySlug,
  puppyName,
  onSuccess,
}: {
  puppySlug: string;
  puppyName: string;
  onSuccess: () => void;
}) {
  const [rating,   setRating]   = useState(0);
  const [name,     setName]     = useState("");
  const [city,     setCity]     = useState("");
  const [comment,  setComment]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const canSubmit = rating > 0 && name.trim().length >= 2 && comment.trim().length >= 10 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          puppySlug,
          reviewerName: name.trim(),
          reviewerCity: city.trim() || undefined,
          rating,
          comment: comment.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao enviar");
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div>
        <p className="text-sm font-semibold text-zinc-500">
          Conte como foi adotar o <span className="text-zinc-900">{puppyName}</span>
        </p>
      </div>

      {/* Star picker */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-zinc-700">Sua nota *</legend>
        <div className="flex items-center gap-3">
          <StarRating
            value={rating}
            size="lg"
            interactive
            onChange={setRating}
          />
          <AnimatePresence mode="wait">
            {rating > 0 && (
              <motion.span
                key={rating}
                className="text-sm font-semibold text-amber-600"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18 }}
              >
                {STAR_LABELS[rating]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </fieldset>

      {/* Name + city */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="rv-name" className="mb-1.5 block text-sm font-medium text-zinc-700">
            Seu nome *
          </label>
          <input
            id="rv-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Ana Carolina"
            maxLength={80}
            required
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
          />
        </div>
        <div>
          <label htmlFor="rv-city" className="mb-1.5 block text-sm font-medium text-zinc-700">
            Cidade <span className="text-zinc-400">(opcional)</span>
          </label>
          <input
            id="rv-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex: São Paulo, SP"
            maxLength={60}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
          />
        </div>
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="rv-comment" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Seu depoimento *
          <span className="ml-1 text-xs font-normal text-zinc-400">(mín. 10 caracteres)</span>
        </label>
        <textarea
          id="rv-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Como está sendo a experiência? O que você mais gosta no seu Spitz?"
          rows={4}
          minLength={10}
          maxLength={600}
          required
          className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
        />
        <p className="mt-1 text-right text-xs text-zinc-400">{comment.length}/600</p>
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}

      <motion.button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        whileTap={canSubmit ? { scale: 0.97 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
      >
        {loading ? "Enviando..." : "Enviar avaliação"}
      </motion.button>
      <p className="text-center text-xs text-zinc-400">
        Sua avaliação será publicada após revisão da equipe.
      </p>
    </motion.form>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PuppyReviews({ puppySlug, puppyName }: Props) {
  const [reviews,   setReviews]   = useState<Review[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch(`/api/reviews?slug=${encodeURIComponent(puppySlug)}`);
      const json = await res.json();
      setReviews(json.reviews ?? []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [puppySlug]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  function handleSuccess() {
    setSubmitted(true);
    setShowForm(false);
  }

  return (
    <section className="mt-16" aria-labelledby="reviews-heading">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
            Famílias que adotaram
          </p>
          <h2
            id="reviews-heading"
            className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl"
          >
            Avaliações reais
          </h2>
        </div>

        {!showForm && !submitted && (
          <motion.button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 hover:scale-[1.02]"
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
          >
            ★ Deixar avaliação
          </motion.button>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <div className="mb-8">
            <ReviewForm
              puppySlug={puppySlug}
              puppyName={puppyName}
              onSuccess={handleSuccess}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Submitted success */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            className="mb-8 flex items-start gap-3 rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-2xl" aria-hidden="true">🐾</span>
            <div>
              <p className="font-semibold text-emerald-800">
                Obrigado pela avaliação!
              </p>
              <p className="mt-0.5 text-sm text-emerald-700">
                Ela será publicada após uma rápida revisão da nossa equipe. Normalmente publicamos em menos de 24 horas.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 py-8 text-sm text-zinc-400">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeLinecap="round" />
          </svg>
          Carregando avaliações...
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Summary */}
          {reviews.length > 0 && <RatingSummary reviews={reviews} />}

          {/* Reviews list */}
          {reviews.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {reviews.map((review, i) => (
                <ReviewCard key={review.id} review={review} index={i} />
              ))}
            </div>
          ) : (
            !showForm && !submitted && (
              <motion.div
                className="rounded-2xl border-2 border-dashed border-zinc-200 py-12 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <p className="text-3xl" aria-hidden="true">⭐</p>
                <p className="mt-3 font-semibold text-zinc-700">
                  Seja o primeiro a avaliar!
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Ajude outras famílias compartilhando sua experiência com {puppyName}.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-5 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow transition hover:bg-emerald-500 hover:scale-[1.02]"
                >
                  Escrever avaliação
                </button>
              </motion.div>
            )
          )}
        </>
      )}
    </section>
  );
}
