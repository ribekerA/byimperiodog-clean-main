import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { guides } from "../content/guides/index";
import { puppiesPublicados } from "../content/puppies-static";
import { puppySearchCopy } from "../content/puppy-search-copy";
import { SEARCH_CLUSTERS, SEARCH_TOPICS } from "../content/search-topics";
import { ALL_COLORS, ALL_SEXES } from "../src/lib/catalog-utils";

const errors: string[] = [];
const owners = new Map<string, string>();
const paths = new Set<string>();
const ids = new Set<string>();
const rows: string[][] = [["grupo", "intencao", "consulta", "pagina_principal"]];
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

function routeExists(href: string) {
  if (!href.startsWith("/") || /[?#]/.test(href)) return false;
  if (existsSync(resolve("app/(public)", `.${href}`, "page.tsx"))) return true;
  if (href.startsWith("/blog/")) return existsSync(resolve("content/posts", `${href.slice(6)}.mdx`));
  if (href.startsWith("/guias/")) return guides.some((guide) => href === `/guias/${guide.slug}`);
  if (href.startsWith("/filhotes/cor/")) return ALL_COLORS.some((cor) => href === `/filhotes/cor/${cor}`);
  if (href.startsWith("/filhotes/sexo/")) return ALL_SEXES.some((sexo) => href === `/filhotes/sexo/${sexo}`);
  return puppiesPublicados.some((puppy) => href === `/filhotes/${puppy.slug}`);
}

for (const topic of SEARCH_TOPICS) {
  if (ids.has(topic.id)) errors.push(`ID duplicado: ${topic.id}`);
  ids.add(topic.id);
  if (!SEARCH_CLUSTERS.some((group) => group.id === topic.cluster)) errors.push(`Grupo desconhecido: ${topic.id}`);
  for (const href of [topic.href, ...(topic.supportingPaths ?? [])]) {
    if (!routeExists(href)) errors.push(`Destino inexistente: ${href}`);
    if (paths.has(href)) errors.push(`Página atribuída a dois temas: ${href}`);
    paths.add(href);
  }
  for (const query of topic.queries) {
    const key = normalize(query);
    const owner = owners.get(key);
    if (!key || (owner && owner !== topic.href)) errors.push(`Consulta com destinos concorrentes: ${query}`);
    owners.set(key, topic.href);
    rows.push([topic.cluster, topic.id, query, topic.href]);
  }
  for (const id of topic.related ?? []) {
    if (!SEARCH_TOPICS.some((candidate) => candidate.id === id)) errors.push(`Tema relacionado inexistente: ${topic.id} -> ${id}`);
  }
}

for (const puppy of puppiesPublicados) {
  const copy = puppySearchCopy(puppy);
  if (!copy) { errors.push(`Filhote divulgado sem texto de busca: ${puppy.slug}`); continue; }
  const href = `/filhotes/${puppy.slug}`;
  paths.add(href);
  const key = normalize(copy.heading);
  if (owners.has(key)) errors.push(`Ficha disputando a mesma consulta: ${copy.heading}`);
  owners.set(key, href);
  rows.push(["vitrine", puppy.slug, copy.heading, href]);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
if (process.argv.includes("--csv")) {
  console.log(rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\n"));
} else {
  console.log(`Mapa validado: ${SEARCH_CLUSTERS.length} grupos, ${SEARCH_TOPICS.length} intenções, ${owners.size} consultas e ${paths.size} páginas principais/de apoio.`);
  console.log(`${puppiesPublicados.length} fichas divulgadas com título e preço sincronizados. Sem destinos inexistentes ou consultas idênticas atribuídas a páginas diferentes.`);
  console.log("A cobertura é do mapa editorial cadastrado; não representa volume de mercado, posição ou participação de tráfego.");
}
