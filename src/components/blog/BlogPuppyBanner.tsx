import Link from "next/link";

import { puppiesPublicados } from "@/content/puppies-static";
import { buildWhatsAppLink } from "@/lib/whatsapp";

interface Props {
  postTitle?: string;
}

// Este banner era um contador de estoque no meio do artigo: "8 filhotes
// disponíveis agora · 5 fêmeas", somado a partir do status de cada filhote e
// escondido inteiro quando a conta dava zero. O status saiu do modelo público em
// 26/08/2026 — o filtro aqui já não filtrava mais nada — e o contador foi junto.
// O banner agora convida para a vitrine, que é o que ele sempre linkou.
export default function BlogPuppyBanner({ postTitle }: Props) {
  // Sem foto publicada não há vitrine para oferecer; o banner some.
  if ((puppiesPublicados as any[]).length === 0) return null;

  const waLink = buildWhatsAppLink({
    message: postTitle
      ? `Olá! Estava lendo o artigo "${postTitle}" no site e gostaria de conhecer as opções atuais de Spitz Alemão Anão.`
      : "Olá! Vi o site da By Império Dog e gostaria de conhecer as opções atuais de Spitz Alemão Anão.",
    utmSource: "blog",
    utmMedium: "inline_banner",
    utmCampaign: "blog_puppy_cta",
  });

  return (
    <aside
      aria-label="Vitrine de filhotes da By Império Dog"
      className="not-prose my-8 overflow-hidden rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/8"
      style={{ background: "rgba(243, 181, 98, 0.08)" }}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6">
        {/* Ícone */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-2xl text-[var(--accent-foreground)]">
          🐾
        </div>

        {/* Texto */}
        <div className="flex-1">
          <p className="font-bold text-zinc-900">
            Conheça a vitrine de filhotes da By Império Dog
          </p>
          <p className="mt-0.5 text-sm text-zinc-600">
            Fotos reais por cor e sexo · registro oficial, consulta veterinária, hemograma completo e contrato inclusos.{" "}
            <span className="font-medium text-zinc-800">Consulte as opções atuais pelo WhatsApp.</span>
          </p>
        </div>

        {/* CTAs */}
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.859L.057 23.784a.5.5 0 0 0 .624.613l6.03-1.579A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.96 0-3.791-.56-5.33-1.527l-.383-.232-3.972 1.04 1.053-3.86-.254-.4A9.965 9.965 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Falar com a criadora
          </a>
          <Link
            href="/filhotes"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border-2 border-zinc-200 px-4 text-sm font-semibold text-zinc-700 transition hover:border-emerald-500 hover:text-emerald-700"
          >
            Ver a vitrine →
          </Link>
        </div>
      </div>
    </aside>
  );
}
