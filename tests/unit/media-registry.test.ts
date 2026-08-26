import { describe, expect, it } from "vitest";

import { staticPuppies } from "@/content/puppies-static";
import { GALLERY_VIDEOS } from "@/domain/gallery-videos";
import {
  MEDIA_REGISTRY,
  existeNoRegistro,
  mediaIdDeArquivo,
  midiaRegistrada,
  tipoDeMidia,
} from "@/domain/media-registry";

/**
 * O registro é o que separa "curtida numa foto" de "curtida numa posição".
 *
 * A especificação sugeria ids do tipo `puppy:branco-femea:photo:01`. Isso é um
 * índice de array com outro nome: no dia em que alguém reordena as fotos no
 * admin, a curtida da foto 3 passa a contar para a foto que assumiu o lugar
 * dela. O id daqui sai do CAMINHO DO ARQUIVO, que não muda quando a ordem muda.
 */

describe("id estável de mídia", () => {
  it("deriva o id do caminho do arquivo, não da posição na lista", () => {
    const foto = "/filhotes/branco-femea-jardim-01.jpg";
    expect(mediaIdDeArquivo(foto)).toBe("foto:filhotes/branco-femea-jardim-01");

    // Mesma foto, outra posição na galeria: o id é o mesmo.
    const antes = ["/a.jpg", foto, "/b.jpg"].map(mediaIdDeArquivo);
    const depois = [foto, "/b.jpg", "/a.jpg"].map(mediaIdDeArquivo);
    expect(depois).toContain(antes[1]);
  });

  it("dá ao vídeo o mesmo id em qualquer tela onde ele apareça", () => {
    // É o requisito de §34: o card da /galeria e o slide do Reel tocam o mesmo
    // arquivo, então precisam resolver para o mesmo id — quem curtiu num vê
    // curtido no outro.
    const video = GALLERY_VIDEOS[0];
    expect(mediaIdDeArquivo(video.src)).toBe(video.id);
    expect(video.id).toBe(`gallery:${video.slug}`);
  });

  it("ignora query string e âncora", () => {
    expect(mediaIdDeArquivo("/filhotes/x.jpg?v=2")).toBe("foto:filhotes/x");
    expect(mediaIdDeArquivo("/filhotes/videos/y.mp4#t=3")).toBe("gallery:y");
  });

  it("recusa caminho que não é do site", () => {
    expect(mediaIdDeArquivo("https://exemplo.invalid/foto.jpg")).toBeNull();
    expect(mediaIdDeArquivo("foto.jpg")).toBeNull();
    expect(mediaIdDeArquivo("/")).toBeNull();
  });

  it("classifica vídeo por extensão, não por pasta", () => {
    expect(tipoDeMidia("/filhotes/videos/a.mp4")).toBe("video");
    expect(tipoDeMidia("/filhotes/videos/a.mp4?x=1")).toBe("video");
    expect(tipoDeMidia("/filhotes/a.jpg")).toBe("image");
  });
});

describe("registro de mídia", () => {
  it("cobre todos os vídeos oficiais da galeria", () => {
    for (const video of GALLERY_VIDEOS) {
      expect(existeNoRegistro(video.id)).toBe(true);
      const registro = midiaRegistrada(video.id);
      expect(registro?.mediaType).toBe("video");
      expect(registro?.url).toBe("/galeria");
    }
  });

  it("cobre todas as mídias do catálogo estático", () => {
    for (const filhote of staticPuppies) {
      for (const src of filhote.images ?? []) {
        const id = mediaIdDeArquivo(src);
        expect(id).not.toBeNull();
        expect(existeNoRegistro(id as string)).toBe(true);
      }
    }
  });

  it("aponta cada foto de filhote para a página pública dele", () => {
    const filhote = staticPuppies[0];
    const primeiraFoto = (filhote.images ?? []).find((src) => !src.endsWith(".mp4"));
    const registro = midiaRegistrada(mediaIdDeArquivo(primeiraFoto as string) as string);

    expect(registro?.contextType).toBe("puppy");
    expect(registro?.contextId).toBe(filhote.slug);
    expect(registro?.url).toBe(`/filhotes/${filhote.slug}`);
  });

  it("não repete id — é o que sustenta a chave única do banco", () => {
    const ids = [...MEDIA_REGISTRY.keys()];
    expect(ids.length).toBe(new Set(ids).size);
    expect(ids.length).toBeGreaterThan(0);
  });

  it("é o porteiro da API: id que não está aqui não existe", () => {
    expect(existeNoRegistro("foto:qualquer-coisa-inventada")).toBe(false);
    expect(existeNoRegistro("gallery:nao-existe")).toBe(false);
    expect(midiaRegistrada("")).toBeUndefined();
  });
});
