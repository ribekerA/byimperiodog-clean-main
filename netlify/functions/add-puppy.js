// Endpoint legado encerrado. A gravacao de filhotes acontece exclusivamente
// pela API Next.js autenticada, com sessao assinada, RBAC e validacao de corpo.
exports.handler = async function() {
  return {
    statusCode: 410,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    body: JSON.stringify({ error: 'endpoint_removed' })
  };
};
