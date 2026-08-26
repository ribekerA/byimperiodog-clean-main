/**
 * Registro central da midia que pode receber curtida.
 *
 * Por que existe: a curtida precisa de um identificador que sobreviva a
 * reordenacao. Guardar "foto 3 do filhote branco" quebra no dia em que a
 * responsavel troca a capa no admin -- a curtida da foto do colo passaria a
 * contar para a foto do jardim. O que nao muda quando a ordem muda e o
 * ARQUIVO, e o nome do arquivo neste projeto ja e semantico
 * (`branco-femea-jardim-01.jpg`). Entao o id sai do caminho do arquivo, nao
 * do indice do array.
 *
 * Duas familias de id:
 *
 *   gallery:<slug>   -> video. `/filhotes/videos/spitz-branco.mp4`
 *                       vira `gallery:spitz-branco`.
 *   foto:<caminho>   -> imagem, sem a barra inicial e sem a extensao.
 *                       `/filhotes/branco/branco-femea-jardim-01.jpg`
 *                       vira `foto:filhotes/branco/branco-femea-jardim-01`.
 *
 * O prefixo `gallery:` cobre TODO video do site porque todos moram em
 * `/filhotes/videos/` -- e e exatamente isso que faz o card da /galeria e o
 * slide do player de filhote compartilharem a mesma contagem: e o mesmo
 * arquivo, entao e a mesma midia. Quem curtiu no card ve o Reel ja curtido.
 *
 * O registro NAO duplica dado: ele deriva de `staticPuppies` (o catalogo) e de
 * `GALLERY_VIDEOS` (a galeria). Nao ha lista de midia escrita a mao aqui.
 * Quando uma foto entra no catalogo, ela entra neste registro junto.
 *
 * Serve tambem de porteiro: a API so aceita curtida em id que exista aqui
 * (§31). Sem isso qualquer um poderia inflar a tabela com id inventado.
 */

import { staticPuppies } from "@/content/puppies-static";
import { GALLERY_VIDEOS } from "@/domain/gallery-videos";

export type MediaTipo = "image" | "video";
export type MediaContextoTipo = "puppy" | "gallery";

export type MidiaRegistrada = {
  /** Id estavel usado na tabela `media_likes` e na API. */
  readonly mediaId: string;
  readonly mediaType: MediaTipo;
  /** Caminho publico do arquivo, como aparece no `src` da pagina. */
  readonly src: string;
  /** Capa do video. Imagem nao tem — ela e a propria capa. */
  readonly poster?: string;
  /** Titulo legivel, para o painel do admin. */
  readonly titulo: string;
  readonly contextType: MediaContextoTipo;
  /** Slug do filhote ou da galeria de onde a midia veio. */
  readonly contextId: string;
  /** Pagina publica onde a midia aparece — link do painel. */
  readonly url: string;
};

const EXTENSAO = /\.[a-z0-9]+$/i;

/** `/filhotes/videos/spitz-branco.mp4` -> `gallery:spitz-branco`. */
export function mediaIdDeArquivo(src: string): string | null {
  const caminho = src.trim().split("?")[0].split("#")[0];
  if (!caminho.startsWith("/")) return null;

  const semBarra = caminho.slice(1);
  const semExtensao = semBarra.replace(EXTENSAO, "");
  if (semExtensao.length === 0) return null;

  if (/\.mp4$/i.test(caminho)) {
    const slug = semExtensao.split("/").pop();
    return slug ? `gallery:${slug}` : null;
  }
  return `foto:${semExtensao}`;
}

export function tipoDeMidia(src: string): MediaTipo {
  return /\.mp4(\?|#|$)/i.test(src) ? "video" : "image";
}

function registrar(mapa: Map<string, MidiaRegistrada>, midia: MidiaRegistrada) {
  // Primeiro a registrar ganha. A mesma foto pode aparecer em dois lugares; o
  // contexto guardado aqui e so o rotulo do painel, nao muda a contagem.
  if (!mapa.has(midia.mediaId)) mapa.set(midia.mediaId, midia);
}

function construirRegistro(): ReadonlyMap<string, MidiaRegistrada> {
  const mapa = new Map<string, MidiaRegistrada>();

  // A galeria vem primeiro para que o titulo do video no painel seja o titulo
  // publicado ("Dupla Creme"), e nao "Spitz Creme Macho — video 2".
  for (const video of GALLERY_VIDEOS) {
    registrar(mapa, {
      mediaId: video.id,
      mediaType: "video",
      src: video.src,
      poster: video.poster,
      titulo: video.title,
      contextType: "gallery",
      contextId: video.slug,
      url: "/galeria",
    });
  }

  for (const filhote of staticPuppies) {
    const imagens: string[] = Array.isArray(filhote.images) ? filhote.images : [];
    let fotos = 0;
    let videos = 0;

    for (const src of imagens) {
      const mediaId = mediaIdDeArquivo(src);
      if (!mediaId) continue;
      const mediaType = tipoDeMidia(src);
      if (mediaType === "video") videos += 1;
      else fotos += 1;

      registrar(mapa, {
        mediaId,
        mediaType,
        src,
        titulo:
          mediaType === "video"
            ? `${filhote.name} — vídeo ${videos}`
            : `${filhote.name} — foto ${fotos}`,
        contextType: "puppy",
        contextId: filhote.slug,
        url: `/filhotes/${filhote.slug}`,
      });
    }
  }

  return mapa;
}

export const MEDIA_REGISTRY: ReadonlyMap<string, MidiaRegistrada> = construirRegistro();

export function midiaRegistrada(mediaId: string): MidiaRegistrada | undefined {
  return MEDIA_REGISTRY.get(mediaId);
}

export function existeNoRegistro(mediaId: string): boolean {
  return MEDIA_REGISTRY.has(mediaId);
}
