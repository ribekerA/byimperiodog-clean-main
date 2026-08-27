/**
 * @module domain/public-truth
 * @description Matriz de verdade pública da By Império Dog — o que o site pode
 * afirmar sobre o próprio negócio, e o que não pode até existir evidência.
 *
 * Por que este arquivo existe
 * ---------------------------
 * As correções de conteúdo das últimas rodadas foram todas feitas a mão, texto
 * por texto. Funcionaram, e nenhuma delas sobrevive sozinha: basta um artigo
 * novo, um card novo ou um template do WhatsApp para "laudo dos pais" voltar ao
 * ar sem que ninguém perceba. Corrigir sem guarda é limpar a mesa antes do
 * jantar.
 *
 * Aqui a regra passa a ter endereço. Um lugar diz o que é verdade, outro
 * (scripts/public-truth-guard.mts, no prebuild) confere o repositório inteiro
 * contra ela e derruba o build quando um texto novo promete o que o canil não
 * confirmou.
 *
 * A distinção que sustenta tudo
 * -----------------------------
 * Não se proíbe PALAVRA, se proíbe AFIRMAÇÃO DO NEGÓCIO.
 *
 * Um artigo educativo pode — e deve — explicar o que é luxação de patela, para
 * que serve um laudo veterinário ou por que microchip é útil. Isso é conteúdo
 * de valor, e um guard que apague a palavra "patela" do site empobrece o texto
 * sem tornar nada mais verdadeiro.
 *
 * O que não pode é a By Império Dog dizer que ENTREGA, FAZ ou POSSUI algo que
 * não está na lista confirmada. Por isso a maior parte das regras abaixo tem
 * escopo `primeira-pessoa`: elas só disparam quando a mesma frase também diz
 * que somos nós.
 */

export type StatusDaAfirmacao =
  /** Confirmado pelo canil. Pode ser publicado como é. */
  | "CONFIRMADO"
  /** Verdadeiro sob condição — só pode ir ao ar com a condição junto. */
  | "CONDICIONAL"
  /** Não pode ser publicado enquanto não houver evidência. */
  | "PROIBIDO_SEM_EVIDENCIA"
  /** Depende de decisão jurídica/contratual — ninguém aqui decide. */
  | "REVISAO_JURIDICA"
  /** Depende de revisão de médico-veterinário responsável. */
  | "REVISAO_VETERINARIA";

export type FatoPublico = {
  id: string;
  status: StatusDaAfirmacao;
  /** Como o site pode escrever. */
  texto: string;
  /** O que sustenta, ou o que falta para sustentar. */
  nota?: string;
};

/**
 * O que o canil confirmou. Tudo o que a comunicação pública afirmar sobre o
 * negócio precisa caber aqui dentro.
 */
