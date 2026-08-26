// content/puppies-static.ts
// Catálogo estático — By Império Dog
// Para atualizar disponibilidade: status → "available" | "reserved" | "sold"
//
// Preço: a tabela vive em src/domain/pricing.ts. Os `priceCents` daqui são a
// aplicação dela a cada filhote, e tests/pricing-guard.test.ts confere um
// contra o outro — o resumo de hierarquia que ficava nesta linha era mais uma
// cópia para divergir, e divergiu.
//
// Esta linha já creditou a conferência ao content-guard do prebuild, que não a
// fazia: este arquivo está na lista de SKIP do guard, e o que ele procura é o
// preço em prosa ("R$ 9.500"), nunca os centavos guardados aqui.
//
// `divulgar: false` tira o filhote das vitrines públicas sem apagar a sua
// página: o Cinza-Lobo saiu da comunicação, mas as URLs que já estavam
// indexadas continuam respondendo até que se decida o que fazer com elas.

export const staticPuppies = [
  // ─── SPITZ BRANCO FÊMEA ──────────────────────────────────────────────────────
  {
    id: "spitz-branco-femea-01",
    name: "Spitz Branco Fêmea",
    slug: "spitz-alemao-anao-branco-femea",
    title: "Spitz Alemão Anão Branco Fêmea | By Império Dog",
    color: "branco",
    cor: "Branco",
    sex: "female",
    gender: "female",
    status: "available",
    breed: "Spitz Alemão Anão",
    size: "mini",
    city: "braganca-paulista",
    state: "SP",
    // images[0] é a capa do card e do modal. A responsável escolheu a foto da
    // dupla no gramado como capa; as outras seguem a ordem em que ela enviou.
    // O .mp4 fica no fim: o componente separa foto de vídeo por extensão e usa
    // photos[0] como pôster, então a posição do vídeo no array não muda a capa.
    images: [
      "/filhotes/branco/branco-femea-dupla-jardim-01.jpg",
      "/filhotes/branco/branco-femea-jardim-01.jpg",
      "/filhotes/branco/branco-femea-colo-01.jpg",
      "/filhotes/branco/branco-femea-jardim-02.jpg",
      "/filhotes/branco/branco-femea-jardim-03.jpg",
      "/filhotes/branco/branco-femea-jardim-04.jpg",
      "/filhotes/branco/branco-femea-jardim-05.jpg",
      "/filhotes/branco/branco-femea-jardim-06.jpg",
      "/filhotes/branco/branco-femea-jardim-07.jpeg",
    ],
    // Fêmea Branca — única cor fora do valor comum das fêmeas: R$ 9.500.
    price_cents: 950000,
    priceCents: 950000,
    currency: "BRL",
    description:
      "Fêmea Branca fotografada em luz natural no jardim. Pelagem de aparência branca e uniforme; consulte a equipe para confirmar disponibilidade, documentação e condições da reserva.",
    availableForShipping: true,
    hasPedigree: true,
    vaccinationStatus: "up-to-date",
    hasMicrochip: false,
    isHighlighted: true,
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    reviewCount: 0,
    averageRating: 0,
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    inquiryCount: 0,
    seoKeywords: [
      "spitz alemão branco fêmea",
      "lulu da pomerânia branco fêmea",
      "filhote spitz branco braganca paulista",
      "spitz anão branco fêmea disponível",
    ],
  },

  // ─── SPITZ CREME FÊMEA ──────────────────────────────────────────────────────
  {
    id: "spitz-creme-femea-01",
    name: "Spitz Creme Fêmea",
    slug: "spitz-alemao-anao-creme-femea",
    title: "Spitz Alemão Anão Creme Fêmea | By Império Dog",
    color: "creme",
    cor: "Creme",
    sex: "female",
    gender: "female",
    status: "available",
    breed: "Spitz Alemão Anão",
    size: "mini",
    city: "braganca-paulista",
    state: "SP",
    images: [
      "/filhotes/creme/creme-femea-01.jpg",
      "/filhotes/creme/creme-filhote-flores-05.jpg",
      "/filhotes/creme/creme-filhote-jardim-04.jpg",
      "/filhotes/creme/creme-filhote-flores-04.jpg",
      "/filhotes/creme/creme-filhote-jardim-03.jpg",
      "/filhotes/creme/creme-femea-02.jpg",
      "/filhotes/creme/creme-femea-03.jpg",
      "/filhotes/creme/creme-filhote-flores-01.jpg",
      "/filhotes/creme/creme-femea-flores-03.jpg",
      "/filhotes/creme/creme-femea-flores-04.jpg",
      "/filhotes/videos/spitz-creme.mp4",
      "/filhotes/videos/ninhada-creme-01.mp4",
    ],
    // Fêmea Creme — preço único de fêmea → R$ 8.500
    price_cents: 850000,
    priceCents: 850000,
    currency: "BRL",
    description:
      "Fêmea Creme de pelagem clara e uniforme. Registro oficial, protocolo vacinal em dia conforme a idade e mentoria pós-venda inclusos. Consulte a disponibilidade e as condições da reserva.",
    availableForShipping: true,
    hasPedigree: true,
    vaccinationStatus: "up-to-date",
    hasMicrochip: false,
    isHighlighted: true,
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: false,
    reviewCount: 0,
    averageRating: 0,
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    inquiryCount: 0,
    seoKeywords: [
      "spitz alemão creme fêmea",
      "lulu pomerânia creme femea sp",
      "filhote spitz creme bragança paulista",
      "spitz anão creme disponível",
    ],
  },

  // ─── SPITZ PRETO FÊMEA ──────────────────────────────────────────────────────
  {
    id: "spitz-preto-femea-01",
    name: "Spitz Preto Fêmea",
    slug: "spitz-alemao-anao-preto-femea",
    title: "Spitz Alemão Anão Preto Fêmea | By Império Dog",
    color: "preto",
    cor: "Preto",
    sex: "female",
    gender: "female",
    status: "available",
    breed: "Spitz Alemão Anão",
    size: "mini",
    city: "braganca-paulista",
    state: "SP",
    images: [
      "/filhotes/preto/preto-filhote-flores-01.jpg",
      "/filhotes/preto/preto-filhote-jardim-01.jpg",
      "/filhotes/preto/preto-filhote-flores-04.jpg",
      "/filhotes/preto/preto-filhote-jardim-04.jpg",
      "/filhotes/preto/preto-filhote-flores-05.jpg",
      "/filhotes/preto/preto-filhote-jardim-03.jpg",
      "/filhotes/preto/preto-filhote-2024-jardim-01.jpg",
      "/filhotes/preto/preto-filhote-2024-jardim-02.jpg",
      "/filhotes/videos/spitz-anao.mp4",
    ],
    // Fêmea Preta — preço único de fêmea → R$ 8.500
    price_cents: 850000,
    priceCents: 850000,
    currency: "BRL",
    description:
      "Fêmea Preta de pelagem escura e brilhante, estrutura compacta. Registro oficial, consulta veterinária e hemograma completo. Consulte a disponibilidade e as condições da reserva.",
    availableForShipping: true,
    hasPedigree: true,
    vaccinationStatus: "up-to-date",
    hasMicrochip: false,
    isHighlighted: true,
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: false,
    reviewCount: 0,
    averageRating: 0,
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    inquiryCount: 0,
    seoKeywords: [
      "spitz alemão preto fêmea",
      "lulu pomerânia preto femea sp",
      "spitz anão preto fêmea bragança paulista",
      "filhote spitz preto fêmea disponível",
    ],
  },

  // ─── SPITZ LARANJA FÊMEA ────────────────────────────────────────────────────
  {
    id: "spitz-laranja-femea-01",
    name: "Spitz Laranja Fêmea",
    slug: "spitz-alemao-anao-laranja-femea",
    title: "Spitz Alemão Anão Laranja Fêmea | By Império Dog",
    color: "laranja",
    cor: "Laranja",
    sex: "female",
    gender: "female",
    status: "available",
    breed: "Spitz Alemão Anão",
    size: "mini",
    city: "braganca-paulista",
    state: "SP",
    // A capa é a primeira imagem que não é vídeo — é ela que aparece nos cards
    // do catálogo e no topo da página do filhote. A antiga (flores-01) mostra a
    // fêmea suspensa na mão do criador, em recorte vertical fechado: no card
    // quadrado sobra a mão e falta o cão. A nova mostra o animal inteiro, de pé,
    // em foco, sozinho no enquadramento. flores-01 continua na galeria.
    images: [
      "/filhotes/laranja/laranja-femea-jardim-04.jpg",
      "/filhotes/laranja/laranja-femea-flores-01.jpg",
      "/filhotes/laranja/laranja-femea-jardim-03.jpg",
      "/filhotes/laranja/laranja-femea-brinquedos-04.jpg",
      "/filhotes/laranja/laranja-femea-flores-02.jpg",
      "/filhotes/laranja/laranja-femea-jardim-02.jpg",
      "/filhotes/laranja/laranja-femea-brinquedos-03.jpg",
      "/filhotes/laranja/laranja-femea-interior-01.jpg",
      "/filhotes/laranja/laranja-femea-01.jpg",
      "/filhotes/laranja/laranja-femea-brinquedos-01.jpg",
      "/filhotes/laranja/laranja-femea-brinquedos-02.jpg",
      "/filhotes/videos/laranja-femea-jardim.mp4",
      "/filhotes/videos/ninhada-jun22-01.mp4",
    ],
    // Fêmea Laranja → R$ 7.500 (TABELA_DE_PRECOS.laranja.femea)
    price_cents: 750000,
    priceCents: 750000,
    currency: "BRL",
    description:
      "Fêmea Laranja de coloração viva, dentro do padrão FCI nº 97. Registro oficial e acompanhamento veterinário. Consulte a disponibilidade e as condições da reserva.",
    availableForShipping: true,
    hasPedigree: true,
    vaccinationStatus: "up-to-date",
    hasMicrochip: false,
    isHighlighted: true,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    reviewCount: 0,
    averageRating: 0,
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    inquiryCount: 0,
    seoKeywords: [
      "spitz alemão laranja fêmea",
      "lulu pomerânia laranja femea sp",
      "filhote spitz laranja disponível",
      "spitz anão laranja fêmea",
    ],
  },

  // ─── SPITZ CREME MACHO ──────────────────────────────────────────────────────
  {
    id: "spitz-creme-macho-01",
    name: "Spitz Creme Macho",
    slug: "spitz-alemao-anao-creme-macho",
    title: "Spitz Alemão Anão Creme Macho | By Império Dog",
    color: "creme",
    cor: "Creme",
    sex: "male",
    gender: "male",
    status: "available",
    breed: "Spitz Alemão Anão",
    size: "mini",
    city: "braganca-paulista",
    state: "SP",
    images: [
      "/filhotes/creme/creme-macho-01.jpg",
      "/filhotes/creme/creme-filhote-flores-06.jpg",
      "/filhotes/creme/creme-filhote-jardim-01.jpg",
      "/filhotes/creme/creme-filhote-folha-01.jpg",
      "/filhotes/creme/creme-filhote-flores-02.jpg",
      "/filhotes/creme/creme-filhote-jardim-05.jpg",
      "/filhotes/creme/creme-macho-02.jpg",
      "/filhotes/creme/creme-macho-flores-01.jpg",
      "/filhotes/creme/creme-filhote-jardim-02.jpg",
      "/filhotes/videos/spitz-branco.mp4",
      "/filhotes/videos/creme-dupla.mp4",
    ],
    // Macho Creme — faixa alta de macho (Creme/Preto) → R$ 7.500
    price_cents: 750000,
    priceCents: 750000,
    currency: "BRL",
    description:
      "Macho Creme com estrutura compacta dentro do padrão FCI nº 97 (altura na cernelha de 21 cm ± 3 cm). Registro oficial e acompanhamento veterinário. Consulte a disponibilidade e as condições da reserva.",
    availableForShipping: true,
    hasPedigree: true,
    vaccinationStatus: "up-to-date",
    hasMicrochip: false,
    isHighlighted: false,
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    reviewCount: 0,
    averageRating: 0,
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    inquiryCount: 0,
    seoKeywords: [
      "spitz alemão creme macho",
      "lulu pomerânia macho creme sp",
      "spitz anão macho bragança paulista",
      "filhote spitz macho disponível",
    ],
  },

  // ─── SPITZ PRETO MACHO ──────────────────────────────────────────────────────
  {
    id: "spitz-preto-macho-01",
    name: "Spitz Preto Macho",
    slug: "spitz-alemao-anao-preto-macho",
    title: "Spitz Alemão Anão Preto Macho | By Império Dog",
    color: "preto",
    cor: "Preto",
    sex: "male",
    gender: "male",
    status: "available",
    breed: "Spitz Alemão Anão",
    size: "mini",
    city: "braganca-paulista",
    state: "SP",
    // Capa: preto-00 é a foto mais recente e a única em que ele aparece
    // inteiro, de frente e em foco. As antigas seguem na ordem em que já
    // estavam — trocar a capa não reordena o resto do álbum.
    images: [
      "/filhotes/preto/preto-00.jpeg",
      "/filhotes/preto/preto-01.jpg",
      "/filhotes/preto/preto-filhote-jardim-01.jpg",
      "/filhotes/preto/preto-filhote-flores-01.jpg",
      "/filhotes/preto/preto-filhote-jardim-03.jpg",
      "/filhotes/preto/preto-filhote-flores-08.jpg",
      "/filhotes/preto/preto-filhote-flores-07.jpg",
      "/filhotes/preto/preto-filhote-jardim-02.jpg",
      "/filhotes/videos/spitz-anao.mp4",
    ],
    // Macho Preto — faixa alta de macho (Creme/Preto) → R$ 7.500
    price_cents: 750000,
    priceCents: 750000,
    currency: "BRL",
    description:
      "Macho Preto de pelagem escura e brilhante, estrutura compacta. Registro oficial e acompanhamento veterinário. Consulte a disponibilidade e as condições da reserva.",
    availableForShipping: true,
    hasPedigree: true,
    vaccinationStatus: "up-to-date",
    hasMicrochip: false,
    isHighlighted: false,
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    reviewCount: 0,
    averageRating: 0,
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    inquiryCount: 0,
    seoKeywords: [
      "spitz alemão preto macho",
      "lulu pomerânia preto macho sp",
      "spitz anão preto bragança paulista",
      "filhote spitz preto disponível",
    ],
  },

  // ─── SPITZ LARANJA MACHO ────────────────────────────────────────────────────
  {
    id: "spitz-laranja-macho-01",
    name: "Spitz Laranja Macho",
    slug: "spitz-alemao-anao-laranja-macho",
    title: "Spitz Alemão Anão Laranja Macho | By Império Dog",
    color: "laranja",
    cor: "Laranja",
    sex: "male",
    gender: "male",
    status: "available",
    breed: "Spitz Alemão Anão",
    size: "mini",
    city: "braganca-paulista",
    state: "SP",
    images: [
      "/filhotes/laranja/laranja-macho-flores-01.jpg",
      "/filhotes/laranja/laranja-macho-flores-02.jpg",
      "/filhotes/laranja/laranja-macho-01.jpg",
      "/filhotes/laranja/laranja-macho-jardim-01.jpg",
      "/filhotes/laranja/laranja-macho-02.jpg",
      "/filhotes/laranja/laranja-macho-flores-03.jpg",
      "/filhotes/laranja/laranja-macho-flores-04.jpg",
      "/filhotes/videos/spitz-laranja-macho.mp4",
      "/filhotes/videos/laranja-macho-jardim.mp4",
      "/filhotes/videos/ninhada-laranja-01.mp4",
    ],
    // Macho Laranja — faixa baixa de macho (Cinza-Lobo/Laranja) → R$ 6.500
    price_cents: 650000,
    priceCents: 650000,
    currency: "BRL",
    description:
      "Macho Laranja de coloração viva e pelagem densa. Acompanhamento veterinário e hemograma completo. Registro oficial incluso, com emissão e entrega conforme o prazo da entidade responsável e as condições previstas em contrato.",
    availableForShipping: true,
    hasPedigree: true,
    vaccinationStatus: "up-to-date",
    hasMicrochip: false,
    isHighlighted: false,
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    reviewCount: 0,
    averageRating: 0,
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    inquiryCount: 0,
    seoKeywords: [
      "spitz alemão laranja macho",
      "lulu pomerânia macho laranja",
      "spitz laranja macho bragança paulista",
      "filhote spitz laranja macho disponível",
    ],
  },

  // ─── LULU DA POMERÂNIA BRANCO MACHO ─────────────────────────────────────────
  // Mesma raça dos demais: "Lulu da Pomerânia" é o nome popular do Spitz
  // Alemão Anão. A responsável pediu que ESTE filhote — e só ele, entre os já
  // cadastrados — fosse anunciado pelo nome popular. O `color` continua
  // "branco" porque é ele que liga o filhote à tabela de preços; o rótulo
  // muda, o valor cobrado não.
  {
    id: "lulu-pomerania-branco-macho-01",
    name: "Lulu da Pomerânia Branco Macho",
    slug: "lulu-da-pomerania-branco-macho",
    title: "Lulu da Pomerânia Branco Macho | By Império Dog",
    color: "branco",
    cor: "Branco",
    sex: "male",
    gender: "male",
    status: "available",
    breed: "Lulu da Pomerânia",
    size: "mini",
    city: "braganca-paulista",
    state: "SP",
    // Capa: a foto em que ele aparece inteiro, de frente e em foco. As outras
    // seguem na ordem em que dão contexto — sentado, em pé no trevo, e a do
    // gramado aberto por último.
    images: [
      "/filhotes/branco/branco-macho-jardim-01.jpeg",
      "/filhotes/branco/branco-macho-jardim-02.jpeg",
      "/filhotes/branco/branco-macho-jardim-03.jpeg",
      "/filhotes/branco/branco-macho-jardim-04.jpeg",
    ],
    // Macho Branco — R$ 8.500, o mesmo valor de qualquer macho branco da
    // tabela. tests/pricing-guard.test.ts confere este número contra
    // precoDe("branco", "macho").
    price_cents: 850000,
    priceCents: 850000,
    currency: "BRL",
    description:
      "Macho Branco fotografado em luz natural no gramado. Pelagem de aparência branca e uniforme; consulte a equipe para confirmar disponibilidade, documentação e condições da reserva.",
    availableForShipping: true,
    hasPedigree: true,
    vaccinationStatus: "up-to-date",
    hasMicrochip: false,
    isHighlighted: false,
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    reviewCount: 0,
    averageRating: 0,
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    inquiryCount: 0,
    seoKeywords: [
      "lulu da pomerânia branco macho",
      "lulu da pomerânia macho bragança paulista",
      "filhote lulu da pomerânia branco disponível",
      "spitz alemão branco macho",
    ],
  },

  // ─── LULU DA POMERÂNIA PARTICOLOR MACHO ─────────────────────────────────────
  // Segue o mesmo pedido do branco acima: nome popular no anúncio, `color`
  // ligado à tabela. O particolor entrou na tabela junto com este filhote — era
  // a cor dele que faltava ter valor oficial, não o contrário.
  {
    id: "lulu-pomerania-particolor-macho-01",
    name: "Lulu da Pomerânia Particolor Macho",
    slug: "lulu-da-pomerania-particolor-macho",
    title: "Lulu da Pomerânia Particolor Macho | By Império Dog",
    color: "particolor",
    cor: "Particolor",
    sex: "male",
    gender: "male",
    status: "available",
    breed: "Lulu da Pomerânia",
    size: "mini",
    city: "braganca-paulista",
    state: "SP",
    // Capa: a única foto em que ele aparece inteiro, de frente e em foco — é o
    // enquadramento em que dá para ver como as manchas se distribuem, que é o
    // que distingue um particolor de outro. As demais seguem por contexto.
    images: [
      "/filhotes/particolor/particolor-macho-jardim-01.jpeg",
      "/filhotes/particolor/particolor-macho-jardim-02.jpeg",
      "/filhotes/particolor/particolor-macho-jardim-03.jpeg",
      "/filhotes/particolor/particolor-macho-jardim-04.jpeg",
      "/filhotes/particolor/particolor-macho-jardim-05.jpeg",
      "/filhotes/particolor/particolor-macho-jardim-06.jpeg",
    ],
    // Macho Particolor — R$ 5.500, o menor valor da tabela.
    // tests/pricing-guard.test.ts confere este número contra
    // precoDe("particolor", "macho").
    price_cents: 550000,
    priceCents: 550000,
    currency: "BRL",
    description:
      "Macho Particolor fotografado em luz natural no jardim. Pelagem de base branca com manchas definidas na cabeça, nas orelhas e no dorso; consulte a equipe para confirmar disponibilidade, documentação e condições da reserva.",
    availableForShipping: true,
    hasPedigree: true,
    vaccinationStatus: "up-to-date",
    hasMicrochip: false,
    isHighlighted: true,
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    reviewCount: 0,
    averageRating: 0,
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    inquiryCount: 0,
    seoKeywords: [
      "lulu da pomerânia particolor macho",
      "spitz alemão particolor macho",
      "filhote particolor bragança paulista",
      "lulu da pomerânia malhado disponível",
    ],
  },

  // ─── LULU DA POMERÂNIA LARANJA MACHO ────────────────────────────────────────
  // Terceiro filhote do lote anunciado pelo nome popular. A cor de registro é
  // laranja, confirmada pela responsável: nas fotos a pelagem aparece com
  // sombreado escuro nas pontas, o que é a fase de filhote e não a cor adulta.
  // A descrição diz isso em vez de prometer o laranja pleno das outras fotos.
  {
    id: "lulu-pomerania-laranja-macho-01",
    name: "Lulu da Pomerânia Laranja Macho",
    slug: "lulu-da-pomerania-laranja-macho",
    title: "Lulu da Pomerânia Laranja Macho | By Império Dog",
    color: "laranja",
    cor: "Laranja",
    sex: "male",
    gender: "male",
    status: "available",
    breed: "Lulu da Pomerânia",
    size: "mini",
    city: "braganca-paulista",
    state: "SP",
    // Capa: a foto frontal em foco. O .mp4 fica no fim porque o componente
    // separa foto de vídeo por extensão e usa photos[0] como pôster — a
    // posição do vídeo no array não muda a capa.
    images: [
      "/filhotes/laranja/laranja-macho-gramado-01.jpeg",
      "/filhotes/laranja/laranja-macho-gramado-02.jpeg",
      "/filhotes/laranja/laranja-macho-gramado-03.jpeg",
      "/filhotes/laranja/laranja-macho-gramado-04.jpeg",
      "/filhotes/laranja/laranja-macho-gramado-05.jpeg",
      "/filhotes/laranja/laranja-macho-gramado-06.jpeg",
      "/filhotes/laranja/laranja-macho-gramado-07.jpeg",
      "/filhotes/laranja/laranja-macho-gramado-08.jpeg",
      "/filhotes/laranja/laranja-macho-gramado-09.jpeg",
      "/filhotes/videos/laranja-macho-gramado.mp4",
    ],
    // Macho Laranja — R$ 6.500, o mesmo valor de qualquer macho laranja da
    // tabela. tests/pricing-guard.test.ts confere este número contra
    // precoDe("laranja", "macho").
    price_cents: 650000,
    priceCents: 650000,
    currency: "BRL",
    description:
      "Macho Laranja fotografado e filmado em luz natural no gramado. A pelagem de filhote ainda traz sombreado escuro nas pontas, que costuma clarear até a cor adulta se firmar; consulte a equipe para confirmar disponibilidade, documentação e condições da reserva.",
    availableForShipping: true,
    hasPedigree: true,
    vaccinationStatus: "up-to-date",
    hasMicrochip: false,
    isHighlighted: false,
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    reviewCount: 0,
    averageRating: 0,
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    inquiryCount: 0,
    seoKeywords: [
      "lulu da pomerânia laranja macho",
      "spitz alemão laranja macho",
      "filhote lulu da pomerânia bragança paulista",
      "lulu da pomerânia laranja disponível",
    ],
  },

  // ─── SPITZ WOLF SABLE FÊMEA ─────────────────────────────────────────────────
  {
    id: "spitz-wolf-sable-femea-01",
    name: "Spitz Cinza-Lobo (Wolf Sable) Fêmea",
    slug: "spitz-alemao-anao-wolf-sable-femea",
    title: "Spitz Alemão Anão Cinza-Lobo (Wolf Sable) Fêmea | By Império Dog",
    color: "wolf-sable",
    cor: "Cinza-Lobo",
    sex: "female",
    gender: "female",
    status: "available",
    divulgar: false,
    breed: "Spitz Alemão Anão",
    size: "mini",
    city: "braganca-paulista",
    state: "SP",
    // Só o que a própria nomenclatura das fotos atribui a esta fêmea. As quatro
    // mídias tiradas daqui (filhote-flores-01, filhote-flores-03,
    // filhote-brinquedos-01 e wolf-sable-jardim.mp4) são todas da mesma sessão
    // no pé de flor vermelha, e uma irmã dessa sessão — filhote-flores-02 —
    // ilustra o anúncio do MACHO. Nada atribuía essas quatro a ela.
    images: [
      "/filhotes/wolf-sable/wolf-sable-femea-01.jpg",
      "/filhotes/wolf-sable/wolf-sable-femea-abeto-01.jpg",
      "/filhotes/wolf-sable/wolf-sable-femea-abeto-02.jpg",
      "/filhotes/wolf-sable/wolf-sable-femea-abeto-03.jpg",
      "/filhotes/wolf-sable/wolf-sable-femea-jardim-01.jpg",
    ],
    // Cinza-Lobo Fêmea — preço único de fêmea → R$ 8.500
    price_cents: 850000,
    priceCents: 850000,
    currency: "BRL",
    description:
      "Fêmea Cinza-Lobo (Wolf Sable) — coloração bicolor com máscara cinza sobre base laranja, reconhecida pela FCI. Cor não divulgada pela By Império Dog.",
    availableForShipping: true,
    hasPedigree: true,
    vaccinationStatus: "up-to-date",
    hasMicrochip: false,
    isHighlighted: true,
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: false,
    reviewCount: 0,
    averageRating: 0,
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    inquiryCount: 0,
    seoKeywords: [
      "spitz alemão wolf sable fêmea",
      "lulu pomerânia wolf sable sp",
      "spitz sable cinza laranja femea",
      "filhote spitz wolf sable disponível",
    ],
  },

  // ─── SPITZ WOLF SABLE MACHO ─────────────────────────────────────────────────
  {
    id: "spitz-wolf-sable-macho-01",
    name: "Spitz Cinza-Lobo (Wolf Sable) Macho",
    slug: "spitz-alemao-anao-wolf-sable-macho",
    title: "Spitz Alemão Anão Cinza-Lobo (Wolf Sable) Macho | By Império Dog",
    color: "wolf-sable",
    cor: "Cinza-Lobo",
    sex: "male",
    gender: "male",
    status: "available",
    divulgar: false,
    breed: "Spitz Alemão Anão",
    size: "mini",
    city: "braganca-paulista",
    state: "SP",
    images: [
      "/filhotes/wolf-sable/wolf-sable-filhote-jardim-04.jpg",
      "/filhotes/wolf-sable/wolf-sable-filhote-flores-02.jpg",
      "/filhotes/wolf-sable/wolf-sable-filhote-jardim-02.jpg",
      "/filhotes/wolf-sable/wolf-sable-macho-abeto-01.jpg",
      "/filhotes/wolf-sable/wolf-sable-macho-abeto-02.jpg",
      "/filhotes/wolf-sable/wolf-sable-filhote-jardim-01.jpg",
      "/filhotes/wolf-sable/wolf-sable-filhote-jardim-03.jpg",
      "/filhotes/wolf-sable/wolf-sable-macho-01.jpg",
      "/filhotes/videos/wolf-sable-jardim.mp4",
      "/filhotes/videos/spitz-anao.mp4",
    ],
    // Cinza-Lobo Macho — faixa baixa de macho (Cinza-Lobo/Laranja) → R$ 6.500
    price_cents: 650000,
    priceCents: 650000,
    currency: "BRL",
    description:
      "Macho Cinza-Lobo (Wolf Sable) — coloração bicolor cinza e laranja, padrão reconhecido pela FCI. Cor não divulgada pela By Império Dog.",
    availableForShipping: true,
    hasPedigree: true,
    vaccinationStatus: "up-to-date",
    hasMicrochip: false,
    isHighlighted: false,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    reviewCount: 0,
    averageRating: 0,
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    inquiryCount: 0,
    seoKeywords: [
      "spitz alemão wolf sable macho",
      "lulu pomerânia sable macho sp",
      "spitz bicolor cinza laranja macho",
      "filhote spitz sable disponível",
    ],
  },
];

/**
 * O catálogo como as vitrines genéricas devem enxergá-lo.
 *
 * Home, /filhotes, páginas de sexo, cidades, quiz, banner do blog e agente do
 * WhatsApp listam "os filhotes disponíveis" — e é aí que o Cinza-Lobo não pode
 * mais aparecer. Já quem responde por uma URL específica (a página do filhote,
 * a página da cor, o sitemap) continua lendo `staticPuppies` direto, senão uma
 * página indexada passaria a devolver 404 ou a abrir vazia.
 */
export const puppiesPublicados = staticPuppies.filter(
  (p) => (p as { divulgar?: boolean }).divulgar !== false,
);
