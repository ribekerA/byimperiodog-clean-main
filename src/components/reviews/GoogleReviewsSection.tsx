import { googleReviewSnapshot } from "@/content/google-reviews";
import { GOOGLE_BUSINESS_PROFILE_URL } from "@/domain/config";

/** Resumo conferido nos prints da proprietária, sem inferir média da amostra. */
export default function GoogleReviewsSection() {
  return (
    <aside aria-labelledby="google-reviews-heading" className="rounded-2xl border border-[#dadce0] bg-white px-6 py-7 text-center shadow-sm lg:mt-16">
        <h3 id="google-reviews-heading" className="text-lg font-medium text-[#202124]">Resumo das avaliações</h3>
        <p className="mt-3 flex items-baseline justify-center gap-2"><span className="text-8xl font-normal tracking-tighter text-[#202124]">{googleReviewSnapshot.rating.toLocaleString("pt-BR")}</span><span className="text-base text-[#5f6368]">/ 5</span></p>
        <div role="img" aria-label={`${googleReviewSnapshot.rating.toLocaleString("pt-BR")} de 5 estrelas`} className="relative mt-2 inline-block text-3xl leading-none tracking-tight">
          <span aria-hidden="true" className="text-zinc-200">★★★★★</span>
          <span aria-hidden="true" className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap text-[#fbbc04]" style={{ width: `${googleReviewSnapshot.rating / 5 * 100}%` }}>★★★★★</span>
        </div>
        <p className="mt-3 text-sm font-semibold text-zinc-800">{googleReviewSnapshot.total} avaliações no Google</p>
        <div role="img" aria-label="Google" className="mt-4 text-4xl font-semibold tracking-tight">
          <span aria-hidden="true"><span className="text-[#4285f4]">G</span><span className="text-[#ea4335]">o</span><span className="text-[#fbbc05]">o</span><span className="text-[#4285f4]">g</span><span className="text-[#34a853]">l</span><span className="text-[#ea4335]">e</span></span>
        </div>
        <a href={GOOGLE_BUSINESS_PROFILE_URL} target="_blank" rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#1967d2] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#174ea6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1967d2]">Ver avaliações no Google <span className="sr-only">(abre em nova aba)</span></a>
        <p className="mt-4 text-xs leading-relaxed text-zinc-600">Conferido em <time dateTime={googleReviewSnapshot.checkedAt}>{googleReviewSnapshot.checkedAtLabel}</time>. Consulte os dados atuais no Google.</p>
    </aside>
  );
}
