import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const INCLUDED = [
  { icon: "📋", title: "Pedigree CBKC", desc: "Registro oficial reconhecido internacionalmente" },
  { icon: "❤️", title: "Laudo cardiológico", desc: "Atestado de saúde cardíaca antes da entrega" },
  { icon: "💉", title: "Vacinação completa", desc: "Protocolo vacinal em dia, carteira assinada" },
  { icon: "🔖", title: "Microchip", desc: "Identificação permanente e rastreável" },
  { icon: "🌿", title: "Vermifugação", desc: "Tratamento preventivo incluso" },
  { icon: "🎓", title: "Mentoria vitalícia", desc: "Você nunca vai ficar sozinho com dúvidas" },
  { icon: "🧸", title: "Enxoval do filhote", desc: "Kit de acolhimento pronto para o primeiro dia" },
  { icon: "🤝", title: "Suporte pós-adoção", desc: "Acompanhamento direto com a criadora" },
];

const SEXES = [
  {
    label: "Macho",
    range: "R$ 7.000 a R$ 9.500",
    highlight: false,
    note: "Temperamento alegre, brincalhão e apegado. Excelente para famílias.",
    colors: [
      { cor: "Laranja", valor: "R$ 7.000" },
      { cor: "Wolf Sable", valor: "R$ 7.500" },
      { cor: "Preto", valor: "R$ 8.000" },
      { cor: "Creme", valor: "R$ 9.000" },
    ],
  },
  {
    label: "Fêmea",
    range: "R$ 10.000 a R$ 15.000",
    highlight: true,
    note: "Vínculo familiar mais profundo. Alta demanda — reservas se esgotam rápido.",
    colors: [
      { cor: "Laranja", valor: "R$ 10.000" },
      { cor: "Wolf Sable", valor: "R$ 11.000" },
      { cor: "Preta", valor: "R$ 13.000" },
      { cor: "Creme", valor: "R$ 15.000" },
    ],
  },
];

const waLink = buildWhatsAppLink({
  message: "Olá! Quero conhecer os filhotes disponíveis e entender os próximos passos para reservar.",
  utmSource: "site",
  utmMedium: "price_section",
  utmCampaign: "conhecer_filhotes",
});

export default function PriceTransparency() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-10" aria-labelledby="price-heading">
      <div className="mb-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Sem letras miúdas</p>
        <h2 id="price-heading" className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          O que você recebe com cada filhote
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-zinc-600">
          Cada filhote sai daqui documentado, examinado e acompanhado. O valor inclui tudo — sem cobranças surpresa depois.
        </p>
      </div>

      {/* Incluído */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
        <h3 className="mb-6 text-center text-base font-semibold text-zinc-500 uppercase tracking-widest">Incluído em todos os filhotes</h3>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INCLUDED.map((item) => (
            <li key={item.title} className="flex items-start gap-2.5 rounded-xl bg-zinc-50 p-3 sm:p-4">
              <span className="mt-0.5 text-xl leading-none" aria-hidden="true">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Sexes + pricing */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {SEXES.map((s) => (
          <div
            key={s.label}
            className={`relative rounded-2xl border p-6 sm:p-8 ${
              s.highlight
                ? "border-emerald-200 bg-emerald-50 shadow-md"
                : "border-zinc-200 bg-white shadow-sm"
            }`}
          >
            {s.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--accent)] px-4 py-1 text-xs font-bold text-[var(--accent-foreground)]">
                Mais procurada
              </span>
            )}
            <h3 className="text-lg font-bold text-zinc-900">{s.label}</h3>
            <p className="mt-1 text-sm text-zinc-500">{s.note}</p>
            <ul className="mt-4 divide-y divide-zinc-100">
              {s.colors.map((c) => (
                <li key={c.cor} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-zinc-700">{c.cor}</span>
                  <span className={`font-bold ${s.highlight ? "text-[var(--accent)] text-base" : "text-emerald-700"}`}>{c.valor}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[52px] items-center gap-2.5 rounded-xl bg-emerald-600 px-8 text-base font-semibold text-white shadow-lg transition hover:bg-emerald-700"
        >
          <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
          Conhecer os filhotes disponíveis
        </a>
        <p className="mt-3 text-xs text-zinc-400">Atendimento de segunda a sábado, 9h–18h.</p>
      </div>
    </section>
  );
}
