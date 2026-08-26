import { puppiesPublicados as publicados, staticPuppies } from "@/content/puppies-static";
import { CORES_DIVULGADAS, RESPOSTA_PRETO } from "@/domain/pricing";

export type CatalogItem = (typeof staticPuppies)[number];

// ALL_COLORS carrega o wolf-sable de propósito: é daqui que saem os
// `generateStaticParams` de /filhotes/cor/[cor] e as entradas do sitemap. Tirar
// o wolf-sable desta lista faria uma URL indexada devolver 404, que é
// exatamente o que não se faz sem decisão de quem responde pelo SEO.
//
// O particolor entrou pelo outro lado: ele é divulgado, então CORES_EXIBIDAS já
// o coloca no seletor de cores. Sem a entrada aqui, esse link levaria a uma rota
// que generateStaticParams não gera — link novo apontando para 404.
export const ALL_COLORS = [
  "branco",
  "creme",
  "laranja",
  "particolor",
  "preto",
  "wolf-sable",
] as const;
export type PuppyColor = (typeof ALL_COLORS)[number];

/**
 * Cores que a comunicação divulga hoje — menus, filtros e vitrines.
 *
 * O Cinza-Lobo saiu desta lista, não de {@link ALL_COLORS}: a página continua
 * no ar, ela é que deixou de ser oferecida.
 */
export const CORES_EXIBIDAS: readonly string[] = CORES_DIVULGADAS;

export const ALL_SEXES = ["femea", "macho"] as const;
export type PuppySex = (typeof ALL_SEXES)[number];

// Map URL slug ↔ domain value
export const SEX_URL_TO_DOMAIN: Record<string, string> = { femea: "female", macho: "male" };
export const SEX_DOMAIN_TO_URL: Record<string, string> = { female: "femea", male: "macho" };

// Reexportado para quem já importa deste módulo. A lista nasce ao lado dos
// dados, em content/puppies-static.
export { puppiesPublicados } from "@/content/puppies-static";

export function getPuppyBySlug(slug: string): CatalogItem | undefined {
  return staticPuppies.find((p) => p.slug === slug);
}

export function getPuppiesByColor(color: string): CatalogItem[] {
  // Vitrine de cor mostra apenas filhotes divulgados. A URL do Cinza-Lobo
  // segue respondendo com o texto da cor; o que ela deixa de ter e a oferta.
  return publicados.filter((p) => p.color === color);
}

export function getPuppiesBySex(urlSex: string): CatalogItem[] {
  const domain = SEX_URL_TO_DOMAIN[urlSex] ?? urlSex;
  // Página de sexo é vitrine genérica, não a URL de uma cor: filtra pelo que
  // está divulgado.
  return publicados.filter(
    (p) => p.sex === domain || (p as any).gender === domain,
  );
}

export function getFirstImage(puppy: CatalogItem): string | undefined {
  return puppy.images.find((img) => !img.endsWith(".mp4"));
}

// Reexporta o formatador de domain/pricing em vez de manter um segundo. O
// `style: "currency"` do Intl separa "R$" do número com espaço estreito sem
// quebra, invisível na revisão e diferente do "R$ 8.500" escrito nos textos.
export { formatarPreco as formatPrice } from "@/domain/pricing";

// ─── SEO content per color ───────────────────────────────────────────────────

export type ColorSeo = {
  seoTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  characteristics: string[];
  faqs: { question: string; answer: string }[];
};

