/**
 * Funcao agendada da Netlify: cron-due
 *
 * A Netlify nao sabe agendar rota do Next. Entao o agendamento vive aqui (o
 * horario esta em netlify.toml, bloco [functions."cron-due"]) e esta funcao so
 * bate nos endpoints que o site ja tinha e que nunca eram chamados:
 *
 *   - /api/cron/publish-scheduled  posts agendados na tabela de eventos
 *                                  blog_post_schedule_events
 *   - /api/blog/publish-due        posts agendados em blog_posts.scheduled_at
 *   - /api/cron/autosales-due      fila de follow-up dos leads
 *
 * Sao dois caminhos de agendamento de blog porque o banco tem os dois, cada um
 * escrito por uma tela diferente do admin. Chamar os dois e mais barato do que
 * adivinhar qual esta em uso — quando nao ha nada vencido, cada um responde
 * "0" sem escrever nada.
 *
 * O agendamento de vendas NAO envia mensagem para ninguem: ele so deixa o texto
 * pronto em autosales_logs com status "queued" para a responsavel revisar em
 * /admin/autosales.
 *
 * Autenticacao: manda CRON_SECRET quando a variavel existir. Sem ela os
 * endpoints continuam abertos e a chamada funciona igual.
 */

const ALVOS = [
  { caminho: "/api/cron/publish-scheduled", metodo: "GET", o_que: "blog (eventos)" },
  { caminho: "/api/blog/publish-due", metodo: "POST", o_que: "blog (scheduled_at)" },
  { caminho: "/api/cron/autosales-due", metodo: "GET", o_que: "fila de follow-up" },
];

export default async () => {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.NEXT_PUBLIC_SITE_URL;

  if (!base) {
    console.error("[cron-due] sem URL do site no ambiente — nada a fazer");
    return new Response("sem URL do site", { status: 500 });
  }

  const segredo = process.env.CRON_SECRET;
  const headers = segredo ? { authorization: `Bearer ${segredo}` } : {};
  const resultados = [];

  for (const alvo of ALVOS) {
    const inicio = Date.now();
    try {
      // 25s por chamada: a funcao agendada tem 30s antes de ser cortada, e um
      // endpoint travado nao pode impedir os outros dois de rodarem.
      const resposta = await fetch(`${base}${alvo.caminho}`, {
        method: alvo.metodo,
        headers,
        signal: AbortSignal.timeout(25_000),
      });
      const corpo = await resposta.text();
      resultados.push({
        alvo: alvo.o_que,
        caminho: alvo.caminho,
        status: resposta.status,
        ms: Date.now() - inicio,
        corpo: corpo.slice(0, 300),
      });
    } catch (erro) {
      resultados.push({
        alvo: alvo.o_que,
        caminho: alvo.caminho,
        status: 0,
        ms: Date.now() - inicio,
        erro: String(erro),
      });
    }
  }

  const falhas = resultados.filter((r) => r.status !== 200);
  // Log sempre: e por ele que se descobre um endpoint quebrado sem esperar
  // alguem reclamar que o agendamento parou.
  console.log("[cron-due]", JSON.stringify({ falhas: falhas.length, resultados }));

  return new Response(JSON.stringify({ ok: falhas.length === 0, resultados }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
