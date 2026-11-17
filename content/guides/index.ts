export type GuideSection = { heading: string; paragraphs: string[] };
export type Guide = {
  slug: string;
  title: string;
  /**
   * Título curto só para o <title>/og:title da página. Existe porque alguns
   * títulos passam de 100 caracteres com o sufixo da marca e o Google corta o
   * fim na busca. O H1 continua sendo o `title`. Opcional.
   */
  seoTitle?: string;
  metaDescription: string;
  publishedAt: string;
  updatedAt: string;
  excerpt: string;
  readingMinutes: number;
  sections: GuideSection[];
  faqs: { question: string; answer: string }[];
  relatedColors?: string[];
};

export const guides: Guide[] = [
  {
    slug: "como-escolher-spitz-alemao-anao",
    title: "Como Escolher um Spitz Alemão Anão (Lulu da Pomerânia): Guia Definitivo",
    seoTitle: "Como Escolher um Spitz Alemão Anão (Lulu da Pomerânia)",
    metaDescription:
      "Como escolher o Spitz Alemão Anão (Lulu da Pomerânia): macho x fêmea, diferenças entre cores, documentação e como reconhecer um criador confiável.",
    publishedAt: "2025-01-10",
    updatedAt: "2025-05-01",
    excerpt:
      "Escolher um Spitz Alemão Anão (Lulu da Pomerânia) vai muito além da cor da pelagem. Este guia cobre tudo que você precisa saber antes de reservar seu filhote.",
    readingMinutes: 8,
    sections: [
      {
        heading: "Entenda o padrão racial antes de comprar",
        paragraphs: [
          "O Lulu da Pomerânia tem cernelha (altura) de 21 cm ± 3 cm, conforme o padrão FCI nº 97, e pelagem dupla e densa. Criador sério trabalha dentro dessa faixa e é honesto sobre o limite: altura de adulto não se mede em filhote — se estima pela linhagem, e a estimativa erra.",
          "Desconfie de vendedores que oferecem 'Spitz micro' ou 'nano' — esses termos não existem no padrão oficial e frequentemente indicam seleção de exemplares com problemas de saúde.",
        ],
      },
      {
        heading: "Macho ou Fêmea: qual escolher?",
        paragraphs: [
          "Os machos partem de R$ 4.500 e as fêmeas de R$ 6.500 no PIX, em qualquer cor. Na fêmea não castrada, o intervalo entre cios varia; os cuidados reprodutivos devem ser orientados pelo médico-veterinário.",
          "Temperamento não vem do sexo. O comportamento é o típico da raça e depende de genética, socialização e da rotina que a família oferece — há macho tranquilo e fêmea agitada, e o contrário também.",
          "Não existe diferença de qualidade, saúde ou inteligência entre machos e fêmeas — ambos recebem a mesma consulta veterinária, o mesmo hemograma completo, registro oficial e acompanhamento na By Imperio Dog.",
        ],
      },
      {
        heading: "As diferenças entre as cores",
        paragraphs: [
          "A By Imperio Dog divulga sete cores: Particolor, Laranja, Creme, Preto, Branco, Chocolate e Merle. A cor não muda o valor de partida, que depende do sexo: machos a partir de R$ 4.500 e fêmeas a partir de R$ 6.500 no PIX. O laranja é o mais conhecido da raça; o particolor tem base branca com manchas definidas; o chocolate é a pelagem marrom; o merle tem manchas marmorizadas.",
          "A cor não influencia o temperamento. Todas as cores seguem o mesmo protocolo de saúde na By Imperio Dog.",
        ],
      },
      {
        heading: "Como reconhecer um criador confiável",
        paragraphs: [
          "Um criador sério apresenta registro oficial do filhote e dos pais, carteira de vacinação assinada por veterinário, histórico de vermifugação e o resultado dos exames feitos antes da entrega. Na By Imperio Dog esse pacote é consulta veterinária e hemograma completo — exame de sangue com resultado, não um atestado genérico.",
          "A possibilidade e o formato da visita devem ser informados com transparência. Quando a visita ao local de criação não for viável, o interessado pode solicitar videochamada, documentação e outras formas de verificação. Em qualquer formato, observe se os filhotes estão limpos, curiosos e sem sinais de medo ou apatia.",
          "Pergunte sobre o suporte pós-venda: na By Imperio Dog ele é feito pelo WhatsApp, direto com a criadora, sem prazo definido. Pergunte diretamente: 'Posso entrar em contato depois da entrega?' A resposta diz muito.",
        ],
      },
      {
        heading: "Documentação obrigatória",
        paragraphs: [
          "O mínimo exigível ao receber seu filhote: registro oficial, carteira de vacinação assinada pelo médico-veterinário com o protocolo em dia conforme a idade do filhote, orientação por escrito das doses seguintes e comprovação dos exames feitos antes da entrega. A identificação do animal deve seguir os requisitos exigidos pela legislação aplicável — confirme no contrato o que está previsto antes de fechar.",
          "Na By Imperio Dog, o registro oficial é incluso, com emissão e entrega conforme o prazo da entidade responsável e as condições previstas em contrato. Os demais documentos são apresentados antes da reserva.",
        ],
      },
    ],
    faqs: [
      {
        question: "Quando o filhote pode ir para o novo lar?",
        answer:
          "A comercialização e a entrega são realizadas somente após o cumprimento dos requisitos sanitários, de identificação e documentais previstos na legislação aplicável. A convivência com a mãe e os irmãos nas primeiras semanas é fundamental para o equilíbrio comportamental, e esse período não deve ser abreviado por pressão do comprador.",
      },
      {
        question: "O que é registro oficial e por que importa?",
        answer:
          "O registro oficial é o documento de linhagem emitido pela entidade responsável, conforme os prazos e condições dela. Na By Imperio Dog, o registro é incluso e a emissão segue o que está previsto em contrato.",
      },
      {
        question: "Posso pagar parcelado?",
        answer:
          "Depende do criador. Na By Imperio Dog, as condições de reserva e pagamento são combinadas diretamente pelo WhatsApp e ficam descritas no contrato.",
      },
      {
        question: "Lulu da Pomerânia é bom para quem trabalha fora?",
        answer:
          "Sim, desde que tenha companhia durante boa parte do dia. O Spitz não suporta isolamento prolongado. Considere ter dois filhotes se passar muitas horas fora.",
      },
    ],
    relatedColors: ["laranja", "creme", "preto", "branco"],
  },
  {
    slug: "spitz-alemao-anao-alimentacao",
    title: "Alimentação do Spitz Alemão Anão (Lulu da Pomerânia): Guia Completo",
    seoTitle: "Alimentação do Spitz Alemão Anão (Lulu da Pomerânia)",
    metaDescription:
      "Tudo sobre a alimentação do Spitz Alemão Anão (Lulu da Pomerânia): ração por fase, quantidade por peso e idade, alimentos proibidos e suplementação.",
    publishedAt: "2025-01-20",
    updatedAt: "2025-05-01",
    excerpt:
      "A alimentação adequada é um dos pilares da saúde e longevidade do Spitz. Este guia cobre tudo, do filhote ao adulto.",
    readingMinutes: 7,
    sections: [
      {
        heading: "Ração ideal para filhotes (2 a 12 meses)",
        paragraphs: [
          "Filhotes de Spitz precisam de ração específica para cães pequenos em fase de crescimento, com alto teor de proteína (mínimo 28%), DHA para desenvolvimento cerebral e cálcio balanceado para os ossos.",
          "Marcas premium com certificação AAFCO e sem corantes artificiais são as mais indicadas. A criadora da By Imperio Dog informa a marca que o filhote vem comendo, para facilitar a transição.",
          "Frequência: 3 a 4 refeições por dia até os 3 meses, depois 3 refeições até os 6 meses e 2 refeições por dia dos 6 meses em diante.",
        ],
      },
      {
        heading: "Quantidade certa para evitar sobrepeso",
        paragraphs: [
          "O Spitz Alemão Anão (Lulu da Pomerânia) adulto costuma pesar entre 1,5 e 3,5 kg — referência prática, já que o padrão FCI determina apenas que o peso seja proporcional ao tamanho do cão. A quantidade diária de ração varia entre 40 e 90 g dependendo do peso, nível de atividade e formulação da ração.",
          "Sempre siga a tabela de alimentação do fabricante como ponto de partida. Ajuste conforme a condição corporal do animal — costelas palpáveis mas não visíveis é o padrão ideal.",
          "O Spitz tem predisposição ao sobrepeso quando excessivamente mimado com petiscos. Mantenha os petiscos como recompensa, nunca como refeição.",
        ],
      },
      {
        heading: "Alimentos proibidos",
        paragraphs: [
          "Nunca ofereça: chocolate, uva, passas, cebola, alho, xilitol (presente em chicletes e alguns alimentos diet), abacate, cafeína ou álcool. Esses alimentos são tóxicos para cães.",
          "Também evite: ossos cozidos (que racham e perfuram o trato digestivo), pele de frango gordurosa em excesso e alimentos muito salgados.",
        ],
      },
      {
        heading: "Suplementação e água",
        paragraphs: [
          "Ômega 3 (óleo de peixe) aparece com frequência na literatura veterinária associado à saúde da pele e da pelagem. Se e quanto suplementar é decisão do médico-veterinário que acompanha o seu cão.",
          "Água fresca disponível 24h é inegociável. Troque pelo menos duas vezes ao dia e prefira bebedouros de aço inox ou cerâmica ao invés de plástico.",
        ],
      },
    ],
    faqs: [
      {
        question: "Posso dar comida caseira para o Spitz?",
        answer:
          "Sim, se formulada por um veterinário nutricionista. Dieta doméstica sem balanceamento adequado pode causar deficiências nutricionais graves. A ração premium completa é a opção mais segura para a maioria dos tutores.",
      },
      {
        question: "O Spitz pode comer frango cozido?",
        answer:
          "Sim. Frango cozido sem tempero, sal ou ossos é um excelente complemento. Mas não deve substituir a ração balanceada — use como petisco ou reforço proteico esporádico.",
      },
      {
        question: "Meu Spitz não come ração. O que fazer?",
        answer:
          "Evite mudar de ração com frequência — isso estimula seletividade. Ofereça a ração sempre no mesmo horário e retire o prato após 20 minutos. Na próxima refeição, ofereça normalmente. Na maioria dos casos, o filhote cede em 1 a 2 dias.",
      },
      {
        question: "Com que idade o Spitz começa a comer ração adulta?",
        answer:
          "A transição para ração adulta deve acontecer entre 10 e 12 meses. Faça a mudança gradualmente em 7-10 dias, misturando as duas rações e aumentando progressivamente a proporção da nova.",
      },
    ],
    relatedColors: [],
  },
  {
    slug: "cuidados-basicos-spitz-alemao-anao",
    title: "Cuidados Básicos com o Spitz Alemão Anão (Lulu da Pomerânia): Do Banho ao Veterinário",
    seoTitle: "Cuidados Básicos com o Spitz Alemão Anão (Lulu da Pomerânia)",
    metaDescription:
      "Guia completo de cuidados básicos com o Spitz Alemão Anão (Lulu da Pomerânia): escovação, banho, unhas, saúde preventiva e atividade física.",
    publishedAt: "2025-02-20",
    updatedAt: "2025-05-01",
    excerpt:
      "O Spitz é uma raça relativamente fácil de manter saudável — desde que você conheça os cuidados específicos da pelagem dupla e da sua predisposição a certos problemas.",
    readingMinutes: 7,
    sections: [
      {
        heading: "Cuidados com a pelagem: escovação e banho",
        paragraphs: [
          "O Spitz Alemão Anão (Lulu da Pomerânia) tem pelagem dupla: subpelo denso e pelo externo longo. Essa estrutura exige escovação pelo menos duas vezes por semana com escova de pinos e pente de aço para evitar nós.",
          "O banho deve ser feito mensalmente com shampoo específico para pelagem dupla. Use secador em temperatura baixa para secar completamente — pelo úmido retido junto ao subpelo favorece dermatites.",
          "Nas trocas sazonais de pelo (primavera e outono), escove diariamente por 2 a 3 semanas para remover o subpelo solto e evitar acúmulo.",
        ],
      },
      {
        heading: "Unhas, ouvidos e dentes",
        paragraphs: [
          "Corte as unhas a cada 3 a 4 semanas ou quando começar a ouvir o barulho no chão ao caminhar. Use alicate de guilhotina específico para cães pequenos e evite o quick (parte rosada da unha).",
          "Limpe os ouvidos semanalmente com solução específica e algodão. O Spitz tem orelhas eretas que circulam bem o ar, mas acúmulo de cera pode acontecer.",
          "Escovação dentária 2 a 3 vezes por semana ajuda a reduzir o tártaro e a prevenir doença periodontal, muito comum em raças pequenas. Introduza o hábito ainda filhote e leve a avaliação da boca para a consulta de rotina.",
        ],
      },
      {
        heading: "Atividade física e estimulação mental",
        paragraphs: [
          "O Spitz Anão precisa de duas caminhadas de 20 minutos por dia e estimulação mental (jogos de farejamento, Kong, trick training). Sem estímulo, tende a desenvolver comportamentos ansiosos como latidos excessivos.",
          "Evite exercício físico intenso em dias muito quentes (acima de 28°C) — o Spitz tem predisposição ao superaquecimento devido à pelagem densa.",
        ],
      },
      {
        heading: "Saúde preventiva: vacinas e consultas",
        paragraphs: [
          "O esquema de vacinação e de vermifugação é definido pelo médico-veterinário responsável, conforme a idade, a região e o histórico de cada cão.",
          "Consultas de rotina ao longo do ano ajudam a acompanhar a saúde do cão adulto, e a frequência costuma aumentar com a idade. O intervalo adequado é indicado pelo médico-veterinário.",
          "A raça tem predisposição a colapso de traqueia, luxação de patela e doença cardíaca. O acompanhamento veterinário regular é o que permite identificar e conduzir esses quadros.",
        ],
      },
    ],
    faqs: [
      {
        question: "Posso raspar a pelagem do Spitz para ele sofrer menos calor?",
        answer:
          "Nunca. Raspar a pelagem dupla do Spitz destrói o subpelo e pode causar síndrome pós-tosa, onde o pelo não cresce adequadamente novamente. A pelagem dupla isola tanto do calor quanto do frio.",
      },
      {
        question: "Com que frequência devo levar o Spitz ao banho e tosa?",
        answer:
          "Banho e escovação profissional a cada 30-45 dias. Corte de unhas a cada 3-4 semanas (pode ser feito em casa com prática). Tosa higiênica conforme necessidade.",
      },
      {
        question: "O Spitz pode viver com gatos?",
        answer:
          "Sim, quando bem socializado desde filhote. Apresentações graduais e calmas são fundamentais. O Spitz tende a aceitar bem gatos que conhece desde cedo.",
      },
      {
        question: "Qual a expectativa de vida do Lulu da Pomerânia?",
        answer:
          "Entre 12 e 16 anos quando bem cuidado. A raça é longevia entre os cães pequenos. Alimentação adequada, veterinário regular e estimulação mental são os principais fatores de longevidade.",
      },
    ],
    relatedColors: [],
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}
