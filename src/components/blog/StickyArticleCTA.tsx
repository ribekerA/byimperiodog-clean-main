import { MessageCircle } from "lucide-react";
import Link from "next/link";

interface Props {
  whatsappUrl: string;
}

export default function StickyArticleCTA({ whatsappUrl }: Props) {
  return (
    <div className="mt-6 rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">
        Interesse em um filhote?
      </p>
      <p className="mt-2 text-sm leading-snug text-zinc-700">
        Conversa sem compromisso. Atendimento todos os dias, das 8h às 22h.
      </p>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        data-track-event="blog_sidebar_cta"
      >
        <MessageCircle className="h-4 w-4 flex-shrink-0" aria-hidden />
        Conversar agora
      </a>
      <Link
        href="/filhotes?utm_source=blog&utm_medium=sidebar_cta"
        className="mt-2 flex items-center justify-center text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline"
      >
        Ver filhotes disponíveis →
      </Link>
      <p className="mt-3 text-center text-[10px] text-zinc-400">
        Registro oficial · Contrato digital
      </p>
    </div>
  );
}
