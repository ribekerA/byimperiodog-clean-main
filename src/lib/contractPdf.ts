import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import { BRAND } from "@/domain/config";

type ContractPdfData = {
  code:              string;
  // Comprador
  nome:              string;
  cpf:               string;
  rg?:               string;
  email?:            string;
  telefone:          string;
  endereco:          string;
  nascimento?:       string;
  // Filhote
  nome_filhote?:     string;
  cor?:              string;
  sexo?:             string;
  nascimento_filhote?: string;
  // Valor
  total_price_cents?: number | null;
  signed_at?:        string | null;
};

function fmt(cents?: number | null) {
  if (!cents) return "a combinar";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "___/___/______";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return iso; }
}

function fmtBirth(v?: string | null): string {
  if (!v) return "___/___/______";
  if (v.includes("-")) {
    const [y, m, d] = v.split("-");
    return `${d}/${m}/${y}`;
  }
  return v;
}

export async function generateContractPdf(data: ContractPdfData): Promise<Uint8Array> {
  const doc   = await PDFDocument.create();
  const bold  = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg   = await doc.embedFont(StandardFonts.Helvetica);

  const W = 595.28; // A4 width pt
  const H = 841.89; // A4 height pt
  const M = 50;     // margin

  let page = doc.addPage([W, H]);
  let y    = H - M;

  const black  = rgb(0.07, 0.07, 0.07);
  const muted  = rgb(0.4,  0.4,  0.4);
  const green  = rgb(0.02, 0.36, 0.23);
  const line   = rgb(0.85, 0.85, 0.85);

  function checkY(needed = 30) {
    if (y - needed < M) {
      page = doc.addPage([W, H]);
      y    = H - M;
    }
  }

  function drawLine(color = line, thickness = 0.5) {
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness, color });
    y -= 10;
  }

  function text(str: string, opts: {

    size?: number; font?: any; color?: ReturnType<typeof rgb>;
    x?: number; indent?: number; maxWidth?: number;
  } = {}) {
    const {
      size = 10, font = reg, color = black,
      x = M, indent = 0, maxWidth = W - M * 2,
    } = opts;
    checkY(size + 6);
    const words   = str.split(" ");
    let   line_   = "";
    const lines_: string[] = [];

    for (const word of words) {
      const test = line_ ? `${line_} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth - indent) {
        lines_.push(line_);
        line_ = word;
      } else {
        line_ = test;
      }
    }
    if (line_) lines_.push(line_);

    for (const l of lines_) {
      checkY(size + 4);
      page.drawText(l, { x: x + indent, y, size, font, color });
      y -= size + 4;
    }
  }

  function field(label: string, value: string) {
    checkY(16);
    page.drawText(`${label}: `, { x: M, y, size: 9, font: bold, color: muted });
    const lw = bold.widthOfTextAtSize(`${label}: `, 9);
    page.drawText(value || "—", { x: M + lw, y, size: 9, font: reg, color: black });
    y -= 15;
  }

  function sectionTitle(title: string) {
    checkY(30);
    y -= 8;
    page.drawText(title.toUpperCase(), { x: M, y, size: 9, font: bold, color: green });
    y -= 12;
    drawLine(rgb(0.8, 0.9, 0.85));
  }

  // ─── Header ───────────────────────────────────────────────────────────────
  page.drawRectangle({ x: M, y: y - 50, width: W - M * 2, height: 56, color: rgb(0.02, 0.36, 0.23) });
  page.drawText("BY IMPÉRIO DOG", { x: M + 12, y: y - 16, size: 14, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Contrato de Compra e Venda de Filhote", { x: M + 12, y: y - 32, size: 10, font: reg, color: rgb(0.8, 1, 0.9) });
  page.drawText(`Spitz Alemão – Lulu da Pomerânia`, { x: M + 12, y: y - 46, size: 9, font: reg, color: rgb(0.7, 0.95, 0.8) });
  page.drawText(`Código: ${data.code}`, { x: W - M - 110, y: y - 32, size: 9, font: bold, color: rgb(1, 1, 1) });
  y -= 68;

  // ─── Vendedor ─────────────────────────────────────────────────────────────
  sectionTitle("Vendedor(a)");
  field("Razão Social", "BY IMPÉRIO DOG");
  field("CNPJ",         "22.587.478/0001-00");
  field("E-mail",       BRAND.contact.email);
  field("Instagram",    "@byimperiodog");
  y -= 6;

  // ─── Comprador ────────────────────────────────────────────────────────────
  sectionTitle("Comprador(a)");
  field("Nome completo", data.nome);
  field("CPF",           data.cpf);
  if (data.rg)  field("RG",            data.rg);
  if (data.nascimento) field("Data de nasc.", fmtBirth(data.nascimento));
  field("Telefone",      data.telefone);
  if (data.email) field("E-mail",       data.email);
  field("Endereço",      data.endereco);
  y -= 6;

  // ─── Filhote ──────────────────────────────────────────────────────────────
  sectionTitle("Filhote");
  field("Raça",           "Spitz Alemão (Lulu da Pomerânia)");
  field("Nome",           data.nome_filhote || "—");
  field("Cor",            data.cor          || "—");
  field("Sexo",           data.sexo         || "—");
  field("Data de nasc.",  fmtBirth(data.nascimento_filhote));
  field("Valor total",    fmt(data.total_price_cents));
  y -= 6;

  // ─── Cláusulas ────────────────────────────────────────────────────────────
  sectionTitle("Cláusulas Contratuais");

  const clausulas = [
    ["1. Do Estado de Saúde e Vacinação",
      "1.1. O filhote é entregue em boas condições de saúde, com vermifugação atualizada e vacinação obrigatória (V8 importada) de acordo com a idade, conforme registrado na carteira assinada por médico veterinário (CRMV).\n1.2. O comprador declara estar ciente e de acordo com o estado do animal no momento da entrega."],
    ["2. Da Documentação Entregue",
      "No ato da entrega serão fornecidos: carteira de vacinação atualizada e assinada pelo veterinário (CRMV); registro oficial do filhote, com emissão e entrega conforme o prazo da entidade responsável; recibo do valor pago; cópia deste contrato assinado pelas partes; vídeo e fotos do momento da entrega; suporte pós-venda por WhatsApp, diretamente com a criadora."],
    ["3. Do Prazo para Avaliação Clínica",
      "3.1. O comprador deverá levar o filhote a uma clínica veterinária no prazo máximo de 72 horas da data de entrega.\n3.2. Caso seja constatado problema pré-existente grave, o vendedor reembolsará integralmente ou substituirá o animal.\n3.3. Após esse prazo, não serão aceitas reclamações relacionadas à saúde do animal."],
    ["4. Dos Cuidados Obrigatórios",
      "O comprador se compromete a: cumprir o cronograma de vacinação (V8, Antirrábica, Giárdia, Bronchi-Shield); vermifugar a cada 6 meses; não expor o filhote a locais públicos antes de completar todas as vacinas (mín. 21 dias após a última dose)."],
    ["5. Da Alimentação",
      "O filhote foi alimentado com ração Super Premium (ex.: Farmina N&D Puppy). O comprador se compromete a manter alimentação de padrão semelhante e cuidados veterinários periódicos."],
    ["6. Da Finalidade de Venda",
      "O filhote é vendido exclusivamente para fins de companhia. Fica expressamente proibida a reprodução comercial sem autorização prévia e escrita do vendedor."],
    ["7. Da Mentoria e Suporte Pós-Entrega",
      "7.1. A By Império Dog prestará acompanhamento durante o período de adaptação do filhote (primeiros 30 dias), incluindo dúvidas sobre alimentação, comportamento e saúde preventiva.\n7.2. Encerrado esse período, o suporte por WhatsApp diretamente com a criadora permanece disponível ao comprador pela vida do animal, sem custo adicional."],
    ["8. Da Isenção de Responsabilidade",
      "O descumprimento das obrigações das cláusulas 4 e 5 exime o vendedor de qualquer responsabilidade posterior, inclusive no tocante à saúde ou desenvolvimento do animal."],
    ["9. Das Disposições Finais",
      "As partes elegem o foro da comarca de Bragança Paulista – SP. Este contrato é assinado digitalmente conforme a MP 2.200-2/2001 e a Lei 14.063/2020."],
  ];

  for (const [title, body] of clausulas) {
    checkY(40);
    y -= 4;
    text(title, { font: bold, size: 9, color: black });
    for (const line__ of body.split("\n")) {
      text(line__, { size: 9, indent: 8, color: rgb(0.2, 0.2, 0.2) });
    }
    y -= 2;
  }

  // ─── Local e data ─────────────────────────────────────────────────────────
  checkY(50);
  y -= 12;
  text(`Bragança Paulista – SP, ${fmtDate(data.signed_at ?? new Date().toISOString())}`, { font: bold, size: 9 });
  y -= 20;

  // ─── Espaço para assinatura (ZapSign adiciona aqui) ───────────────────────
  checkY(90);
  const sigY = y - 60;
  const midX = (W - M * 2) / 2 + M;

  page.drawLine({ start: { x: M,    y: sigY }, end: { x: midX - 20, y: sigY }, thickness: 0.5, color: black });
  page.drawLine({ start: { x: midX + 20, y: sigY }, end: { x: W - M, y: sigY }, thickness: 0.5, color: black });

  page.drawText("Comprador(a)", { x: M + 40, y: sigY - 12, size: 8, font: bold, color: muted });
  page.drawText(data.nome, { x: M + 8, y: sigY - 22, size: 7, font: reg, color: muted });
  page.drawText(`CPF: ${data.cpf}`, { x: M + 8, y: sigY - 32, size: 7, font: reg, color: muted });

  page.drawText("BY IMPÉRIO DOG", { x: midX + 30, y: sigY - 12, size: 8, font: bold, color: muted });
  page.drawText("CNPJ: 22.587.478/0001-00", { x: midX + 12, y: sigY - 22, size: 7, font: reg, color: muted });

  y = sigY - 50;

  // ─── Rodapé ───────────────────────────────────────────────────────────────
  checkY(30);
  drawLine(line);
  text(`Código de autenticidade: ${data.code}  |  byimperiodog.com.br`, { size: 7, color: muted });

  return doc.save();
}
