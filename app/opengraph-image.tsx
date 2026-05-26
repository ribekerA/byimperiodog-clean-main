/**
 * app/opengraph-image.tsx
 *
 * OG image dinâmica gerada no servidor (Edge Runtime) para o site inteiro.
 * Aparece automaticamente como og:image de qualquer página que não declare
 * sua própria imagem openGraph.
 *
 * Cada sub-rota pode sobrescrever com seu próprio opengraph-image.tsx.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "By Império Dog — Spitz Alemão Anão | Criação responsável em Bragança Paulista, SP";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(145deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Decorative top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: "linear-gradient(90deg, #16a34a, #22c55e, #4ade80)",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#16a34a",
            borderRadius: "100px",
            padding: "10px 28px",
            marginBottom: "28px",
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            By Império Dog
          </span>
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "#052e2b",
            textAlign: "center",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            maxWidth: "960px",
            padding: "0 40px",
          }}
        >
          Spitz Alemão Anão
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "30px",
            color: "#16a34a",
            textAlign: "center",
            marginTop: "18px",
            fontWeight: 600,
            letterSpacing: "0.01em",
          }}
        >
          Criação responsável desde 2012 · Bragança Paulista, SP
        </div>

        {/* Trust pills */}
        <div
          style={{
            display: "flex",
            gap: "14px",
            marginTop: "44px",
            flexWrap: "wrap",
            justifyContent: "center",
            padding: "0 60px",
          }}
        >
          {["Registro oficial", "Laudos veterinários", "180+ famílias", "Mentoria vitalícia"].map(
            (tag) => (
              <div
                key={tag}
                style={{
                  background: "white",
                  border: "2px solid #bbf7d0",
                  borderRadius: "100px",
                  padding: "10px 22px",
                  fontSize: "20px",
                  color: "#166534",
                  fontWeight: 600,
                }}
              >
                {tag}
              </div>
            )
          )}
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            fontSize: "18px",
            color: "#6b7280",
            fontWeight: 500,
            letterSpacing: "0.05em",
          }}
        >
          byimperiodog.com.br
        </div>
      </div>
    ),
    { ...size }
  );
}
