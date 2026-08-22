#!/usr/bin/env node
/**
 * Varredura de segredos no codigo e, opcionalmente, no historico do git.
 *
 * Existe porque ja aconteceu: uma chave service_role do Supabase ficou escrita
 * dentro de scripts versionados num repositorio publico, e uma frase fixa
 * (`byid-internal-v1-2025`) servia de credencial das rotas internas. Nos dois
 * casos bastava ler o repositorio para ter a chave. Este script e o portao que
 * impede a proxima.
 *
 * Uso:
 *   node scripts/secret-scan.mjs              # arvore de trabalho (arquivos versionados)
 *   node scripts/secret-scan.mjs --history    # tambem varre todos os commits
 *
 * Saida: caminho, linha e nome da regra. O valor encontrado NUNCA e impresso
 * inteiro — sai mascarado, com os quatro primeiros caracteres e o tamanho. Um
 * relatorio de vazamento que imprime o segredo e um segundo vazamento.
 *
 * Codigo de saida: 0 quando nada foi encontrado, 1 quando houve achado.
 */
import { spawnSync } from "node:child_process";

const REGRAS = [
  { nome: "jwt-supabase", re: "eyJ[A-Za-z0-9_-]{15,}\\.[A-Za-z0-9_-]{15,}\\." },
  { nome: "supabase-secret", re: "sb_secret_[A-Za-z0-9_-]{16,}" },
  { nome: "supabase-pat", re: "sbp_[a-f0-9]{40}" },
  { nome: "openai", re: "sk-(proj-)?[A-Za-z0-9_-]{20,}" },
  { nome: "anthropic", re: "sk-ant-[A-Za-z0-9_-]{20,}" },
  { nome: "groq", re: "gsk_[A-Za-z0-9]{20,}" },
  { nome: "google-api-key", re: "AIza[0-9A-Za-z_-]{30,}" },
  { nome: "github-token", re: "gh[pousr]_[A-Za-z0-9]{30,}" },
  { nome: "slack-token", re: "xox[baprs]-[A-Za-z0-9-]{10,}" },
  { nome: "aws-access-key", re: "AKIA[0-9A-Z]{16}" },
  { nome: "chave-privada", re: "-----BEGIN [A-Z ]*PRIVATE KEY-----" },
  {
    nome: "atribuicao-suspeita",
    re: "(SECRET|TOKEN|PASSWORD|PASSWD|API_KEY|SERVICE_ROLE_KEY)[A-Z_]*['\"]?\\s*[:=]\\s*['\"][^'\"\\s$]{20,}['\"]",
  },
];

// Valores que casam com alguma regra mas nao sao segredo: placeholder de
// documentacao, stub de teste, exemplo em comentario. Sao comparados contra a
// linha inteira, em minusculas.
const ISENCOES = [
  "your_",
  "seu_",
  "example",
  "exemplo",
  "placeholder",
  "xxxxx",
  "changeme",
  "generate_a_random",
  "<sua",
  "<seu",
  "dummy",
  "fake",
  "stub",
  "de-teste",
  "test-secret",
];

const ARQUIVOS_ISENTOS = [/^\.env\.example$/, /^scripts\/secret-scan\.mjs$/];

function git(args) {
  const r = spawnSync("git", args, {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    windowsHide: true,
  });
  // git grep sai com 1 quando nao encontra nada: isso nao e erro.
  if (r.status !== 0 && r.status !== 1 && r.stderr) {
    throw new Error(`git ${args[0]} falhou: ${r.stderr.trim().slice(0, 200)}`);
  }
  return r.stdout || "";
}

function mascarar(valor) {
  const visivel = valor.slice(0, 4);
  return `${visivel}${"*".repeat(Math.max(0, Math.min(12, valor.length - 4)))} (${valor.length} chars)`;
}

function linhaIsenta(linha, caminho) {
  const baixa = linha.toLowerCase();
  if (ISENCOES.some((termo) => baixa.includes(termo))) return true;
  return ARQUIVOS_ISENTOS.some((re) => re.test(caminho));
}

/**
 * `git grep` devolve `caminho:linha:conteudo` na arvore e
 * `commit:caminho:linha:conteudo` quando recebe revisoes. A funcao normaliza os
 * dois formatos.
 */
function analisar(saida, regra, comRevisao) {
  const achados = [];
  const re = new RegExp(regra.re);

  for (const bruta of saida.split("\n")) {
    if (!bruta.trim()) continue;
    const partes = bruta.split(":");
    if (partes.length < (comRevisao ? 4 : 3)) continue;

    const revisao = comRevisao ? partes.shift() : null;
    const caminho = partes.shift();
    const numero = partes.shift();
    const conteudo = partes.join(":");

    if (linhaIsenta(conteudo, caminho)) continue;

    const casamento = conteudo.match(re);
    if (!casamento) continue;

    achados.push({
      regra: regra.nome,
      caminho,
      numero,
      revisao: revisao ? revisao.slice(0, 8) : null,
      valor: mascarar(casamento[0]),
    });
  }
  return achados;
}

function varrerArvore() {
  const achados = [];
  for (const regra of REGRAS) {
    const saida = git(["grep", "-I", "-n", "-E", "-e", regra.re, "--"]);
    achados.push(...analisar(saida, regra, false));
  }
  return achados;
}

function varrerHistorico() {
  const revisoes = git(["rev-list", "--all"]).split("\n").filter(Boolean);
  if (revisoes.length === 0) return [];

  const achados = [];
  for (const regra of REGRAS) {
    // Um unico `git grep` cobre todas as revisoes de uma vez.
    const saida = git(["grep", "-I", "-n", "-E", "-e", regra.re, ...revisoes]);
    achados.push(...analisar(saida, regra, true));
  }
  return achados;
}

function main() {
  const comHistorico = process.argv.includes("--history");

  const achados = varrerArvore();
  if (comHistorico) achados.push(...varrerHistorico());

  if (achados.length === 0) {
    console.log(
      comHistorico
        ? "secret-scan: nenhum segredo encontrado na arvore nem no historico."
        : "secret-scan: nenhum segredo encontrado nos arquivos versionados."
    );
    return 0;
  }

  // Duas ocorrencias do mesmo segredo no mesmo arquivo, em commits diferentes,
  // sao o mesmo problema. Agrupar evita um relatorio de centenas de linhas.
  const vistos = new Set();
  console.error(`secret-scan: ${achados.length} ocorrencia(s). Valores mascarados de proposito.\n`);
  for (const a of achados) {
    const chave = `${a.regra}|${a.caminho}|${a.valor}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    const onde = a.revisao ? `historico ${a.revisao} ${a.caminho}` : `${a.caminho}:${a.numero}`;
    console.error(`  [${a.regra}] ${onde} -> ${a.valor}`);
  }
  console.error(
    "\nSe o achado for real: rotacione a chave no provedor ANTES de reescrever o historico." +
      "\nRemover o commit nao invalida a chave — quem clonou o repositorio ja tem o valor."
  );
  return 1;
}

process.exit(main());
