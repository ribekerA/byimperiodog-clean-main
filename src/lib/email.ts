const FROM_ADDRESS = process.env.RESEND_FROM || "By Império Dog <noreply@byimperiodog.com.br>";
const WA_PHONE    = (process.env.NEXT_PUBLIC_WA_PHONE || "5511968633239").replace(/\D/g, "");

export interface LeadAutoResponseParams {
  name: string;
  phone?: string | null;
  city?: string | null;
  color?: string | null;
  sex?: string | null;
  email?: string | null;
}

function buildLeadEmailHtml(p: LeadAutoResponseParams): string {
  const firstName  = (p.name || "").split(" ")[0] || "olá";
  const desired    = [p.color, p.sex === "femea" ? "fêmea" : p.sex === "macho" ? "macho" : null].filter(Boolean).join(" · ");
  const waMessage  = encodeURIComponent(`Olá ${firstName}! Somos da By Império Dog. Recebemos seu interesse${desired ? ` (${desired})` : ""}. Posso te mandar fotos e vídeos agora?`);
  const waUrl      = `https://wa.me/${WA_PHONE}?text=${waMessage}`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#052e2b,#0d5c49);padding:32px 24px;text-align:center;">
      <p style="margin:0;font-size:28px;">🐾</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">By Império Dog</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,.7);font-size:13px;">Spitz Alemão Anão · Criação Premium</p>
    </div>

    <div style="padding:28px 24px;">
      <p style="margin:0 0 12px;font-size:16px;color:#1a1a1a;">Olá, <strong>${firstName}</strong>! 👋</p>
      <p style="margin:0 0 16px;font-size:14px;color:#444;line-height:1.6;">
        Recebemos seu interesse${desired ? ` em um Spitz <strong>${desired}</strong>` : ""}. Nossa criadora vai entrar em contato em breve para te mostrar os filhotes disponíveis, vídeos ao vivo e tirar todas as suas dúvidas.
      </p>

      ${p.city ? `<p style="margin:0 0 16px;font-size:13px;color:#666;">📍 ${p.city}</p>` : ""}

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#166534;">Enquanto isso, você pode:</p>
        <ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:#166534;line-height:1.8;">
          <li>Ver o catálogo completo em <a href="https://www.byimperiodog.com.br/filhotes" style="color:#166534;">byimperiodog.com.br/filhotes</a></li>
          <li>Ler nosso guia de cuidados com Spitz Alemão</li>
          <li>Falar diretamente no WhatsApp abaixo</li>
        </ul>
      </div>

      <div style="text-align:center;margin:24px 0;">
        <a href="${waUrl}" style="display:inline-block;background:#25d366;color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:50px;text-decoration:none;">
          💬 Falar no WhatsApp agora
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>

      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
        <span style="font-size:12px;color:#888;">⭐ 5/5 — 180+ famílias</span>
        <span style="font-size:12px;color:#888;">📄 Contrato digital</span>
        <span style="font-size:12px;color:#888;">🩺 Garantia de saúde</span>
      </div>
    </div>

    <div style="background:#f8f9fa;padding:16px 24px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#aaa;">
        Você recebeu este e-mail por preencher o formulário em byimperiodog.com.br.<br/>
        <a href="https://www.byimperiodog.com.br" style="color:#aaa;">byimperiodog.com.br</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendLeadAutoResponse(p: LeadAutoResponseParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !p.email) return; // silently skip when not configured

  const firstName = (p.name || "").split(" ")[0] || "olá";
  const subject   = `${firstName}, recebemos seu interesse! 🐾`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from:    FROM_ADDRESS,
        to:      [p.email],
        subject,
        html:    buildLeadEmailHtml(p),
      }),
    });
  } catch {
    // never block lead capture
  }
}
