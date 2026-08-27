// AUTO-GERADO por scripts/gen-lastmod.mjs — NAO EDITAR A MAO.
// Rode `npm run gen:lastmod` depois de alterar conteudo de pagina.
//
// Data do ultimo commit que mexeu em cada rota (arquivo da pagina + os arquivos
// de conteudo que ela importa). E o que alimenta <lastmod> no sitemap, no lugar
// do timestamp do build, que dizia ao Google que o site inteiro mudava a cada
// deploy. Chaves iniciadas por @ sao grupos dinamicos do catalogo.
export const LASTMOD: Record<string, string> = {
  "/": "2026-08-27T21:34:49.000Z",
  "/alimentacao": "2026-08-27T04:39:09.000Z",
  "/blog": "2026-08-27T04:39:09.000Z",
  "/canil-spitz-alemao-interior-sp": "2026-08-27T04:39:09.000Z",
  "/comprar-spitz-anao": "2026-08-27T04:39:09.000Z",
  "/contato": "2026-08-27T10:51:51.000Z",
  "/criador-spitz-confiavel": "2026-08-27T10:51:51.000Z",
  "/cuidados": "2026-08-27T04:39:09.000Z",
  "/faq-do-tutor": "2026-08-26T18:30:10.000Z",
  "/filhote-de-spitz-alemao": "2026-08-27T04:39:09.000Z",
  "/filhotes": "2026-08-27T21:34:49.000Z",
  "/filhotes/minas-gerais": "2026-08-27T21:34:49.000Z",
  "/filhotes/rio-de-janeiro": "2026-08-27T21:34:49.000Z",
  "/filhotes/sao-paulo": "2026-08-27T21:34:49.000Z",
  "/galeria": "2026-08-27T21:34:49.000Z",
  "/guias": "2026-08-27T04:39:09.000Z",
  "/lulu-da-pomerania": "2026-08-27T21:34:49.000Z",
  "/lulu-da-pomerania-braganca-paulista": "2026-08-27T04:39:09.000Z",
  "/ninhadas": "2026-08-27T21:34:49.000Z",
  "/obrigado": "2026-08-22T12:00:02.000Z",
  "/politica-de-privacidade": "2026-08-27T04:39:09.000Z",
  "/politica-editorial": "2026-08-26T18:30:10.000Z",
  "/pomeranian": "2026-08-27T21:34:49.000Z",
  "/preco-spitz-anao": "2026-08-27T21:34:49.000Z",
  "/reserve-seu-filhote": "2026-08-27T10:51:51.000Z",
  "/search": "2026-08-23T09:38:25.000Z",
  "/sobre": "2026-08-27T10:51:51.000Z",
  "/spitz-alemao": "2026-08-27T04:39:09.000Z",
  "/spitz-alemao-baby-face": "2026-08-27T04:39:09.000Z",
  "/spitz-alemao-branco": "2026-08-26T18:30:10.000Z",
  "/spitz-alemao-preto": "2026-08-27T21:34:49.000Z",
  "/temperamento": "2026-08-27T04:39:09.000Z",
  "/termos-de-uso": "2026-08-22T12:00:02.000Z",
  "@color": "2026-08-27T21:34:49.000Z",
  "@puppy": "2026-08-27T21:34:49.000Z",
  "@sex": "2026-08-27T21:34:49.000Z",
} as const;

/**
 * Data de alteracao real da rota, ou undefined quando nao ha registro.
 * Devolver undefined e proposital: <lastmod> e opcional no protocolo de sitemap,
 * e omitir e melhor do que declarar uma data inventada.
 */
export function lastmodFor(rota: string): string | undefined {
  return LASTMOD[rota];
}

/** Maior data do conjunto — usada no lastmod do indice de sitemaps. */
export function maxLastmod(datas: Array<string | undefined>): string | undefined {
  let maior: string | undefined;
  for (const d of datas) {
    if (!d) continue;
    if (!maior || d > maior) maior = d;
  }
  return maior;
}

// Data do commit que CRIOU o arquivo de cada rota. Substitui os
// `datePublished: "2025-01-01"` escritos a mao em onze paginas, que nao tinham
// nenhuma evidencia por tras — nem no git, nem no Internet Archive — e ainda
// ANTECIPAVAM a data, fingindo conteudo mais antigo e estabelecido do que se
// pode provar.
//
// O que esta data afirma, e so isso: a pagina existe neste repositorio desde
// entao. Se o site rodou antes em outro repositorio, a data verdadeira e mais
// antiga e esta aqui subestima — que e o lado seguro de errar.
export const FIRSTPUB: Record<string, string> = {
  "/": "2026-05-25T17:36:50.000Z",
  "/alimentacao": "2026-08-06T23:01:39.000Z",
  "/blog": "2026-05-25T17:36:50.000Z",
  "/canil-spitz-alemao-interior-sp": "2026-05-25T17:36:50.000Z",
  "/comprar-spitz-anao": "2026-05-25T17:36:50.000Z",
  "/contato": "2026-05-25T17:36:50.000Z",
  "/criador-spitz-confiavel": "2026-05-25T17:36:50.000Z",
  "/cuidados": "2026-08-06T23:01:39.000Z",
  "/faq-do-tutor": "2026-05-25T17:36:50.000Z",
  "/filhote-de-spitz-alemao": "2026-05-25T17:36:50.000Z",
  "/filhotes": "2026-05-25T17:36:50.000Z",
  "/filhotes/minas-gerais": "2026-05-25T17:36:50.000Z",
  "/filhotes/rio-de-janeiro": "2026-05-25T17:36:50.000Z",
  "/filhotes/sao-paulo": "2026-05-25T17:36:50.000Z",
  "/galeria": "2026-05-26T19:14:48.000Z",
  "/guias": "2026-05-25T17:36:50.000Z",
  "/lulu-da-pomerania": "2026-05-25T17:36:50.000Z",
  "/lulu-da-pomerania-braganca-paulista": "2026-05-25T17:36:50.000Z",
  "/ninhadas": "2026-08-06T23:01:39.000Z",
  "/obrigado": "2026-05-25T17:36:50.000Z",
  "/politica-de-privacidade": "2026-05-25T17:36:50.000Z",
  "/politica-editorial": "2026-05-25T17:36:50.000Z",
  "/pomeranian": "2026-05-27T14:52:51.000Z",
  "/preco-spitz-anao": "2026-05-25T17:36:50.000Z",
  "/reserve-seu-filhote": "2026-05-25T17:36:50.000Z",
  "/search": "2026-05-25T17:36:50.000Z",
  "/sobre": "2026-05-25T17:36:50.000Z",
  "/spitz-alemao": "2026-05-25T17:36:50.000Z",
  "/spitz-alemao-baby-face": "2026-05-25T17:36:50.000Z",
  "/spitz-alemao-branco": "2026-08-20T06:45:18.000Z",
  "/spitz-alemao-preto": "2026-05-25T17:36:50.000Z",
  "/temperamento": "2026-08-06T23:01:39.000Z",
  "/termos-de-uso": "2026-05-25T17:36:50.000Z",
} as const;

/**
 * Data de publicacao da rota, ou undefined quando o git nao sabe responder.
 * Undefined e proposital, pela mesma razao de `lastmodFor`: no JSON-LD, omitir
 * `datePublished` e melhor do que declarar uma data inventada.
 */
export function firstPubFor(rota: string): string | undefined {
  return FIRSTPUB[rota];
}
