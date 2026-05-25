export type GuideSection = { heading: string; paragraphs: string[] };
export type Guide = {
  slug: string;
  title: string;
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
    title: "Como Escolher um Spitz Alemão Anão (Lulu da Pomerânia): Guia Definitivo 2025",
    metaDescription:
      "Aprenda tudo sobre como escolher o Spitz Alemão Anão (Lulu da Pomerânia) ideal: macho x fêmea, diferenças entre cores, documentação obrigatória e como reconhecer um criador confiável.",
    publishedAt: "2025-01-10",
    updatedAt: "2025-05-01",
    excerpt:
      "Escolher um Spitz Alemão Anão (Lulu da Pomerânia) vai muito além da cor da pelagem. Este guia cobre tudo que você precisa saber antes de reservar seu filhote.",
    readingMinutes: 8,
    sections: [
      {
        heading: "Entenda o padrão racial antes de comprar",
        paragraphs: [
          "O Spitz Alemão Anão (Lulu da Pomerânia) deve ter, no máximo, 22 cm de altura e pelagem dupla e densa. Criadores sérios seguem o padrão FCI e apresentam laudo de medição junto ao pedigree CBKC.",
          "Desconfie de vendedores que oferecem 'Spitz micro' ou 'nano' abaixo de 20 cm — esses termos não existem no padrão oficial e frequentemente indicam seleção de exemplares com problemas de saúde.",
        ],
      },
      {
        heading: "Macho ou Fêmea: qual escolher?",
        paragraphs: [
          "Fêmeas tendem a ser mais apegadas e criar vínculos seletivos e profundos com a família. São ideais para quem busca um companheiro leal e dócil. O preço é superior ao macho em todas as cores.",
          "Machos são geralmente mais brincalhões, extrovertidos e menos territoriais quando castrados. Têm custo menor e são excelentes para famílias com crianças pequenas que preferem um cão com mais energia.",
          "Não existe diferença de qualidade, saúde ou inteligência entre machos e fêmeas — ambos recebem os mesmos laudos, pedigree e acompanhamento na By Império Dog.",
        ],
      },
      {
        heading: "As diferenças entre as cores",
        paragraphs: [
          "Creme e Preto Fêmea são as cores mais valorizadas e raras. Wolf Sable (bicolor cinza/laranja) é a cor mais exótica. Laranja é a mais icônica e com maior disponibilidade ao longo do ano.",
          "A cor não influencia o temperamento nem a saúde — influencia apenas a disponibilidade e, consequentemente, o preço. Todas as cores seguem o mesmo protocolo de saúde na By Império Dog.",
        ],
      },
      {
        heading: "Como reconhecer um criador confiável",
        paragraphs: [
          "Um criador sério apresenta pedigree CBKC do filhote e dos pais, laudo cardiológico, exames genéticos (opcionais mas recomendados) e vacinação em dia com carteirinha assinada por veterinário.",
          "Visite o ambiente antes de reservar. Os filhotes devem conviver com os pais, estar limpos, curiosos e sem sinais de medo ou apatia. Criadores que recusam visitas são um sinal de alerta.",
          "Mentoria pós-venda é o diferencial que separa criadores comprometidos dos comercializadores. Pergunte diretamente: 'Posso entrar em contato depois da entrega?' A resposta diz muito.",
        ],
      },
      {
        heading: "Documentação obrigatória",
        paragraphs: [
          "O mínimo exigível ao receber seu filhote: Pedigree CBKC, carteirinha de vacinação com pelo menos V10 e antirrábica, microchip implantado e laudo de saúde veterinário.",
          "Na By Império Dog, toda a documentação é entregue antes ou no momento da reserva. Você não paga pelo filhote sem ter visto os documentos.",
        ],
      },
    ],
    faqs: [
      {
        question: "Qual a idade ideal para levar o filhote para casa?",
        answer:
          "Entre 60 e 75 dias de vida. Antes disso, a socialização com a mãe e irmãos é fundamental para o equilíbrio comportamental. Criadores sérios não entregam antes dos 60 dias.",
      },
      {
        question: "O que é pedigree CBKC e por que importa?",
        answer:
          "O pedigree CBKC é o registro oficial de linhagem emitido pelo Kennel Club do Brasil. Comprova que o filhote é puro-sangue Spitz Alemão Anão (Lulu da Pomerânia) com árvore genealógica rastreável.",
      },
      {
        question: "Posso pagar parcelado?",
        answer:
          "Depende do criador. Na By Império Dog, as condições de reserva e pagamento são negociadas diretamente via WhatsApp com transparência total.",
      },
      {
        question: "Spitz Alemão Anão (Lulu da Pomerânia) é bom para quem trabalha fora?",
        answer:
          "Sim, desde que tenha companhia durante boa parte do dia. O Spitz não suporta isolamento prolongado. Considere adotar dois filhotes se passar muitas horas fora.",
      },
    ],
    relatedColors: ["creme", "laranja", "preto", "wolf-sable"],
  },
  {
    slug: "spitz-alemao-anao-alimentacao",
    title: "Alimentação do Spitz Alemão Anão (Lulu da Pomerânia): Guia Completo",
    metaDescription:
      "Tudo sobre a alimentação do Spitz Alemão Anão (Lulu da Pomerânia): ração ideal, quantidade por peso e idade, alimentos proibidos, suplementação e dicas da criadora.",
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
          "Marcas premium com certificação AAFCO e sem corantes artificiais são as mais indicadas. A criadora da By Império Dog orienta a marca específica usada desde o nascimento para facilitar a transição.",
          "Frequência: 3 a 4 refeições por dia até os 3 meses, depois 3 refeições até os 6 meses e 2 refeições por dia dos 6 meses em diante.",
        ],
      },
      {
        heading: "Quantidade certa para evitar sobrepeso",
        paragraphs: [
          "O Spitz Alemão Anão (Lulu da Pomerânia) adulto pesa entre 1,5 e 3,5 kg. A quantidade diária de ração varia entre 40 e 90g dependendo do peso, nível de atividade e formulação da ração.",
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
          "Ômega 3 (óleo de peixe) é o suplemento mais indicado para manter a pelagem brilhante e a pele saudável no Spitz. A dose varia por peso — consulte seu veterinário.",
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
    slug: "spitz-alemao-anao-vs-lulu-pomerania",
    title: "Spitz Alemão Anão x Lulu da Pomerânia: São o Mesmo Cão?",
    metaDescription:
      "Entenda de uma vez a diferença (ou não) entre Spitz Alemão Anão e Lulu da Pomerânia. Nomenclatura oficial, padrão FCI e por que isso importa na hora de comprar.",
    publishedAt: "2025-02-05",
    updatedAt: "2025-05-01",
    excerpt:
      "A confusão entre Spitz Alemão Anão e Lulu da Pomerânia é a mais comum no nicho. A resposta curta: é o mesmo cão. A resposta completa é bem mais interessante.",
    readingMinutes: 5,
    sections: [
      {
        heading: "São o mesmo cão",
        paragraphs: [
          "Sim, o Spitz Alemão Anão e o Lulu da Pomerânia são a mesma raça. A FCI (Federação Cinológica Internacional) e a CBKC (Confederação Brasileira de Cinologia) reconhecem oficialmente a raça como 'Spitz Alemão' dividido em cinco tamanhos, sendo o 'Anão' (Kleinspitz / Zwergspitz) o menor deles.",
          "No Brasil, o apelido 'Lulu da Pomerânia' se popularizou nas décadas de 1980 e 1990 por influência americana, onde a raça é chamada de 'Pomeranian'. O nome homenageia a região histórica da Pomerânia (hoje norte da Polônia e Alemanha).",
        ],
      },
      {
        heading: "Por que o nome causa confusão?",
        paragraphs: [
          "O problema surge porque alguns vendedores comercializam 'Spitz Alemão' e 'Lulu da Pomerânia' como raças diferentes para justificar diferenças de preço ou para disfarçar cruzamentos inadequados.",
          "Geneticamente, comportamentalmente e morfologicamente, são a mesma raça. Um filhote com pedigree CBKC registrado como 'Spitz Alemão Anão' e outro como 'Lulu da Pomerânia' são documentalmente idênticos — a CBKC aceita os dois termos.",
        ],
      },
      {
        heading: "O que o padrão FCI define",
        paragraphs: [
          "O padrão FCI N° 97 descreve o Spitz Alemão — Lulu da Pomerânia — (Deutsche Spitz) em cinco variedades de tamanho: Wolfsspitz (Keeshond), Großspitz (Grande), Mittelspitz (Médio), Kleinspitz (Pequeno) e Zwergspitz (Anão / Pomeranian).",
          "O Zwergspitz/Pomeranian — nosso 'Anão' — tem peso entre 1,5 e 3 kg e altura máxima de 22 cm. Qualquer animal vendido como 'micro' ou 'nano' abaixo dessas medidas não corresponde ao padrão oficial.",
        ],
      },
      {
        heading: "Como isso impacta a compra",
        paragraphs: [
          "Ao buscar um filhote, tanto 'Spitz Alemão Anão' quanto 'Lulu da Pomerânia' são buscas válidas. O que importa é o pedigree CBKC e a qualidade do criador, não o nome usado no anúncio.",
          "Desconfie de quem vende 'Lulu Pomerânia importado' a preços absurdos — não existe vantagem real em filhotes importados para um comprador brasileiro que busca companheirismo.",
        ],
      },
    ],
    faqs: [
      {
        question: "Existe diferença entre Spitz Alemão Anão (Lulu da Pomerânia) e Pomeranian?",
        answer:
          "Não. São o mesmo cão com nomes diferentes dependendo do país. No Brasil (CBKC), o nome oficial é 'Spitz Alemão' (Lulu da Pomerânia). Nos EUA (AKC), é 'Pomeranian'. Na Alemanha, é 'Zwergspitz'. Geneticamente idênticos.",
      },
      {
        question: "Spitz Médio e Spitz Anão são a mesma raça?",
        answer:
          "São da mesma família Spitz Alemão (Lulu da Pomerânia), mas tamanhos oficialmente distintos. O Médio tem entre 29 e 36 cm e o Anão tem no máximo 22 cm. Características físicas semelhantes, mas porte e preço bem diferentes.",
      },
      {
        question: "Lulu da Pomerânia 'branco' é o mesmo que Spitz Creme?",
        answer:
          "Não exatamente. O Branco puro é uma coloração específica rara. O Creme tem tonalidade marfim levemente quente. Na prática do mercado brasileiro, os dois termos são frequentemente usados como sinônimos, mas são cores ligeiramente diferentes no padrão FCI.",
      },
      {
        question: "Como saber se o filhote é puro-sangue?",
        answer:
          "Pela apresentação do pedigree CBKC emitido em nome do filhote (não só dos pais). O documento lista no mínimo três gerações de ancestrais registrados.",
      },
    ],
    relatedColors: ["creme", "laranja", "preto", "wolf-sable"],
  },
  {
    slug: "cuidados-basicos-spitz-alemao-anao",
    title: "Cuidados Básicos com o Spitz Alemão Anão (Lulu da Pomerânia): Do Banho ao Veterinário",
    metaDescription:
      "Guia completo de cuidados básicos com o Spitz Alemão Anão (Lulu da Pomerânia): escovação, banho, unhas, saúde preventiva e atividade física ideal para a raça.",
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
          "Escovação dentária 2 a 3 vezes por semana reduz tártaro e previne doença periodontal — muito comum em raças pequenas. Introduce o hábito ainda filhote.",
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
          "Esquema vacinal padrão: V10 anual (Cinomose, Hepatite, Parvovirose, Leptospirose, Coronavirose, Parainfluenza), antirrábica anual e vermifugação trimestral.",
          "Consulta veterinária semestral é o mínimo para cães adultos saudáveis. A partir dos 7 anos, trimestral com exames de sangue de rotina.",
          "O Spitz tem predisposição genética a colapso de traqueia, luxação de patela e doença cardíaca (especialmente fêmeas). Laudo cardiológico em filhotes e anual em adultos é fortemente recomendado.",
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
        question: "Com que frequência devo levar o Spitz ao petshop?",
        answer:
          "Banho e escovação profissional a cada 30-45 dias. Corte de unhas a cada 3-4 semanas (pode ser feito em casa com prática). Tosa higiênica conforme necessidade.",
      },
      {
        question: "O Spitz pode viver com gatos?",
        answer:
          "Sim, quando bem socializado desde filhote. Apresentações graduais e calmas são fundamentais. O Spitz tende a aceitar bem gatos que conhece desde cedo.",
      },
      {
        question: "Qual a expectativa de vida do Spitz Alemão Anão (Lulu da Pomerânia)?",
        answer:
          "Entre 12 e 16 anos quando bem cuidado. A raça é longevia entre os cães pequenos. Alimentação adequada, veterinário regular e estimulação mental são os principais fatores de longevidade.",
      },
    ],
    relatedColors: [],
  },
  {
    slug: "preparando-chegada-filhote-spitz",
    title: "Como Preparar a Chegada do Filhote de Spitz Alemão Anão (Lulu da Pomerânia)",
    metaDescription:
      "Checklist completo para preparar a chegada do filhote de Spitz Alemão Anão (Lulu da Pomerânia): enxoval, adaptação do ambiente, primeiros dias, veterinário e socialização inicial.",
    publishedAt: "2025-03-01",
    updatedAt: "2025-05-01",
    excerpt:
      "Os primeiros dias em casa são decisivos para o desenvolvimento do filhote. Este guia garante que você esteja 100% preparado antes da chegada.",
    readingMinutes: 6,
    sections: [
      {
        heading: "Enxoval essencial antes da chegada",
        paragraphs: [
          "Cama ou caixa de transporte confortável (o filhote usará como refúgio), tigelas de aço inox para água e ração, coleira e guia de nylon leve (tamanho XS ou PP), pente de aço e escova de pinos.",
          "Ração da mesma marca usada pelo criador (fundamental nos primeiros 15 dias para evitar diarreia de transição), brinquedos resistentes de borracha ou látex, tapete higiênico e caixa de areia opcional.",
          "Se possível, peça ao criador um pano com o cheiro da mãe. Colocá-lo na cama do filhote nos primeiros dias reduz significativamente o estresse de adaptação.",
        ],
      },
      {
        heading: "Adaptação do ambiente",
        paragraphs: [
          "Isole um cômodo seguro para os primeiros dias — sem escadarias, fios expostos ou plantas tóxicas. O filhote precisa explorar um espaço menor antes de ter acesso a toda a casa.",
          "Proteja tomadas baixas, remova plantas tóxicas (como filodendro, singônio e lírio) e guarde medicamentos e produtos de limpeza em armários altos. Filhotes de Spitz são extremamente curiosos.",
        ],
      },
      {
        heading: "Os primeiros dias em casa",
        paragraphs: [
          "Mantenha a rotina do filhote alinhada com a do criador: mesmo horário de refeições, mesma ração, mesmo ritual de dormir. Mudanças repentinas intensificam o estresse de adaptação.",
          "Não convide amigos e família para conhecer o filhote no primeiro dia. Deixe ele explorar o ambiente com calma, em companhia apenas dos moradores da casa.",
          "Choro noturno nos primeiros dias é normal — o filhote está longe da mãe pela primeira vez. Uma garrafa de água morna enrolada em pano na cama ajuda a simular o calor da mãe.",
        ],
      },
      {
        heading: "Primeiro veterinário e socialização",
        paragraphs: [
          "Marque consulta veterinária na primeira semana para checar o estado geral, confirmar o esquema vacinal e estabelecer vínculo com o profissional que acompanhará o animal.",
          "Socialização começa dentro de casa: expor a sons variados (aspirador, TV, campainha), diferentes superfícies e diferentes pessoas da família. Socialização com outros cães deve aguardar a vacinação completa.",
        ],
      },
    ],
    faqs: [
      {
        question: "Filhote de Spitz pode dormir na cama?",
        answer:
          "Pode, mas não é recomendado inicialmente. Crie o hábito de dormir na própria cama do filhote desde o início — trocar depois é muito mais difícil. Se decidir permitir, instale degraus para que ele não pule e se machuque.",
      },
      {
        question: "Quando começa o adestramento básico?",
        answer:
          "Imediatamente. Filhotes aprendem desde as primeiras semanas. Comandos simples como 'senta', 'fica' e 'não' com reforço positivo (petisco) podem começar com 8 semanas. Quanto antes, mais fácil.",
      },
      {
        question: "O filhote pode tomar banho antes de completar as vacinas?",
        answer:
          "Sim. Banho pode ser dado normalmente em casa. O que deve ser evitado é contato com locais públicos frequentados por outros cães (parques, petshops) até concluir o esquema vacinal.",
      },
      {
        question: "Como apresentar o Spitz filhote a outros animais da casa?",
        answer:
          "Sempre em ambiente neutro e com supervisão. Para gatos: apresentações separadas por grade ou porta por 2-3 dias antes do contato direto. Para cães: passeio conjunto antes de entrar em casa — território neutro facilita a aceitação.",
      },
    ],
    relatedColors: [],
  },
  {
    slug: "quanto-custa-ter-spitz-alemao-anao",
    title: "Quanto Custa Ter um Spitz Alemão Anão (Lulu da Pomerânia) por Mês? (2025)",
    metaDescription:
      "Descubra o custo real mensal de ter um Spitz Alemão Anão (Lulu da Pomerânia): ração premium, veterinário, banho, vacinas, petiscos e acessórios. Planilha completa para se preparar antes de comprar.",
    publishedAt: "2025-06-01",
    updatedAt: "2025-06-01",
    excerpt:
      "Além do valor do filhote, há custos mensais que muitos tutores não calculam antes de comprar. Veja o custo real detalhado de manter um Spitz Alemão Anão (Lulu da Pomerânia) com qualidade de vida.",
    readingMinutes: 9,
    sections: [
      {
        heading: "Ração — o maior custo mensal",
        paragraphs: [
          "Um adulto de Spitz Alemão Anão — Lulu da Pomerânia — (1,5 a 3,5 kg) come entre 40 e 80g de ração por dia, dependendo do peso e da marca. Rações premium para raças pequenas custam entre R$ 60 e R$ 150 por kg.",
          "Na prática, um pacote de 1 kg dura entre 15 e 25 dias para um adulto. Custo médio mensal com ração premium: R$ 80 a R$ 180. Rações veterinárias (N&D, Royal Canin, Orijen) ficam na faixa superior e oferecem melhor custo-benefício na saúde a longo prazo.",
          "Filhotes comem proporcionalmente mais que adultos em relação ao peso — planeje gastar entre 20% e 30% a mais durante os primeiros 12 meses.",
        ],
      },
      {
        heading: "Banho e tosa — cuidados com a pelagem dupla",
        paragraphs: [
          "O Spitz Alemão Anão (Lulu da Pomerânia) tem pelagem dupla que precisa de banho a cada 15–21 dias para evitar odor e dermatites. O banho em pet shop varia de R$ 60 a R$ 130 para a raça, dependendo da cidade e do tamanho.",
          "Tosa de acabamento (não corte — a pelagem do Spitz não deve ser raspada) custa R$ 30 a R$ 60 adicionais. Uma escova profissional durante o período de muda pode chegar a R$ 100.",
          "Custo mensal estimado com grooming: R$ 120 a R$ 280. Tutores que aprendem a escovar em casa (3–4x por semana) reduzem o custo em até 40%.",
        ],
      },
      {
        heading: "Veterinário e saúde preventiva",
        paragraphs: [
          "Consultas de rotina anuais custam de R$ 150 a R$ 350. Vacinas anuais (V10 + antirrábica): R$ 120 a R$ 250. Vermifugação trimestral: R$ 20 a R$ 60 por dose.",
          "Planos de saúde pet já estão disponíveis e cobrem consultas, exames e internações. Custam entre R$ 80 e R$ 250 por mês. Para Spitz adultos saudáveis, o custo de saúde sem plano fica em R$ 80 a R$ 150 por mês em média (distribuindo custos anuais mensalmente).",
          "Reserva para emergências: especialistas recomendam uma reserva de R$ 2.000 a R$ 5.000 para emergências como fraturas, intoxicações ou problemas cardíacos — mais comuns em raças pequenas após os 5 anos.",
        ],
      },
      {
        heading: "Petiscos, brinquedos e acessórios",
        paragraphs: [
          "Petiscos dentais (importantes para raças pequenas propensas a tártaro): R$ 20 a R$ 60 por mês. Brinquedos: R$ 20 a R$ 80 por mês, dependendo da frequência de troca.",
          "Coleira, guia, cama, caixinha de transporte são custos únicos de aquisição: R$ 300 a R$ 800 no primeiro mês. Em seguida, reposição esporádica.",
          "Roupinhas e acessórios são opcionais, mas o Spitz Alemão Anão (Lulu da Pomerânia) tem baixa tolerância ao frio abaixo de 15°C — uma roupinha para dias frios é funcional, não somente estética.",
        ],
      },
      {
        heading: "Resumo: custo mensal total estimado",
        paragraphs: [
          "Considerando ração premium, banho quinzenal, saúde preventiva e petiscos, o custo mensal médio de um Spitz Alemão Anão (Lulu da Pomerânia) adulto fica entre R$ 400 e R$ 700 por mês.",
          "No primeiro ano, com vacinas do filhote, acessórios iniciais e consultas de acompanhamento mais frequentes, o custo fica entre R$ 600 e R$ 1.200 por mês.",
          "Comparado a raças maiores, o Spitz é uma raça de custo mensal baixo — consome menos ração e precisa de menos espaço. O investimento inicial no filhote é maior, mas o custo de vida é acessível.",
        ],
      },
    ],
    faqs: [
      {
        question: "Quanto gasto por mês com um Spitz Alemão Anão (Lulu da Pomerânia)?",
        answer:
          "Em média, entre R$ 400 e R$ 700 por mês para um adulto (ração premium, banho quinzenal, saúde preventiva e petiscos). No primeiro ano, o custo pode ser de R$ 600 a R$ 1.200 por mês incluindo vacinas iniciais e acessórios.",
      },
      {
        question: "Qual a melhor ração para Spitz Alemão Anão (Lulu da Pomerânia)?",
        answer:
          "Rações premium para raças pequenas como N&D, Royal Canin Mini, Orijen Small ou Purina Pro Plan Small são indicadas. O critério principal é proteína animal como primeiro ingrediente e ausência de corantes e conservantes artificiais.",
      },
      {
        question: "Precisa de plano de saúde para Spitz Alemão (Lulu da Pomerânia)?",
        answer:
          "Não é obrigatório, mas é recomendado para quem quer previsibilidade de gastos. Planos entre R$ 80 e R$ 180 mensais cobrem consultas de rotina e exames. Para cão adulto saudável, a reserva de emergência (R$ 3.000–5.000) pode substituir o plano.",
      },
      {
        question: "Com que frequência o Spitz Alemão (Lulu da Pomerânia) precisa de banho?",
        answer:
          "A cada 15 a 21 dias. A pelagem dupla retém odor e pode desenvolver fungos se o intervalo for muito longo ou se a secagem for incompleta após o banho.",
      },
    ],
    relatedColors: ["creme", "laranja", "preto", "wolf-sable"],
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}
