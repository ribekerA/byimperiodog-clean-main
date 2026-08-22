/**
 * Nucleo compartilhado do portao administrativo.
 *
 * Existe por um motivo concreto: ate aqui a mesma decisao de seguranca era
 * tomada em dois lugares com regras diferentes. O `middleware.ts` comparava
 * ADMIN_PASS com `===`, sem tamanho minimo e sem checar origem; o
 * `src/lib/adminAuth.ts` fazia comparacao em tempo constante, exigia 24
 * caracteres e recusava POST de origem cruzada. Duas portas para a mesma sala,
 * e a mais fraca era a que ficava na frente.
 *
 * Nao da para o middleware simplesmente importar `adminAuth`: aquele modulo usa
 * `next/headers` e o cliente do Supabase, que nao rodam no runtime Edge. Entao a
 * parte que os dois precisam mora aqui, sem dependencia nenhuma alem de Web
 * APIs padrao.
 */

/**
 * Tamanho minimo do segredo de maquina.
 *
 * ADMIN_PASS nao e senha digitada por pessoa: e chave usada por script, com
 * rotacao. Abaixo disso vira alvo de forca bruta, e um segredo curto aceito e
 * pior do que segredo nenhum, porque da a impressao de que existe protecao.
 */
export const MIN_MACHINE_SECRET = 24;

export const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Le um cookie direto do header.
 *
 * Funciona igual para `Request` e `NextRequest` — o portao nao pode depender de
 * qual dos dois o chamador tem em maos, porque era exatamente essa bifurcacao
 * que abria caminho alternativo.
 */
export function lerCookieDoHeader(req: Request, nome: string): string | undefined {
  const bruto = req.headers.get("cookie");
  if (!bruto) return undefined;
  for (const parte of bruto.split(";")) {
    const eq = parte.indexOf("=");
    if (eq < 0) continue;
    if (parte.slice(0, eq).trim() !== nome) continue;
    return decodeURIComponent(parte.slice(eq + 1).trim());
  }
  return undefined;
}

/** Comparacao sem vazar o prefixo correto pelo tempo de resposta. */
export function comparacaoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Autenticacao maquina-a-maquina: header `x-admin-pass` com o valor de
 * ADMIN_PASS. A variavel e server-only (sem prefixo NEXT_PUBLIC_, que o Next
 * inlina no bundle do browser). Segredo curto demais e recusado.
 *
 * `aoRecusarSegredoCurto` deixa quem chama registrar o aviso com o logger que
 * tiver: o middleware nao carrega o mesmo logger das rotas.
 */
export function autenticadoPorSegredoDeMaquina(
  req: Request,
  aoRecusarSegredoCurto?: (minimo: number) => void
): boolean {
  const esperado = process.env.ADMIN_PASS?.trim();
  if (!esperado) return false;
  if (esperado.length < MIN_MACHINE_SECRET) {
    aoRecusarSegredoCurto?.(MIN_MACHINE_SECRET);
    return false;
  }
  const recebido = req.headers.get("x-admin-pass");
  if (!recebido) return false;
  return comparacaoConstante(recebido, esperado);
}

/**
 * Hosts que contam como "este site".
 *
 * Atras do proxy da Netlify o header `Host` pode chegar como o host interno e o
 * publico vem em `x-forwarded-host`, entao os tres precisam valer. Um atacante
 * nao consegue forjar `x-forwarded-host` a partir de uma pagina: header custom
 * dispara preflight, e o site nao responde preflight nenhum.
 */
export function hostsDoProprioSite(req: Request): Set<string> {
  const hosts = new Set<string>();
  for (const nome of ["host", "x-forwarded-host"]) {
    const valor = req.headers.get(nome)?.trim();
    if (valor) hosts.add(valor.split(",")[0].trim());
  }
  try {
    hosts.add(new URL(req.url).host);
  } catch {
    // req.url relativo nao acrescenta nada; os headers acima ja respondem.
  }
  return hosts;
}

/**
 * CSRF nas acoes mutaveis.
 *
 * O cookie de sessao e SameSite=Lax, entao o navegador ja nao o envia num POST
 * disparado de outro site. Esta checagem e a segunda tranca: um POST vindo de
 * origem diferente da do proprio site e recusado antes de qualquer efeito.
 * Requisicao de maquina (sem Origin e sem Sec-Fetch-Site) passa por aqui e cai
 * na verificacao do segredo.
 */
export function origemSuspeita(req: Request): boolean {
  if (!MUTATING_METHODS.has(req.method.toUpperCase())) return false;

  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return true;

  const origin = req.headers.get("origin");
  if (!origin) return false;

  let origemHost: string;
  try {
    origemHost = new URL(origin).host;
  } catch {
    return true;
  }

  return !hostsDoProprioSite(req).has(origemHost);
}
