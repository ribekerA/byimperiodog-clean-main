// Roda o axe-core numa lista de rotas do servidor local e imprime SO as
// violacoes de contraste, ja agrupadas por combinacao de cor.
//
// LICAO APRENDIDA (nao remover). Este script ja mentiu "0 reprovado" duas
// vezes, e as duas por dizer respeito a como a pagina e medida, nao a que cor
// ela tem. O axe PULA EM SILENCIO todo elemento invisivel: nao conta como
// reprovado nem como aprovado, ele some do relatorio. Entao qualquer coisa que
// deixe um elemento invisivel na hora da medicao vira contraste que ninguem
// conferiu.
//
// 1) As secoes entram com fade (framer-motion, whileInView + once). Enquanto o
//    IntersectionObserver nao dispara, o elemento fica em opacity 0. A rolagem
//    de reconhecimento passava rapido demais (120 ms por tela) e o observador
//    nao chegava a disparar: os cards de filhote ficavam parados em 0 e o
//    preco escrito em #f3b562 sobre branco -- 1,81:1 -- nunca era medido.
//    Com 200 ms por tela o observador dispara. Mesmo assim ha uma segunda
//    passada que leva ate a tela quem ficou para tras, porque depender de
//    tempo e depender de sorte.
// 2) A espera de assentamento procurava opacidade FRACIONARIA (0 < o < 1),
//    logo lia um elemento parado em exatamente 0 como "ja assentou" e seguia
//    em frente. A checagem fracionaria continua aqui, mas so para pegar fade
//    em andamento -- de quem esta parado em 0 cuida a passada de resgate, e o
//    que sobrar e denunciado no relatorio.
//
// Medir no meio do fade tambem inventa reprovacao: text-zinc-500 (#6b6b73,
// 5,4:1 sobre branco) foi medido como #78787f = 4,38:1 so por estar em
// opacity 0,91. Por isso a espera de assentamento nao pode sair.
//
// Por fim o script confere, rota a rota, quantos elementos com texto visivel
// o axe deixou de tocar. Enquanto esse numero nao for zero ou explicado,
// "0 reprovado" nao significa nada.
import { readFileSync } from "node:fs";

import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const ROTAS = (process.env.ROTAS || "/").trim().split(/[\s,]+/);
const axeFonte = readFileSync(
  new URL("../node_modules/axe-core/axe.min.js", import.meta.url),
  "utf8"
);

// TELA=desktop mede na largura que o Lighthouse usa no desktop. Isso importa:
// varios elementos so existem num dos dois tamanhos. O aviso de rodape da
// tabela de precos, por exemplo, e sm:table-cell -- some aos 412px e a
// auditoria so de celular nunca chegou a medi-lo.
const DESKTOP = process.env.TELA === "desktop";
const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  // ScrollReveal e StaggerContainer consultam useReducedMotion e, com a
  // preferencia ligada, renderizam uma <div> comum, sem fade e com opacidade
  // cheia. Um problema a menos. Os motion.* crus do projeto nao consultam
  // nada e continuam animando -- e deles que trata a rolagem abaixo.
  reducedMotion: "reduce",
  ...(DESKTOP
    ? { viewport: { width: 1350, height: 940 }, deviceScaleFactor: 1 }
    : {
        viewport: { width: 412, height: 823 },
        deviceScaleFactor: 1.75,
        isMobile: true,
        hasTouch: true,
        userAgent:
          "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      }),
});
console.log("### tela:", DESKTOP ? "desktop 1350x940" : "celular 412x823", "| reducedMotion: reduce");

let totalNos = 0;
let totalOrfaos = 0;
let totalInvisiveis = 0;
const rotasComProblema = [];

