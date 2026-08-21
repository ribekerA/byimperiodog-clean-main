// Legendas do álbum de clientes — escrito à mão, ao contrário de
// clientPhotos.ts, que é regerado a cada build a partir de public/clientes.
//
// Só entra aqui a família cuja identificação veio da criadora. Foto sem
// entrada neste mapa aparece sem legenda, e é assim de propósito: a versão
// anterior do carrossel sorteava a cidade por posição (`CITY_POOL[i % n]`),
// ou seja, atribuía origem à família pela ordem do slide. Isso não volta.
//
// A chave é o nome do arquivo dentro de public/clientes, em minúsculas.

export type ClientPhotoCaption = {
  /** Como a família é identificada na legenda. */
  name: string;
  /** Cidade informada pela própria família. */
  city: string;
};

const CLIENT_PHOTO_CAPTIONS: Record<string, ClientPhotoCaption> = {
  "ronaldo-braganca-paulista.jpeg": { name: "Ronaldo", city: "Bragança Paulista, SP" },
  "bruno-familia-jundiai.jpeg": { name: "Bruno e família", city: "Jundiaí, SP" },
  "ana-paula-jundiai.jpeg": { name: "Ana Paula", city: "Jundiaí, SP" },
};

/** Legenda de uma foto do álbum, ou null quando a origem não é conhecida. */
export function captionFor(src: string): ClientPhotoCaption | null {
  const base = (src.split("/").pop() ?? "").toLowerCase();
  return CLIENT_PHOTO_CAPTIONS[base] ?? null;
}

export default CLIENT_PHOTO_CAPTIONS;
