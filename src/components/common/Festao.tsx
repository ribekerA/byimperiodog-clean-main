// Festão de pinheiro entre as seções. Só aparece com o tema de Natal ligado
// (html[data-tema="natal"], ver src/lib/temporada.ts); fora dele é display:none
// e a imagem nem é baixada, porque ela vem do CSS.
export default function Festao() {
  return <div className="festao-natal" aria-hidden="true" />;
}
