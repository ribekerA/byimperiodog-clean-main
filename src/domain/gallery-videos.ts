// Registro unico dos videos da galeria publica.
//
// Antes isso vivia dentro de app/(public)/galeria/page.tsx como um array solto
// com src/title/description/category. Faltava tudo que da identidade estavel a
// um video: id proprio, poster proprio e data de publicacao. O resultado era um
// JSON-LD em que os doze VideoObject apontavam para o mesmo thumbnailUrl (um
// /og-image.jpg que nem existe) e declaravam a mesma uploadDate inventada.
//
// Com o registro aqui, a pagina, o sitemap de videos e o botao de curtida leem
// a mesma fonte -- e o id semantico (`gallery:spitz-branco`) e o mesmo em todos
// os tres.
//
// As medidas reais (largura, altura, duracao) ficam em video-medidas.json,
// gerado por scripts/gen-video-posters.mjs a partir dos proprios arquivos. Nada
// ali e digitado a mao.

import medidas from "./video-medidas.json";

/** Data do primeiro lote de videos. Vem do historico do git
 *  (`git log --diff-filter=A` aponta 2026-05-25 para os arquivos que ja
 *  estavam em public/filhotes/videos), nao de estimativa. E a data de upload
 *  de fato: o dia em que o material passou a ser servido por
 *  byimperiodog.com.br.
 *
 *  Continua sendo o padrao de quem nao declara data propria. Video que entra
 *  depois declara a sua em `definir(...)` — herdar 2026-05-25 seria dizer ao
 *  Google que um arquivo de agosto esta no ar desde maio, que e exatamente o
 *  tipo de data inventada que fez este arquivo existir. */
export const VIDEO_UPLOAD_DATE = "2026-05-25";

export type GalleryVideoCategory = "canil" | "creme" | "laranja" | "branco" | "ninhada" | "raça";

export type GalleryVideo = {
  /** Id semantico e estavel, compartilhado com o sistema de curtidas. */
  readonly id: string;
  readonly slug: string;
  readonly src: string;
  readonly poster: string;
  readonly title: string;
  readonly description: string;
  readonly category: GalleryVideoCategory;
  /** Dia em que o arquivo passou a ser servido pelo site. */
  readonly uploadDate: string;
};

function definir(
  slug: string,
  title: string,
  description: string,
  category: GalleryVideoCategory,
  uploadDate: string = VIDEO_UPLOAD_DATE
): GalleryVideo {
  return {
    id: `gallery:${slug}`,
    slug,
    src: `/filhotes/videos/${slug}.mp4`,
    poster: `/filhotes/videos/posters/${slug}.webp`,
    title,
    description,
    category,
    uploadDate,
  };
}

// As descricoes descrevem o que aparece na tela. As versoes anteriores
// afirmavam coisa que nenhum video prova -- "cheia de personalidade e saude",
// "uma das cores mais cobicadas da raca", "veja como sao criados desde os
// primeiros dias". Saude nao se declara em legenda, raridade de cor nao tem
// fonte e a terceira dava a entender um acompanhamento de criacao que o video
// nao mostra.
export const GALLERY_VIDEOS: readonly GalleryVideo[] = [
  definir("apresentacao-canil", "Apresentação do Canil", "Vídeo de apresentação da By Império Dog.", "canil"),
  definir("creme-dupla", "Dupla Creme", "Dois Spitz creme juntos — pura fofura em dobro.", "creme"),
  definir("laranja-femea-jardim", "Fêmea Laranja no Jardim", "Spitz laranja fêmea explorando o jardim.", "laranja"),
  // Entrou com o lote de 26/08/2026, junto das fotos de
  // lulu-pomerania-laranja-macho-01. Data real de entrada no repositorio,
  // conferida no git log do proprio .mp4 -- por isso nao usa VIDEO_UPLOAD_DATE.
  definir("laranja-macho-gramado", "Macho Laranja no Gramado", "Spitz Alemão Anão laranja macho no gramado, filmado em luz natural.", "laranja", "2026-08-26"),
  definir("laranja-macho-jardim", "Macho Laranja no Jardim", "Spitz laranja macho brincando no espaço externo.", "laranja"),
  definir("ninhada-creme-01", "Ninhada Creme", "Uma ninhada inteira de Spitz creme.", "ninhada"),
  definir("ninhada-jun22-01", "Ninhada Junho 2022 — Vol. 1", "Ninhada de junho de 2022.", "ninhada"),
  definir("ninhada-jun22-02", "Ninhada Junho 2022 — Vol. 2", "Continuação da ninhada de junho de 2022.", "ninhada"),
  definir("ninhada-laranja-01", "Ninhada Laranja", "Ninhada com filhotes laranja.", "ninhada"),
  definir("spitz-anao", "Spitz Alemão Anão", "Spitz Alemão Anão em movimento.", "raça"),
  definir("spitz-branco", "Spitz Branco", "Spitz Alemão Anão branco em movimento.", "branco"),
  definir("spitz-creme", "Spitz Creme", "Spitz Alemão Anão creme em movimento.", "creme"),
  definir("spitz-laranja-macho", "Spitz Laranja Macho", "Spitz Alemão Anão laranja macho em movimento.", "laranja"),
  // O video da femea branca (spitz-femea-branco.mp4) estava aqui e saiu: o
  // arquivo desapareceu de public/filhotes/videos/ antes do commit e nao existe
  // em nenhum outro lugar do disco. Registro sem arquivo = <video:content_loc>
  // apontando para 404 no sitemap e player quebrado na pagina. Assim que o
  // arquivo voltar para public/filhotes/videos/spitz-femea-branco.mp4, basta
  // rodar `npm run gen:video-posters` e devolver a linha abaixo:
  //   definir("spitz-femea-branco", "Fêmea Branca no Gramado",
  //     "Spitz Alemão Anão branco fêmea andando pelo gramado, ao lado de outro
  //      filhote branco.", "branco", "<data real de entrada>"),
  // e reincluir "/filhotes/videos/spitz-femea-branco.mp4" nas imagens de
  // spitz-branco-femea-01 em content/puppies-static.ts.
] as const;

/** Data do video mais recente. O sitemap-index usa isto como lastmod do
 *  sitemap de videos — fixar VIDEO_UPLOAD_DATE ali deixava o arquivo dizendo
 *  "maio" no dia em que um video de agosto entrava nele. */
export const ULTIMO_VIDEO_UPLOAD_DATE: string = GALLERY_VIDEOS.reduce(
  (maior, video) => (video.uploadDate > maior ? video.uploadDate : maior),
  VIDEO_UPLOAD_DATE
);

export type VideoMedida = { width: number; height: number; duration: string };

/** Medidas lidas do arquivo. Devolve undefined enquanto o poster do video ainda
 *  nao tiver sido gerado -- quem consome decide se omite o campo no schema. */
export function medidaDoVideo(slug: string): VideoMedida | undefined {
  return (medidas as Record<string, VideoMedida>)[slug];
}
