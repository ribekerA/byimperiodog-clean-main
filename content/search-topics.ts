/**
 * Mapa editorial de intenções de busca. Não é uma meta tag de keywords nem
 * uma previsão de volume: cada grupo tem uma página principal e conteúdos
 * de apoio. A mesma fonte alimenta navegação, recomendações e auditoria.
 */
export type SearchCluster = "compra" | "raca" | "escolha" | "rotina" | "cuidados" | "regiao";

export type SearchTopic = {
  id: string;
  cluster: SearchCluster;
  href: string;
  label: string;
  description: string;
  queries: readonly string[];
  supportingPaths?: readonly string[];
  related?: readonly string[];
};

export const SEARCH_CLUSTERS: readonly { id: SearchCluster; title: string; description: string }[] = [
  { id: "compra", title: "Preços, compra e escolha do canil", description: "Compare valores, documentação e etapas da reserva antes de decidir." },
  { id: "raca", title: "Conheça o Spitz e o Lulu da Pomerânia", description: "Entenda os nomes da raça, suas características e veja fotos e vídeos reais." },
  { id: "escolha", title: "Compare cores e sexos", description: "Veja referências de pelagem e os valores de machos e fêmeas. As opções atuais são confirmadas no atendimento." },
  { id: "rotina", title: "O filhote combina com a sua rotina?", description: "Apartamento, crianças, latidos e convivência: perguntas para planejar a vida com o cão." },
  { id: "cuidados", title: "Prepare a chegada e os cuidados", description: "Organize o enxoval e a rotina, com orientação veterinária para as decisões de saúde." },
  { id: "regiao", title: "Atendimento e transporte", description: "A By Império Dog fica em Bragança Paulista, SP. Consulte como organizar visita, retirada e transporte para sua região." },
];

