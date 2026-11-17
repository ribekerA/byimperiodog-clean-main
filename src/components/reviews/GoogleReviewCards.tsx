import ReviewComment from "@/components/reviews/ReviewComment";
import { googleReviews } from "@/content/google-reviews";

export default function GoogleReviewCards() {
  return googleReviews.filter((review) => review.text).slice(0, 8).map((review) => (
    <li key={`google-${review.id}`} data-review-source="google" className="flex w-[90%] shrink-0 snap-start flex-col gap-3 rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm sm:w-[310px]">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-lg font-medium text-[var(--accent-ink)]">{review.name.charAt(0).toUpperCase()}</span>
        <div className="min-w-0"><p className="text-sm font-semibold text-[var(--text)]">{review.name}</p><p className="mt-1 text-xs text-[var(--text-muted)]">Publicado no Google</p>{review.id === "jeeh-souza" && <p className="mt-0.5 text-xs text-[var(--text-muted)]">Theo · Atibaia-SP</p>}</div>
      </div>
      <span role="img" aria-label={`${review.rating} de 5 estrelas`} className="whitespace-nowrap text-xl tracking-tight text-[#fbbc04]">★★★★★</span>
      <ReviewComment text={review.text ?? ""} />
      {/* Cada cartão tinha um link "Ver no perfil do Google" para o mesmo
          endereço: oito links iguais disputando o toque com o WhatsApp
          (17/11/2026). A seção já leva ao perfil por "Conferir no Google" e
          "Ver avaliações no Google". */}
      {review.translated && <p className="border-t border-zinc-100 pt-3 text-xs text-zinc-600">Tradução exibida pelo Google.</p>}
    </li>
  ));
}
