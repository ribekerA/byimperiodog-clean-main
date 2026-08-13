// AUTO-GERADO por scripts/gen-lastmod.mjs — NAO EDITAR A MAO.
// Rode `npm run gen:lastmod` depois de alterar conteudo de pagina.
//
// Data do ultimo commit que mexeu em cada rota (arquivo da pagina + os arquivos
// de conteudo que ela importa). E o que alimenta <lastmod> no sitemap, no lugar
// do timestamp do build, que dizia ao Google que o site inteiro mudava a cada
// deploy. Chaves iniciadas por @ sao grupos dinamicos do catalogo.
export const LASTMOD: Record<string, string> = {
  "/": "2026-08-13T00:46:25.000Z",
  "/alimentacao": "2026-08-13T00:34:45.000Z",
  "/blog": "2026-08-12T23:03:34.000Z",
  "/canil-spitz-alemao-interior-sp": "2026-08-13T00:34:45.000Z",
  "/comprar-spitz-anao": "2026-08-12T23:03:34.000Z",
  "/contato": "2026-08-12T23:03:34.000Z",
  "/criador-spitz-confiavel": "2026-08-12T23:03:34.000Z",
  "/cuidados": "2026-08-13T00:34:45.000Z",
  "/faq-do-tutor": "2026-08-12T23:03:34.000Z",
  "/filhote-de-spitz-alemao": "2026-08-13T00:34:45.000Z",
  "/filhotes": "2026-08-13T00:34:45.000Z",
  "/filhotes/minas-gerais": "2026-08-13T00:51:34.000Z",
  "/filhotes/rio-de-janeiro": "2026-08-13T00:51:34.000Z",
  "/filhotes/sao-paulo": "2026-08-13T00:51:34.000Z",
  "/galeria": "2026-08-13T00:34:45.000Z",
  "/guias": "2026-08-13T00:34:45.000Z",
  "/lulu-da-pomerania": "2026-08-12T23:03:34.000Z",
  "/lulu-da-pomerania-braganca-paulista": "2026-08-13T00:34:45.000Z",
  "/ninhadas": "2026-08-12T23:03:34.000Z",
  "/obrigado": "2026-08-06T23:01:39.000Z",
  "/politica-de-privacidade": "2026-08-12T23:03:34.000Z",
  "/politica-editorial": "2026-08-07T00:13:17.000Z",
  "/pomeranian": "2026-08-12T23:03:34.000Z",
  "/preco-spitz-anao": "2026-08-13T00:34:45.000Z",
  "/reserve-seu-filhote": "2026-08-12T23:03:34.000Z",
  "/search": "2026-08-06T23:01:39.000Z",
  "/sobre": "2026-08-13T00:34:45.000Z",
  "/spitz-alemao": "2026-08-13T00:34:45.000Z",
  "/spitz-alemao-baby-face": "2026-08-13T00:34:45.000Z",
  "/spitz-alemao-preto": "2026-08-12T23:03:34.000Z",
  "/temperamento": "2026-08-13T00:34:45.000Z",
  "/termos-de-uso": "2026-08-12T23:03:34.000Z",
  "@color": "2026-08-12T23:03:34.000Z",
  "@puppy": "2026-08-12T23:03:34.000Z",
  "@sex": "2026-08-12T23:03:34.000Z",
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