export const FATOS_PUBLICOS: readonly FatoPublico[] = [
  { id: "marca", status: "CONFIRMADO", texto: "By Império Dog" },
  { id: "base", status: "CONFIRMADO", texto: "Bragança Paulista, São Paulo" },
  {
    id: "inicio",
    status: "CONFIRMADO",
    texto: "Atuação desde 2013",
    nota: "O ano vive em domain/config (FOUNDING_YEAR) e é calculado, nunca escrito por extenso.",
  },
  {
    id: "raca",
    status: "CONFIRMADO",
    texto: "Spitz Alemão Anão, também chamado de Lulu da Pomerânia",
  },
  {
    id: "entrega",
    status: "CONFIRMADO",
    texto:
      "A entrega inclui vacinação conforme a idade, vermifugação, consulta veterinária antes da entrega, hemograma completo, pedigree/registro oficial e contrato",
    nota: "Esta é a lista fechada. O que não está aqui não é 'incluso'.",
  },
  {
    id: "pedigree",
    status: "CONDICIONAL",
    texto:
      "Pedigree emitido pela CBKC ou por clube filiado à FCI, conforme os prazos e as condições da entidade",
    nota: "A condição é parte da afirmação: sem ela vira promessa de prazo.",
  },
  {
    id: "identificacao",
    status: "CONDICIONAL",
    texto: "A identificação do animal segue os requisitos exigidos pela legislação aplicável",
    nota: "Frase exata acordada. Não desdobrar em microchip, tatuagem ou 'rastreável'.",
  },
  {
    id: "padrao",
    status: "CONFIRMADO",
    texto: "Padrão FCI de 21 cm ± 3 cm, com peso proporcional ao tamanho",
    nota: "Peso em quilos não é número oficial da FCI e não deve ser publicado como se fosse.",
  },
  {
    id: "pos-venda",
    status: "CONFIRMADO",
    texto: "Suporte pós-venda ativo pelo WhatsApp, direto com a criadora",
    nota: "Sem prazo. 'Vitalício' é promessa contratual que ninguém assinou.",
  },
  {
    id: "visitas",
    status: "CONDICIONAL",
    texto: "Visitas e videochamadas são combinadas caso a caso com a criadora",
    nota: "Nunca como direito universal, nunca com dia fixo.",
  },
  {
    id: "transporte",
    status: "CONDICIONAL",
    texto:
      "Orientação sobre transporte seguro; o tutor busca em Bragança Paulista ou contrata transportadora especializada, por conta dele",
    nota: "Sem empresa parceira, sem prazo fixo, sem frete grátis.",
  },
  {
    id: "contrato",
    status: "REVISAO_JURIDICA",
    texto: "Contrato de compra e venda",
    nota:
      "Prazos de garantia, devolução, substituição e foro são decisão jurídica. Ver CONTRACT_LEGAL_BLOCKERS.md.",
  },
  {
    id: "saude-editorial",
    status: "REVISAO_VETERINARIA",
    texto: "Conteúdo educativo sobre saúde da raça",
    nota:
      "Pode explicar; não pode prescrever, nem assinar como se o negócio tivesse formação veterinária.",
  },
];

/**
 * Quando a frase é sobre NÓS.
 *
 * É este marcador que separa "o que é um laudo de patela" (artigo) de "nossos
 * filhotes têm laudo de patela" (promessa). Vale a frase inteira: se qualquer
 * um destes aparecer no mesmo período da expressão vigiada, a regra de escopo
 * `primeira-pessoa` dispara.
 */
export const MARCADORES_DE_PRIMEIRA_PESSOA =
  /\b(somos|nosso|nossos|nossa|nossas|entrevistamos|selecionamos|entregamos|oferecemos|fornecemos|realizamos|fazemos|possuímos|possuimos|temos|criamos|trabalhamos|acompanha|acompanham|inclus[oa]|inclusos|inclusas|incluído|incluido|incluídos|incluidos|inclui|incluem|todos os filhotes|cada filhote|o filhote (sai|vai|chega)|saem com|sai com|vem com|vêm com|vao com|aqui na by|by império dog|by imperio dog)\b/i;

/**
 * Quando a frase PROÍBE em vez de afirmar.
 *
 * O prompt do matchmaker (app/api/matchmaker/route.ts) é um regulamento: ele
 * lista o que a assistente nunca pode dizer, e para isso precisa escrever as
 * frases proibidas. Um guard que leia "Nunca prometa microchip incluso" como
 * uma promessa de microchip acusa exatamente o texto que impede a promessa.
 *
 * A lista de verbos é curta de propósito. Casa com meta-instrução ("nunca
 * diga", "não prometa", "são proibidas") e não com negação comum — "nossos
 * filhotes nunca saem sem laudo" continua sendo pego, porque "saem" não está
 * aqui. Negação genérica seria porta dos fundos; meta-instrução é a exceção
 * real.
 */
