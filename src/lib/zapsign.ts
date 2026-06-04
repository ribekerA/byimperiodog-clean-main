const BASE_URL = "https://api.zapsign.com.br/api/v1";

function getToken() {
  const token = process.env.ZAPSIGN_API_TOKEN;
  if (!token) throw new Error("ZAPSIGN_API_TOKEN não configurado");
  return token;
}

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization:  `Bearer ${getToken()}`,
  };
}

export type ZapSignSigner = {
  name:                     string;
  email?:                   string;
  phone_country?:           string; // "55" para Brasil
  phone_number?:            string; // somente dígitos, ex: "11998218158"
  send_automatic_email?:    boolean;
  send_automatic_whatsapp?: boolean;
  auth_mode?:               "assinaturaTela" | "documentoComSelfie" | "tokenEmail" | "tokenWhatsapp";
  redirect_link?:           string;
};

export type ZapSignCreateParams = {
  name:          string;
  base64_pdf:    string;        // PDF em base64
  lang?:         "pt-BR" | "en" | "es";
  signers:       ZapSignSigner[];
  external_id?:  string;        // Nosso código de contrato
  webhook_url?:  string;
};

export type ZapSignDocument = {
  token:          string;
  status:         "pending" | "finished" | "canceled";
  name:           string;
  external_id?:   string;
  signed_file?:   string;       // URL do PDF assinado
  signers: {
    token:        string;
    name:         string;
    email?:       string;
    status:       "pending" | "signed" | "rejected";
    sign_url:     string;       // Link de assinatura
    signed_at?:   string;
  }[];
};

export async function createZapSignDocument(params: ZapSignCreateParams): Promise<ZapSignDocument> {
  const res = await fetch(`${BASE_URL}/docs/`, {
    method:  "POST",
    headers: headers(),
    body:    JSON.stringify({
      name:        params.name,
      base64_pdf:  params.base64_pdf,
      lang:        params.lang ?? "pt-BR",
      external_id: params.external_id,
      webhook_url: params.webhook_url,
      signers:     params.signers.map((s) => ({
        name:                     s.name,
        email:                    s.email             ?? null,
        phone_country:            s.phone_country     ?? "55",
        phone_number:             s.phone_number      ?? null,
        send_automatic_email:     s.send_automatic_email    ?? true,
        send_automatic_whatsapp:  s.send_automatic_whatsapp ?? true,
        auth_mode:                s.auth_mode         ?? "assinaturaTela",
        redirect_link:            s.redirect_link     ?? null,
      })),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ZapSign error ${res.status}: ${err}`);
  }

  return res.json();
}

export async function getZapSignDocument(docToken: string): Promise<ZapSignDocument> {
  const res = await fetch(`${BASE_URL}/docs/${docToken}/`, { headers: headers() });
  if (!res.ok) throw new Error(`ZapSign get error ${res.status}`);
  return res.json();
}

export async function cancelZapSignDocument(docToken: string): Promise<void> {
  await fetch(`${BASE_URL}/docs/${docToken}/cancel/`, { method: "POST", headers: headers() });
}

export function isConfigured(): boolean {
  return Boolean(process.env.ZAPSIGN_API_TOKEN);
}
