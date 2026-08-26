// Guard das rotas internas de manutencao (reindex de busca, embeddings
// faltantes, seed de badges). Nao sao rotas de UI: sao gatilhos operacionais
// chamados a mao ou por script.
//
// O que estava errado ate esta rodada: a frase secreta e o SHA-256 dela viviam
// escritos NESTE arquivo -- em um repositorio publico. Qualquer pessoa que
// abrisse o GitHub lia `x-internal-token: <frase>` e disparava /api/qa/embed-missing
// e /api/search/reindex a vontade, que sao justamente as duas rotas que gastam
// credito de embedding da OpenAI. Um segredo versionado nao e segredo.
//
// Agora o valor vem de INTERNAL_API_TOKEN. Sem a variavel configurada o guard
// devolve false: a rota responde 401 e nao roda. Falhar fechado e proposital --
// o modo anterior (aceitar um valor padrao) e exatamente o defeito corrigido.
//
// Implementado sem `node:crypto` para continuar compativel com runtime de borda.

/** Comparacao de tempo constante para strings. `===` vaza pelo tempo o tamanho
 *  do prefixo correto, o que permite adivinhar o token byte a byte. */
function comparaConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) {
    diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferenca === 0;
}

export function verifyInternalToken(headerValue: string | null | undefined): boolean {
  if (!headerValue) return false;

  const esperado = process.env.INTERNAL_API_TOKEN;
  // Sem segredo configurado, ninguem entra. Um token curto tambem nao serve:
  // essas rotas gastam dinheiro, entao o minimo e 24 caracteres.
  if (!esperado || esperado.length < 24) return false;

  return comparaConstante(headerValue, esperado);
}

export function internalGuard(req: Request): boolean {
  return verifyInternalToken(req.headers.get('x-internal-token'));
}