export const COLOR_SEO: Record<string, ColorSeo> = {
  branco: {
    seoTitle: "Spitz Alemão Anão Branco — Filhotes",
    metaDescription:
      "Conheça o Spitz Alemão Anão Branco, entenda a diferença visual para o creme claro e consulte filhotes e disponibilidade na By Império Dog.",
    h1: "Spitz Alemão Anão Branco",
    intro:
      "O Spitz Branco tem pelagem de aparência branca e uniforme. Já o creme claro apresenta um tom mais quente, que pode lembrar marfim ou champanhe. Luz, câmera e fase da pelagem podem alterar a percepção da cor; por isso a comparação deve ser feita com imagens atuais e em luz natural.",
    characteristics: [
      "Pelagem de aparência branca e uniforme",
      "Tom visualmente mais neutro que o creme claro",
      "Fotos e vídeos em luz natural ajudam a comparar as tonalidades",
      "A cor da pelagem não determina comportamento, inteligência ou saúde",
      "Disponibilidade deve ser consultada no catálogo atualizado",
    ],
    faqs: [
      {
        question: "Qual é a diferença entre Spitz Branco e Spitz Creme claro?",
        answer:
          "O branco tem aparência visualmente neutra, enquanto o creme claro apresenta um fundo mais quente, próximo de marfim ou champanhe. Iluminação e câmera podem aproximar as duas tonalidades nas fotos, então vale comparar vídeos atuais em luz natural.",
      },
      {
        question: "Qual o preço do Spitz Alemão Anão Branco?",
        answer:
          "A tabela atual parte de R$ 8.500 para macho e R$ 9.500 para fêmea — o maior valor entre as cinco cores, nos dois sexos. A disponibilidade é informada no atendimento.",
      },
      {
        question: "A cor branca muda o temperamento ou a saúde do Spitz?",
        answer:
          "Não. A cor é uma característica estética e, isoladamente, não define temperamento, inteligência ou saúde. O comportamento varia conforme genética, socialização, ambiente e características individuais de cada cão.",
      },
      {
        question: "Há filhotes de Spitz Branco disponíveis agora?",
        answer:
          "A disponibilidade muda conforme as ninhadas. O catálogo desta página mostra os filhotes cadastrados na cor branca; quando não houver nenhum, é possível consultar a agenda diretamente com a equipe.",
      },
    ],
  },
  creme: {
    seoTitle: "Spitz Alemão Anão Creme — Filhotes",
    metaDescription:
      "Filhotes de Spitz Alemão Anão Creme em Bragança Paulista, SP. Pelagem sedosa cor marfim, registro oficial, laudos veterinários e mentoria pós-venda inclusa.",
    h1: "Spitz Alemão Anão Creme",
    intro:
      "O Spitz Creme tem pelagem sedosa cor de marfim, combinada com olhos escuros expressivos. Na tabela atual da By Império Dog, o macho creme fica acima do laranja, junto com o preto. Disponibilidade limitada — consulte a agenda de ninhadas.",
    characteristics: [
      "Pelagem densa cor creme/marfim uniforme sem manchas",
      "Olhos escuros expressivos e focinho amendoado",
      "Temperamento típico da raça — a cor não altera o comportamento",
      "Tamanho dentro do padrão FCI nº 97 (21 cm ± 3 cm na cernelha)",
      "Ninhadas abertas com antecedência — consulte a agenda",
    ],
    faqs: [
      {
        question: "Qual o preço de um Spitz Alemão Anão Creme?",
        answer:
          "Na By Império Dog, o Macho Creme é R$ 7.500 e a Fêmea Creme é R$ 8.500. A disponibilidade é informada no atendimento.",
      },
      {
        question: "Por que o Spitz Creme é mais caro que o laranja?",
        answer:
          "Porque o creme tem disponibilidade menor ao longo do ano. Na tabela atual da By Império Dog o creme fica acima do laranja, junto com o preto: R$ 7.500 para macho e R$ 8.500 para fêmea.",
      },
      {
        question: "O Spitz Creme perde muito pelo?",
        answer:
          "Sim. O Spitz tem dupla camada de pelo e troca sazonal intensa. Escovação duas vezes por semana e banho mensal mantêm a pelagem saudável. A criadora orienta o protocolo completo.",
      },
      {
        question: "Posso reservar um Spitz Creme antes da ninhada?",
        answer:
          "Sim. Mantemos lista de interesse prioritária. Entre em contato via WhatsApp para ser informado assim que a próxima ninhada for confirmada.",
      },
    ],
  },
  laranja: {
    seoTitle: "Spitz Alemão Anão Laranja — Filhotes",
    metaDescription:
      "Filhotes de Spitz Alemão Anão Laranja em Bragança Paulista, SP. Cor mais icônica da raça. Registro oficial, laudos veterinários e mentoria pós-venda.",
    h1: "Spitz Alemão Anão Laranja",
    intro:
      "O Spitz Laranja é a cor mais icônica e reconhecida da raça no mundo. Sua pelagem vibrante está dentro do padrão FCI. Ideal para famílias que amam um cão com personalidade marcante e presença visual.",
    characteristics: [
      "Pelagem laranja uniforme e densa dentro do padrão FCI",
      "Temperamento típico da raça — a cor não altera o comportamento",
      "Adapta-se muito bem a apartamentos e casas com quintal",
      "Cor mais disponível — ninhadas regulares ao longo do ano",
      "Excelente para famílias com crianças e outros animais",
    ],
    faqs: [
      {
        question: "Qual o preço do Spitz Alemão Anão Laranja?",
        answer:
          "Na By Império Dog, o Laranja parte de R$ 6.500 no macho e R$ 7.500 na fêmea — acima apenas do particolor, que abre a tabela. A disponibilidade é informada no atendimento.",
      },
      {
        question: "Spitz Laranja é dócil com crianças?",
        answer:
          "Sim. O Spitz Alemão Anão tem temperamento equilibrado e afetivo, e a cor não muda isso. Com socialização em ambiente familiar e orientação de ambientação — como a praticada na By Império Dog — convive bem com crianças de qualquer idade.",
      },
      {
        question: "Spitz Laranja é diferente de Lulu da Pomerânia?",
        answer:
          "São o mesmo cão. No Brasil o nome popular é Lulu da Pomerânia, mas a nomenclatura oficial da FCI é Spitz Alemão Anão. O padrão racial, saúde e características são idênticos.",
      },
      {
        question: "Com que frequência devo dar banho no Spitz Laranja?",
        answer:
          "O ideal é a cada 30 dias com escovação semanal para evitar nós. Em épocas de troca de pelo, a escovação pode ser aumentada para três vezes por semana.",
      },
    ],
  },
  particolor: {
    seoTitle: "Spitz Alemão Anão Particolor — Filhotes",
    metaDescription:
      "Filhotes de Spitz Alemão Anão Particolor (Lulu da Pomerânia) em Bragança Paulista, SP. Pelagem branca com manchas definidas, a partir de R$ 5.500.",
    h1: "Spitz Alemão Anão Particolor",
    intro:
      "O Particolor é o Spitz Alemão Anão — o Lulu da Pomerânia — de pelagem branca com manchas bem definidas de outra cor, distribuídas pela cabeça, orelhas e dorso. É a combinação que abre a tabela da By Império Dog: a partir de R$ 5.500 no macho.",
    characteristics: [
      "Base branca com manchas definidas de outra cor — o desenho é único em cada filhote",
      "Coloração reconhecida pelo padrão FCI nº 97 da raça",
      "Temperamento típico da raça — a cor não altera o comportamento",
      "Tamanho dentro do padrão FCI nº 97 (21 cm ± 3 cm na cernelha (altura))",
      "Menor valor da tabela atual, nos dois sexos",
    ],
    faqs: [
      {
        question: "Qual o preço do Spitz Alemão Anão Particolor?",
        answer:
          "Na By Império Dog, o Particolor parte de R$ 5.500 no macho e R$ 6.500 na fêmea — o menor valor da tabela nos dois sexos. A disponibilidade é informada no atendimento.",
      },
      {
        question: "O que é um Spitz Particolor?",
        answer:
          "Particolor descreve a pelagem de base branca com manchas de outra cor bem delimitadas, e não uma mistura gradual de tons. O desenho das manchas muda de filhote para filhote — dois particolores da mesma ninhada nunca têm a mesma distribuição.",
      },
      {
        question: "O Particolor é aceito pelo padrão da raça?",
        answer:
          "Sim. O particolor consta entre as colorações previstas no padrão FCI nº 97 do Spitz Alemão. O que o padrão pede é que as manchas sejam bem distribuídas sobre a base branca.",
      },
      {
        question: "As manchas do Particolor mudam com o tempo?",
        answer:
          "O desenho das manchas se mantém, mas a intensidade da cor dentro delas pode clarear ou escurecer até a pelagem adulta se firmar, entre 6 e 12 meses. É o mesmo comportamento das demais cores da raça.",
      },
    ],
  },
  preto: {
    seoTitle: "Spitz Alemão Anão Preto — Filhotes",
    metaDescription:
      "Filhotes de Spitz Alemão Anão Preto em Bragança Paulista, SP. Disponibilidade limitada. Registro oficial, laudos veterinários e mentoria pós-venda inclusa.",
    h1: "Spitz Alemão Anão Preto",
    intro:
      "O Spitz Preto tem pelagem preta brilhante, estrutura compacta e expressão marcante. Nas ninhadas da By Império Dog é a cor que aparece com menos frequência — a agenda abre esporadicamente.",
    characteristics: [
      "Pelagem preta brilhante uniforme sem manchas ou degradê",
      "Expressão marcante com contraste visual único",
      "Disponibilidade limitada — ninhadas abertas esporadicamente",
      "Mesma faixa de preço do creme na tabela atual",
      "Temperamento típico da raça — a cor não altera o comportamento",
    ],
    faqs: [
      {
        question: "Qual o preço do Spitz Alemão Anão Preto?",
        answer: RESPOSTA_PRETO,
      },
      {
        question: "Por que o Spitz Preto tem menos disponibilidade?",
        answer:
          "A cor preta aparece com menos frequência entre os filhotes disponíveis pela By Império Dog do que o laranja. A disponibilidade varia ao longo do ano e é informada no atendimento.",
      },
      {
        question: "Existe lista de espera para Spitz Preto?",
        answer:
          "Sim. Como o preto tem disponibilidade menor, mantemos lista de interesse prioritária. Entre em contato via WhatsApp para reservar sua posição.",
      },
      {
        question: "Spitz Preto fica com a pelagem opaca?",
        answer:
          "Não quando bem cuidado. Com escovação regular, shampoo adequado para pelagem escura e proteção solar em dias de sol intenso, o pelo mantém o brilho característico.",
      },
    ],
  },
  "wolf-sable": {
    seoTitle: "Spitz Alemão Anão Cinza-Lobo (Wolf Sable)",
    metaDescription:
      "O que é o Cinza-Lobo (Wolf Sable) no Spitz Alemão Anão: como a coloração se forma e o que diz o padrão da FCI. Cor não divulgada pela By Império Dog.",
    h1: "Spitz Alemão Anão Cinza-Lobo (Wolf Sable)",
    intro:
      "O Cinza-Lobo (Wolf Sable) é a coloração bicolor do Spitz Alemão Anão, com máscara facial cinza sobre base laranja que lembra o padrão do lobo. É reconhecida pela FCI como cor oficial e aparece com menos frequência nas ninhadas do que o laranja.",
    characteristics: [
      "Coloração bicolor: base laranja com pontas cinza/pretas (sable)",
      "Máscara facial escura — padrão único inconfundível",
      "Cor reconhecida oficialmente pela FCI",
      "Aparece com menos frequência nas ninhadas do que o laranja",
      "Temperamento típico da raça — a cor não altera o comportamento",
    ],
    faqs: [
      {
        question: "O que é Cinza-Lobo (Wolf Sable) no Spitz Alemão Anão?",
        answer:
          "Cinza-Lobo (ou Wolf Sable) descreve uma coloração bicolor onde cada pelo tem base laranja e ponta escura (cinza ou preta), criando o efeito 'lobo'. É uma cor reconhecida oficialmente pela FCI no padrão da raça.",
      },
      {
        question: "A By Império Dog trabalha com Cinza-Lobo?",
        answer:
          "O Cinza-Lobo não faz parte das cores divulgadas pela By Império Dog. As cores oferecidas são Particolor, Laranja, Creme, Preto e Branco, com a tabela de valores publicada na página de preços.",
      },
      {
        question: "O Spitz Cinza-Lobo muda de cor com o tempo?",
        answer:
          "Filhotes Wolf Sable podem parecer mais escuros ao nascer. A coloração definitiva costuma se estabelecer entre 6 e 12 meses de idade.",
      },
      {
        question: "Cinza-Lobo (Wolf Sable) é o mesmo que Sable?",
        answer:
          "Cinza-Lobo (ou Orange Sable) e Sable puro são variações distintas dentro da família Sable. No Cinza-Lobo a base é laranja; no Sable puro a base pode ser mais clara. Ambos são reconhecidos pela FCI.",
      },
    ],
  },
};

