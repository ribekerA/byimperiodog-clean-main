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
import { RESPOSTA_PRETO, RESPOSTA_QUANTO_CUSTA } from "@/domain/pricing";

export type FaqItem = {
  question: string;
  answer: string;
};

export const HOME_FAQ_ITEMS: FaqItem[] = [
  {
    question: "Quanto custa um Spitz Alemão Anão (Lulu da Pomerânia)?",
    // Resposta oficial de preço, importada de domain/pricing. O que acompanha o
    // filhote tem pergunta própria logo abaixo ("Quais documentos acompanham o
    // filhote?") — misturar as duas coisas era o que fazia esta resposta crescer
    // até ninguém mais conferir os números dentro dela.
    answer: RESPOSTA_QUANTO_CUSTA,
  },
  {
    question: "O Spitz Alemão Anão é bom para apartamento?",
    answer:
      "Sim. O Spitz Alemão Anão é uma das raças mais adaptadas à vida em apartamento. Com cernelha (altura) de 21 cm ± 3 cm conforme o padrão FCI nº 97, ele se sente bem em espaços compactos desde que tenha passeios diários e estimulação mental. O Spitz Alemão Anão é uma raça alerta e pode ser vocal. Socialização, enriquecimento ambiental e treinamento consistente ajudam no controle dos latidos.",
  },
  {
    question: "Qual melhor canil de Spitz Alemão Anão em Bragança Paulista e interior de SP?",
    answer:
      `Não existe um ranking oficial de canis, e desconfie de quem se anuncia como o melhor. O que dá para comparar é objetivo: registro oficial, contrato por escrito, acompanhamento veterinário e o que o criador apresenta antes do pagamento. A By Império Dog é um canil familiar especializado em Spitz Alemão Anão em Bragança Paulista, SP, cria a raça desde ${FOUNDING_YEAR} e entrega os filhotes com registro oficial, consulta veterinária, hemograma completo, protocolo vacinal em dia conforme a idade, contrato e mentoria pós-venda. Atendemos famílias de todo o Brasil.`,
  },
  {
    question: "Qual a diferença entre Spitz Alemão Anão e Lulu da Pomerânia?",
    answer:
      "São nomes para a mesma raça. 'Lulu da Pomerânia' é o nome popular usado no Brasil, enquanto 'Spitz Alemão Anão' é a denominação oficial reconhecida pela FCI (Fédération Cynologique Internationale). Quando você busca um desses nomes, está procurando o mesmo cachorro — o pequeno e fofo de pelagem densa e orelhas pontudas.",
  },
  {
    question: "Spitz Alemão Anão preto é difícil de encontrar? É mais caro?",
    // Mesma resposta da página da cor e da /spitz-alemao-preto — vem de
    // domain/pricing para as três não divergirem quando a tabela mudar.
    answer: RESPOSTA_PRETO,
  },
  {
    question: "Vocês entregam o filhote em todo o Brasil?",
    answer:
      "Sim. Orientamos transporte seguro para qualquer estado do Brasil. O tutor pode buscar pessoalmente em Bragança Paulista (SP) ou o filhote pode viajar por transportadora aérea especializada em animais. Auxiliamos na escolha da empresa, preparação da caixa de transporte e documentação necessária. O filhote só viaja após atingir peso e maturidade adequados, com todos os exames em dia.",
  },
  {
    question: "Quais documentos acompanham o filhote?",
    answer:
      "Todo filhote da By Império Dog sai com: registro oficial incluso (emissão e entrega conforme o prazo da entidade responsável e as condições previstas em contrato), laudo de saúde, carteira de vacinação assinada pelo médico-veterinário com o protocolo em dia conforme a idade do filhote e orientação para as doses seguintes, hemograma, histórico de vermifugação e contrato de responsabilidade compartilhada. A identificação do animal segue os requisitos exigidos pela legislação aplicável. Além disso, o tutor recebe acesso à mentoria pós-venda diretamente com a criadora via WhatsApp.",
  },
  {
    question: "Por quanto tempo tenho suporte após receber o filhote?",
    answer:
      `O suporte continua depois da entrega, pelo tempo em que a família precisar. Isso inclui orientação sobre alimentação por fase de vida, comportamento, cuidados de pelagem e saúde, com encaminhamento ao médico-veterinário quando o caso exigir avaliação profissional. O contato é direto com a criadora via WhatsApp, sem intermediários.`,
  },
];
