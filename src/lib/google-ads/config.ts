// Configuracao da conexao com a API do Google Ads.
//
// Tres coisas precisam existir antes de qualquer chamada, e o motivo de cada
// uma ser separada das outras:
//
// 1. GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET -- o mesmo par OAuth que ja serve
//    GA4 e GTM. A conexao do Ads reaproveita o cliente do Google Cloud; o que
//    muda e so o escopo pedido (adwords).
// 2. GOOGLE_ADS_DEVELOPER_TOKEN -- OPCIONAL. O Google desligou o developer
//    token em 09/09/2026: o nivel de acesso passou a pertencer ao PROJETO do
//    Google Cloud que emitiu as credenciais OAuth, e o cabecalho, quando
//    enviado, e ignorado pelos servidores. Continua aceito aqui porque projeto
//    antigo ainda tem o valor guardado e mandar nao custa nada -- mas exigi-lo
//    trancaria a tela por uma credencial que a API nao pede mais.
//    Quem decide se a chamada responde e o nivel do projeto: "Test" fala so
//    com conta de teste, "Explorer" ja fala com conta de producao. Conta real
//    respondendo vazio quase sempre e nivel de projeto, nao defeito de codigo.
// 3. GOOGLE_ADS_LOGIN_CUSTOMER_ID -- o ID do gerenciador, obrigatorio apenas
//    quando a conta autorizada e um MCC operando sobre contas filhas. Fora
//    desse caso, mandar o cabecalho atrapalha: o Google recusa se o ID nao for
//    de fato gerenciador da conta alvo.
//
// A versao fica numa variavel porque a API do Google Ads aposenta versoes em
// cerca de um ano. Quando a v26 for desligada, trocar GOOGLE_ADS_API_VERSION
// em producao evita um deploy so para mudar uma string.

/** Versao padrao da API. v26 foi publicada em 14/10/2026, com desligamento
 *  previsto para novembro de 2027 -- a mais longeva entre as disponiveis
 *  quando esta integracao foi escrita. */
export const VERSAO_PADRAO_API = "v26";

export const ESCOPO_ADS = "https://www.googleapis.com/auth/adwords";

export function versaoApi(): string {
  const bruto = process.env.GOOGLE_ADS_API_VERSION?.trim();
  if (!bruto) return VERSAO_PADRAO_API;
  // So aceita o formato vNN ou vNN_N. Uma string livre aqui vira caminho de
  // URL, e caminho de URL vindo de variavel de ambiente mal preenchida produz
  // um 404 dificil de ler.
  return /^v\d+(_\d+)?$/.test(bruto) ? bruto : VERSAO_PADRAO_API;
}

export function baseApi(): string {
  return `https://googleads.googleapis.com/${versaoApi()}`;
}

/** Token de desenvolvedor, quando ainda houver um. Ausencia nao e erro: ver o
 *  item 2 do cabecalho -- a API ignora este cabecalho desde 09/09/2026. */
export function developerToken(): string | null {
  return process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim() || null;
}

/** O cabecalho login-customer-id so aceita digitos. Quem copia o ID do painel
 *  traz no formato 123-456-7890, e o hifen faz a chamada falhar com um erro
 *  generico de autorizacao. */
export function soDigitos(valor: string | null | undefined): string | null {
  const limpo = (valor ?? "").replace(/\D/g, "");
  return limpo.length > 0 ? limpo : null;
}

export function loginCustomerId(): string | null {
  return soDigitos(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);
}

/** Diz se a conexao tem o minimo para funcionar, sem lancar. A tela de admin
 *  usa isto para explicar o que falta em vez de mostrar um erro de rede. */
export function diagnosticoConfiguracao(): {
  pronto: boolean;
  faltando: string[];
  versao: string;
  loginCustomerId: string | null;
} {
  const faltando: string[] = [];
  if (!process.env.GOOGLE_CLIENT_ID?.trim()) faltando.push("GOOGLE_CLIENT_ID");
  if (!process.env.GOOGLE_CLIENT_SECRET?.trim()) faltando.push("GOOGLE_CLIENT_SECRET");
  // GOOGLE_ADS_DEVELOPER_TOKEN nao entra nesta lista de proposito: pedi-lo
  // deixaria a tela travada esperando uma credencial aposentada.
  return {
    pronto: faltando.length === 0,
    faltando,
    versao: versaoApi(),
    loginCustomerId: loginCustomerId(),
  };
}