// ─── SEO content per sex ──────────────────────────────────────────────────────

export type SexSeo = {
  seoTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  characteristics: string[];
  faqs: { question: string; answer: string }[];
};

export const SEX_SEO: Record<string, SexSeo> = {
  femea: {
    seoTitle: "Spitz Alemão Anão Fêmea — Filhotes",
    metaDescription:
      "Filhotes fêmea de Spitz Alemão Anão em Bragança Paulista, SP. Registro oficial, laudos veterinários e mentoria pós-venda inclusos.",
    h1: "Spitz Alemão Anão Fêmea",
    intro:
      "A Spitz Fêmea tem pelagem densa e porte compacto dentro do padrão FCI. O temperamento é o típico da raça e varia de filhote para filhote — quem define o comportamento adulto é a genética somada à socialização e à rotina de cada família, não o sexo.",
    characteristics: [
      "Temperamento típico da raça — o sexo não define o comportamento",
      "Pelagem densa e volumosa na fase adulta",
      "Convive bem em família quando a socialização é feita com calma",
      "Preço superior ao macho em todas as cores",
      "Cio a cada 6-8 meses (castração orientada pela criadora)",
    ],
    faqs: [
      {
        question: "Qual a diferença entre Spitz Fêmea e Macho de temperamento?",
        answer:
          "Não existe uma regra por sexo. O temperamento depende muito mais da genética, da socialização e da rotina da família do que de ser macho ou fêmea. Fêmeas e machos bem socializados convivem igualmente bem em família.",
      },
      {
        question: "Spitz Fêmea é mais cara que Macho?",
        answer:
          "Sim. A fêmea parte de R$ 6.500 no particolor, R$ 7.500 no laranja, R$ 8.500 em creme e preto e R$ 9.500 no branco; o macho vai de R$ 5.500 a R$ 8.500 conforme a cor. Comparando a mesma cor, a diferença é de R$ 1.000.",
      },
      {
        question: "Posso castrar a Spitz Fêmea?",
        answer:
          "Sim. A criadora orienta sobre o momento ideal para castração — geralmente após o primeiro cio. A castração não afeta o temperamento e previne problemas de saúde como piometra.",
      },
      {
        question: "A Spitz Fêmea pode viver em apartamento?",
        answer:
          "Sim. O Spitz Anão é uma raça excelente para apartamento. Com caminhadas diárias e estimulação mental adequada, adapta-se perfeitamente a espaços menores.",
      },
    ],
  },
  macho: {
    seoTitle: "Spitz Alemão Anão Macho — Filhotes",
    metaDescription:
      "Filhotes macho de Spitz Alemão Anão em Bragança Paulista, SP. Registro oficial, laudos veterinários e mentoria pós-venda inclusos.",
    h1: "Spitz Alemão Anão Macho",
    intro:
      "O Spitz Macho tem porte compacto dentro do padrão FCI e pelagem densa, e é a opção com o melhor custo-benefício dentro da raça. O temperamento é o típico da raça e varia de filhote para filhote — quem define o comportamento adulto é a genética somada à socialização e à rotina de cada família, não o sexo.",
    characteristics: [
      "Temperamento típico da raça — o sexo não define o comportamento",
      "Pelagem densa e volumosa — presença marcante",
      "Porte dentro do padrão FCI: 21 cm ± 3 cm na cernelha",
      "Melhor custo-benefício dentro da raça",
      "Convive bem em família quando a socialização é feita com calma",
    ],
    faqs: [
      {
        question: "Macho Spitz marca território?",
        answer:
          "A marcação de território é um comportamento comum em machos não castrados. A castração costuma reduzir esse comportamento, e o momento adequado deve ser definido pelo médico-veterinário que acompanha o cão. A criadora orienta o tutor sobre o tema no pós-venda.",
      },
      {
        question: "Macho Spitz briga com outros cães?",
        answer:
          "Não é característico da raça. Com socialização desde filhote e apresentações feitas com calma, o Spitz Macho tende a conviver bem com outros animais.",
      },
      {
        question: "Qual a diferença de preço entre Macho e Fêmea?",
        answer:
          "O Macho é R$ 1.000 mais barato que a Fêmea da mesma cor, sem qualquer diferença de qualidade, saúde ou documentação.",
      },
      {
        question: "O Macho Spitz é bom para crianças?",
        answer:
          "Sim, desde que a convivência seja supervisionada e as apresentações sejam feitas com calma. Como todo cão de porte pequeno, o Spitz precisa ser manuseado com cuidado por crianças pequenas.",
      },
    ],
  },
};