export const MARCADORES_DE_PROIBICAO =
  /\b(nunca|jamais|n[ãa]o)\s+(diga|prometa|afirme|invente|cite|use|escreva|mencione|descreva|atribua|garanta)\b|\b(s[ãa]o|est[ãa]o|é|e)\s+proibid[ao]s?\b|\bproibid[ao]s?\s+em\s+qualquer\b/i;

export type EscopoDaRegra =
  /** Vale em qualquer texto do repositório. */
  | "sempre"
  /** Só vale quando a frase também afirma que somos nós. */
  | "primeira-pessoa";

export type RegraDeVerdade = {
  id: string;
  status: StatusDaAfirmacao;
  escopo: EscopoDaRegra;
  padrao: RegExp;
  /** Por que não pode. */
  motivo: string;
  /** O que dá para dizer no lugar. */
  alternativa?: string;
};

/**
 * As regras.
 *
 * Cada `padrao` roda sem a flag `g` de propósito: quem varre é
 * {@link verificarTexto}, frase a frase, e um lastIndex compartilhado entre
 * chamadas é a maneira clássica de um guard passar a pular ocorrência.
 */
export const REGRAS_DE_VERDADE: readonly RegraDeVerdade[] = [
  {
    id: "laudo-entregue",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "primeira-pessoa",
    padrao: /\blaudos?\b/i,
    motivo:
      "Laudo não está na lista de entrega confirmada. O que existe é consulta veterinária e hemograma completo.",
    alternativa: "consulta veterinária e hemograma completo antes da entrega",
  },
  {
    id: "exame-de-patela",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "sempre",
    padrao: /\b(teste|exame|avalia[cç][aã]o|raio-?x|radiografia)s?\s+(de\s+)?patela|\bpatelas?\s+(testad|avaliad|examinad)/i,
    motivo:
      "Exame ortopédico de patela dos filhotes ou dos pais não foi confirmado. Explicar a doença é conteúdo; afirmar o exame é promessa.",
    alternativa: "explicar o que é luxação de patela, sem dizer que o canil testa",
  },
  {
    id: "microchip-incluso",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "primeira-pessoa",
    padrao: /\b(microchip|micro-?chip|chipad[oa])\b/i,
    motivo: "Nenhum filhote da vitrine tem microchip incluso (hasMicrochip: false).",
    alternativa: "a identificação do animal segue os requisitos exigidos pela legislação aplicável",
  },
  {
    id: "nota-fiscal-inclusa",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "primeira-pessoa",
    padrao: /\bnota\s+fiscal\b/i,
    motivo: "Emissão de nota fiscal na entrega não foi confirmada como item incluso.",
    alternativa: "contrato de compra e venda",
  },
  {
    id: "estrutura-fisica",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "sempre",
    padrao:
      /\bmaternidade\s+climatizada|\bc[âa]meras?\s+(24h|de\s+monitoramento|ao\s+vivo)|\bcanil\s+climatizado|\bnascem\s+dentro\s+da\s+resid[êe]ncia/i,
    motivo: "Estrutura física do canil não foi confirmada e não é publicada.",
  },
  {
    id: "rede-de-parceiros",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "sempre",
    padrao:
      /\b(groomer|comportamentalista|adestrador)(e?s)?\s+(parceir|da\s+rede)|\b(transportadora|motorista)\s+parceir/i,
    motivo: "Não há rede de parceiros contratada. O canil orienta, não encaminha para parceiro.",
  },
  {
    id: "selecao-de-familias",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "sempre",
    // "Entrevista" só aparece neste site como etapa de um processo de seleção
    // que não existe. Se um dia um artigo educativo precisar da palavra em
    // outro sentido — "entreviste o criador antes de comprar" —, o lugar de
    // liberar é a lista EXCECOES do guard, com motivo escrito.
    padrao:
      /\bentrevistas?\b|\bentrevistamos\b|\btriagem\s+(de|das|com)\b|\bselecionamos\s+(cada\s+)?(fam[íi]lia|as\s+fam[íi]lias)|\bsele[cç][aã]o\s+(de|das|com)\s+fam[íi]lias|\bfam[íi]lias\s+selecionadas\b/i,
    motivo:
      "Não existe etapa formal de entrevista ou seleção de famílias. O que existe é conversa pelo WhatsApp com a criadora.",
    alternativa: "conversa e alinhamento com a criadora antes da reserva",
  },
  {
    id: "numeros-sem-fonte",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "sempre",
    padrao:
      /\b\d{2,4}\s+(fam[íi]lias|avalia[cç][õo]es|clientes\s+satisfeitos)|\bnota\s+5[.,]0\b|\b5[.,]0\s+estrelas\b/i,
    motivo:
      "Contagem de famílias, de avaliações e nota média precisam de fonte auditável. Não existe uma.",
  },
  {
    id: "superlativo",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "primeira-pessoa",
    padrao:
      /\b(o\s+melhor\s+canil|melhor\s+canil\s+d[oae]|refer[êe]ncia\s+nacional|n[úu]mero\s+1|#1\b|100%\s+(de\s+)?(garantia|satisfa[cç][aã]o|saud[áa]vel|puro))/i,
    motivo: "Superlativo comparativo sobre o próprio negócio não é verificável.",
  },
  {
    id: "vitalicio",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "sempre",
    padrao: /\b(mentoria|suporte|acompanhamento|assist[êe]ncia|garantia)\s+vital[íi]cia?o?\b|\bvital[íi]ci[oa]\b/i,
    motivo: "Compromisso sem prazo final é obrigação contratual que ninguém assinou.",
    alternativa: "suporte pós-venda pelo WhatsApp, direto com a criadora",
  },
  {
    id: "garantia-de-saude",
    status: "REVISAO_JURIDICA",
    escopo: "primeira-pessoa",
    padrao:
      /\bgarantia\s+(de\s+)?(sa[úu]de|gen[ée]tica|heredit[áa]ria)|\bgarantimos\s+(a\s+)?sa[úu]de|\b(devolu[cç][aã]o|substitui[cç][aã]o)\s+(do\s+filhote|garantida)/i,
    motivo:
      "Garantia, devolução e substituição são cláusulas contratuais. Ver CONTRACT_LEGAL_BLOCKERS.md.",
  },
  {
    id: "frete-gratis",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "sempre",
    padrao: /\b(frete|entrega|transporte)\s+(gr[áa]tis|gratuit[oa]|sem\s+custo|por\s+nossa\s+conta)/i,
    motivo: "O transporte é por conta do comprador.",
  },
  {
    id: "prazo-de-entrega-fixo",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "primeira-pessoa",
    padrao:
      /\b(entregamos|entrega|chega|viaja|sai)\s+(em|com|ap[óo]s)\s+(at[ée]\s+)?\d+\s*(dias|semanas|horas)\b|\bem\s+at[ée]\s+\d+\s*(dias|horas)\s+(o\s+filhote|na\s+sua\s+casa)/i,
    motivo:
      "Prazo de transporte e idade de entrega dependem do animal, do veterinário e da transportadora.",
  },
  {
    id: "urgencia-fabricada",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "sempre",
    padrao:
      /[úu]ltim[oa]\s+(desta|dessa|da)\s+(cor|ninhada)|\brestam?\s+(apenas\s+)?\d+\s+(filhotes?|vagas?|unidades?)|\bquase\s+vendid|\b\d+\s+pessoas?\s+(vendo|visualizando)|\bdisponibilidade\s+limitada|\bvagas\s+limitadas|\b[úu]ltimas?\s+vagas/i,
    motivo:
      "O site não publica estoque: a vitrine é permanente e a disponibilidade real só existe no atendimento. Pressa fabricada é o oposto do que a página promete.",
  },
  {
    id: "procura-como-justificativa",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "sempre",
    // A segunda alternativa é estreita de propósito. "Uma das raças de pequeno
    // porte mais procuradas do Brasil" é afirmação sobre a RAÇA, defensável e
    // hedgeada; o que não se sustenta é atribuir procura a uma cor ou a um
    // sexo do nosso catálogo — foi assim que a fêmea ganhou selo de "Maior
    // procura" e uma diferença de preço "por conta da maior procura".
    padrao:
      /\b(maior|alta|grande)\s+procura\b|\b(cor|cores|sexo|f[êe]mea|f[êe]meas|macho|machos|combina[cç][ãa]o)\w*\s+mais\s+procurad[oa]s?\b/i,
    motivo:
      "Demanda de mercado nunca foi medida aqui, e preço publicado não precisa de justificativa inventada.",
  },
  {
    id: "entrega-como-servico-proprio",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "sempre",
    padrao:
      /\b(fazemos|realizamos)\s+(a\s+)?entregas?\b|\bentregamos\s+(em|para)\b|\btransporte\s+humanizado\b|\bnunca\s+viaja\s+sozinh[oa]\b|\ba\s+entrega\s+[ée]\s+segura\b|\bentrega\s+humanizada\b/i,
    motivo:
      "O canil não opera transporte. O tutor retira em Bragança Paulista ou contrata transporte especializado, e ninguém aqui pode garantir a segurança de um trajeto que não conduz.",
    alternativa:
      "o tutor pode retirar o filhote em Bragança Paulista ou consultar opções de transporte especializado, definidas conforme destino, idade e condições do filhote",
  },
  {
    id: "ano-errado",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "primeira-pessoa",
    padrao: /\b(desde|em)\s+2012\b|\b2012\s*[-–]\s*(hoje|atual)/i,
    motivo: "O ano de início confirmado é 2013, e ele vive em domain/config.",
  },
  {
    id: "crianca-como-garantia",
    status: "PROIBIDO_SEM_EVIDENCIA",
    escopo: "primeira-pessoa",
    padrao:
      /\b(excelentes?|ideal|ideais|perfeitos?|[óo]timos?)\s+(para\s+)?(fam[íi]lias\s+com\s+)?crian[cç]as|\b(convivem|convivência)\s+com\s+crian[cç]as\b/i,
    motivo:
      "Comportamento com crianças depende do animal e da casa. Prometer adequação é o tipo de frase que volta como reclamação.",
  },
];

export type Violacao = {
  regra: RegraDeVerdade;
  /** Período onde a expressão apareceu, já normalizado. */
  trecho: string;
};

/** Divide em períodos. Frase é a unidade de contexto: é nela que "nosso" vale. */
function emFrases(texto: string): string[] {
  return texto
    .split(/(?<=[.!?;:])\s+|\n{2,}|\r?\n/)
    .map((f) => f.trim())
    .filter(Boolean);
}

/**
 * Confere um texto contra a matriz.
 *
 * Recebe texto já limpo de comentário de código — quem varre arquivo é o
 * script, e comentário que DOCUMENTA a remoção de uma frase não pode ser
 * confundido com a frase de volta. Este módulo não sabe ler arquivo de
 * propósito: é assim que ele fica testável nos dois sentidos.
 */
export function verificarTexto(texto: string): Violacao[] {
  const achados: Violacao[] = [];

  for (const frase of emFrases(texto)) {
    // Regulamento não é promessa: a frase que proíbe precisa citar o que
    // proíbe, e acusá-la seria derrubar o build por causa da própria regra.
    if (MARCADORES_DE_PROIBICAO.test(frase)) continue;

    const primeiraPessoa = MARCADORES_DE_PRIMEIRA_PESSOA.test(frase);

    for (const regra of REGRAS_DE_VERDADE) {
      if (regra.escopo === "primeira-pessoa" && !primeiraPessoa) continue;
      if (!regra.padrao.test(frase)) continue;
      achados.push({ regra, trecho: frase.length > 200 ? `${frase.slice(0, 197)}...` : frase });
    }
  }

  return achados;
}
