import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { LINHAS_FORMATADAS } from "@/domain/pricing";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const INCLUDED = [
  { icon: "📋", title: "Registro oficial", desc: "Documento oficial reconhecido internacionalmente" },
  { icon: "❤️", title: "Laudo de saúde", desc: "Exame veterinário completo antes da entrega" },
  { icon: "💉", title: "Protocolo vacinal", desc: "Em dia conforme a idade do filhote, carteira assinada pelo médico-veterinário" },
  { icon: "🔖", title: "Identificação do animal", desc: "Identificação individual e rastreável, conforme os requisitos da legislação aplicável" },
  { icon: "🌿", title: "Vermifugação", desc: "Tratamento preventivo incluso" },
  { icon: "🎓", title: "Mentoria pós-venda", desc: "Você nunca vai ficar sozinho com dúvidas" },
  { icon: "🤝", title: "Suporte pós-entrega", desc: "Acompanhamento direto com a criadora" },
];

// As duas colunas saem de domain/pricing e não de uma cópia escrita na mão. A
// versão anterior listava um card por cor com o valor digitado ao lado, e foi
// assim que a fêmea laranja ficou parada em R$ 8.500 enquanto a tabela
// comercial já dizia outra coisa.
const SEXES = [
  {
    label: "Macho",
    highlight: false,
    note: "Preço varia conforme a cor. O temperamento é o típico da raça e não depende do sexo.",
    colors: LINHAS_FORMATADAS.map((linha) => ({ cor: linha.label, valor: linha.macho })),
  },
  {
    label: "Fêmea",
    highlight: true,
    note: "A fêmea custa mais que o macho em todas as cores. A disponibilidade pode mudar rapidamente conforme as reservas.",
    colors: LINHAS_FORMATADAS.map((linha) => ({ cor: linha.label, valor: linha.femea })),
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
        <ul data-wa-safe-zone className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INCLUDED.map((item) => (
            <li key={item.title} className="flex items-start gap-2.5 rounded-xl bg-zinc-50 p-3 sm:p-4">
              <span className="mt-0.5 text-xl leading-none" aria-hidden="true">{item.icon}</span>
              {/* min-w-0: sem isso o item de flex nao encolhe abaixo da palavra
                  mais longa e "internacionalmente" vazava por cima do card ao lado. */}
              <div className="min-w-0">
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
                Maior procura
              </span>
            )}
            <h3 className="text-lg font-bold text-zinc-900">{s.label}</h3>
            <p className="mt-1 text-sm text-zinc-500">{s.note}</p>
            <ul className="mt-4 divide-y divide-zinc-100">
              {s.colors.map((c) => (
                <li key={c.cor} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-zinc-700">{c.cor}</span>
                  <span className={`font-bold ${s.highlight ? "text-[var(--accent-ink)] text-base" : "text-emerald-700"}`}>{c.valor}</span>
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
        <p className="mt-3 text-xs text-zinc-500">Atendimento todos os dias, 8h–22h.</p>
      </div>
    </section>
  );
}
