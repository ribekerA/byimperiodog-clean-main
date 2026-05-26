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

export type FaqItem = {
  question: string;
  answer: string;
};

export const HOME_FAQ_ITEMS: FaqItem[] = [
  {
    question: "Quanto custa um Spitz Alemão Anão (Lulu da Pomerânia)?",
    answer:
      "Os filhotes de Spitz Alemão Anão (Lulu da Pomerânia) da By Império Dog custam entre R$ 7.000 e R$ 15.000, dependendo da cor e do sexo. Machos variam de R$ 7.000 (laranja) a R$ 9.000 (creme). Fêmeas, por sua maior demanda, variam de R$ 10.000 (laranja) a R$ 15.000 (creme). Todos os filhotes saem com registro oficial, laudo de saúde, vacinação completa, microchip e mentoria vitalícia inclusos no valor — sem cobranças extras.",
  },
  {
    question: "O Spitz Alemão Anão é bom para apartamento?",
    answer:
      "Sim. O Spitz Alemão Anão (Lulu da Pomerânia) é uma das raças mais adaptadas à vida em apartamento. Com até 22 cm de altura e temperamento equilibrado, ele se sente bem em espaços compactos desde que tenha passeios diários e estimulação mental. Não é uma raça barulhenta por natureza — com socialização adequada desde filhote, como fazemos aqui, o comportamento é tranquilo.",
  },
  {
    question: "Qual melhor canil de Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista e interior de SP?",
    answer:
      "A By Império Dog é um canil familiar especializado em Spitz Alemão Anão (Lulu da Pomerânia) localizado em Bragança Paulista, SP. Com mais de 10 anos de criação responsável, mais de 180 famílias atendidas e filhotes com registro oficial, laudos veterinários e mentoria vitalícia, somos referência no interior de São Paulo. Atendemos famílias de todo o Brasil.",
  },
  {
    question: "Qual a diferença entre Spitz Alemão Anão e Lulu da Pomerânia?",
    answer:
      "São nomes para a mesma raça. 'Lulu da Pomerânia' é o nome popular usado no Brasil, enquanto 'Spitz Alemão Anão' é a denominação oficial reconhecida pela FCI (Fédération Cynologique Internationale). Quando você busca um desses nomes, está procurando o mesmo cachorro — o pequeno e fofo de pelagem densa e orelhas pontudas.",
  },
  {
    question: "Spitz Alemão (Lulu da Pomerânia) preto é raro? É mais caro?",
    answer:
      "O Spitz Alemão Anão (Lulu da Pomerânia) preto é considerado uma cor rara, com menos criadores especializados no Brasil. É mais difícil de encontrar com registro oficial e linhagem saudável. Na By Império Dog, mantemos matrizes na cor preta com laudos genéticos. O preço do preto fica em torno de R$ 8.000 para machos e R$ 13.000 para fêmeas — um pouco acima do laranja, mas abaixo do creme.",
  },
  {
    question: "Vocês entregam o filhote em todo o Brasil?",
    answer:
      "Sim. Orientamos transporte seguro para qualquer estado do Brasil. O tutor pode buscar pessoalmente em Bragança Paulista (SP) ou o filhote pode viajar por transportadora aérea especializada em animais. Auxiliamos na escolha da empresa, preparação da caixa de transporte e documentação necessária. O filhote só viaja após atingir peso e maturidade adequados, com todos os exames em dia.",
  },
  {
    question: "Quais documentos acompanham o filhote?",
    answer:
      "Todo filhote da By Império Dog sai com: registro oficial, laudo de saúde, carteira de vacinação atualizada, teste de patela, histórico de vermifugação, microchip implantado, nota fiscal e contrato de responsabilidade compartilhada. Além disso, o tutor recebe acesso à mentoria vitalícia diretamente com a criadora via WhatsApp.",
  },
  {
    question: "Por quanto tempo tenho suporte após receber o filhote?",
    answer:
      "O suporte é vitalício — para a vida toda do seu Spitz. Isso inclui orientação sobre alimentação por fase de vida, comportamento, cuidados de pelagem, saúde e emergências. O contato é direto com a criadora via WhatsApp, sem intermediários. Mais de 180 famílias atendidas ao longo de 10 anos comprovam a seriedade deste compromisso.",
  },
];
