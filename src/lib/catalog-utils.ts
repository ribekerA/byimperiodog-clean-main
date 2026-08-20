import { staticPuppies } from "@/content/puppies-static";

export type CatalogItem = (typeof staticPuppies)[number];

export const ALL_COLORS = ["branco", "creme", "laranja", "preto", "wolf-sable"] as const;
export type PuppyColor = (typeof ALL_COLORS)[number];

export const ALL_SEXES = ["femea", "macho"] as const;
export type PuppySex = (typeof ALL_SEXES)[number];

// Map URL slug ↔ domain value
export const SEX_URL_TO_DOMAIN: Record<string, string> = { femea: "female", macho: "male" };
export const SEX_DOMAIN_TO_URL: Record<string, string> = { female: "femea", male: "macho" };

export function getPuppyBySlug(slug: string): CatalogItem | undefined {
  return staticPuppies.find((p) => p.slug === slug);
}

export function getPuppiesByColor(color: string): CatalogItem[] {
  return staticPuppies.filter((p) => p.color === color);
}

export function getPuppiesBySex(urlSex: string): CatalogItem[] {
  const domain = SEX_URL_TO_DOMAIN[urlSex] ?? urlSex;
  return staticPuppies.filter(
    (p) => p.sex === domain || (p as any).gender === domain,
  );
}

export function getFirstImage(puppy: CatalogItem): string | undefined {
  return puppy.images.find((img) => !img.endsWith(".mp4"));
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

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
    seoTitle: "Spitz Alemão Anão Branco — Filhotes e Diferenças do Creme",
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
          "A tabela atual traz R$ 7.500 para macho e R$ 8.500 para fêmea. Na cor branca, confirme com a equipe o valor do filhote disponível antes de reservar.",
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
    seoTitle: "Spitz Alemão Anão Creme — Filhotes Disponíveis",
    metaDescription:
      "Filhotes de Spitz Alemão Anão Creme em Bragança Paulista, SP. Pelagem sedosa cor marfim, registro oficial, laudos veterinários e mentoria vitalícia inclusa.",
    h1: "Spitz Alemão Anão Creme",
    intro:
      "O Spitz Creme tem pelagem sedosa cor de marfim, combinada com olhos escuros expressivos. Na tabela atual da By Império Dog, o creme está na faixa superior entre os machos, junto com o preto. Disponibilidade limitada — consulte a agenda de ninhadas.",
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
          "Na By Império Dog, a Fêmea Creme é R$ 8.500 e o Macho Creme é R$ 7.500. Todos os valores incluem registro oficial, protocolo vacinal em dia conforme a idade do filhote, laudos de saúde e mentoria vitalícia.",
      },
      {
        question: "Por que o Spitz Creme é mais caro que outras cores?",
        answer:
          "Nem toda ninhada traz filhotes creme com pelagem uniforme dentro do padrão FCI, então a disponibilidade é menor ao longo do ano. Na tabela atual da By Império Dog, o macho creme está na faixa superior, junto com o preto.",
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
    seoTitle: "Spitz Alemão Anão Laranja — Filhotes Disponíveis",
    metaDescription:
      "Filhotes de Spitz Alemão Anão Laranja em Bragança Paulista, SP. Cor mais icônica da raça. Registro oficial, laudos veterinários e mentoria vitalícia.",
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
          "Na By Império Dog, a Fêmea Laranja é R$ 8.500 e o Macho Laranja é R$ 6.500. Inclui registro oficial, vacinação, laudos e mentoria vitalícia.",
      },
      {
        question: "Spitz Laranja é dócil com crianças?",
        answer:
          "Sim. O Spitz Alemão Anão tem temperamento equilibrado e afetivo, e a cor não muda isso. Com socialização guiada desde o nascimento — como a praticada na By Império Dog — convive bem com crianças de qualquer idade.",
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
  preto: {
    seoTitle: "Spitz Alemão Anão Preto — Filhotes Disponíveis",
    metaDescription:
      "Filhotes de Spitz Alemão Anão Preto em Bragança Paulista, SP. Disponibilidade limitada. Registro oficial, laudos veterinários e mentoria vitalícia inclusa.",
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
        answer:
          "Na By Império Dog, a Fêmea Preta é R$ 8.500 e o Macho Preto é R$ 7.500. Incluem registro oficial, vacinação, laudos e mentoria vitalícia.",
      },
      {
        question: "Por que o Spitz Preto tem menos disponibilidade?",
        answer:
          "A pelagem preta uniforme depende das linhagens usadas no acasalamento, e nem toda ninhada traz filhotes pretos dentro do padrão FCI. Por isso as ninhadas pretas da By Império Dog são menos frequentes do que as de laranja.",
      },
      {
        question: "Existe lista de espera para Spitz Preto?",
        answer:
          "Sim. Como as ninhadas pretas são menos frequentes, mantemos lista de interesse prioritária. Entre em contato via WhatsApp para reservar sua posição na próxima ninhada.",
      },
      {
        question: "Spitz Preto fica com a pelagem opaca?",
        answer:
          "Não quando bem cuidado. Com escovação regular, shampoo adequado para pelagem escura e proteção solar em dias de sol intenso, o pelo mantém o brilho característico.",
      },
    ],
  },
  "wolf-sable": {
    seoTitle: "Filhotes de Spitz Cinza-Lobo (Wolf Sable)",
    metaDescription:
      "Filhotes de Spitz Alemão Anão Cinza-Lobo (Wolf Sable, cinza/laranja) em Bragança Paulista, SP. Cor reconhecida pela FCI. Registro oficial e mentoria vitalícia.",
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
        question: "Qual o preço do Spitz Cinza-Lobo?",
        answer:
          "Na By Império Dog, a Fêmea Cinza-Lobo é R$ 8.500 e o Macho Cinza-Lobo é R$ 6.500. Incluem registro oficial, vacinação, laudos e mentoria vitalícia.",
      },
      {
        question: "O Spitz Cinza-Lobo muda de cor com o tempo?",
        answer:
          "Filhotes Wolf Sable podem parecer mais escuros ao nascer. A coloração definitiva se estabelece entre 6 e 12 meses. A criadora documenta e acompanha a evolução da pelagem.",
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
    seoTitle: "Spitz Alemão Anão Fêmea — Filhotes Disponíveis",
    metaDescription:
      "Filhotes fêmea de Spitz Alemão Anão em Bragança Paulista, SP. Registro oficial, laudos veterinários e mentoria vitalícia inclusos.",
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
          "Sim. Todas as fêmeas têm o mesmo valor (R$ 8.500), enquanto o macho varia entre R$ 6.500 e R$ 7.500 conforme a cor — uma diferença de R$ 1.000 a R$ 2.000.",
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
    seoTitle: "Spitz Alemão Anão Macho — Filhotes Disponíveis",
    metaDescription:
      "Filhotes macho de Spitz Alemão Anão em Bragança Paulista, SP. Registro oficial, laudos veterinários e mentoria vitalícia inclusos.",
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
          "O Macho é entre R$ 1.000 e R$ 2.000 mais barato que a Fêmea (que tem valor único de R$ 8.500), dependendo da cor do macho, sem qualquer diferença de qualidade, saúde ou documentação.",
      },
      {
        question: "O Macho Spitz é bom para crianças?",
        answer:
          "Sim, desde que a convivência seja supervisionada e as apresentações sejam feitas com calma. Como todo cão de porte pequeno, o Spitz precisa ser manuseado com cuidado por crianças pequenas.",
      },
    ],
  },
};
