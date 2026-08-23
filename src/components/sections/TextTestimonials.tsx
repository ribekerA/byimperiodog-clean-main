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
// Pela mesma razão saíram "enxoval completo" (Lucas), "mentoria vitalícia"
// (Marina) e "mostrou o filhote por videochamada" (depoimento sem identidade
// nº 3): nenhum dos três consta da lista de inclusões que o canil confirma —
// registro oficial, consulta veterinária, hemograma completo, protocolo
// vacinal, vermifugação e contrato. O resto de cada texto ficou palavra por
// palavra.
//
// Os dez últimos foram associados, por orientação do canil, às fotos nomeadas
// do álbum na mesma sequência dos depoimentos. Cidade, filhote e nota seguem
// opcionais e só aparecem quando houver informação confirmada.
type Depoimento = {
  /** Chave estável de render — não aparece na tela. */
  id: string;
  text: string;
  /** Os quatro campos abaixo só existem com identificação vinda da criadora. */
  photo?: string;
  name?: string;
  city?: string;
  puppy?: string;
  /** Nota só entra se a própria família tiver dado uma. */
  stars?: number;
};

const TESTIMONIALS: readonly Depoimento[] = [
  {
    id: "ana-paula-m",
    photo: "/clientes/ana.jpeg",
    name: "Ana Paula M.",
    city: "Campinas, SP",
    puppy: "Spitz Creme Fêmea",
    stars: 5,
    text: "Processo impecável do início ao fim. A criadora me acompanhou em cada dúvida, enviou vídeos do filhote e a entrega foi perfeita. Minha Bella já chegou com todos os documentos e a vacinação em dia. Recomendo de olhos fechados.",
  },
  {
    id: "marina-s",
    photo: "/clientes/marina.jpeg",
    name: "Marina S.",
    city: "São Paulo, SP",
    puppy: "Spitz Laranja Fêmea",
    stars: 5,
    text: "Fui mãe de primeira viagem e tinha muito medo de errar. A mentoria pós-venda foi decisiva para minha escolha. Já se passaram 8 meses e até hoje consigo tirar dúvidas direto com a criadora. Minha Mel é saudável, feliz e amada por toda a família.",
  },
  {
    id: "lucas-familia",
    photo: "/clientes/lucas.jpeg",
    name: "Lucas & Família",
    city: "Belo Horizonte, MG",
    puppy: "Spitz Preto Macho",
    stars: 5,
    text: "Comprei para minha filha de aniversário e foi a melhor decisão. O Zeus veio com registro oficial, consulta veterinária e hemograma completo. A criadora foi transparente em tudo — preço, documentação, saúde. Confiança total.",
  },
  {
    id: "fernanda-l",
    photo: "/clientes/fernanda.jpeg",
    name: "Fernanda L.",
    city: "Rio de Janeiro, RJ",
    puppy: "Spitz Creme Macho",
    stars: 5,
    text: "Pesquisei meses antes de decidir. O que diferenciou a By Império Dog foi a transparência — sem promessas vazias, com laudos e documentação real. O Thor chegou exatamente como prometido: saudável, socializado e com muita energia!",
  },
  {
    id: "joao",
    photo: "/clientes/joao.jpeg",
    name: "João",
    text: "Desde o primeiro contato, a criadora foi muito atenciosa e transparente. Recebi fotos e vídeos reais, todas as orientações e pude acompanhar tudo com segurança. Estamos apaixonados pelo nosso filhote!",
  },
  {
    id: "livia",
    photo: "/clientes/livia.jpeg",
    name: "Lívia",
    text: "Excelente experiência com a By Império Dog. O filhote foi entregue muito bem cuidado, com a documentação e o protocolo de saúde explicados detalhadamente. Recomendo!",
  },
  {
    id: "patricia",
    photo: "/clientes/patricia.jpeg",
    name: "Patrícia",
    text: "Pesquisei bastante antes de escolher e fiquei muito satisfeita. A criadora respondeu todas as minhas dúvidas sem pressão, no meu tempo. Atendimento sério e confiável.",
  },
  {
    id: "paula",
    photo: "/clientes/paula.jpeg",
    name: "Paula",
    text: "Nosso Spitz chegou saudável, alegre e muito bem cuidado. O suporte continuou mesmo depois da entrega, o que fez toda a diferença para nossa família.",
  },
  {
    id: "ricardo",
    photo: "/clientes/ricardo.jpeg",
    name: "Ricardo",
    text: "Atendimento impecável do começo ao fim. Tudo foi explicado com clareza e cumprido conforme combinado. Dá para perceber o carinho e a responsabilidade com os cães.",
  },
  {
    id: "roberto",
    photo: "/clientes/roberto.jpeg",
    name: "Roberto",
    text: "Todo o processo foi muito tranquilo. Recebi atualizações, vídeos e orientações até o momento da entrega. Minha experiência com a By Império Dog foi excelente.",
  },
  {
    id: "bruno-familia-jundiai",
    photo: "/clientes/bruno-familia-jundiai.jpeg",
    name: "Bruno e família",
    city: "Jundiaí, SP",
    text: "O que mais gostei foi da transparência. Conheci as condições, tirei todas as dúvidas e vi informações reais sobre o filhote antes de decidir. Recomendo a By Império Dog.",
  },
  {
    id: "camila",
    photo: "/clientes/camila.jpeg",
    name: "Camila",
    text: "Foi nosso primeiro Spitz e recebemos toda a orientação necessária sobre alimentação, adaptação e cuidados. A criadora foi muito paciente e continua nos ajudando quando precisamos.",
  },
  {
    id: "ana-paula-jundiai",
    photo: "/clientes/ana-paula-jundiai.jpeg",
    name: "Ana Paula",
    city: "Jundiaí, SP",
    text: "Nossa família está encantada! O filhote é carinhoso, saudável e chegou muito bem cuidado. A compra foi segura e o atendimento superou nossas expectativas.",
  },
  {
    id: "ronaldo-braganca-paulista",
    photo: "/clientes/ronaldo-braganca-paulista.jpeg",
    name: "Ronaldo",
    city: "Bragança Paulista, SP",
    text: "Recomendo de coração a By Império Dog. Atendimento profissional, fotos reais, informações claras e muito cuidado em cada etapa. Foi uma experiência maravilhosa.",
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
          Famílias que já receberam um filhote da By Império Dog
        </h2>
        <p className="mt-3 text-zinc-600">
          Criação de Spitz Alemão Anão desde {FOUNDING_YEAR}. Veja o que as famílias dizem sobre a experiência.
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
            key={t.id}
            className="w-[82vw] max-w-[320px] shrink-0 snap-start flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition sm:w-auto sm:max-w-none sm:shrink sm:hover:shadow-md"
          >
            {/* Sem nota, sem estrelas. O cartão começa pela aspa e continua
                legível — melhor do que cinco estrelas que ninguém deu. */}
            {t.stars ? <Stars count={t.stars} /> : null}
            <blockquote className="flex-1 text-sm leading-relaxed text-zinc-600">
              &ldquo;{t.text}&rdquo;
            </blockquote>
            <div className="flex items-center gap-3 border-t border-zinc-100 pt-4">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-100">
                {t.photo && t.name ? (
                  <Image src={t.photo} alt={t.name} fill className="object-cover" sizes="40px" />
                ) : (
                  // Aspa no lugar do rosto: mantém o desenho do cartão sem
                  // pendurar a foto de uma família em um texto de outra.
                  <span className="flex h-full w-full items-center justify-center pb-1 text-2xl leading-none text-zinc-300" aria-hidden="true">
                    &rdquo;
                  </span>
                )}
              </div>
              <div>
                {t.name ? (
                  <>
                    <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                    <p className="text-xs text-zinc-400">{t.city}</p>
                    <p className="text-xs font-medium text-emerald-600">{t.puppy}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-zinc-900">Família atendida</p>
                    <p className="text-xs text-zinc-400">Depoimento enviado ao canil</p>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
