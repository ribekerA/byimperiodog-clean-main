/**
 * home-faq-items.ts
 *
 * Plain data module — NO "use client" directive.
 * Safe to import from both Server Components (for JSON-LD generation)
 * and Client Components (for rendering).
 *
 * Previously exported directly from HomeFAQ.tsx ("use client"), which caused
 * Next.js to treat the array as a Client Reference — breaking buildFAQLD()
 * calls in Server Components.
 */

import { FOUNDING_YEAR } from "@/domain/config";

export type FaqItem = {
  question: string;
  answer: string;
};

export const HOME_FAQ_ITEMS: FaqItem[] = [
  {
    question: "Quanto custa um Spitz Alemão Anão (Lulu da Pomerânia)?",
    answer:
      "Os filhotes de Spitz Alemão Anão (Lulu da Pomerânia) da By Império Dog custam entre R$ 6.500 e R$ 8.500, dependendo da cor e do sexo. Machos variam de R$ 6.500 (laranja e cinza-lobo) a R$ 7.500 (creme e preto). Fêmeas custam R$ 8.500, valor único para todas as cores, por conta da maior demanda. Todos os filhotes saem com registro oficial, laudo de saúde, protocolo vacinal em dia conforme a idade do filhote e mentoria vitalícia inclusos no valor. O microchip é opcional, sob contratação.",
  },
  {
    question: "O Spitz Alemão Anão é bom para apartamento?",
    answer:
      "Sim. O Spitz Alemão Anão (Lulu da Pomerânia) é uma das raças mais adaptadas à vida em apartamento. Com cernelha (altura) de 21 cm ± 3 cm conforme o padrão FCI nº 97, ele se sente bem em espaços compactos desde que tenha passeios diários e estimulação mental. O Spitz Alemão Anão (Lulu da Pomerânia) é uma raça alerta e pode ser vocal. Socialização, enriquecimento ambiental e treinamento consistente ajudam no controle dos latidos.",
  },
  {
    question: "Qual melhor canil de Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista e interior de SP?",
    answer:
      `A By Império Dog é um canil familiar especializado em Spitz Alemão Anão (Lulu da Pomerânia) localizado em Bragança Paulista, SP. Criamos a raça desde ${FOUNDING_YEAR}, já atendemos mais de 180 famílias e entregamos os filhotes com registro oficial, laudos veterinários e mentoria vitalícia. Atendemos famílias de todo o Brasil.`,
  },
  {
    question: "Qual a diferença entre Spitz Alemão Anão e Lulu da Pomerânia?",
    answer:
      "São nomes para a mesma raça. 'Lulu da Pomerânia' é o nome popular usado no Brasil, enquanto 'Spitz Alemão Anão' é a denominação oficial reconhecida pela FCI (Fédération Cynologique Internationale). Quando você busca um desses nomes, está procurando o mesmo cachorro — o pequeno e fofo de pelagem densa e orelhas pontudas.",
  },
  {
    question: "Spitz Alemão (Lulu da Pomerânia) preto é raro? É mais caro?",
    answer:
      "O Spitz Alemão Anão (Lulu da Pomerânia) preto é considerado uma cor rara, com menos criadores especializados no Brasil. É mais difícil de encontrar com registro oficial e linhagem saudável. Na By Império Dog, mantemos matrizes na cor preta com registro oficial e acompanhamento veterinário. O preço do preto é de R$ 7.500 para machos e R$ 8.500 para fêmeas (mesmo valor de todas as cores) — no mesmo patamar do creme, acima do laranja e do cinza-lobo.",
  },
  {
    question: "Vocês entregam o filhote em todo o Brasil?",
    answer:
      "Sim. Orientamos transporte seguro para qualquer estado do Brasil. O tutor pode buscar pessoalmente em Bragança Paulista (SP) ou o filhote pode viajar por transportadora aérea especializada em animais. Auxiliamos na escolha da empresa, preparação da caixa de transporte e documentação necessária. O filhote só viaja após atingir peso e maturidade adequados, com todos os exames em dia.",
  },
  {
    question: "Quais documentos acompanham o filhote?",
    answer:
      "Todo filhote da By Império Dog sai com: registro oficial incluso (emissão e entrega conforme o prazo da entidade responsável e as condições previstas em contrato), laudo de saúde, carteira de vacinação assinada pelo médico-veterinário com o protocolo em dia conforme a idade do filhote e orientação para as doses seguintes, teste de patela, histórico de vermifugação, nota fiscal e contrato de responsabilidade compartilhada. Microchip é opcional, sob contratação. Além disso, o tutor recebe acesso à mentoria vitalícia diretamente com a criadora via WhatsApp.",
  },
  {
    question: "Por quanto tempo tenho suporte após receber o filhote?",
    answer:
      `O suporte é vitalício — para a vida toda do seu Spitz Alemão Anão (Lulu da Pomerânia). Isso inclui orientação sobre alimentação por fase de vida, comportamento, cuidados de pelagem e saúde, com encaminhamento ao médico-veterinário quando o caso exigir avaliação profissional. O contato é direto com a criadora via WhatsApp, sem intermediários. Mais de 180 famílias já foram atendidas desde ${FOUNDING_YEAR}.`,
  },
];
