// Tema de Natal (aprovado em 17/11/2026): liga sozinho em 1º/12 e desliga
// em 1º/1, à meia-noite de Brasília, no horário de Brasília. Mudar as datas é mudar
// só as duas constantes abaixo; o resto do site lê daqui.
//
// Duas fases:
// - "familia" (1º a 25/12): faixa "Família nova";
// - "festas" (26/12 a 31/12): a faixa vira "Boas festas".
//
// Quem decide o visual é o atributo `data-tema="natal"` no <html>, posto pelo
// script SCRIPT_DO_TEMA antes da primeira pintura, em todas as páginas, inclusive
// as estáticas. Sem script (ou fora da data), o site fica como sempre foi.
//
// Prévia fora da data: abra qualquer página com `?tema=natal` (ou `?tema=festas`).
// A prévia depende do parâmetro na URL e não persiste até o dia seguinte; `?tema=normal` desfaz.

export const NATAL_INICIO = { mes: 12, dia: 1 } as const;
export const NATAL_FIM = { mes: 12, dia: 31 } as const;
/** Último dia da fase "Família nova". Do dia seguinte até NATAL_FIM, "Boas festas". */
export const NATAL_VIRADA = { mes: 12, dia: 25 } as const;

export type FaseDoNatal = "familia" | "festas" | null;

const md = (d: { mes: number; dia: number }) => d.mes * 100 + d.dia;
const INICIO = md(NATAL_INICIO);
const FIM = md(NATAL_FIM);
const VIRADA = md(NATAL_VIRADA);

/** Fase do Natal num mês/dia (MMDD). A temporada atravessa a virada do ano. */
export function faseNoDia(mmdd: number): FaseDoNatal {
  if (mmdd >= INICIO && mmdd <= VIRADA) return "familia";
  if (mmdd > VIRADA && mmdd <= FIM) return "festas";
  return null;
}

/** Fase do Natal agora, no horário de Brasília. */
export function faseDoNatal(agora: Date = new Date()): FaseDoNatal {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    month: "numeric",
    day: "numeric",
  }).formatToParts(agora);
  const mes = Number(partes.find((p) => p.type === "month")?.value);
  const dia = Number(partes.find((p) => p.type === "day")?.value);
  return faseNoDia(mes * 100 + dia);
}

// A mesma regra de faseNoDia, em JavaScript puro, para rodar no <head>.
// `faseNoDia` e este texto precisam concordar: o teste em
// tests/unit/temporada.test.ts executa os dois e compara dia a dia.
export const SCRIPT_DO_TEMA = `try{var f=null,q=null;try{q=new URLSearchParams(location.search).get('tema');if(q==='natal'||q==='familia'||q==='festas'||q==='normal'){f=q==='natal'?'familia':q}}catch(e){}if(!f){var p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',month:'numeric',day:'numeric'}).formatToParts(new Date()),m=0,d=0;for(var i=0;i<p.length;i++){if(p[i].type==='month')m=+p[i].value;if(p[i].type==='day')d=+p[i].value}var n=m*100+d;f=(n>=${INICIO}&&n<=${VIRADA})?'familia':(n>${VIRADA}&&n<=${FIM})?'festas':'normal'}if(f==='familia'||f==='festas'){var h=document.documentElement;h.setAttribute('data-tema','natal');h.setAttribute('data-natal-fase',f)}}catch(e){}`;
