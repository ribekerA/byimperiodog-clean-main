import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { PISOS_POR_SEXO, partesDoPrecoNoPix, textoNoCartao } from "@/domain/pricing";

// Faixa de preço logo abaixo do topo de /filhotes (crítica de design de 17/11/2026).
// /preco-spitz-anao redireciona para cá, e quem chegava buscando preço via só o
// topo decorativo. Os valores não são digitados: PISOS_POR_SEXO é o menor preço
// cadastrado por sexo, o mesmo par das pílulas da home, e sexo sem oferta não
// aparece. O texto sai das partes de partesDoPrecoNoPix ("A partir de R$ X no PIX").
// Componente de servidor: entra na vitrine (cliente) como slot, para a tabela de
// preços não ir para o pacote do navegador.
export default function FaixaDePrecoDaVitrine() {
  if (PISOS_POR_SEXO.length === 0) return null;
  const cartao = PISOS_POR_SEXO.flatMap((piso) => {
    const texto = textoNoCartao(piso.cents);
    return texto ? [`${piso.rotulo}: ${texto}`] : [];
  });
  return (
    <section className="vp" aria-labelledby="vp-titulo">
      <div className="vp-miolo">
        <h2 id="vp-titulo" className="vp-titulo">
          Preço do Spitz Alemão Anão (Lulu da Pomerânia)
        </h2>
        <ul className="vp-lista">
          {PISOS_POR_SEXO.map((piso) => {
            const partes = partesDoPrecoNoPix(piso.cents);
            return (
              <li key={piso.sexo}>
                <Link href={`/filhotes/sexo/${piso.sexo}`} className="vp-item">
                  <span className="vp-rotulo">{piso.rotulo}</span>{" "}
                  <span className="vp-preco">
                    {partes.prefixo}{" "}
                    {/* Valor e "no PIX" não se separam na quebra de linha do celular. */}
                    <span className="vp-valor">
                      <strong>{partes.valor}</strong> {partes.sufixo}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <Link href="/blog/preco-spitz-alemao-anao" className="vp-guia">
          Como o preço é formado
          <ChevronRight aria-hidden="true" strokeWidth={2.4} />
        </Link>
      </div>
      {/* Cartão: total junto das parcelas (CDC art. 52). Fora de .vp-miolo
          porque no desktop a faixa é uma linha só, sem quebra. Sem taxa de
          cartão cadastrada, a linha não aparece. */}
      {cartao.length > 0 && <p className="vp-cartao">{cartao.join(" · ")}</p>}
    </section>
  );
}
