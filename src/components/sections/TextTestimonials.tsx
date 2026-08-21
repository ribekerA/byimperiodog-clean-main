import Image from "next/image";

import { FOUNDING_YEAR } from "@/domain/config";

// Depoimentos reais, escritos pelas próprias famílias. A regra aqui é não
// reescrever ninguém: o texto é o que a pessoa disse. A única intervenção
// permitida é retirar algo que o canil não oferece a todo mundo — porque um
// depoimento na página de venda é lido como descrição do que vem incluso, e
// não como a experiência de uma família só.
//
// Foi o caso de duas expressões no primeiro depoimento:
//
// • "microchip" — este é o único ponto do site público que dizia que o filhote
//   chega com microchip. Todos os filhotes em puppies-static têm
//   `hasMicrochip: false`, e o prompt do chat é explícito: "Nunca prometa
//   microchip incluso". Uma família lia o depoimento, cobrava o microchip na
//   entrega e ninguém estava errado — só o site.
// • "vídeos diários" — enviar vídeo do filhote é real, mas "diários" não
//   aparece em lugar nenhum como compromisso. Quem lê passa a esperar um vídeo
//   por dia até a entrega.
//
// O resto do texto ficou palavra por palavra. As outras três famílias citam
// registro oficial, laudo de saúde, enxoval e mentoria vitalícia — tudo isso o
// canil anuncia em página própria e consta no contrato, então nada a ajustar.
const TESTIMONIALS = [
  {
    photo: "/clientes/ana.jpeg",
    name: "Ana Paula M.",
    city: "Campinas, SP",
    puppy: "Spitz Creme Fêmea",
    stars: 5,
    text: "Processo impecável do início ao fim. A criadora me acompanhou em cada dúvida, enviou vídeos do filhote e a entrega foi perfeita. Minha Bella já chegou com todos os documentos e a vacinação em dia. Recomendo de olhos fechados.",
  },
  {
    photo: "/clientes/marina.jpeg",
    name: "Marina S.",
    city: "São Paulo, SP",
    puppy: "Spitz Laranja Fêmea",
    stars: 5,
    text: "Fui mãe de primeira viagem e tinha muito medo de errar. A mentoria vitalícia foi decisiva para minha escolha. Já se passaram 8 meses e até hoje consigo tirar dúvidas direto com a criadora. Minha Mel é saudável, feliz e amada por toda a família.",
  },
  {
    photo: "/clientes/lucas.jpeg",
    name: "Lucas & Família",
    city: "Belo Horizonte, MG",
    puppy: "Spitz Preto Macho",
    stars: 5,
    text: "Comprei para minha filha de aniversário e foi a melhor decisão. O Zeus veio com registro oficial, laudo de saúde e um enxoval completo. A criadora foi transparente em tudo — preço, documentação, saúde. Confiança total.",
  },
  {
    photo: "/clientes/fernanda.jpeg",
    name: "Fernanda L.",
    city: "Rio de Janeiro, RJ",
    puppy: "Spitz Creme Macho",
    stars: 5,
    text: "Pesquisei meses antes de decidir. O que diferenciou a By Império Dog foi a transparência — sem promessas vazias, com laudos e documentação real. O Thor chegou exatamente como prometido: saudável, socializado e com muita energia!",
  },
];

// role="img": aria-label em <div> sem role é ignorado pelo leitor de tela
// (e reprovado no axe). Com role, a nota vira um rótulo de verdade.
function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${count} estrelas`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="h-4 w-4 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function TextTestimonials() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Depoimentos reais</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Famílias que já encontraram o Spitz ideal
        </h2>
        <p className="mt-3 text-zinc-600">
          Mais de 180 famílias atendidas desde {FOUNDING_YEAR}. Veja o que dizem sobre a experiência.
        </p>
      </div>

      {/* ── Depoimentos — UMA única instância no DOM ───────────────────────────
          Antes existia uma <ul> "mobile" e outra "desktop" com exatamente os
          mesmos quatro depoimentos, o que duplicava todo o texto no HTML
          público. Agora é a mesma lista: carrossel com snap no mobile e grid
          de 2/4 colunas a partir de sm, alternado somente por CSS. */}
      <ul
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:snap-none sm:grid-cols-2 sm:gap-5 sm:overflow-x-visible sm:pb-0 lg:grid-cols-4"
        aria-label="Depoimentos de clientes"
      >
        {TESTIMONIALS.map((t) => (
          <li
            key={t.name}
            className="w-[82vw] max-w-[320px] shrink-0 snap-start flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition sm:w-auto sm:max-w-none sm:shrink sm:hover:shadow-md"
          >
            <Stars count={t.stars} />
            <blockquote className="flex-1 text-sm leading-relaxed text-zinc-600">
              "{t.text}"
            </blockquote>
            <div className="flex items-center gap-3 border-t border-zinc-100 pt-4">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-100">
                <Image src={t.photo} alt={t.name} fill className="object-cover" sizes="40px" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                <p className="text-xs text-zinc-400">{t.city}</p>
                <p className="text-xs font-medium text-emerald-600">{t.puppy}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
