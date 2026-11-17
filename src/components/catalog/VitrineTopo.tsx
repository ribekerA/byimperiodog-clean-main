import { ShieldCheck } from "lucide-react";
import Image from "next/image";

import { faseDoNatal } from "@/lib/temporada";

// Topo de /filhotes, no desenho aprovado em 06/11/2026: foto, título e cápsula.
// O que vem abaixo dele está em VitrineFilhotes.
export default function VitrineTopo() {
  // Mesma troca do topo da home: as duas fotos no HTML, o CSS mostra uma pelo
  // data-tema do <html>, e a prioritária é a que o servidor espera ver.
  const natal = faseDoNatal() !== null;
  return (
    <div className="vt">
      <div className="vt-topo">
        {/* Os alts descrevem a ilustração e não atribuem o animal ao canil: não há
            registro de que seja foto de um filhote daqui. */}
        <Image
          src="/images/vitrine/topo-filhote-creme.webp"
          width={1024}
          height={600}
          priority={!natal}
          loading={natal ? "lazy" : undefined}
          fetchPriority={natal ? "low" : "high"}
          sizes="(max-width: 1229px) 100vw, 1229px"
          alt="Filhote de Spitz Alemão Anão (Lulu da Pomerânia) creme sentado em um jardim."
          className="vt-topo-foto so-fora-do-natal"
        />
        <Image
          src="/images/vitrine/topo-filhote-creme-natal.webp"
          width={1024}
          height={600}
          priority={natal}
          loading={natal ? undefined : "lazy"}
          fetchPriority={natal ? "high" : "low"}
          sizes="(max-width: 1229px) 100vw, 1229px"
          alt="Filhote de Spitz Alemão Anão (Lulu da Pomerânia) creme de gorro de Papai Noel, diante de uma árvore de Natal."
          className="vt-topo-foto so-no-natal"
        />
        <div className="vt-topo-veu" aria-hidden="true" />
        <div className="vt-miolo vt-topo-texto">
          <h1 className="vt-titulo">
            Spitz Alemão{" "}
            <span className="vt-titulo-linha">
              <span className="vt-titulo-anao">Anão</span>{" "}
              <span className="vt-titulo-lulu">
                (Lulu da <span className="vt-quebra">Pomerânia)</span>
              </span>
            </span>
            <span className="sr-only"> — filhotes</span>
          </h1>
          <p className="vt-frase">Beleza, carinho e companheirismo em um só pet.</p>
          <svg className="vt-traco" viewBox="0 0 165 14" fill="none" aria-hidden="true">
            <path d="M1 12C45 3 110 1 164 2C110 4 55 7 1 12Z" fill="#e8c56f" />
          </svg>
          <p className="vt-capsula">
            <ShieldCheck aria-hidden="true" strokeWidth={2.4} />
            <span>
              Canil com procedência <span className="vt-quebra">e suporte especializado</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
