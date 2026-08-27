# Recuperação de desastre

O que fazer quando o site sai do ar, quando um deploy quebra a vitrine, ou
quando o banco perde dado. Escrito para ser lido **durante** o problema: passo
numerado, na ordem, sem procurar nada.

Duas metades independentes:

| Metade | Onde vive | O que se perde se ela cair |
|---|---|---|
| **Site** | Netlify, publicado a partir de `main` | Vitrine, blog, páginas comerciais. Nada de dado do cliente. |
| **Banco** | Supabase, projeto `npmnuihgydadihktglrd` | Leads, contratos, posts do blog, comentários, configurações do admin. |

O site **não** depende do banco para existir: catálogo, preços e fotos são
código versionado (`content/puppies-static.ts`, `src/domain/pricing.ts`,
`public/`). Banco fora do ar derruba o admin e a captação de lead — não derruba
a vitrine. Isso é decisão de arquitetura, não sorte, e é o que torna a
recuperação do site trivial e a do banco a parte séria.

---

## 1. Deploy quebrou o site — rollback

**Sintoma:** o site publicou e alguma coisa quebrou — página em branco, erro 500,
build que passou mas quebrou em runtime.

1. **Netlify → Deploys.** A lista mostra cada publicação com o commit.
2. Abrir o último deploy **bom** (o anterior ao problema).
3. **Publish deploy** → confirmar.

O site volta em segundos. Esse botão **não** reconstrói nada: ele repõe uma saída
que já existia. Não gasta crédito de build e não depende do repositório estar
consertado.

4. **Só depois** consertar o código, com build local verde antes de empurrar.

> Rollback não é conserto: é parar a sangria. `main` continua com o commit ruim,
> e o próximo push republica o problema se ele não tiver sido corrigido.

Se o problema for **conteúdo** e não código (um texto errado, uma foto trocada),
não é caso de rollback — é caso de corrigir e publicar normalmente.

---

## 2. Banco: o que existe de backup

**PENDENTE — VERIFICAÇÃO HUMANA.** Backup automático no Supabase depende do plano
contratado, e o que vale para este projeto tem de ser lido no painel, não
suposto aqui:

- Supabase → **Database → Backups**: ver se há backup diário e qual a retenção.
- Supabase → **Database → Point in Time Recovery**: recurso pago; ver se está
  ativo. Com PITR dá para voltar a um instante; sem ele, volta-se ao último
  backup diário, e tudo o que entrou depois se perde.

- [ ] Anotar aqui, depois de conferir: retenção em dias e se PITR está ligado.

**Backup manual antes de qualquer migração destrutiva** (item 4) é obrigatório
independentemente do que o painel disser.

### O que nunca entra no Git

Dump de dados **não** é versionado. As tabelas que importam guardam dado pessoal
de gente real — `leads`, `lead_interactions`, `contracts`, `blog_comments`
(e-mail do autor), `newsletter_subscribers`, `admin_users`, `blog_gam_users`.
Um dump dessas tabelas num repositório **público** é vazamento, mesmo em branch
antiga, mesmo apagado depois.

Regra prática: `supabase/migrations/` guarda **estrutura**. Hoje são 13 arquivos
e **zero** instrução `INSERT` ou `COPY` — está assim de propósito, e é isso que
deve continuar verdadeiro. Backup de dado mora no Supabase e, se precisar sair de
lá, num lugar privado e cifrado — nunca no repositório.

---

## 3. Restaurar o banco

Ordem. Ela importa porque um site apontando para um banco meio restaurado grava
lixo por cima do que sobrou.

1. **Parar a escrita.** Netlify → desligar a função agendada `cron-due`
   (`netlify.toml`, roda a cada 15 min e escreve na fila de follow-up), ou
   despublicar o site pelo rollback do item 1. Restaurar com o site vivo por
   cima é como trocar o pneu andando.
2. **Restaurar no Supabase** — Backups → escolher o ponto → restaurar. Isso
   repõe o banco inteiro; não é preciso ordenar tabela por tabela.
3. **Conferir a estrutura**: `supabase db push` (`npm run supabase:db:push`)
   aplica migrações que sejam mais novas que o backup. Ele é aditivo — não apaga
   dado.
4. **Conferir as variáveis de ambiente.** Se o projeto Supabase for **outro**
   (recriado do zero), as chaves mudaram: Netlify → Environment variables →
   atualizar URL e chaves, e **rotacionar** o que estava no projeto antigo.
