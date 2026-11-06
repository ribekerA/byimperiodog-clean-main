import ReviewComment from "@/components/reviews/ReviewComment";
import { googleReviews, googleReviewSnapshot } from "@/content/google-reviews";
import { GOOGLE_BUSINESS_PROFILE_URL } from "@/domain/config";

export default function GoogleReviewCards() {
  return googleReviews.map((review) => (
    <li key={`google-${review.id}`} data-review-source="google" className="flex w-[90%] shrink-0 snap-start flex-col gap-3 rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm sm:w-[310px]">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-lg font-medium text-[var(--accent-ink)]">{review.name.charAt(0).toUpperCase()}</span>
        <div className="min-w-0"><p className="text-sm font-semibold text-[var(--text)]">{review.name}</p><p className="mt-1 text-xs text-[var(--text-muted)]">Publicado no Google</p>{review.id === "jeeh-souza" && <p className="mt-0.5 text-xs text-[var(--text-muted)]">Theo · Atibaia-SP</p>}</div>
      </div>
      <span role="img" aria-label={`${review.rating} de 5 estrelas`} className="whitespace-nowrap text-xl tracking-tight text-[#fbbc04]">★★★★★</span>
      {review.text ? <ReviewComment text={review.text} />
        : <p className="flex-1 text-base leading-relaxed text-zinc-600">Avaliação de {review.rating} estrelas no Google.</p>}
      <div className="border-t border-zinc-100 pt-3">
        {review.excerpt && <p className="text-xs text-zinc-600">Trecho: o texto completo está no Google.</p>}
        {review.translated && <p className="text-xs text-zinc-600">Tradução exibida pelo Google.</p>}
        <p className="mt-1 text-xs leading-relaxed text-zinc-600">Na imagem recebida em {googleReviewSnapshot.checkedAtLabel}: {review.displayedDate}</p>
        <a href={GOOGLE_BUSINESS_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center rounded text-sm font-medium text-[var(--accent-ink)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Ver no perfil do Google<span className="sr-only"> — referência: {review.name}; abre em nova aba</span></a>
      </div>
    </li>
  ));
}
