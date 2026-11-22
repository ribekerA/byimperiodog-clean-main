import Image from "next/image";
import { BRAND, FOUNDING_YEAR } from "@/domain/config";

type Props = {
  tom?: "escuro" | "claro";
  tamanho?: number;
  className?: string;
};

export function SeloDeRegistro({ tamanho = 132, className }: Props) {
  return (
    <Image
      src="/cbkc-logo-oficial.png"
      width={tamanho}
      height={tamanho}
      alt={`Logotipo da CBKC. Canil registrado sob o número ${BRAND.registroCbkc}, em Bragança Paulista desde ${FOUNDING_YEAR}.`}
      className={className}
      style={{ width: tamanho, height: tamanho, objectFit: "contain" }}
    />
  );
}