for (const rota of ROTAS) {
  const pagina = await contexto.newPage();
  try {
    await pagina.goto(BASE + rota, { waitUntil: "networkidle", timeout: 60000 });
  } catch (e) {
    console.log("\n########## " + rota + " -> NAO CARREGOU: " + e.message.split("\n")[0]);
    await pagina.close();
    continue;
  }

  await pagina.evaluate(async () => {
    const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

    // Passada 1: percorre a pagina inteira devagar. Alem de disparar os fades,
    // isso forca a renderizacao das secoes com content-visibility: auto, que
    // fora da tela nem calculam estilo -- sem passar por elas o axe devolve o
    // conteudo como "incomplete" e o relatorio parece limpo porque metade da
    // pagina nunca existiu.
    const passo = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += passo) {
      window.scrollTo(0, y);
      await esperar(200);
    }
    window.scrollTo(0, 0);
    await esperar(300);

    // Passada 2: resgate. Quem continua abaixo de opacidade cheia nao chegou a
    // disparar. Leva cada um ate o meio da tela e espera. Repete algumas
    // vezes porque um resgate pode revelar outro elemento animado.
    for (let volta = 0; volta < 4; volta++) {
      const parados = Array.from(document.querySelectorAll("[style*='opacity']")).filter(
        (el) => el.getClientRects().length > 0 && parseFloat(getComputedStyle(el).opacity) < 1
      );
      if (parados.length === 0) break;
      for (const el of parados) {
        el.scrollIntoView({ block: "center" });
        await esperar(160);
      }
      window.scrollTo(0, 0);
      await esperar(300);
    }

    // Passada 3: espera o fade terminar. Medir no meio mistura a cor do texto
    // com a do fundo e reprova quem passa.
    const limite = Date.now() + 10000;
    while (Date.now() < limite) {
      const rodando = document.getAnimations().some((a) => a.playState === "running");
      const meioDoFade = Array.from(document.querySelectorAll("body *")).some((el) => {
        const o = parseFloat(getComputedStyle(el).opacity);
        return o > 0 && o < 1;
      });
      if (!rodando && !meioDoFade) break;
      await esperar(100);
    }
    await esperar(250);
  });

  await pagina.addScriptTag({ content: axeFonte });
  const r = await pagina.evaluate(async () => {
    const res = await window.axe.run(document, {
      runOnly: { type: "rule", values: ["color-contrast"] },
    });

    // Quantos elementos com texto proprio existem, e em quantos o axe tocou?
    // A diferenca e o ponto cego. So conta o que o axe DEVERIA medir: ele pula
    // de proposito o que esta sob aria-hidden e o que nao tem caixa no layout.
    const todos = Array.from(
      document.querySelectorAll("p,a,span,h1,h2,h3,h4,li,td,th,dd,dt,button,label,figcaption,strong,em,div")
    ).filter((el) =>
      Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
    );
    const comTexto = todos.filter((el) => !el.closest('[aria-hidden="true"]'));

    // getClientRects decide se ha caixa. Cuidado: getComputedStyle de um filho
    // dentro de um pai display:none devolve o display DO FILHO, nao "none".
    const semCaixa = comTexto.filter((el) => el.getClientRects().length === 0);

    // checkVisibility olha a cadeia inteira de ancestrais -- e o que pega o
    // caso que derrubou a versao anterior: o <p> do preco estava opaco, mas o
    // <article> em volta estava em opacity 0, e o axe pulou o ramo todo.
    const invisiveis = comTexto.filter(
      (el) =>
        el.getClientRects().length > 0 &&
        !el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })
    );

    const deveriaMedir = comTexto.filter((el) => !semCaixa.includes(el) && !invisiveis.includes(el));

    // em quais elementos o axe encostou (reprovado, aprovado ou indefinido)
    const tocados = new Set();
    for (const grupo of [res.violations || [], res.passes || [], res.incomplete || []]) {
      for (const v of grupo) {
        for (const n of v.nodes) {
          const sel = Array.isArray(n.target) ? n.target[0] : n.target;
          try { document.querySelectorAll(sel).forEach((e) => tocados.add(e)); } catch { /* seletor exotico */ }
        }
      }
    }
    const orfaos = deveriaMedir.filter((el) => !tocados.has(el));
    const resumo = (el) => String(el.outerHTML).replace(/\s+/g, " ").slice(0, 130);

    return {
      violations: res.violations,
      incomplete: res.incomplete,
      comTexto: comTexto.length,
      semCaixa: semCaixa.length,
      invisiveis: invisiveis.length,
      exemplosInvisiveis: invisiveis.slice(0, 5).map(resumo),
      deveriaMedir: deveriaMedir.length,
      orfaos: orfaos.length,
      exemplosOrfaos: orfaos.slice(0, 5).map(resumo),
    };
  });

  const nos = r.violations.flatMap((v) => v.nodes);
  totalNos += nos.length;
  totalOrfaos += r.orfaos;
  totalInvisiveis += r.invisiveis;
  if (nos.length || r.orfaos || r.invisiveis) rotasComProblema.push(rota);

  console.log("\n########## " + rota + " -> " + nos.length + " no(s) reprovado(s) ##########");
  console.log(
    "    com texto: " + r.comTexto +
    " | fora do layout: " + r.semCaixa +
    " | invisiveis: " + r.invisiveis +
    " | deviam ser medidos: " + r.deveriaMedir +
    " | NAO medidos: " + r.orfaos
  );
  // Estes dois blocos sao o antidoto contra o "0 reprovado" enganoso: se algo
  // visivel escapou da medicao, tem de aparecer aqui.
  if (r.invisiveis > 0) r.exemplosInvisiveis.forEach((h) => console.log("      INVISIVEL (o axe pula): " + h));
  if (r.orfaos > 0) r.exemplosOrfaos.forEach((h) => console.log("      NAO MEDIDO: " + h));

  // O axe marca como incomplete o que nao conseguiu medir sozinho (imagem de
  // fundo, gradiente). Nao e reprovacao, mas aparece para ninguem ler
  // "0 reprovado" como "tudo conferido".
  const indefinidos = (r.incomplete || []).flatMap((v) => v.nodes).length;
  if (indefinidos) console.log("    (" + indefinidos + " no(s) que o axe nao conseguiu medir sozinho)");

  const grupos = new Map();
  for (const n of nos) {
    const dados = n.any?.[0]?.data || {};
    const chave = `${dados.fgColor} sobre ${dados.bgColor} = ${dados.contrastRatio} (min ${dados.expectedContrastRatio})`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push({ sel: n.target.join(" "), html: n.html.replace(/\s+/g, " ").slice(0, 200) });
  }
  let i = 0;
  for (const [chave, lista] of grupos) {
    console.log(`\n--- ${++i}. ${chave}   [${lista.length}x]`);
    console.log("    sel : " + lista[0].sel.slice(0, 190));
    console.log("    html: " + lista[0].html);
  }
  await pagina.close();
}

await navegador.close();
console.log("\n==================== RESUMO ====================");
console.log("rotas analisadas                     :", ROTAS.length);
console.log("NOS REPROVADOS                       :", totalNos);
console.log("elementos visiveis que o axe pulou   :", totalInvisiveis);
console.log("elementos visiveis nao medidos       :", totalOrfaos);
if (totalInvisiveis || totalOrfaos) {
  console.log("\nATENCAO: enquanto os dois numeros acima nao forem zero ou");
  console.log("explicados, este relatorio NAO cobre a pagina inteira.");
  console.log("rotas a conferir:", rotasComProblema.join(" "));
}
// So reprovacao de contraste define o codigo de saida; os outros dois numeros
// sao para leitura humana.
process.exit(totalNos === 0 ? 0 : 1);
