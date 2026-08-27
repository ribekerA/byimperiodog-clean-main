/**
 * lastmod — regressão nos dois sentidos.
 *
 * O sitemap deste site já declarou o timestamp do build em <lastmod>, o que
 * dizia ao Google que 36 rotas mudavam toda vez que alguém apertava deploy.
 * Um sinal de frescor que anda sem conteúdo novo é um sinal que o Google
 * aprende a descontar, e depois não volta a valer nem quando a página muda de
 * verdade.
 *
 * Os dois sentidos que precisam ser testados:
 *   1. a data ACOMPANHA mudança editorial real (senão o gerador é decorativo);
 *   2. a data NÃO ANDA sozinha — nem com o relógio, nem com um rebase.
 *
 * O segundo é o que quebrou na prática: `git log --format=%cI` devolve a data
 * do COMMITTER, que um `git commit --amend` reescreve para "agora". Trinta
 * rotas ganharam data nova sem que uma linha de texto mudasse.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { FIRSTPUB, LASTMOD, firstPubFor, lastmodFor, maxLastmod } from "@/lib/_generated-lastmod";

const RAIZ = resolve(__dirname, "..");
const GERADO = resolve(RAIZ, "src/lib/_generated-lastmod.ts");
const GERADOR = resolve(RAIZ, "scripts/gen-lastmod.mjs");

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: RAIZ,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

/**
 * Clone raso não tem histórico para responder nada.
 *
 * O gerador trata esse caso preservando o arquivo já commitado — comportamento
 * certo, porque o build da Netlify roda sobre clone raso. Aqui a consequência é
 * que as asserções que consultam o git não têm base: sem histórico elas
 * comparariam a data commitada com o único commit disponível e reprovariam
 * conteúdo correto.
 */
const rasoOuSemGit = (() => {
  try {
    return git(["rev-parse", "--is-shallow-repository"]) === "true";
  } catch {
    return true;
  }
})();

const datas = [...Object.values(LASTMOD), ...Object.values(FIRSTPUB)];

describe("lastmod — acompanha o conteúdo", () => {
  it("tem data para as rotas públicas principais", () => {
    for (const rota of ["/", "/filhotes", "/blog", "/sobre", "/contato"]) {
      expect(LASTMOD[rota], `rota ${rota} sem lastmod`).toBeTruthy();
    }
  });

  it("registra a mudança editorial mais recente de cada página", () => {
    if (rasoOuSemGit) return;
    // A rota não pode ser mais antiga que o último commit no arquivo da própria
    // página. Pode ser MAIS NOVA: o gerador também olha o conteúdo importado, e
    // um texto compartilhado que mudou depois legitimamente empurra a data.
    const rotas: Record<string, string> = {
      "/sobre": "app/(public)/sobre/page.tsx",
      "/contato": "app/(public)/contato/page.tsx",
      "/filhotes": "app/(public)/filhotes/page.tsx",
    };
    for (const [rota, arquivo] of Object.entries(rotas)) {
      const doGit = git(["log", "-1", "--format=%aI", "--", arquivo]);
      if (!doGit) continue; // arquivo novo, ainda não commitado
      expect(
        new Date(LASTMOD[rota]).getTime(),
        `${rota} está mais antiga que o último commit de ${arquivo}`,
      ).toBeGreaterThanOrEqual(new Date(doGit).getTime());
    }
  });

  it("nunca publica a página depois de modificá-la", () => {
    for (const [rota, publicacao] of Object.entries(FIRSTPUB)) {
      const alteracao = LASTMOD[rota];
      if (!alteracao) continue;
      expect(
        new Date(publicacao).getTime(),
        `${rota}: datePublished depois de dateModified`,
      ).toBeLessThanOrEqual(new Date(alteracao).getTime());
    }
  });
});

describe("lastmod — não anda sozinho", () => {
  it("não é o instante do build", () => {
    // Uma hora de folga. Se o gerador voltasse a carimbar Date.now(), toda data
    // do arquivo cairia dentro dos últimos segundos.
    const limite = Date.now() - 60 * 60 * 1000;
    for (const d of datas) {
      expect(new Date(d).getTime(), `data suspeita de ser hora de build: ${d}`).toBeLessThan(
        limite,
      );
    }
  });

  it("gera o mesmo arquivo quando nada mudou", () => {
    const antes = readFileSync(GERADO, "utf8");
    try {
      execFileSync("node", [GERADOR], { cwd: RAIZ, stdio: "ignore" });
      expect(readFileSync(GERADO, "utf8")).toBe(antes);
    } finally {
      // Rodar o gerador é o próprio teste; deixar o arquivo diferente do
      // commitado seria transformar a suite em fonte de diff.
      writeFileSync(GERADO, antes, "utf8");
    }
    // O gerador faz uma chamada de git por rota e leva uns oito segundos; o
    // padrão do vitest são cinco, e o estouro aparecia como falha de conteúdo.
  }, 60_000);

  it("usa a data do autor, não a do committer", () => {
    if (rasoOuSemGit) return;
    // As duas nascem iguais e divergem em rebase, amend e cherry-pick. Quando
    // divergem, a do committer é a hora em que alguém reescreveu o commit —
    // nada a ver com o texto. Nenhuma data do arquivo pode ser uma dessas.
    const linhas = git(["log", "-n", "400", "--format=%aI|%cI"]).split("\n").filter(Boolean);
    const soDoCommitter = new Set<number>();
    for (const linha of linhas) {
      const [autor, committer] = linha.split("|");
      const a = new Date(autor).getTime();
      const c = new Date(committer).getTime();
      if (a !== c) soDoCommitter.add(c);
    }
    if (soDoCommitter.size === 0) return; // histórico sem reescrita: nada a provar
    for (const d of datas) {
      expect(
        soDoCommitter.has(new Date(d).getTime()),
        `${d} é data de committer — o gerador voltou para %cI`,
      ).toBe(false);
    }
  });

  it("o gerador não pede a data do committer ao git", () => {
    const fonte = readFileSync(GERADOR, "utf8");
    // A checagem acima só acusa quando existe commit reescrito no histórico
    // alcançável. Esta aqui vale sempre e diz onde consertar.
    const usos = fonte.match(/--format=%[ac]I/g) ?? [];
    expect(usos.length).toBeGreaterThan(0);
    expect(usos.every((u) => u === "--format=%aI")).toBe(true);
  });
});

describe("lastmod — ausência é resposta válida", () => {
  it("devolve undefined em vez de inventar data", () => {
    expect(lastmodFor("/rota-que-nao-existe")).toBeUndefined();
    expect(firstPubFor("/rota-que-nao-existe")).toBeUndefined();
    expect(maxLastmod([undefined, undefined])).toBeUndefined();
  });

  it("maxLastmod ignora buraco e devolve a maior data", () => {
    expect(maxLastmod(["2026-01-01T00:00:00.000Z", undefined, "2026-08-01T00:00:00.000Z"])).toBe(
      "2026-08-01T00:00:00.000Z",
    );
  });
});
