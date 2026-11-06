// Gera as capas quadradas dos cartoes de filhote em public/images/cartoes.
//
// As fotos sao verticais e o filhote ocupa alturas diferentes em cada uma, entao
// nenhum `object-position` mostra o animal inteiro. Cada capa tem aqui uma janela
// medida a mao, com folga no alto para o selo "Disponivel".
//
// Quando o filhote nao cabe na largura da foto, a janela passa da borda e a faixa
// que falta vem da propria foto desfocada. O animal nao e retocado.
//
// Foto nova: acrescente a janela aqui, rode o script e ligue a capa em
// CAPA_QUADRADA (src/lib/photo-focus.ts).
//   node scripts/gerar-capas-dos-cartoes.mjs
import { mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const SAIDA = "public/images/cartoes";
const LADO = 900;
const ESFUMADO = Math.round(LADO * 0.05);

// x, y e lado em pixels da foto original; negativo ou alem da borda vira faixa.
const CAPAS = [
  { foto: "public/filhotes/branco/branco-macho-20261105-01.jpg", x: 72, y: 297, lado: 640 },
  { foto: "public/filhotes/branco/branco-femea-jardim-20260926-04.jpg", x: 343, y: 388, lado: 1000 },
  { foto: "public/filhotes/branco/branco-femea-20261106-01.jpg", x: 40, y: 515, lado: 770 },
  { foto: "public/filhotes/creme/creme-femea-01.jpg", x: 0, y: 166, lado: 797 },
  { foto: "public/filhotes/creme/creme-filhote-flores-02.jpg", x: 15, y: 170, lado: 860 },
  { foto: "public/filhotes/laranja/laranja-femea-brinquedos-04.jpg", x: 0, y: 190, lado: 720 },
  { foto: "public/filhotes/laranja/laranja-femea-01.jpg", x: -110, y: -40, lado: 850 },
  { foto: "public/filhotes/laranja/laranja-macho-02.jpg", x: 77, y: 150, lado: 900 },
  { foto: "public/filhotes/preto/preto-00.jpeg", x: 170, y: 340, lado: 1000 },
  { foto: "public/filhotes/preto/preto-femea-jardim-20260926-01.jpg", x: 278, y: 515, lado: 900 },
];

/** Alfa que some em direcao as bordas onde existe faixa, para nao marcar emenda. */
function alfaEsfumado(largura, altura, faixas) {
  const suave = (d) => {
    const t = Math.min(1, Math.max(0, d / ESFUMADO));
    return t * t * (3 - 2 * t);
  };
  const alfa = Buffer.alloc(largura * altura);
  for (let y = 0; y < altura; y++) {
    const fy = Math.min(faixas.topo ? suave(y) : 1, faixas.base ? suave(altura - 1 - y) : 1);
    for (let x = 0; x < largura; x++) {
      const fx = Math.min(faixas.esq ? suave(x) : 1, faixas.dir ? suave(largura - 1 - x) : 1);
      alfa[y * largura + x] = Math.round(255 * Math.min(fx, fy));
    }
  }
  return alfa;
}

async function gerar({ foto, x, y, lado }) {
  const origem = sharp(foto).rotate().removeAlpha();
  const { width: W, height: H } = await origem.metadata();

  const escala = LADO / lado;
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + lado);
  const y1 = Math.min(H, y + lado);
  if (x1 <= x0 || y1 <= y0) throw new Error(`janela fora da foto: ${foto}`);

  const largura = Math.min(LADO, Math.round((x1 - x0) * escala));
  const altura = Math.min(LADO, Math.round((y1 - y0) * escala));
  const esq = Math.min(LADO - largura, Math.round((x0 - x) * escala));
  const topo = Math.min(LADO - altura, Math.round((y0 - y) * escala));
  const dir = LADO - largura - esq;
  const base = LADO - altura - topo;

  const recorte = await origem
    .extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 })
    .resize(largura, altura, { kernel: "lanczos3" })
    .toBuffer();

  let quadro = sharp(recorte);
  if (esq || dir || topo || base) {
    const fundo = await sharp(recorte)
      .extend({ left: esq, right: dir, top: topo, bottom: base, extendWith: "mirror" })
      .blur(22)
      .toBuffer();
    const alfa = alfaEsfumado(largura, altura, { esq, dir, topo, base });
    const frente = await sharp(recorte)
      .joinChannel(alfa, { raw: { width: largura, height: altura, channels: 1 } })
      .png()
      .toBuffer();
    quadro = sharp(fundo).composite([{ input: frente, left: esq, top: topo }]);
  }

  const nome = path.basename(foto).replace(/\.[^.]+$/, "") + ".webp";
  await quadro.webp({ quality: 80 }).toFile(path.join(SAIDA, nome));
  return { nome, faixas: { esq, dir, topo, base } };
}

await mkdir(SAIDA, { recursive: true });
for (const capa of CAPAS) {
  const { nome, faixas } = await gerar(capa);
  console.log(nome, JSON.stringify(faixas));
}
