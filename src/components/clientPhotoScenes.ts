// O que se vê em cada foto do álbum de clientes — cor do Spitz e quantos cães
// aparecem. Serve só para montar o `alt`, e por isso vive longe de
// clientPhotoCaptions.ts: legenda é texto publicado, que depende da criadora
// confirmar quem é a família; alt é a descrição da imagem, que se obtém
// olhando a imagem.
//
// A tabela abaixo saiu de uma conferência foto a foto em 21/08/2026. Duas
// coisas que ela revelou e que valem mais do que o alt em si:
//
// • Nenhuma das 37 fotos tem um Spitz branco. O branco é a cor mais cara da
//   tabela (R$ 8.500 macho, R$ 9.500 fêmea) e é a única sem prova social —
//   e também a única sem ficha de macho no catálogo estático.
// • Nove fotos têm mais de um cão, e em três delas há cão de outra raça. Uma
//   legenda de cor por foto seria falsa nesses casos; por isso `cores` é lista
//   e existe `outraRaca`.
//
// Onde havia dúvida entre creme e laranja claro, ficou a descrição mais
// contida: alt errado é pior do que alt genérico.

export type ClientPhotoScene = {
  /** Cores dos Spitz visíveis, sem repetir cor. Vazio quando não dá para afirmar. */
  cores: readonly string[];
  /** Quantos cães aparecem no total, incluindo os que não são Spitz. */
  caes: number;
  /** Verdadeiro quando há cão de outra raça junto dos Spitz. */
  outraRaca?: boolean;
};

const CENAS: Record<string, ClientPhotoScene> = {
  "ana-paula-jundiai.jpeg": { cores: ["preto"], caes: 1 },
  "ana.jpeg": { cores: ["laranja"], caes: 1 },
  "bruno-familia-jundiai.jpeg": { cores: ["preto"], caes: 1 },
  "bruno.jpeg": { cores: ["creme"], caes: 1 },
  "camila.jpeg": { cores: ["laranja"], caes: 1 },
  "cliente1-byimperiodog.jpeg": { cores: ["laranja"], caes: 1 },
  "cliente10-byimperiodog.jpeg": { cores: ["laranja"], caes: 2, outraRaca: true },
  "cliente12-byimperiodog.jpeg": { cores: ["laranja"], caes: 2, outraRaca: true },
  "cliente14-byimperiodog.jpeg": { cores: ["laranja"], caes: 3, outraRaca: true },
  "cliente16-byimperiodog.jpeg": { cores: ["laranja"], caes: 1 },
  "cliente17-byimperiodog.jpeg": { cores: ["laranja"], caes: 1 },
  "cliente18-byimperiodog.jpeg": { cores: ["laranja"], caes: 1 },
  "cliente20-byimperiodog.jpeg": { cores: ["laranja"], caes: 1 },
  "cliente21-byimperiodog.jpeg": { cores: ["laranja"], caes: 1 },
  "cliente22-byimperiodog.jpeg": { cores: ["creme", "laranja"], caes: 5 },
  "cliente23-byimperiodog.jpeg": { cores: ["laranja"], caes: 2 },
  "cliente24-byimperiodog.jpeg": { cores: ["laranja"], caes: 1 },
  "cliente25-byimperiodog.jpeg": { cores: ["laranja"], caes: 1 },
  "cliente27-byimperiodog.jpeg": { cores: ["creme"], caes: 1 },
  "cliente3-byimperiodog.jpeg": { cores: ["laranja"], caes: 1 },
  "cliente30-byimperiodog.jpeg": { cores: ["laranja"], caes: 2 },
  "cliente31-byimperiodog.jpeg": { cores: ["creme"], caes: 1 },
  "cliente32-byimperiodog.jpeg": { cores: ["creme"], caes: 1 },
  "cliente4-byimperiodog.jpeg": { cores: ["laranja"], caes: 1 },
  "cliente5-byimperiodog.jpeg": { cores: ["creme"], caes: 1 },
  "cliente8-byimperiodog.jpeg": { cores: ["preto"], caes: 1 },
  "cliente9-byimperiodog.jpeg": { cores: ["laranja"], caes: 1 },
  "fernanda.jpeg": { cores: ["laranja"], caes: 1 },
  "joao.jpeg": { cores: ["laranja"], caes: 2 },
  "livia.jpeg": { cores: ["preto"], caes: 1 },
  "lucas.jpeg": { cores: ["laranja"], caes: 1 },
  "marina.jpeg": { cores: ["creme"], caes: 1 },
  "patricia.jpeg": { cores: ["laranja"], caes: 1 },
  "paula.jpeg": { cores: ["preto", "creme"], caes: 3 },
  "ricardo.jpeg": { cores: ["laranja"], caes: 2 },
  "roberto.jpeg": { cores: ["laranja"], caes: 1 },
  "ronaldo-braganca-paulista.jpeg": { cores: ["laranja"], caes: 1 },
};

const NUMERAL: Record<number, string> = {
  2: "dois",
  3: "três",
  4: "quatro",
  5: "cinco",
};

/** "preto e creme", "creme, laranja e preto" — sem vírgula antes do "e". */
function listar(itens: readonly string[]): string {
  if (itens.length <= 1) return itens[0] ?? "";
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

// §93-D — o alt trazia "Spitz Alemão Anão (Lulu da Pomerânia)" nas 37 fotos.
// São dois problemas em um: os dois nomes da raça juntos no mesmo alt, e a
// raça repetida em toda imagem por hábito, não por descrição. Quem usa leitor
// de tela ouvia o nome completo da raça 37 vezes e nenhuma vez o que muda de
// uma foto para a outra.
//
// A forma do nome agora varia por foto, e varia de forma determinística: o
// índice sai do próprio nome do arquivo. Isso importa mais do que parece — um
// alt sorteado a cada render sai diferente no servidor e no cliente, quebra a
// hidratação e ainda muda de uma visita para a outra.
const FORMAS_DA_RACA = ["Spitz Alemão Anão", "Lulu da Pomerânia", "Spitz"] as const;

/** Índice estável a partir do nome do arquivo: mesma foto, sempre a mesma forma. */
function formaDaRaca(base: string): string {
  let soma = 0;
  for (let i = 0; i < base.length; i += 1) soma += base.charCodeAt(i);
  return FORMAS_DA_RACA[soma % FORMAS_DA_RACA.length];
}

/**
 * O trecho que descreve os cães da foto, do tipo "o seu Lulu da Pomerânia
 * laranja" ou "os seus cinco Spitz creme e laranja". Devolve null quando não
 * há cena registrada, para o chamador cair no texto genérico.
 */
export function descreverCaes(src: string): string | null {
  const base = (src.split("/").pop() ?? "").toLowerCase();
  const cena = CENAS[base];
  if (!cena || cena.cores.length === 0) return null;

  const cor = listar(cena.cores);

  // Quantos Spitz há: o cão de outra raça não entra na conta, e sem ele o
  // total de cães é o próprio número de Spitz.
  const spitz = cena.outraRaca ? cena.caes - 1 : cena.caes;

  const nucleo =
    spitz > 1
      ? `os seus ${NUMERAL[spitz] ?? spitz} Spitz ${cor}`
      : `o seu ${formaDaRaca(base)} ${cor}`;

  return cena.outraRaca ? `${nucleo} e outro cão da família` : nucleo;
}

export default CENAS;
