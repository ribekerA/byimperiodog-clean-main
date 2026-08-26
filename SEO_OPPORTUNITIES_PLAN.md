# Plano de Oportunidades de SEO

**Status: BLOQUEADO POR CREDENCIAL DO SEARCH CONSOLE.**
Este bloqueio **não impede o deploy**. Ele impede três decisões específicas — listadas
na seção 3 — que não podem ser tomadas por leitura de código.

Última revisão: 2026-08-26.

---

## 1. Por que este arquivo existe

O projeto já tem a integração com o Google Search Console escrita e funcionando:

- `src/lib/gsc.ts` — `fetchGscData(days)` e `isGscConfigured()`
- `app/api/admin/seo/gsc/route.ts` — rota do painel, protegida por `requireAdminApi`
- `app/api/admin/seo/suggestions/route.ts` — fila de sugestões, também protegida

O que falta não é código. Falta a credencial:

| Variável | Situação hoje |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | **NÃO CONFIGURADA** |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | **NÃO CONFIGURADA** |

Sem as duas, `isGscConfigured()` devolve `false` e a rota responde
`GSC_NOT_CONFIGURED` — comportamento correto, não é defeito.

**Quem configura é a pessoa responsável, não o assistente.** Chave de conta de
serviço é segredo; ela não passa por este chat, não entra em arquivo do
repositório e não é digitada por mim em nenhum painel. O caminho é:

1. No Google Cloud, criar uma conta de serviço e gerar a chave JSON.
2. No Search Console da propriedade `https://byimperiodog.com.br`, adicionar o
   e-mail dessa conta de serviço como usuário **restrito** (leitura basta).
3. No Netlify → Site settings → Environment variables, cadastrar
   `GOOGLE_SERVICE_ACCOUNT_KEY` (o JSON inteiro) e
   `GOOGLE_SEARCH_CONSOLE_SITE_URL` (`https://byimperiodog.com.br/`).

Permissão de leitura é suficiente e é a que se deve dar. A integração só lê.

---

## 2. O que roda no minuto seguinte à credencial entrar

Nada aqui exige código novo. É operar o que já existe.

1. **Painel → SEO → GSC, janela de 28 dias.** Confirmar que retorna linhas.
2. **Exportar consultas e páginas** dos últimos 90 dias (`?days=90`).
3. **Cruzar consulta × página.** É esse cruzamento que responde as perguntas da
   seção 3 — nenhuma delas se responde olhando o HTML.

---

## 3. As três decisões que estão esperando dado

Estas ficaram explicitamente em aberto durante a auditoria. Em todas elas a
instrução foi a mesma: **não apagar, não colocar noindex e não redirecionar às
cegas.** Uma página que traz busca é ativo; matar por suspeita é perda real.

### 3.1 As três páginas regionais

`/filhotes/sao-paulo`, `/filhotes/minas-gerais`, `/filhotes/rio-de-janeiro`.

A dúvida é se elas funcionam como página de destino legítima ou como *doorway* —
três URLs quase idênticas competindo entre si e com `/filhotes`.

O que o dado precisa mostrar, por página:

- **Impressões e cliques próprios.** Página que não aparece para ninguém não é
  ativo; é manutenção sem retorno.
- **Consultas exclusivas.** Se as três aparecem para o mesmo conjunto de termos,
  são a mesma página escrita três vezes.
- **Canibalização com `/filhotes`.** Se para "spitz alemão anão" o Google
  alterna entre `/filhotes` e `/filhotes/sao-paulo`, o site está disputando
  consigo mesmo.

Critérios combinados **antes** de ver o número, para o dado não ser lido
conforme a conveniência:

| Leitura do dado | Decisão |
|---|---|
| Consultas próprias e cliques próprios | **Manter e melhorar.** Conteúdo específico de verdade sobre entregar naquele estado. |
| Impressões sem clique, consultas iguais às de `/filhotes` | **Consolidar.** Uma página de entrega/atendimento por região, 301 das outras duas. |
| Zero impressão em 90 dias | **Consolidar.** Sem tráfego não há o que preservar; o 301 devolve o pouco de sinal que exista. |

Nenhuma dessas decisões entra sem os 90 dias na mão.

### 3.2 Inventário do blog — o que atualizar, fundir ou aposentar

São 30 artigos em `content/posts/`. A classificação (MANTER / ATUALIZAR /
FUNDIR / CONSOLIDAR / NOINDEX / APAGAR-301) depende de saber quais trazem busca.

Ordem de trabalho depois do dado:

1. **Traz clique e está desatualizado** → atualizar primeiro. É o melhor retorno
   por hora de trabalho que existe no site.
2. **Dois artigos disputando a mesma consulta** → fundir no que já tem
   histórico, 301 do outro.
3. **Zero impressão em 90 dias e sem função comercial** → decidir caso a caso,
   com a pessoa responsável. Apagar conteúdo correto e honesto porque ainda não
   ranqueou é frequentemente cedo demais.

### 3.3 Palavras que o site já quase alcança

O relatório de consultas mostra termos em que a página aparece na posição 8–20:
o Google já entende do que o site trata, mas ainda escolhe outro. É aí que
melhorar um artigo que já existe vale mais do que escrever um novo.

**Não vale como resposta:** criar página nova para cada variação encontrada.
Fábrica de cauda longa é exatamente o que a auditoria proibiu.

---

## 4. O que não depende de credencial (e já foi feito)

Para não passar a impressão de que o SEO está parado esperando um JSON:

- Marcação `FAQPage` removida (o Google aposentou o rich result de FAQ em maio
  de 2026); as perguntas continuam visíveis na página, que é o que serve ao
  leitor.
- `max-image-preview: large`, `max-snippet: -1`, `max-video-preview: -1`.
- `LocalBusiness` único, sem duplicar por estado.
- `areaServed` honesto, sem raio geográfico inventado.
- Preço, cor e disponibilidade vindos de uma fonte só.
- Cabeçalho de cache de 30 dias em `/filhotes/*` e `/clientes/*`, onde as fotos
  do catálogo realmente moram.

---

## 5. Como sair do bloqueio

Uma coisa só: cadastrar as duas variáveis da seção 1 no Netlify. Feito isso,
este arquivo deixa de estar bloqueado e a seção 2 roda no mesmo dia.
