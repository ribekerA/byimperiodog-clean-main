import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { rateLimit } from "@/lib/rateLimit";

import { PrintButton } from "./PrintButton";

export const metadata: Metadata = {
  title: "Contrato de Compra e Venda",
  robots: { index: false, follow: false },
};

type Payload = {
  nome?: string; cpf?: string; rg?: string; email?: string;
  telefone?: string; endereco?: string; nascimento?: string;
  nome_filhote?: string; cor?: string; sexo?: string;
  nascimento_filhote?: string; ip_timestamp?: string;
};

type ContractData = {
  code: string;
  status: string;
  signed_at: string | null;
  total_price_cents: number | null;
  payload: Payload | null;
  signature_path: string | null;
};

async function fetchContract(code: string): Promise<ContractData | null> {
  try {
    const { data } = await supabaseAdmin()
      .from("contracts")
      .select("code,status,signed_at,total_price_cents,payload,signature_path")
      .eq("code", code)
      .maybeSingle();
    return data as ContractData | null;
  } catch {
    return null;
  }
}

async function getSignatureUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  try {
    const { data } = supabaseAdmin().storage.from("contracts").getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}

function fmt(cents?: number | null) {
  if (!cents) return "a combinar";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function fmtDate(iso?: string | null, includeTime = false): string {
  if (!iso) return "___/___/______";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (includeTime) {
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtBirthDate(v?: string | null) {
  if (!v) return "___/___/______";
  // Handle YYYY-MM-DD from input type=date
  if (v.includes("-")) {
    const [y, m, d] = v.split("-");
    return `${d}/${m}/${y}`;
  }
  return v;
}

export default async function ContractDocumento({ params }: { params: { code: string } }) {
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`contract-doc:${ip}`, 30, 60_000);
  if (!rl.allowed) notFound();

  const contract = await fetchContract(params.code);
  if (!contract) notFound();

  const buyer   = (contract.payload ?? {}) as Payload;
  const signUrl = await getSignatureUrl((contract as ContractData & { signature_path?: string | null }).signature_path ?? null);
  const today   = fmtDate(contract.signed_at ?? new Date().toISOString());

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Contrato {contract.code} – By Império Dog</title>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #111; background: #fff; padding: 0; }
          .page { max-width: 800px; margin: 0 auto; padding: 40px 48px; }
          h1 { font-size: 13pt; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 20px; }
          .section-title { font-size: 11pt; font-weight: bold; margin: 18px 0 8px; text-transform: uppercase; }
          .block { border: 1px solid #ccc; border-radius: 4px; padding: 12px 16px; margin-bottom: 14px; }
          .field { display: flex; gap: 8px; margin-bottom: 5px; font-size: 11pt; }
          .label { font-weight: bold; white-space: nowrap; }
          .value { border-bottom: 1px solid #888; flex: 1; }
          .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
          .clause { margin-bottom: 14px; }
          .clause h3 { font-size: 11pt; font-weight: bold; margin-bottom: 5px; }
          .clause p, .clause li { font-size: 10.5pt; line-height: 1.6; }
          .clause ul { padding-left: 22px; }
          .clause ul li { margin-bottom: 3px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
          .sig-box { border-top: 1px solid #333; padding-top: 8px; text-align: center; }
          .sig-img { max-height: 80px; max-width: 220px; object-fit: contain; display: block; margin: 0 auto 6px; }
          .sig-name { font-size: 10pt; }
          .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #ccc; font-size: 9pt; color: #555; text-align: center; }
          .badge { display: inline-block; border: 1px solid #ccc; border-radius: 20px; padding: 2px 10px; font-size: 9pt; font-family: monospace; }
          @media print {
            body { padding: 0; }
            .page { padding: 20mm 20mm; }
            .no-print { display: none; }
          }
        `}</style>
      </head>
      <body>
        <div className="page">
          <div className="no-print" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#166534" }}>
              {contract.status === "assinado" ? "✓ Contrato assinado digitalmente" : "⏳ Contrato pendente de assinatura"}
            </span>
            <PrintButton />
          </div>

          <h1>Contrato de Compra e Venda de Filhote<br />Spitz Alemão – Lulu da Pomerânia</h1>

          {/* Vendedor */}
          <div className="section-title">Vendedor(a)</div>
          <div className="block grid2">
            <div className="field"><span className="label">Razão social:</span><span className="value">BY IMPÉRIO DOG</span></div>
            <div className="field"><span className="label">CNPJ:</span><span className="value">22.587.478/0001-00</span></div>
            <div className="field"><span className="label">E-mail:</span><span className="value">byimperiodog@gmail.com</span></div>
            <div className="field"><span className="label">Instagram:</span><span className="value">@byimperiodog</span></div>
          </div>

          {/* Comprador */}
          <div className="section-title">Comprador(a)</div>
          <div className="block">
            <div className="grid2">
              <div className="field"><span className="label">Nome:</span><span className="value">{buyer.nome ?? "—"}</span></div>
              <div className="field"><span className="label">Nasc.:</span><span className="value">{fmtBirthDate(buyer.nascimento)}</span></div>
              <div className="field"><span className="label">CPF:</span><span className="value">{buyer.cpf ?? "—"}</span></div>
              <div className="field"><span className="label">RG:</span><span className="value">{buyer.rg ?? "—"}</span></div>
              <div className="field"><span className="label">Telefone:</span><span className="value">{buyer.telefone ?? "—"}</span></div>
              <div className="field"><span className="label">E-mail:</span><span className="value">{buyer.email ?? "—"}</span></div>
            </div>
            <div className="field" style={{ marginTop: 6 }}>
              <span className="label">Endereço:</span><span className="value">{buyer.endereco ?? "—"}</span>
            </div>
          </div>

          {/* Filhote */}
          <div className="section-title">Filhote</div>
          <div className="block grid2">
            <div className="field"><span className="label">Raça:</span><span className="value">Spitz Alemão (Lulu da Pomerânia)</span></div>
            <div className="field"><span className="label">Nome:</span><span className="value">{buyer.nome_filhote ?? "—"}</span></div>
            <div className="field"><span className="label">Cor:</span><span className="value">{buyer.cor ?? "—"}</span></div>
            <div className="field"><span className="label">Sexo:</span><span className="value">{buyer.sexo ?? "—"}</span></div>
            <div className="field"><span className="label">Data de nasc.:</span><span className="value">{fmtBirthDate(buyer.nascimento_filhote)}</span></div>
            <div className="field"><span className="label">Valor total:</span><span className="value">{fmt(contract.total_price_cents)}</span></div>
          </div>

          {/* Cláusulas */}
          <div className="section-title">Cláusulas Contratuais</div>

          <div className="clause">
            <h3>1. Do Estado de Saúde e Vacinação</h3>
            <p>1.1. O filhote é entregue em boas condições de saúde, com vermifugação atualizada e vacinação obrigatória (V8 importada) de acordo com a idade, conforme registrado na carteira assinada por médico veterinário (CRMV).</p>
            <p>1.2. O comprador declara estar ciente e de acordo com o estado do animal no momento da entrega.</p>
          </div>

          <div className="clause">
            <h3>2. Da Documentação Entregue</h3>
            <p>No ato da entrega serão fornecidos:</p>
            <ul>
              <li>Carteira de vacinação atualizada e assinada pelo veterinário (CRMV);</li>
              <li>Recibo do valor pago;</li>
              <li>Cópia deste contrato assinado pelas partes;</li>
              <li>Vídeo e fotos do momento da entrega;</li>
              <li>Acesso ao grupo de suporte pós-entrega da By Império Dog.</li>
            </ul>
          </div>

          <div className="clause">
            <h3>3. Do Prazo para Avaliação Clínica</h3>
            <p>3.1. O comprador deverá levar o filhote a uma clínica veterinária de sua confiança no prazo máximo de <strong>72 horas</strong> a contar da data de entrega.</p>
            <p>3.2. Caso seja constatado algum problema de saúde de origem pré-existente, deverá ser apresentado laudo técnico com exames assinados por médico veterinário (CRMV).</p>
            <p>3.3. Confirmado problema grave de origem pré-existente, o vendedor se compromete a <strong>reembolsar integralmente o valor pago</strong> ou substituir o animal, a critério do comprador.</p>
            <p>3.4. Após esse prazo, não serão aceitas reclamações relacionadas à saúde do animal.</p>
          </div>

          <div className="clause">
            <h3>4. Dos Cuidados Obrigatórios do Comprador</h3>
            <p>4.1. O comprador se compromete a:</p>
            <ul>
              <li>Cumprir o cronograma de vacinação: V8, Antirrábica, Giárdia e Bronchi-Shield;</li>
              <li>Vermifugar o animal a cada 6 meses conforme orientação veterinária;</li>
              <li>Não expor o filhote a locais públicos, pet shops ou contato com outros cães antes de completar todas as vacinas (mínimo de 21 dias após a última dose);</li>
              <li>Consultar veterinário de confiança para check-ups anuais.</li>
            </ul>
          </div>

          <div className="clause">
            <h3>5. Da Alimentação e Manutenção</h3>
            <p>O filhote foi alimentado com ração Super Premium (ex.: Farmina N&amp;D Puppy). O comprador se compromete a manter alimentação de padrão semelhante, além de cuidados veterinários periódicos, garantindo qualidade de vida ao animal.</p>
          </div>

          <div className="clause">
            <h3>6. Da Finalidade de Venda – Companhia (Pet)</h3>
            <p>O filhote é vendido exclusivamente para fins de companhia. Fica expressamente proibida a reprodução comercial do animal sem autorização prévia e por escrito do vendedor.</p>
          </div>

          <div className="clause">
            <h3>7. Da Mentoria e Suporte Pós-Entrega</h3>
            <p>A By Império Dog se compromete a prestar orientações e suporte ao comprador durante o período de adaptação do filhote (mínimo 30 dias), incluindo dúvidas sobre alimentação, comportamento e saúde preventiva.</p>
          </div>

          <div className="clause">
            <h3>8. Da Isenção de Responsabilidade do Vendedor</h3>
            <p>O descumprimento das obrigações previstas nas cláusulas 4 e 5 exime o vendedor de qualquer responsabilidade posterior, inclusive no tocante à saúde ou desenvolvimento do animal.</p>
          </div>

          <div className="clause">
            <h3>9. Das Disposições Finais</h3>
            <p>9.1. As partes elegem o foro da comarca de <strong>Bragança Paulista – SP</strong> para dirimir quaisquer dúvidas oriundas deste contrato.</p>
            <p>9.2. Este contrato é assinado digitalmente conforme a MP 2.200-2/2001 e a Lei 14.063/2020, tendo plena validade jurídica.</p>
          </div>

          {/* Local e data */}
          <p style={{ marginTop: 24, fontSize: "11pt" }}>
            Bragança Paulista – SP, <strong>{today}</strong>
          </p>

          {/* Assinaturas */}
          <div className="signatures">
            <div className="sig-box">
              {signUrl && <img src={signUrl} alt="Assinatura do comprador" className="sig-img" />}
              <div className="sig-name">
                <strong>{buyer.nome ?? "Comprador"}</strong><br />
                CPF: {buyer.cpf ?? "—"}
              </div>
              {buyer.ip_timestamp && (
                <div style={{ fontSize: "8pt", color: "#777", marginTop: 4 }}>
                  Assinado em: {fmtDate(buyer.ip_timestamp, true)}
                </div>
              )}
            </div>
            <div className="sig-box">
              <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "14pt", fontStyle: "italic", color: "#444" }}>By Império Dog</span>
              </div>
              <div className="sig-name">
                <strong>BY IMPÉRIO DOG</strong><br />
                CNPJ: 22.587.478/0001-00
              </div>
            </div>
          </div>

          <div className="footer">
            <p>Código de autenticidade: <span className="badge">{contract.code}</span></p>
            <p style={{ marginTop: 4 }}>
              Este documento pode ser verificado em <strong>byimperiodog.com.br/contract/{contract.code}</strong>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
