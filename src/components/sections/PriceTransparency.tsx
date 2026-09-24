import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const INCLUDED = [
  { icon: "📋", title: "Registro oficial", desc: "Documento oficial reconhecido internacionalmente" },
  { icon: "❤️", title: "Consulta veterinária", desc: "Consulta e hemograma completo antes da entrega" },
  { icon: "💉", title: "Protocolo vacinal", desc: "Em dia conforme a idade do filhote, carteira assinada pelo médico-veterinário" },
  // "Identificação individual e rastreável" dizia mais do que o canil confirma:
  // rastreável, num card ao lado de um preço, é lido como microchip, e nenhum
  // filhote da vitrine tem microchip incluso. A frase agora é a mesma do resto
  // do site, palavra por palavra.
  { icon: "🔖", title: "Identificação do animal", desc: "Segue os requisitos exigidos pela legislação aplicável" },
  { icon: "🌿", title: "Vermifugação", desc: "Tratamento preventivo incluso" },
  { icon: "🎓", title: "Mentoria pós-venda", desc: "Você nunca vai ficar sozinho com dúvidas" },
  { icon: "🤝", title: "Suporte pós-entrega", desc: "Acompanhamento direto com a criadora" },
];

// As duas colunas saem de domain/pricing e não de uma cópia escrita na mão. A
// versão anterior listava um card por cor com o valor digitado ao lado, e foi
// assim que a fêmea laranja ficou parada em R$ 8.500 enquanto a tabela
// comercial já dizia outra coisa.
const waLink = buildWhatsAppLink({
  message: "Olá! Quero conhecer as opções atuais e entender os próximos passos para reservar.",
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
          O valor aparece somente na ficha de cada filhote atualmente divulgado.
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

      {/* CTA */}
      <div className="mt-10 text-center">
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[52px] items-center gap-2.5 rounded-xl bg-emerald-600 px-8 text-base font-semibold text-white shadow-lg transition hover:bg-emerald-700"
        >
          <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
          Conhecer a vitrine de filhotes
        </a>
        <p className="mt-3 text-xs text-zinc-500">Atendimento todos os dias, 8h–22h.</p>
      </div>
    </section>
  );
}