export const SEARCH_TOPICS: readonly SearchTopic[] = [
  {
    id: "canil", cluster: "compra", href: "/", label: "Canil By Império Dog",
    description: "Conheça a criação de Spitz Alemão Anão em Bragança Paulista.",
    queries: ["By Império Dog", "canil Spitz Alemão", "canil Lulu da Pomerânia"],
    supportingPaths: ["/sobre", "/contato"], related: ["criador", "filhotes", "preco"],
  },
  {
    id: "filhotes", cluster: "compra", href: "/filhotes", label: "Filhotes de Spitz Alemão Anão",
    description: "Fotos reais, cores, sexos e preços da vitrine de Lulu da Pomerânia.",
    queries: ["filhotes de Spitz Alemão", "filhotes de Lulu da Pomerânia"],
    supportingPaths: ["/ninhadas"], related: ["preco", "comprar", "femea"],
  },
  {
    id: "preco", cluster: "compra", href: "/preco-spitz-anao", label: "Quanto custa um Lulu da Pomerânia?",
    description: "Tabela de preços do Spitz por cor e sexo e o que acompanha o filhote.",
    queries: ["Spitz Alemão preço", "Lulu da Pomerânia valor", "quanto custa um Lulu da Pomerânia"],
    supportingPaths: ["/blog/preco-spitz-alemao-anao", "/blog/cores-spitz-alemao-anao-qual-mais-cara"], related: ["filhotes", "custo-mensal", "comprar"],
  },
  {
    id: "comprar", cluster: "compra", href: "/comprar-spitz-anao", label: "Como comprar com segurança",
    description: "O que conferir no atendimento, no contrato e antes de reservar.",
    queries: ["comprar Spitz Alemão Anão", "comprar Lulu da Pomerânia"],
    supportingPaths: ["/reserve-seu-filhote", "/faq-do-tutor"], related: ["criador", "preco", "documentacao"],
  },
  {
    id: "criador", cluster: "compra", href: "/criador-spitz-confiavel", label: "Como escolher um criador confiável",
    description: "Critérios para comparar canis, informações e documentos.",
    queries: ["criador de Spitz confiável", "como escolher canil de Lulu da Pomerânia"],
    supportingPaths: ["/blog/como-escolher-canil-spitz-alemao", "/guias/como-escolher-spitz-alemao-anao"], related: ["canil", "documentacao", "comprar"],
  },
  {
    id: "documentacao", cluster: "compra", href: "/blog/documentacao-registro-spitz-alemao", label: "Registro e documentação do filhote",
    description: "Entenda os documentos e as informações a pedir ao criador.",
    queries: ["registro Spitz Alemão", "documentação Lulu da Pomerânia"], related: ["criador", "comprar", "preco"],
  },
  {
    id: "custo-mensal", cluster: "compra", href: "/guias/quanto-custa-ter-spitz-alemao-anao", label: "Quanto custa manter um Spitz?",
    description: "Planeje os gastos de rotina além do valor de compra.",
    queries: ["quanto custa manter um Spitz Alemão", "custo mensal Lulu da Pomerânia"],
    supportingPaths: ["/blog/quanto-custa-manter-spitz-alemao"], related: ["preco", "alimentacao", "chegada"],
  },
  {
    id: "spitz", cluster: "raca", href: "/spitz-alemao", label: "Spitz Alemão: características da raça",
    description: "Conheça a raça e os cuidados para escolher com informação.",
    queries: ["Spitz Alemão", "Spitz Alemão Anão"],
    supportingPaths: ["/blog/guia-spitz-alemao", "/blog/spitz-alemao-anao-vs-pinscher-chihuahua"], related: ["nomes-raca", "temperamento", "filhotes"],
  },
  {
    id: "lulu", cluster: "raca", href: "/lulu-da-pomerania", label: "Lulu da Pomerânia",
    description: "Porte, pelagem e particularidades do Lulu.",
    queries: ["Lulu da Pomerânia"], related: ["nomes-raca", "preco", "apartamento"],
  },
  {
    id: "pomeranian", cluster: "raca", href: "/pomeranian", label: "Pomeranian no Brasil",
    description: "Entenda o nome usado internacionalmente para o Lulu.",
    queries: ["Pomeranian", "Pomeranian Brasil"], related: ["nomes-raca", "filhotes", "transporte"],
  },
  {
    id: "nomes-raca", cluster: "raca", href: "/guias/spitz-alemao-anao-vs-lulu-pomerania", label: "Spitz e Lulu são o mesmo cão?",
    description: "Compare a nomenclatura da raça e evite confusão ao pesquisar.",
    queries: ["diferença Spitz Alemão e Lulu da Pomerânia"],
    supportingPaths: ["/blog/lulu-pomerania-ou-spitz-alemao"], related: ["spitz", "lulu", "filhotes"],
  },
  {
    id: "baby-face", cluster: "raca", href: "/spitz-alemao-baby-face", label: "O que significa Baby Face?",
    description: "Entenda o termo e o que observar nas fotos de um filhote.",
    queries: ["Spitz Baby Face", "Lulu da Pomerânia Baby Face"], related: ["galeria", "criador", "filhotes"],
  },
  {
    id: "galeria", cluster: "raca", href: "/galeria", label: "Fotos e vídeos dos filhotes",
    description: "Veja registros reais e compare as referências da vitrine.",
    queries: ["vídeos Spitz Alemão", "fotos Lulu da Pomerânia"], related: ["branco", "preto", "filhotes"],
  },
  {
    id: "branco", cluster: "escolha", href: "/spitz-alemao-branco", label: "Spitz branco e creme claro",
    description: "Compare a aparência das pelagens e veja referências da cor branca.",
    queries: ["Spitz Alemão branco", "Lulu da Pomerânia branco"], related: ["branco-catalogo", "creme", "preco"],
  },
  {
    id: "branco-catalogo", cluster: "escolha", href: "/filhotes/cor/branco", label: "Filhotes brancos: fotos e valores",
    description: "Consulte as referências de Spitz branco da vitrine.",
    queries: ["filhote Spitz branco preço", "Lulu da Pomerânia branco valor"], related: ["preco", "creme", "femea"],
  },
  {
    id: "preto", cluster: "escolha", href: "/spitz-alemao-preto", label: "Spitz Alemão preto",
    description: "Conheça a pelagem preta e as referências publicadas.",
    queries: ["Spitz Alemão preto", "Lulu da Pomerânia preto"],
    supportingPaths: ["/blog/spitz-alemao-anao-preto"], related: ["preto-catalogo", "preco", "femea"],
  },
  {
    id: "preto-catalogo", cluster: "escolha", href: "/filhotes/cor/preto", label: "Filhotes pretos: fotos e valores",
    description: "Compare machos e fêmeas de pelagem preta.",
    queries: ["filhote Spitz preto preço", "Lulu da Pomerânia preto valor"], related: ["preco", "femea", "macho"],
  },
  {
    id: "creme", cluster: "escolha", href: "/filhotes/cor/creme", label: "Spitz creme: fotos e preços",
    description: "Veja a tonalidade creme e compare os valores por sexo.",
    queries: ["Spitz Alemão creme", "Lulu da Pomerânia creme preço"],
    supportingPaths: ["/blog/spitz-alemao-anao-creme"], related: ["branco", "preco", "filhotes"],
  },
  {
    id: "laranja", cluster: "escolha", href: "/filhotes/cor/laranja", label: "Spitz laranja: fotos e preços",
    description: "Referências da pelagem laranja e valores da vitrine.",
    queries: ["Spitz Alemão laranja", "Lulu da Pomerânia laranja preço"], related: ["preco", "femea", "macho"],
  },
  {
    id: "particolor", cluster: "escolha", href: "/filhotes/cor/particolor", label: "Spitz particolor: padrão e valores",
    description: "Entenda a pelagem com manchas e consulte as opções no atendimento.",
    queries: ["Spitz Alemão particolor", "Lulu da Pomerânia particolor"], related: ["preco", "galeria", "filhotes"],
  },
  {
    id: "femea", cluster: "escolha", href: "/filhotes/sexo/femea", label: "Spitz fêmea: cores e valores",
    description: "Compare as referências de fêmeas de Lulu da Pomerânia.",
    queries: ["Spitz Alemão fêmea", "Lulu da Pomerânia fêmea preço"], related: ["macho-femea", "preco", "filhotes"],
  },
  {
    id: "macho", cluster: "escolha", href: "/filhotes/sexo/macho", label: "Spitz macho: cores e valores",
    description: "Compare as referências de machos de Lulu da Pomerânia.",
    queries: ["Spitz Alemão macho", "Lulu da Pomerânia macho preço"], related: ["macho-femea", "preco", "filhotes"],
  },
  {
    id: "macho-femea", cluster: "escolha", href: "/blog/spitz-alemao-anao-macho-ou-femea", label: "Spitz macho ou fêmea?",
    description: "O que considerar na escolha, além do sexo do filhote.",
    queries: ["Spitz macho ou fêmea", "Lulu da Pomerânia macho ou fêmea"], related: ["macho", "femea", "temperamento"],
  },
  {
    id: "nomes", cluster: "rotina", href: "/blog/nomes-lulu-da-pomerania", label: "Nomes para Lulu: fêmeas e machos",
    description: "Ideias por estilo e cor para escolher o nome do filhote em família.",
    queries: ["nomes para Lulu da Pomerânia", "nomes para Spitz Alemão fêmea"], related: ["chegada", "femea", "filhotes"],
  },
  {
    id: "apartamento", cluster: "rotina", href: "/blog/spitz-alemao-anao-bom-para-apartamento", label: "Lulu é bom para apartamento?",
    description: "Espaço, rotina e atenção: o que planejar antes de receber o cão.",
    queries: ["Lulu da Pomerânia é bom para apartamento", "Spitz Alemão apartamento"], related: ["latidos", "sozinho", "chegada"],
  },
  {
    id: "criancas", cluster: "rotina", href: "/blog/spitz-alemao-anao-com-criancas", label: "Convivência do Spitz com crianças",
    description: "Cuidados de supervisão e adaptação na família.",
    queries: ["Spitz Alemão com crianças", "Lulu da Pomerânia crianças"], related: ["temperamento", "chegada", "escolher-filhote"],
  },
  {
    id: "latidos", cluster: "rotina", href: "/blog/spitz-alemao-anao-latido", label: "O Spitz late muito?",
    description: "Entenda os latidos e como organizar a rotina.",
    queries: ["Spitz Alemão late muito", "Lulu da Pomerânia latidos"],
    supportingPaths: ["/blog/adestramento-spitz-alemao-anao"], related: ["apartamento", "sozinho", "temperamento"],
  },
  {
    id: "sozinho", cluster: "rotina", href: "/blog/spitz-alemao-anao-ansiedade-separacao", label: "Como preparar o Spitz para ficar sozinho",
    description: "Adaptação gradual e atenção ao comportamento do cão.",
    queries: ["Lulu da Pomerânia pode ficar sozinho", "ansiedade de separação Spitz"], related: ["chegada", "apartamento", "temperamento"],
  },
  {
    id: "temperamento", cluster: "rotina", href: "/blog/spitz-alemao-anao-temperamento", label: "Temperamento e convivência",
    description: "Características de comportamento e necessidades de interação.",
    queries: ["temperamento Spitz Alemão", "comportamento Lulu da Pomerânia"],
    supportingPaths: ["/blog/spitz-alemao-anao-outros-animais", "/blog/spitz-alemao-anao-idoso-adulto-solo", "/blog/spitz-alemao-anao-exercicios-passeios"], related: ["criancas", "apartamento", "escolher-filhote"],
  },
  {
    id: "escolher-filhote", cluster: "cuidados", href: "/filhote-de-spitz-alemao", label: "Como escolher e receber o filhote",
    description: "Perguntas para o criador e preparação dos primeiros dias.",
    queries: ["como escolher filhote de Spitz Alemão"], related: ["criador", "chegada", "filhotes"],
  },
  {
    id: "chegada", cluster: "cuidados", href: "/guias/preparando-chegada-filhote-spitz", label: "Primeiros dias e enxoval do filhote",
    description: "Prepare os ambientes, os itens essenciais e a adaptação.",
    queries: ["enxoval Spitz Alemão", "primeiros dias Lulu da Pomerânia"],
    supportingPaths: ["/blog/spitz-alemao-anao-filhote-primeiros-dias"], related: ["alimentacao", "cuidados", "custo-mensal"],
  },
  {
    id: "alimentacao", cluster: "cuidados", href: "/guias/spitz-alemao-anao-alimentacao", label: "Alimentação do Spitz Alemão",
    description: "Orientações de rotina para conversar com o médico-veterinário.",
    queries: ["alimentação Spitz Alemão", "ração Lulu da Pomerânia"],
    supportingPaths: ["/blog/alimentacao-spitz-alemao-anao"], related: ["custo-mensal", "chegada", "cuidados"],
  },
  {
    id: "cuidados", cluster: "cuidados", href: "/guias/cuidados-basicos-spitz-alemao-anao", label: "Pelagem, higiene e cuidados básicos",
    description: "Organize escovação, higiene e acompanhamento do cão.",
    queries: ["cuidados Lulu da Pomerânia", "cuidados Spitz Alemão"],
    supportingPaths: ["/blog/cuidados-pelo-spitz-alemao-anao", "/blog/spitz-alemao-anao-dentes"], related: ["alimentacao", "saude", "chegada"],
  },
  {
    id: "saude", cluster: "cuidados", href: "/blog/saude-spitz-alemao-anao", label: "Saúde e acompanhamento veterinário",
    description: "Informações para preparar consultas e acompanhar o desenvolvimento.",
    queries: ["saúde Spitz Alemão", "saúde Lulu da Pomerânia"],
    supportingPaths: ["/blog/vacinas-spitz-alemao-anao-filhote", "/blog/spitz-alemao-anao-peso-desenvolvimento"], related: ["documentacao", "cuidados", "alimentacao"],
  },
  {
    id: "braganca", cluster: "regiao", href: "/lulu-da-pomerania-braganca-paulista", label: "Lulu da Pomerânia em Bragança Paulista",
    description: "Conheça o atendimento na cidade onde fica a By Império Dog.",
    queries: ["Lulu da Pomerânia Bragança Paulista", "Spitz Alemão Bragança Paulista"],
    supportingPaths: ["/blog/spitz-alemao-anao-braganca-paulista"], related: ["interior-sp", "canil", "filhotes"],
  },
  {
    id: "interior-sp", cluster: "regiao", href: "/canil-spitz-alemao-interior-sp", label: "Canil no interior de São Paulo",
    description: "Atendimento a partir de Bragança Paulista para famílias da região.",
    queries: ["canil Spitz Alemão interior SP", "canil Lulu da Pomerânia interior SP"], related: ["braganca", "sao-paulo", "transporte"],
  },
  {
    id: "sao-paulo", cluster: "regiao", href: "/filhotes/sao-paulo", label: "Filhotes para famílias de São Paulo",
    description: "Como consultar opções e organizar retirada ou transporte em SP.",
    queries: ["filhotes Spitz Alemão São Paulo", "Lulu da Pomerânia São Paulo"], related: ["filhotes", "transporte", "preco"],
  },
  {
    id: "minas-gerais", cluster: "regiao", href: "/filhotes/minas-gerais", label: "Atendimento para Minas Gerais",
    description: "Planejamento do transporte de Bragança Paulista para MG.",
    queries: ["filhotes Spitz Alemão Minas Gerais", "Lulu da Pomerânia Minas Gerais"], related: ["transporte", "filhotes", "comprar"],
  },
  {
    id: "rio-de-janeiro", cluster: "regiao", href: "/filhotes/rio-de-janeiro", label: "Atendimento para o Rio de Janeiro",
    description: "Planejamento do transporte de Bragança Paulista para o RJ.",
    queries: ["filhotes Spitz Alemão Rio de Janeiro", "Lulu da Pomerânia Rio de Janeiro"], related: ["transporte", "filhotes", "comprar"],
  },
  {
    id: "transporte", cluster: "regiao", href: "/blog/spitz-alemao-anao-entrega-brasil", label: "Transporte do filhote para outros estados",
    description: "Veja o que combinar sobre trajeto, condições e entrega antes da reserva.",
    queries: ["transporte filhote Spitz Alemão", "entrega Lulu da Pomerânia Brasil"], related: ["comprar", "documentacao", "chegada"],
  },
];

export function topicsForCluster(cluster: SearchCluster): readonly SearchTopic[] {
  return SEARCH_TOPICS.filter((topic) => topic.cluster === cluster);
}

/** Relações editoriais explícitas; URL desconhecida recebe caminhos de apoio. */
export function relatedSearchTopics(path: string, limit = 3): readonly SearchTopic[] {
  const pathname = path.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  const current = SEARCH_TOPICS.find((topic) => topic.href === pathname || topic.supportingPaths?.includes(pathname));
  const ids = [...(current?.related ?? []), "filhotes", "preco", "comprar"];
  const seen = new Set<string>([pathname]);
  return ids.flatMap((id) => {
    const topic = SEARCH_TOPICS.find((candidate) => candidate.id === id);
    if (!topic || seen.has(topic.href)) return [];
    seen.add(topic.href);
    return [topic];
  }).slice(0, Math.max(0, limit));
}
