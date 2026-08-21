// Ponto de interesse das fotos de capa.
//
// Todo card de filhote recorta uma foto vertical dentro de um quadro mais
// baixo, e quem decide o que sobra é o `object-position`. O site inteiro usava
// um valor só, `50% 28%`, calibrado numa foto em que o filhote está no alto do
// quadro — o Preto, que é fotografado no colo. Nas fotos em que o filhote está
// no chão o mesmo 28% guarda o céu e joga o cachorro para a beirada de baixo:
// no card do Laranja sobravam 28 pontos de árvore em cima e as patas saíam
// cortadas.
//
// Não dá para acertar isso com um número só porque não é um problema de
// enquadramento do card, e sim de onde o fotógrafo colocou o filhote em cada
// foto. Os valores abaixo foram medidos foto a foto: onde começa a cabeça,
// onde terminam as patas, e qual deslocamento vertical deixa o filhote
// centrado com uma folga de ar em cima — sem que o selo "Disponível" (que fica
// a 12px do topo) caia em cima da cabeça.
//
// Escolher por caminho de arquivo, e não por filhote, é de propósito: a capa
// pode mudar de foto sem que o valor deixe de valer para a foto antiga, e um
// filhote vindo do banco (sem entrada aqui) simplesmente cai no padrão.
const FOCO_POR_FOTO: Record<string, string> = {
  // Duas fêmeas no gramado, pequenas no quadro: o corte quadrado só funciona
  // centrado nelas, senão vira foto de grama.
  "/filhotes/branco/branco-femea-dupla-jardim-01.jpg": "50% 55%",
  // Filhote grande no quadro; 35% é o limite antes de o selo encostar na
  // franja e de as patas saírem.
  "/filhotes/creme/creme-femea-01.jpg": "50% 35%",
  // Filhote no colo, cabeça no alto do quadro: é a foto de onde veio o padrão.
  "/filhotes/preto/preto-filhote-flores-01.jpg": "50% 28%",
  // Sentada na grama, com meio metro de árvore acima da cabeça.
  "/filhotes/laranja/laranja-femea-jardim-04.jpg": "50% 78%",
  // No colo, entre as flores vermelhas: a 28% sobrava folhagem no topo e o
  // corpo perdia as patas na base. 40% desce o recorte até o filhote.
  "/filhotes/creme/creme-macho-01.jpg": "50% 40%",
  // Retrato fechado. Bate com o padrão, e está aqui escrito de propósito: já
  // foi conferido foto a foto, e se algum dia o padrão mudar esta continua
  // valendo em vez de mudar junto sem ninguém olhar.
  "/filhotes/laranja/laranja-macho-flores-01.jpg": "50% 28%",
  // De pé na grama, corpo inteiro e pequeno no quadro. A 28% o filhote ficava
  // no rodapé do card com metade da foto virando mato desfocado.
  "/filhotes/preto/preto-01.jpg": "50% 70%",
};

/** Padrão de quem não foi medido: mantém o comportamento que o site já tinha. */
export const FOCO_PADRAO = "50% 28%";

/**
 * Devolve o `object-position` da foto — o valor medido, se existir, ou o
 * padrão. Serve para `style`, não para classe do Tailwind: o valor vem de
 * dados, e classe montada em tempo de execução o Tailwind não gera.
 */
export function focoDaFoto(src: string | undefined | null): string {
  if (!src) return FOCO_PADRAO;
  return FOCO_POR_FOTO[src] ?? FOCO_PADRAO;
}
