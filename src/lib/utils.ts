// src/lib/utils.ts
export function fmtPrice(price: number | null | undefined) {
  if (typeof price !== "number") return "Preço indisponível";
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}
