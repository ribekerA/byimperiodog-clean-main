export const runtime = "edge";

/**
 * GET /og/cor/[cor]
 *
 * OG image dinâmica por cor — 1200×630px
 */

import { ImageResponse } from "next/og";
import { COLOR_SEO } from "@/lib/catalog-utils";

const COLOR_CONFIG: Record<string, {
  bg: string; accent: string; badge: string; dark: boolean; emoji: string; tagline: string; img: string;
}> = {
  creme: {
    bg:      "radial-gradient(ellipse at 60% 50%, #fef3c7, #fffbeb, #ffffff)",
    accent:  "#92400e",
    badge:   "#f59e0b",
    dark:    false,
    emoji:   "✨",
    tagline: "A cor mais valorizada e disputada",
    img:     "/filhotes/creme/creme-femea-01.jpg",
  },
  laranja: {
    bg:      "radial-gradient(ellipse at 60% 50%, #ffedd5, #fff7ed, #ffffff)",
    accent:  "#9a3412",
    badge:   "#f97316",
    dark:    false,
    emoji:   "🔥",
    tagline: "A cor mais icônica da raça",
    img:     "/filhotes/laranja/laranja-femea-flores-01.jpg",
  },
  preto: {
    bg:      "radial-gradient(ellipse at 60% 50%, #27272a, #18181b, #09090b)",
    accent:  "#e4e4e7",
    badge:   "#71717a",
    dark:    true,
    emoji:   "🖤",
    tagline: "Elegância rara — cor muito disputada",
    img:     "/filhotes/preto/preto-filhote-flores-01.jpg",
  },
  "wolf-sable": {
    bg:      "radial-gradient(ellipse at 60% 50%, #d6d3d1, #e7e5e4, #fafaf9)",
    accent:  "#44403c",
    badge:   "#78716c",
    dark:    false,
    emoji:   "🐺",
    tagline: "O mais raro — bicolor inconfundível",
    img:     "/filhotes/wolf-sable/wolf-sable-femea-01.jpg",
  },
};

export async function GET(
  _req: Request,
  { params }: { params: { cor: string } }
) {
  const cfg = COLOR_CONFIG[params.cor];
  const seo = COLOR_SEO[params.cor];
  if (!cfg || !seo) return new Response("Not found", { status: 404 });

  const { dark } = cfg;
  const textColor = dark ? "#f4f4f5" : "#18181b";
  const subColor  = dark ? "#a1a1aa"  : "#52525b";

  const SITE_URL = "https://canilspitzalemao.com.br";
  const imgUrl   = `${SITE_URL}${cfg.img}`;

  let imgData: string | null = null;
  try {
    const res = await fetch(imgUrl, { cache: "force-cache" });
    if (res.ok) {
      const buf  = await res.arrayBuffer();
      const b64  = Buffer.from(buf).toString("base64");
      const mime = res.headers.get("content-type") ?? "image/jpeg";
      imgData    = `data:${mime};base64,${b64}`;
    }
  } catch { /* fallback */ }

  return new ImageResponse(
    (
      <div
        style={{
          display:    "flex",
          width:      "100%",
          height:     "100%",
          background: cfg.bg,
          fontFamily: "sans-serif",
          position:   "relative",
          overflow:   "hidden",
        }}
      >
        {/* Foto */}
        {imgData && (
          <img
            src={imgData}
            style={{
              position:       "absolute",
              right:          0,
              top:            0,
              height:         "100%",
              width:          "50%",
              objectFit:      "cover",
              objectPosition: "center top",
            }}
          />
        )}
        {imgData && (
          <div
            style={{
              position:   "absolute",
              right:      0,
              top:        0,
              height:     "100%",
              width:      "50%",
              background: dark
                ? "linear-gradient(to right, #09090b 0%, transparent 45%)"
                : "linear-gradient(to right, white 0%, transparent 45%)",
            }}
          />
        )}

        {/* Conteúdo */}
        <div
          style={{
            display:        "flex",
            flexDirection:  "column",
            justifyContent: "center",
            gap:            "20px",
            padding:        "60px 56px",
            width:          imgData ? "56%" : "100%",
            zIndex:         1,
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 700, color: cfg.badge, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            🐾 By Império Dog
          </div>

          <div
            style={{
              fontSize:    "64px",
              fontWeight:  900,
              color:       textColor,
              lineHeight:  1,
              letterSpacing: "-0.025em",
            }}
          >
            {cfg.emoji} {seo.h1}
          </div>

          <div style={{ fontSize: "22px", color: subColor, lineHeight: 1.4, maxWidth: "500px" }}>
            {cfg.tagline}
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
            {["Registro oficial", "Mentoria vitalícia", "Laudos veterinários"].map((tag) => (
              <div
                key={tag}
                style={{
                  background:   dark ? "#27272a" : "#f4f4f5",
                  color:        subColor,
                  borderRadius: "6px",
                  padding:      "5px 12px",
                  fontSize:     "13px",
                  fontWeight:   600,
                }}
              >
                ✓ {tag}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "absolute", bottom: "20px", right: "24px", fontSize: "13px", color: subColor, opacity: 0.7 }}>
          canilspitzalemao.com.br
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
