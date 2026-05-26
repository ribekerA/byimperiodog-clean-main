export const runtime = "edge";

/**
 * GET /og/filhote/[slug]
 *
 * OG image dinâmica por filhote — 1200×630px
 * Design: gradiente por cor + foto do filhote + nome + preço + branding
 */

import { ImageResponse } from "next/og";
import { staticPuppies } from "@/content/puppies-static";

// ─── Paleta por cor ───────────────────────────────────────────────────────────

const COLOR_PALETTE: Record<string, { bg: string; accent: string; badge: string }> = {
  creme:        { bg: "#fdf6e3",  accent: "#92400e", badge: "#f59e0b" },
  laranja:      { bg: "#fff7ed",  accent: "#9a3412", badge: "#f97316" },
  preto:        { bg: "#18181b",  accent: "#e4e4e7", badge: "#71717a" },
  "wolf-sable": { bg: "#f5f0eb",  accent: "#44403c", badge: "#78716c" },
};

const DEFAULT_PALETTE = { bg: "#f0fdf4", accent: "#065f46", badge: "#059669" };

// ─── Helper: formata preço ────────────────────────────────────────────────────

function fmtPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style:              "currency",
    currency:           "BRL",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const puppy = staticPuppies.find((p) => p.slug === params.slug);

  if (!puppy) {
    return new Response("Not found", { status: 404 });
  }

  const palette   = COLOR_PALETTE[puppy.color] ?? DEFAULT_PALETTE;
  const isDark    = puppy.color === "preto";
  const textColor = isDark ? "#f4f4f5" : "#18181b";
  const subColor  = isDark ? "#a1a1aa" : "#52525b";

  const sexLabel  = puppy.sex === "female" ? "Fêmea" : "Macho";
  const corLabel  = (puppy as Record<string, unknown>).cor as string ?? puppy.color;
  const priceCents =
    ((puppy as Record<string, unknown>).priceCents as number) ??
    ((puppy as Record<string, unknown>).price_cents as number) ??
    0;

  // URL absoluta da foto (funciona em produção; em dev pode falhar — tem fallback)
  const SITE_URL = "https://canilspitzalemao.com.br";
  const firstImg  = puppy.images.find((i) => !i.endsWith(".mp4"));
  const imgUrl    = firstImg ? `${SITE_URL}${firstImg}` : null;

  // Tenta carregar a foto — graceful fallback se falhar
  let imgData: string | null = null;
  if (imgUrl) {
    try {
      const res = await fetch(imgUrl, { cache: "force-cache" });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const b64 = Buffer.from(buf).toString("base64");
        const mime = res.headers.get("content-type") ?? "image/jpeg";
        imgData = `data:${mime};base64,${b64}`;
      }
    } catch {
      // foto indisponível — usa só gradiente
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display:         "flex",
          width:           "100%",
          height:          "100%",
          background:      isDark
            ? `radial-gradient(ellipse at 70% 50%, #27272a, #09090b)`
            : `radial-gradient(ellipse at 70% 50%, ${palette.bg}, #ffffff)`,
          fontFamily:      "sans-serif",
          position:        "relative",
          overflow:        "hidden",
        }}
      >
        {/* Foto do filhote — lado direito */}
        {imgData && (
          <img
            src={imgData}
            style={{
              position:   "absolute",
              right:      0,
              top:        0,
              height:     "100%",
              width:      "52%",
              objectFit:  "cover",
              objectPosition: "center top",
            }}
          />
        )}

        {/* Gradiente sobre a foto para legibilidade */}
        {imgData && (
          <div
            style={{
              position:   "absolute",
              right:      0,
              top:        0,
              height:     "100%",
              width:      "52%",
              background: isDark
                ? "linear-gradient(to right, #09090b 0%, transparent 40%)"
                : `linear-gradient(to right, white 0%, transparent 40%)`,
            }}
          />
        )}

        {/* Conteúdo — lado esquerdo */}
        <div
          style={{
            display:       "flex",
            flexDirection: "column",
            justifyContent:"center",
            gap:           "18px",
            padding:       "60px 56px",
            width:         imgData ? "58%" : "100%",
            zIndex:        1,
          }}
        >
          {/* Branding */}
          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              gap:            "8px",
              fontSize:       "16px",
              fontWeight:     700,
              color:          palette.badge,
              letterSpacing:  "0.15em",
              textTransform:  "uppercase",
            }}
          >
            🐾 By Império Dog
          </div>

          {/* Badge cor */}
          <div
            style={{
              display:         "inline-flex",
              alignSelf:       "flex-start",
              background:      palette.badge + "22",
              color:           palette.badge,
              borderRadius:    "100px",
              padding:         "6px 18px",
              fontSize:        "14px",
              fontWeight:      700,
              border:          `1px solid ${palette.badge}44`,
            }}
          >
            {corLabel} • {sexLabel}
          </div>

          {/* Nome */}
          <div
            style={{
              fontSize:    "56px",
              fontWeight:  900,
              color:       textColor,
              lineHeight:  1.05,
              letterSpacing: "-0.02em",
            }}
          >
            {puppy.name}
          </div>

          {/* Preço */}
          {priceCents > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div
                style={{
                  fontSize:   "42px",
                  fontWeight: 900,
                  color:      "#059669",
                  lineHeight: 1,
                }}
              >
                {fmtPrice(priceCents)}
              </div>
              <div style={{ fontSize: "13px", color: subColor }}>
                registro oficial incluso
              </div>
            </div>
          )}

          {/* Selos */}
          <div
            style={{
              display:    "flex",
              gap:        "10px",
              flexWrap:   "wrap",
              marginTop:  "8px",
            }}
          >
            {["Registro oficial", "Mentoria vitalícia", "Laudos veterinários"].map((tag) => (
              <div
                key={tag}
                style={{
                  background:   isDark ? "#27272a" : "#f4f4f5",
                  color:        subColor,
                  borderRadius: "6px",
                  padding:      "5px 12px",
                  fontSize:     "12px",
                  fontWeight:   600,
                }}
              >
                ✓ {tag}
              </div>
            ))}
          </div>
        </div>

        {/* Watermark URL */}
        <div
          style={{
            position:   "absolute",
            bottom:     "20px",
            right:      "24px",
            fontSize:   "13px",
            color:      subColor,
            opacity:    0.7,
          }}
        >
          canilspitzalemao.com.br
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
