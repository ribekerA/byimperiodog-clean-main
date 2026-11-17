import Link from "next/link";

// Faixa do tema de Natal, no alto de todas as páginas públicas. Sai sempre no
// HTML, mas fica escondida pelo CSS; só aparece com `data-tema="natal"` no
// <html>, que o script de src/lib/temporada.ts põe antes da primeira pintura.
// Por isso ela não empurra a página depois de carregada.
//
// As frases não prometem data de entrega: isso o canil ainda não confirmou.

function Estrela() {
  return (
    <svg className="faixa-natal-estrela" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2l2.6 6.9L22 9.3l-5.8 4.6 2 7.1L12 17l-6.2 4 2-7.1L2 9.3l7.4-.4z" fill="currentColor" />
    </svg>
  );
}

export default function FaixaSazonal() {
  return (
    <div className="faixa-natal" role="region" aria-label="Recado de fim de ano">
      <p className="faixa-natal-familia">
        <Estrela />
        <Link href="/filhotes">
          <strong>Família nova</strong> neste Natal: venha conhecer os filhotes de Lulu da Pomerânia da By Imperio Dog.
        </Link>
        <Estrela />
      </p>
      <p className="faixa-natal-festas">
        <Estrela />
        <span>
          <strong>Boas festas</strong> e um ano novo com um Lulu da Pomerânia na família!
        </span>
        <Estrela />
      </p>
    </div>
  );
}
