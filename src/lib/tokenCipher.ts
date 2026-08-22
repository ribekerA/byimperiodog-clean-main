/**
 * Cifra dos tokens de integracao em repouso.
 *
 * A tabela `integrations` guarda access_token e refresh_token de Meta, Google
 * Analytics e Tag Manager em texto puro. Um token de refresh do Google nao
 * vence: quem le a linha uma vez continua entrando na conta de analytics do
 * canil depois. Backup, dump de suporte, print de tela do painel do Supabase,
 * consulta com a chave de servico — em qualquer um desses caminhos o valor sai
 * legivel.
 *
 * Aqui os tokens passam a ser gravados cifrados com AES-256-GCM. GCM porque
 * autentica: alterar o texto cifrado nao produz um token diferente, produz erro
 * de decifragem.
 *
 * Formato do envelope: `v1.<iv em base64url>.<texto cifrado em base64url>`.
 * O prefixo de versao existe para que trocar de algoritmo um dia nao exija
 * adivinhar o formato do que ja esta gravado.
 *
 * A chave vem de INTEGRATIONS_ENCRYPTION_KEY: 32 bytes em base64 ou em hex.
 * Sem ela, `cifrarToken` LANCA — de proposito. Gravar token de OAuth em texto
 * puro numa tabela cujo RLS ainda nao foi auditado e exatamente o que este
 * modulo existe para impedir, entao a rota falha fechada e diz o que falta em
 * vez de gravar mesmo assim.
 */

import { base64url, base64urlToBytes } from "@/lib/base64url";

const PREFIXO = "v1";
const TAMANHO_IV = 12; // 96 bits, o recomendado para GCM
const TAMANHO_CHAVE = 32; // AES-256

export class ChaveDeCifraAusente extends Error {
  constructor() {
    super(
      "INTEGRATIONS_ENCRYPTION_KEY nao configurada: tokens de integracao nao podem ser gravados em texto puro."
    );
    this.name = "ChaveDeCifraAusente";
  }
}

function bytesDaChave(bruta: string): Uint8Array<ArrayBuffer> {
  const limpa = bruta.trim();

  if (/^[0-9a-fA-F]{64}$/.test(limpa)) {
    const bytes = new Uint8Array(TAMANHO_CHAVE);
    for (let i = 0; i < TAMANHO_CHAVE; i++) bytes[i] = parseInt(limpa.slice(i * 2, i * 2 + 2), 16);
    return bytes;
  }

  const bytes = base64urlToBytes(limpa);
  if (bytes.length !== TAMANHO_CHAVE) {
    throw new Error(
      `INTEGRATIONS_ENCRYPTION_KEY precisa ter ${TAMANHO_CHAVE} bytes (64 caracteres hex ou 44 base64); tem ${bytes.length}.`
    );
  }
  return bytes;
}

async function chave(uso: "encrypt" | "decrypt"): Promise<CryptoKey> {
  const bruta = process.env.INTEGRATIONS_ENCRYPTION_KEY;
  if (!bruta || !bruta.trim()) throw new ChaveDeCifraAusente();
  return crypto.subtle.importKey("raw", bytesDaChave(bruta), { name: "AES-GCM" }, false, [uso]);
}

/** Diz se a chave esta configurada, sem revelar nada sobre o valor dela. */
export function cifraConfigurada(): boolean {
  return Boolean(process.env.INTEGRATIONS_ENCRYPTION_KEY?.trim());
}

/** Reconhece um valor que ja esta no envelope cifrado. */
export function pareceCifrado(valor: string): boolean {
  return valor.startsWith(`${PREFIXO}.`) && valor.split(".").length === 3;
}

export async function cifrarToken(claro: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(TAMANHO_IV));
  const cifrado = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await chave("encrypt"),
    new TextEncoder().encode(claro)
  );
  return [PREFIXO, base64url(iv), base64url(cifrado)].join(".");
}

/** Cifra so quando ha valor. Evita `if (token) ...` espalhado em quem chama. */
export async function cifrarTokenOpcional(claro: string | null | undefined): Promise<string | null> {
  if (!claro) return null;
  return cifrarToken(claro);
}

/**
 * Decifra o envelope.
 *
 * Valor sem o prefixo de versao volta como esta: sao as linhas gravadas antes
 * desta mudanca, que continuam em texto puro no banco. Elas passam a ser
 * regravadas cifradas na proxima reconexao do provedor. Uma migracao que
 * cifrasse as linhas existentes exigiria escrita no banco de producao, o que
 * esta fora do que posso fazer aqui — fica registrado como pendencia externa.
 */
export async function decifrarToken(valor: string | null | undefined): Promise<string | null> {
  if (!valor) return null;
  if (!pareceCifrado(valor)) return valor;

  const [, iv, corpo] = valor.split(".");
  const claro = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64urlToBytes(iv) },
    await chave("decrypt"),
    base64urlToBytes(corpo)
  );
  return new TextDecoder().decode(claro);
}
