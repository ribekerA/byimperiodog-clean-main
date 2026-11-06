// Texto de foto e legenda de um filhote. O nome publicado quase sempre já traz a
// raça, a cor e o sexo; repetir tudo depois dele daria "Lulu da Pomerânia" duas
// vezes na mesma frase.
export function descricaoDoFilhote(nome: string, cor: string, sexo: string): string {
  if (/lulu\s+da\s+pomer/i.test(nome)) return nome;
  return `${nome} — Spitz Alemão Anão (Lulu da Pomerânia) ${cor} ${sexo}`.trim();
}
