import { BRAND, FOUNDING_YEAR } from "@/domain/config";

// O selo de registro: a assinatura visual do site (proposta de design de 17/11/2026).
//
// Tudo o que ele diz já estava publicado: o registro CBKC (BRAND.registroCbkc),
// o ano de fundação e a cidade. Ele não acrescenta fato nenhum, só dá ao
// registro o peso de um carimbo em vez de uma linha perdida numa tabela.
//
// Aparece em três lugares e só neles: topo do /sobre, cabeçalho do comparativo
// do /sobre e rodapé. Usado em mais lugares, vira enfeite e perde o sentido.
//
// Sem animação de propósito: carimbo não gira.

type Props = {
  /** "escuro" para fundo verde (dourado claro); "claro" para fundo papel (dourado fechado). */
  tom?: "escuro" | "claro";
  tamanho?: number;
  className?: string;
};

const CORES = {
  escuro: { traco: "#d4a84b", texto: "#f0d083", miolo: "rgba(212,168,75,0.10)" },
  claro: { traco: "#9a7426", texto: "#7a5a1a", miolo: "rgba(154,116,38,0.07)" },
} as const;

export function SeloDeRegistro({ tom = "escuro", tamanho = 132, className }: Props) {
  const cor = CORES[tom];
  // id único por tom: o selo pode aparecer duas vezes na mesma página
  // (/sobre tem o topo e o comparativo), e dois <path> com o mesmo id
  // fariam o segundo textPath seguir o primeiro.
  const idDoAro = `selo-aro-${tom}-${tamanho}`;

  return (
    <svg
      viewBox="0 0 120 120"
      width={tamanho}
      height={tamanho}
      role="img"
      aria-label={`Canil com registro CBKC nº ${BRAND.registroCbkc}, em Bragança Paulista desde ${FOUNDING_YEAR}`}
      className={className}
    >
      <defs>
        {/* Círculo de raio 47 começando à esquerda, no sentido horário: o texto
            do aro corre por cima e fecha embaixo. */}
        <path id={idDoAro} d="M 13 60 A 47 47 0 1 1 107 60 A 47 47 0 1 1 13 60" />
      </defs>

      <circle cx="60" cy="60" r="58" fill="none" stroke={cor.traco} strokeWidth="1.2" />
      <circle cx="60" cy="60" r="38" fill={cor.miolo} stroke={cor.traco} strokeWidth="0.8" />

      <text
        fill={cor.texto}
        fontSize="8.4"
        fontWeight="700"
        letterSpacing="1.4"
        style={{ fontFamily: "var(--font-sans, system-ui), system-ui, sans-serif" }}
      >
        {/* textLength fecha o aro sem sobra: 2π·47 ≈ 295, menos o respiro do ponto final. */}
        <textPath href={`#${idDoAro}`} textLength="290" lengthAdjust="spacing">
          REGISTRO CBKC · BRAGANÇA PAULISTA · SP ·
        </textPath>
      </text>

      <text
        x="60"
        y="52"
        textAnchor="middle"
        fill={cor.texto}
        fontSize="7"
        fontWeight="600"
        letterSpacing="1.2"
        style={{ fontFamily: "var(--font-sans, system-ui), system-ui, sans-serif" }}
      >
        Nº
      </text>
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fill={cor.texto}
        fontSize="17"
        fontWeight="700"
        style={{ fontFamily: "var(--font-display)", fontVariantNumeric: "tabular-nums lining-nums" }}
      >
        {BRAND.registroCbkc}
      </text>
      <text
        x="60"
        y="80"
        textAnchor="middle"
        fill={cor.texto}
        fontSize="6.6"
        fontWeight="600"
        letterSpacing="1.1"
        style={{ fontFamily: "var(--font-sans, system-ui), system-ui, sans-serif", fontVariantNumeric: "tabular-nums" }}
      >
        DESDE {FOUNDING_YEAR}
      </text>
    </svg>
  );
}
