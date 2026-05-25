import { staticPuppies } from "@/content/puppies-static";

export type CatalogItem = (typeof staticPuppies)[number];

export const ALL_COLORS = ["creme", "laranja", "preto", "wolf-sable"] as const;
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
  creme: {
    seoTitle: "Spitz Alemão Anão Creme | Filhotes Disponíveis – By Império Dog",
    metaDescription:
      "Filhotes de Spitz Alemão Anão Creme em Bragança Paulista, SP. Pelagem sedosa cor marfim, pedigree CBKC, laudos veterinários e mentoria vitalícia inclusa.",
    h1: "Spitz Alemão Anão Creme",
    intro:
      "O Spitz Creme é a cor mais valorizada e disputada da raça. Sua pelagem sedosa cor de marfim, combinada com olhos escuros expressivos, faz dele o Spitz mais procurado por famílias que buscam sofisticação. Disponibilidade limitada — consulte agenda de ninhadas.",
    characteristics: [
      "Pelagem densa cor creme/marfim uniforme sem manchas",
      "Olhos escuros expressivos e focinho amendoado",
      "Temperamento dócil, ideal para famílias com crianças",
      "Tamanho dentro do padrão FCI (até 22 cm)",
      "Alta demanda — ninhadas abertas com antecedência",
    ],
    faqs: [
      {
        question: "Qual o preço de um Spitz Alemão Anão Creme?",
        answer:
          "Na By Império Dog, a Fêmea Creme começa em R$ 15.000 e o Macho em R$ 9.000. Todos os valores incluem pedigree CBKC, vacinação completa, laudos cardiológicos e mentoria vitalícia.",
      },
      {
        question: "Por que o Spitz Creme é mais caro que outras cores?",
        answer:
          "O Spitz Creme tem disponibilidade menor porque cada ninhada produz poucos filhotes com pelagem uniforme dentro do padrão FCI. A combinação de raridade e alta demanda eleva naturalmente o valor.",
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
    seoTitle: "Spitz Alemão Anão Laranja | Filhotes Disponíveis – By Império Dog",
    metaDescription:
      "Filhotes de Spitz Alemão Anão Laranja em Bragança Paulista, SP. Cor mais icônica da raça, temperamento alegre. Pedigree CBKC e mentoria vitalícia.",
    h1: "Spitz Alemão Anão Laranja",
    intro:
      "O Spitz Laranja é a cor mais icônica e reconhecida da raça no mundo. Sua pelagem vibrante dentro do padrão FCI combina com um temperamento alegre e extremamente afetivo. Ideal para famílias que amam um cão com personalidade marcante e presença visual.",
    characteristics: [
      "Pelagem laranja uniforme e densa dentro do padrão FCI",
      "Temperamento alegre, brincalhão e extremamente carinhoso",
      "Adapta-se muito bem a apartamentos e casas com quintal",
      "Cor mais disponível — ninhadas regulares ao longo do ano",
      "Excelente para famílias com crianças e outros animais",
    ],
    faqs: [
      {
        question: "Qual o preço do Spitz Alemão Anão Laranja?",
        answer:
          "Na By Império Dog, a Fêmea Laranja começa em R$ 10.000 e o Macho em R$ 7.000. Inclui pedigree CBKC, vacinação, laudos e mentoria vitalícia.",
      },
      {
        question: "Spitz Laranja é dócil com crianças?",
        answer:
          "Sim. O Spitz Laranja tem temperamento equilibrado e afetivo. Com socialização guiada desde o nascimento — como a praticada na By Império Dog — convive muito bem com crianças de qualquer idade.",
      },
      {
        question: "Spitz Laranja é diferente de Lulu da Pomerânia?",
        answer:
          "São o mesmo cão. No Brasil o nome popular é Lulu da Pomerânia, mas a nomenclatura oficial da CBKC e FCI é Spitz Alemão Anão. O padrão racial, saúde e características são idênticos.",
      },
      {
        question: "Com que frequência devo dar banho no Spitz Laranja?",
        answer:
          "O ideal é a cada 30 dias com escovação semanal para evitar nós. Em épocas de troca de pelo, a escovação pode ser aumentada para três vezes por semana.",
      },
    ],
  },
  preto: {
    seoTitle: "Spitz Alemão Anão Preto | Filhotes Disponíveis – By Império Dog",
    metaDescription:
      "Filhotes de Spitz Alemão Anão Preto em Bragança Paulista, SP. Cor rara e elegante. Pedigree CBKC, laudos veterinários e mentoria vitalícia inclusa.",
    h1: "Spitz Alemão Anão Preto",
    intro:
      "O Spitz Preto é uma das colorações mais elegantes e menos comuns da raça. Sua pelagem brilhante preta, aliada à estrutura compacta e expressão marcante, faz dele uma escolha sofisticada para quem busca exclusividade. A disponibilidade é limitada — ninhadas abertas esporadicamente.",
    characteristics: [
      "Pelagem preta brilhante uniforme sem manchas ou degradê",
      "Expressão marcante com contraste visual único",
      "Disponibilidade muito rara — ninhadas abertas esporadicamente",
      "Segunda cor fêmea mais valorizada da raça",
      "Temperamento equilibrado, fiel e atento",
    ],
    faqs: [
      {
        question: "Qual o preço do Spitz Alemão Anão Preto?",
        answer:
          "Na By Império Dog, a Fêmea Preta começa em R$ 13.000 e o Macho em R$ 8.000. Incluem pedigree CBKC, vacinação, laudos e mentoria vitalícia.",
      },
      {
        question: "Por que o Spitz Preto é raro?",
        answer:
          "A genética do Spitz Preto puro exige linhagens específicas. É mais difícil obter filhotes pretos uniformes dentro do padrão FCI, tornando cada ninhada preta um evento disputado no Brasil.",
      },
      {
        question: "Existe lista de espera para Spitz Preto?",
        answer:
          "Sim. Devido à raridade das ninhadas, mantemos lista de interesse prioritária. Entre em contato via WhatsApp para reservar sua posição na próxima ninhada.",
      },
      {
        question: "Spitz Preto fica com a pelagem opaca?",
        answer:
          "Não quando bem cuidado. Com escovação regular, shampoo adequado para pelagem escura e proteção solar em dias de sol intenso, o pelo mantém o brilho característico.",
      },
    ],
  },
  "wolf-sable": {
    seoTitle: "Spitz Alemão Anão Wolf Sable | Filhotes Disponíveis – By Império Dog",
    metaDescription:
      "Filhotes de Spitz Alemão Anão Wolf Sable (cinza/laranja) em Bragança Paulista, SP. Cor rara reconhecida pela FCI. Pedigree CBKC e mentoria vitalícia.",
    h1: "Spitz Alemão Anão Wolf Sable",
    intro:
      "O Wolf Sable é a coloração bicolor mais exótica do Spitz Alemão Anão. Com máscara facial cinza sobre base laranja, imita o padrão selvagem do lobo. Reconhecida pela FCI como cor oficial, é raramente encontrada em criações especializadas no Brasil — o que torna cada filhote uma oportunidade única.",
    characteristics: [
      "Coloração bicolor: base laranja com pontas cinza/pretas (sable)",
      "Máscara facial escura — padrão único inconfundível",
      "Cor reconhecida oficialmente pela FCI",
      "Uma das cores mais buscadas e menos disponíveis no Brasil",
      "Temperamento alerta, curioso e levemente mais ativo",
    ],
    faqs: [
      {
        question: "O que é Wolf Sable no Spitz Alemão Anão?",
        answer:
          "Wolf Sable descreve uma coloração bicolor onde cada pelo tem base laranja e ponta escura (cinza ou preta), criando o efeito 'lobo'. É uma cor reconhecida oficialmente pela FCI no padrão da raça.",
      },
      {
        question: "Qual o preço do Spitz Wolf Sable?",
        answer:
          "Na By Império Dog, a Fêmea Wolf Sable começa em R$ 11.000 e o Macho em R$ 7.500. Incluem pedigree CBKC, vacinação, laudos e mentoria vitalícia.",
      },
      {
        question: "O Spitz Wolf Sable muda de cor com o tempo?",
        answer:
          "Filhotes Wolf Sable podem parecer mais escuros ao nascer. A coloração definitiva se estabelece entre 6 e 12 meses. A criadora documenta e acompanha a evolução da pelagem.",
      },
      {
        question: "Wolf Sable é o mesmo que Sable?",
        answer:
          "Wolf Sable (ou Orange Sable) e Sable puro são variações distintas dentro da família Sable. No Wolf Sable a base é laranja; no Sable puro a base pode ser mais clara. Ambos são reconhecidos pela FCI.",
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
    seoTitle: "Spitz Alemão Anão Fêmea | Filhotes Disponíveis – By Império Dog",
    metaDescription:
      "Filhotes fêmea de Spitz Alemão Anão em Bragança Paulista, SP. Temperamento dócil e apegado. Pedigree CBKC, laudos veterinários e mentoria vitalícia.",
    h1: "Spitz Alemão Anão Fêmea",
    intro:
      "A Spitz Fêmea é reconhecida pelo temperamento especialmente dócil e pelo vínculo profundo que cria com a família. Com pelagem exuberante e porte delicado, é a escolha favorita de quem busca um companheiro equilibrado, afetivo e de presença marcante.",
    characteristics: [
      "Temperamento mais dócil e apegado em relação ao macho",
      "Pelagem ainda mais exuberante na fêmea adulta",
      "Vínculo familiar muito forte — ideal para famílias com crianças",
      "Preço superior ao macho em todas as cores",
      "Cio a cada 6-8 meses (castração orientada pela criadora)",
    ],
    faqs: [
      {
        question: "Qual a diferença entre Spitz Fêmea e Macho de temperamento?",
        answer:
          "Fêmeas tendem a ser mais apegadas e seletivas no afeto — criando vínculos muito fortes com a família. Machos costumam ser mais brincalhões e extrovertidos. Ambos são excelentes para família quando bem socializados.",
      },
      {
        question: "Spitz Fêmea é mais cara que Macho?",
        answer:
          "Sim. A fêmea tem demanda consideravelmente superior ao macho em todas as cores, o que eleva seu valor. A diferença varia de R$ 2.000 a R$ 6.000 dependendo da cor.",
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
    seoTitle: "Spitz Alemão Anão Macho | Filhotes Disponíveis – By Império Dog",
    metaDescription:
      "Filhotes macho de Spitz Alemão Anão em Bragança Paulista, SP. Temperamento alegre e brincalhão. Pedigree CBKC, laudos veterinários e mentoria vitalícia.",
    h1: "Spitz Alemão Anão Macho",
    intro:
      "O Spitz Macho combina personalidade marcante com um temperamento alegre e brincalhão que conquista toda a família. Com porte compacto dentro do padrão FCI e pelagem densa, é a opção com o melhor custo-benefício dentro da raça para quem busca um Spitz de qualidade premium.",
    characteristics: [
      "Temperamento alegre, brincalhão e extrovertido",
      "Pelagem densa e volumosa — presença marcante",
      "Porte levemente maior que a fêmea em todas as cores",
      "Melhor custo-benefício dentro da raça",
      "Excelente para famílias ativas e jovens",
    ],
    faqs: [
      {
        question: "Macho Spitz marca território?",
        answer:
          "Machos não castrados marcam território. A castração entre 6 e 12 meses praticamente elimina esse comportamento. Nossos filhotes saem com orientação detalhada sobre o momento ideal.",
      },
      {
        question: "Macho Spitz briga com outros cães?",
        answer:
          "Não é característico da raça. Com socialização guiada desde o nascimento — como praticamos na By Império Dog — o Spitz Macho convive muito bem com outros animais e cães.",
      },
      {
        question: "Qual a diferença de preço entre Macho e Fêmea?",
        answer:
          "O Macho é entre R$ 2.000 e R$ 6.000 mais barato que a Fêmea dependendo da cor, sem qualquer diferença de qualidade, saúde ou documentação.",
      },
      {
        question: "O Macho Spitz é bom para crianças?",
        answer:
          "Sim. O Spitz Macho tem temperamento equilibrado com crianças, especialmente quando socializado desde filhote. Sua energia brincalhona combina muito bem com o ritmo infantil.",
      },
    ],
  },
};
