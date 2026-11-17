// Texto de foto e legenda de um filhote. O nome publicado quase sempre já traz a
// raça, a cor e o sexo; repetir tudo depois dele daria "Lulu da Pomerânia" duas
// vezes na mesma frase.
export function descricaoDoFilhote(nome: string, cor: string, sexo: string): string {
  if (/lulu\s+da\s+pomer/i.test(nome)) return nome;
  return `${nome} — Spitz Alemão Anão (Lulu da Pomerânia) ${cor} ${sexo}`.trim();
}

// Texto do botão de WhatsApp de um filhote: "Perguntar pela Branca", "Perguntar
// pelo Preto". Substituiu "Ver disponibilidade" (crítica de design de
// 17/11/2026): o botão ficava ao lado do selo "Disponibilidade a confirmar" e
// prometia uma consulta de estoque que o site não faz. Sem cor conhecida, o
// botão diz só para onde leva.
export function perguntarPeloFilhote(cor: string, sexo: string): string {
  const femea = /^f[eê]mea$|^female$/i.test(sexo.trim());
  const base = cor.trim();
  if (!base) return "Perguntar pelo WhatsApp";
  const capitalizada = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
  return femea ? `Perguntar pela ${capitalizada.replace(/o$/, "a")}` : `Perguntar pelo ${capitalizada}`;
}
