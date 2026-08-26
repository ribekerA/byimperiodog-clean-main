// Gera um poster proprio para cada video da galeria e mede os dados reais do
// arquivo (largura, altura, duracao).
//
// Por que existe: os doze VideoObject da /galeria apontavam todos para o mesmo
// thumbnailUrl -- /og-image.jpg, arquivo que nem existe em public/ -- e todos
// declaravam uploadDate "2024-01-01". Thumbnail 404 e data igual para tudo sao
// exatamente o tipo de metadado que o Google descarta.
//
// Nao ha ffmpeg nesta maquina. A saida foi o proprio Chromium do Playwright,
// que decodifica o H.264 destes MP4 sem problema. Ele so nao carrega file://
// dentro de uma pagina about:blank -- por isso o servidor estatico local aqui
// embaixo, que da uma origem http de verdade para os videos.
//
// Uso: npm run gen:video-posters
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import sharp from "sharp";

import { GALLERY_VIDEOS } from "@/domain/gallery-videos";

const RAIZ = resolve(process.cwd(), "public");
const DESTINO = resolve(RAIZ, "filhotes/videos/posters");
const LARGURA_POSTER = 720;

const TIPOS: Record<string, string> = {
  ".mp4": "video/mp4",
  ".html": "text/html; charset=utf-8",
};

// Servidor minimo so para dar origem http aos arquivos de public/.
const servidor = createServer(async (req, res) => {
  const caminho = decodeURIComponent((req.url || "/").split("?")[0]);
  if (caminho === "/") {
    res.writeHead(200, { "content-type": TIPOS[".html"] });
    res.end("<!doctype html><title>posters</title>");
    return;
  }
  const arquivo = join(RAIZ, caminho);
  if (!arquivo.startsWith(RAIZ) || !existsSync(arquivo)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const dados = await readFile(arquivo);
  res.writeHead(200, {
    "content-type": TIPOS[extname(arquivo)] || "application/octet-stream",
    "content-length": dados.length,
  });
  res.end(dados);
});

await new Promise<void>((ok) => servidor.listen(0, "127.0.0.1", () => ok()));
const endereco = servidor.address();
if (!endereco || typeof endereco === "string") throw new Error("servidor local nao abriu");
const base = `http://127.0.0.1:${endereco.port}`;
await mkdir(DESTINO, { recursive: true });

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.goto(base + "/", { waitUntil: "domcontentloaded" });

type Quadro = { png?: string; width?: number; height?: number; duration?: number; erro?: string };

const medidos: Record<string, { width: number; height: number; duration: string }> = {};
let falhas = 0;

for (const video of GALLERY_VIDEOS) {
  const resultado: Quadro = await pagina.evaluate(async (src) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = src;

    try {
      // Sem helper nomeado aqui dentro: o esbuild que compila este arquivo
      // envolve toda funcao atribuida a uma const com __name(), e esse __name
      // nao existe no navegador -- a funcao chega serializada la e quebra.
      await new Promise<void>((ok, falha) => {
        const t = setTimeout(() => falha(new Error("tempo esgotado nos metadados")), 30000);
        v.addEventListener("loadeddata", () => { clearTimeout(t); ok(); }, { once: true });
        v.addEventListener("error", () => { clearTimeout(t); falha(new Error("falha ao decodificar")); }, { once: true });
      });
      // Um quarto do video: longe do primeiro quadro (quase sempre escuro ou
      // desfocado) e longe do fim.
      v.currentTime = Math.max(0.1, (v.duration || 4) * 0.25);
      await new Promise<void>((ok, falha) => {
        const t = setTimeout(() => falha(new Error("tempo esgotado no posicionamento")), 30000);
        v.addEventListener("seeked", () => { clearTimeout(t); ok(); }, { once: true });
        v.addEventListener("error", () => { clearTimeout(t); falha(new Error("falha ao posicionar")); }, { once: true });
      });

      const tela = document.createElement("canvas");
      tela.width = v.videoWidth;
      tela.height = v.videoHeight;
      tela.getContext("2d")!.drawImage(v, 0, 0);
      return {
        png: tela.toDataURL("image/png").split(",")[1],
        width: v.videoWidth,
        height: v.videoHeight,
        duration: v.duration,
      };
    } catch (e) {
      return { erro: (e as Error).message };
    }
  }, base + video.src);

  if (resultado.erro || !resultado.png) {
    console.log(`  FALHOU  ${video.slug}: ${resultado.erro ?? "sem quadro"}`);
    falhas++;
    continue;
  }

  await sharp(Buffer.from(resultado.png, "base64"))
    .resize({ width: LARGURA_POSTER, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(join(DESTINO, `${video.slug}.webp`));

  medidos[video.slug] = {
    width: resultado.width!,
    height: resultado.height!,
    // ISO 8601. Arredondado para o segundo: a fracao nao acrescenta nada e so
    // deixa o schema feio.
    duration: `PT${Math.round(resultado.duration!)}S`,
  };
  console.log(`  ok      ${video.slug}.webp  ${resultado.width}x${resultado.height}  ${Math.round(resultado.duration!)}s`);
}

await navegador.close();
servidor.close();

await writeFile(
  resolve(process.cwd(), "src/domain/video-medidas.json"),
  JSON.stringify(medidos, null, 2) + "\n",
  "utf8"
);

console.log(`\nposters gerados: ${Object.keys(medidos).length}/${GALLERY_VIDEOS.length}`);
if (falhas > 0) process.exit(1);
