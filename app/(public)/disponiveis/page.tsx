import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DISPONIVEIS } from "@/content/disponiveis";
import { BRAND } from "@/domain/config";
import { REGRA_DE_ENTREGA } from "@/domain/public-truth";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const STATUS = { disponivel: "Disponível", reservado: "Reservado", vendido: "Vendido" } as const;
const dinheiro = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const metadata: Metadata = {
  title: "Filhotes com disponibilidade confirmada | By Imperio Dog",
  description: "Consulte os Spitz Alemão Anão (Lulu da Pomerânia) com cadastro individual confirmado de fotos, valor, sexo e situação atual.",
  alternates: { canonical: "/disponiveis" },
  robots: DISPONIVEIS.length === 0 ? { index: false, follow: true } : { index: true, follow: true },
};

export default function DisponiveisPage() {
  const itensValidos = DISPONIVEIS.filter((p) =>
    p.id && p.nome && p.cor && /^\d{4}-\d{2}-\d{2}$/.test(p.nascimento) &&
    Number.isInteger(p.valorPixCents) && p.valorPixCents > 0 && p.fotos.length > 0 &&
    p.status === "disponivel",
  );
  const productLd = itensValidos.map((p) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${BRAND.urls.site}/disponiveis#${encodeURIComponent(p.id)}`,
    name: p.nome,
    description: `Spitz Alemão Anão (Lulu da Pomerânia), ${p.sexo === "femea" ? "fêmea" : "macho"}, ${p.cor}. Nascimento: ${p.nascimento}.`,
    image: p.fotos.map((src) => new URL(src, BRAND.urls.site).toString()),
    brand: { "@type": "Brand", name: BRAND.name },
    offers: {
      "@type": "Offer",
      url: `${BRAND.urls.site}/disponiveis`,
      price: (p.valorPixCents / 100).toFixed(2),
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      seller: { "@id": `${BRAND.urls.site}/#business` },
    },
  }));
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      {productLd.map((data) => (
        <script key={data["@id"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-emerald-950">Filhotes com disponibilidade confirmada</h1>
        <p className="max-w-3xl text-zinc-700">
          Esta página é atualizada somente após confirmação de cada animal. A <Link className="underline" href="/filhotes">vitrine de referências</Link> permanece disponível para conhecer cores e sexos.
        </p>
        <p className="text-sm text-zinc-600">{REGRA_DE_ENTREGA}</p>
      </header>
      {itensValidos.length === 0 ? (
        <section className="mt-9 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-xl font-semibold">Disponibilidade sob consulta</h2>
          <p className="mt-2 text-zinc-700">Ainda não há filhotes com cadastro individual confirmado nesta página.</p>
          <a className="mt-5 inline-block rounded-full bg-emerald-800 px-6 py-3 font-semibold text-white"
            href={buildWhatsAppLink({ message: "Olá! Gostaria de consultar as opções atuais de Spitz Alemão Anão." })} target="_blank" rel="noopener noreferrer">
            Consultar pelo WhatsApp
          </a>
        </section>
      ) : (
        <ul className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {itensValidos.map((p) => (
            <li key={p.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="relative aspect-square">
                <Image src={p.fotos[0]} alt={p.nome} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
              </div>
              <div className="space-y-2 p-5">
                <h2 className="font-bold text-emerald-950">{p.nome}</h2>
                <p className="text-sm">{p.sexo === "femea" ? "Fêmea" : "Macho"} · {p.cor} · Nascimento: {p.nascimento}</p>
                <p className="text-sm font-medium">{STATUS[p.status]}</p>
                <p className="text-lg font-bold">{dinheiro(p.valorPixCents)} no Pix</p>
                {p.video && <a href={p.video} className="underline">Ver vídeo</a>}
                <a href={buildWhatsAppLink({ message: `Olá! Quero informações sobre ${p.nome} (identificação ${p.id}).` })}
                  target="_blank" rel="noopener noreferrer"
                  className="block rounded-full bg-emerald-800 px-4 py-3 text-center font-semibold text-white">Consultar pelo WhatsApp</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