5. **Republicar o site** — Netlify → Deploys → Publish no deploy bom.
6. **Religar** o `cron-due`.
7. **Verificar** (item 5).

### O que nunca se faz

- `supabase db reset` **apaga o banco** e reaplica as migrações do zero. É
  comando de máquina local. Nunca apontado para produção — nem "para testar",
  nem "só para ver se as migrações estão certas".
- Restaurar por cima sem parar a escrita.
- Rodar migração destrutiva (`drop`, `alter ... drop column`, `truncate`) sem
  backup manual imediatamente antes. Backup de ontem não serve: o que se perde é
  o que entrou hoje.

---

## 4. Migração destrutiva — procedimento

Vale para qualquer `drop`, `truncate`, `alter column type` ou renomeação em
tabela com dado.

1. Backup manual no Supabase, **na hora**, antes de tudo.
2. Aplicar e testar no projeto de teste (item 6), com dado restaurado de backup.
3. Só então aplicar em produção, fora de horário de pico.
4. Verificar (item 5) antes de considerar terminado.

---

## 5. Verificação depois de restaurar

Nada disso é opcional: restauração que ninguém conferiu é restauração que talvez
não tenha acontecido.

```bash
npm run production:seo-watch
```

Lê as URLs críticas do site publicado com as mesmas regras do auditor. Zero URL
verificada é **erro**, não aprovação.

```bash
npm run route:validate:prod
```

Depois, à mão:

- [ ] Home, `/filhotes` e três fichas de cores diferentes abrem com foto e preço.
- [ ] `/blog` lista artigos — se o banco voltou vazio, os posts do Supabase somem
      e só os MDX versionados aparecem. Isso é sinal de restauração incompleta.
- [ ] `/admin/dashboard` sem sessão redireciona para `/admin/login`; com login,
      a lista de leads carrega e mostra os leads antigos.
- [ ] Contagem de leads do último mês bate com o esperado. Se voltou zerada, o
      backup restaurado é anterior ao que se pensava.
- [ ] Nenhum selo de status ou preço estranho na vitrine.

Teste de **escrita** (mandar um lead de verdade pelo formulário) fica para o
projeto de teste, não para produção: leads de mentira na fila de atendimento
custam tempo de gente e sujam a base que acabou de ser recuperada.

---

## 6. Ensaio de restauração — ambiente de teste

**PENDENTE — AÇÃO HUMANA.** Backup que nunca foi restaurado é uma esperança, não
um backup. O ensaio precisa acontecer pelo menos uma vez, e nunca em produção.

Como fazer, sem risco nenhum para o site no ar:

1. Criar um **segundo projeto Supabase** (`byimperiodog-staging`), separado.
2. Restaurar nele um backup recente do projeto de produção.
3. `supabase db push` apontado para ele, confirmando que as migrações aplicam
   limpo.
4. Rodar o site **localmente** com `.env.local` apontando para o projeto de teste
   (`npm run build && npm run start`) e percorrer a lista do item 5, inclusive o
   teste de escrita.
5. Anotar abaixo a data e o que falhou.
6. **Apagar o projeto de teste** quando terminar — ele contém dado pessoal real
   restaurado do backup, e projeto esquecido com dado de cliente é o mesmo
   problema de segurança, só que sem ninguém olhando.

| Data do ensaio | Backup usado | Resultado | Quem fez |
|---|---|---|---|
| — | — | nunca executado | — |

Alternativa mais barata, se criar um segundo projeto for inconveniente: rodar o
Supabase local (`npm run supabase:start`) e aplicar só as migrações — prova que a
estrutura reconstrói, **não** prova que o backup de dado presta. Vale como meio
ensaio, e deve ser registrado como meio ensaio.

---

## 7. Contatos e identificadores

| O quê | Valor |
|---|---|
| Domínio canônico | `https://byimperiodog.com.br` (sem `www`) |
| Repositório | `ribekerA/byimperiodog-clean-main` — **público** |
| Branch que publica | `main` |
| Netlify | site `7bd02368-137b-4cc8-8fbe-f56b0f9eb54e` |
| Supabase | projeto `npmnuihgydadihktglrd` |
| E-mail do canil | `contato@byimperiodog.com.br` |

Chave, token e senha **não** aparecem neste arquivo nem em nenhum outro do
repositório. Onde cada segredo mora está em `GITHUB_SECURITY_SETUP.md`, seção 4 —
o nome da variável, nunca o valor.
