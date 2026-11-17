import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { DISPONIVEIS } from "@/content/disponiveis";
import { formatarPreco } from "@/domain/pricing";
import { REGRA_DE_ENTREGA } from "@/domain/public-truth";
import { pageMetadata } from "@/lib/seo";
import { buildWebPageLD } from "@/lib/structured-data";
import { buildWhatsAppLink } from "@/lib/whatsapp";

/**
 * /disponiveis — só o que pode ser reservado agora (pedido de 17/11/2026).
 *
 * A lista vem de content/disponiveis.ts, escrita à mão pela criadora. Vazia, a
 * página avisa, fica com noindex e não entra no sitemap: página sem filhote não
 * é resposta para quem busca filhote disponível.
 *
 * Sem selo de status e sem nó Product/Offer: o contrato da vitrine
 * (scripts/showcase-audit.mts) proíbe os dois em página pública. Quem está na
 * lista pode ser reservado; reservado ou entregue sai da lista.
 */
const path = "/disponiveis";

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Spitz Alemão Anão (Lulu da Pomerânia) disponíveis agora",
    description:
      "Filhotes de Spitz Alemão Anão (Lulu da Pomerânia) disponíveis para reserva agora: foto, sexo, cor, nascimento e valor no Pix.",
    path,
    ...(DISPONIVEIS.length === 0 ? { robots: { index: false, follow: true } } : {}),
  });
}

function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function DisponiveisPage() {
  const webPageLd = buildWebPageLD({
    path,
    name: "Spitz Alemão Anão (Lulu da Pomerânia) disponíveis agora",
  });
  const whatsapp = buildWhatsAppLink({
    message: "Olá! Vi a página de disponíveis e quero saber sobre um Spitz Alemão Anão (Lulu da Pomerânia).",
    utmSource: "disponiveis",
  });

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
        Spitz Alemão Anão (Lulu da Pomerânia) disponíveis agora
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-zinc-600 sm:text-base">
        Esta lista mostra só os filhotes de Spitz Alemão Anão (Lulu da Pomerânia) que podem ser reservados hoje. {REGRA_DE_ENTREGA}
      </p>

      {DISPONIVEIS.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-700">
          <p>
            Neste momento não há Spitz Alemão Anão (Lulu da Pomerânia) listado aqui. Veja as referências de cor e sexo na{" "}
            <Link href="/filhotes" className="underline">vitrine</Link> e pergunte no{" "}
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="underline">WhatsApp</a> sobre a próxima ninhada.
          </p>
        </div>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DISPONIVEIS.map((f) => (
            <li key={f.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="relative aspect-square">
                {f.video ? (
                  <video src={f.video} poster={f.foto} controls playsInline preload="none" className="h-full w-full object-cover" />
                ) : (
                  <Image src={f.foto} alt={`${f.nome}, ${f.cor}`} fill sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 p-4 text-sm">
                <dt className="text-zinc-500">Sexo</dt><dd className="text-zinc-900">{f.sexo === "macho" ? "Macho" : "Fêmea"}</dd>
                <dt className="text-zinc-500">Cor</dt><dd className="text-zinc-900">{f.cor}</dd>
                <dt className="text-zinc-500">Nascimento</dt><dd className="text-zinc-900">{dataBr(f.nascimento)}</dd>
                <dt className="text-zinc-500">Valor no Pix</dt><dd className="font-semibold text-zinc-900">{formatarPreco(f.valorCents)}</dd>
              </dl>
            </li>
          ))}
        </ul>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />
    </main>
  );
}
