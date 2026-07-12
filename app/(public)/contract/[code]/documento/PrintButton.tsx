"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{ background: "#166534", color: "#fff", border: "none", borderRadius: 6, padding: "6px 16px", cursor: "pointer", fontSize: 12 }}
    >
      Imprimir / Salvar PDF
    </button>
  );
}
