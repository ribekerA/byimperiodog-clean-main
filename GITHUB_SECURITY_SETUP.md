# Segurança do repositório — o que está no código e o que precisa ser clicado

**Repositório:** `ribekerA/byimperiodog-clean-main` — **público**.
**Branch de publicação:** `main`. Push em `main` publica o site na Netlify.

Este documento existe porque metade da proteção de um repositório não mora em
arquivo nenhum: mora em telas de configuração do GitHub, que só o dono da conta
consegue abrir. O que dá para versionar já está versionado e está marcado como
**FEITO** abaixo. O resto está marcado como **PENDENTE — AÇÃO HUMANA**, com o
caminho exato de onde clicar.

> **Regra deste arquivo:** nenhum valor de segredo entra aqui. Nem chave, nem
> token, nem senha, nem trecho de chave, nem "os primeiros caracteres para
> conferir". Um repositório público não é lugar de conferir segredo — e um
> segredo escrito num documento de segurança continua sendo um segredo vazado.
> Quando for preciso falar de um segredo, fala-se do **nome** da variável.

---

## 1. O que já está no repositório

| Item | Arquivo | O que faz |
|---|---|---|
| CI de qualidade e build | `.github/workflows/ci.yml` | Tipos, testes, encoding, palavras banidas, catálogo, lint e build de produção a cada push e PR. Lint **reprova** (não é mais `continue-on-error`). |
| Smoke do site público | `.github/workflows/ci.yml` (passo final) | Playwright contra a saída de produção. Não clica em CTA de WhatsApp, não envia formulário, não toca em pagamento. |
| Monitor de produção | `.github/workflows/seo-watch.yml` | 1×/dia lê as URLs críticas do site no ar. Silencioso quando está tudo certo. Zero URL verificada = falha. |
| Atualização de dependência | `.github/dependabot.yml` | Semanal, npm + github-actions, fila curta, **major de framework ignorado**, **sem auto-merge em lugar nenhum**. |
| Análise estática | `.github/workflows/codeql.yml` | CodeQL JS/TS a cada push, PR e 1×/semana. |

---

## 2. PENDENTE — AÇÃO HUMANA: proteções da aba Security

Caminho: **repositório → Settings → Code security**.

### 2.1 Secret scanning

- [ ] **Secret scanning: Enable**
- [ ] **Push protection: Enable**

Push protection é a que importa no dia a dia: ela **bloqueia o push** que carrega
um formato reconhecido de chave (Supabase, Google, OpenAI, AWS…) antes de o
commit existir no GitHub. Sem ela, o caminho é sempre o mesmo — o segredo chega
ao repositório público, e a partir daí a única saída é **rotacionar**, porque
remover o commit não desfaz quem já leu.

Em repositório público as duas são gratuitas.

### 2.2 Dependabot

- [ ] **Dependabot alerts: Enable**
- [ ] **Dependabot security updates: Enable**

`dependabot.yml` (já versionado) cuida da atualização **de rotina**. Estas duas
opções são outra coisa: são o aviso de **vulnerabilidade conhecida** numa versão
que o projeto usa hoje, e o PR de correção correspondente. Uma não substitui a
outra.

- [ ] **NÃO** habilitar auto-merge para nenhum desses PRs.

### 2.3 CodeQL

- [ ] **Code scanning → CodeQL analysis**: confirmar que o workflow versionado
      aparece como configurado ("Advanced" — é o arquivo `codeql.yml`).

Se em algum momento o repositório virar privado sem um plano que inclua Advanced
Security, o job passa a falhar por licença. A ação correta nesse caso é
**apagar `.github/workflows/codeql.yml`** — não deixar um job permanentemente
vermelho. Portão que vive vermelho para de ser lido, e aí nenhum portão funciona.

---

## 3. PENDENTE — AÇÃO HUMANA: proteção do branch `main`

Caminho: **Settings → Branches → Add branch ruleset** (ou *Branch protection
rules*), alvo `main`.

`main` publica. Um push direto e errado em `main` é um deploy errado no ar, sem
revisão e sem CI ter terminado.

- [ ] **Require a pull request before merging**
- [ ] **Require status checks to pass** → marcar o check **`Qualidade e build`**
      (nome do job em `ci.yml`)
- [ ] **Require branches to be up to date before merging**
- [ ] **Block force pushes**
- [ ] **Restrict deletions**
- [ ] Manter **linear history** (opcional, mas deixa o histórico legível)

Sobre "Require approvals": o repositório tem um mantenedor só. Exigir aprovação
de outra pessoa travaria o trabalho sem aumentar segurança nenhuma — o que
protege aqui é **o CI ter de passar** e **não dar para forçar push**. Se um dia
entrar uma segunda pessoa no projeto, aí sim vale exigir 1 aprovação.

> Isto **não** é configurado por script. Fazer isso exigiria um token de
> administração do repositório, e este projeto não cria token para automatizar
> configuração de segurança: o token viraria, ele próprio, o elo mais fraco.

---

## 4. Segredos: onde eles moram

| Onde | Para quê |
|---|---|
| Netlify → Site settings → Environment variables | Tudo que o site precisa em runtime e no build. |
| `.env.local` na máquina do desenvolvedor | Espelho local. **Nunca** versionado (`.gitignore`). |
| GitHub → Settings → Secrets and variables → Actions | Apenas se algum workflow precisar. Hoje **nenhum precisa**: CI e monitor rodam só com o que é público. |

Regras:

1. Nenhuma chave sensível pode ter prefixo `NEXT_PUBLIC_`. Esse prefixo empacota
   o valor no JavaScript entregue ao navegador — é publicação, não configuração.
2. Chave de serviço (a que ignora RLS no Supabase) só existe no servidor.
3. Se uma chave passar por qualquer lugar público — commit, log, print, chat,
   issue —, ela está **queimada**. O procedimento é rotacionar, não avaliar o
   risco. Rotação já executada uma vez neste projeto, em 20/08/2026.

---

## 5. Pendência conhecida — limite de escrita pública

`app/api/blog/comments/route.ts` é o único endpoint em que um desconhecido grava
uma linha no banco. Ele tem: moderação humana obrigatória (nasce não aprovado),
texto escapado na renderização, limite de tamanho de corpo, isca anti-robô,
tempo mínimo de preenchimento e contagem durável de enxurrada por artigo.

O que **falta**: limite global por IP. O limitador em memória que existe hoje no
arquivo **não** é limite global — em ambiente serverless cada instância tem o seu
Map, e uma rajada distribuída cai em processos diferentes. Isso está escrito no
próprio arquivo para ninguém contar com ele numa avaliação de risco.

Fazer direito exige guardar IP (ou hash de IP) com carimbo de tempo, ou seja,
**migração no banco de produção** — trabalho de rodada própria, com backup antes.
Ver `DISASTER_RECOVERY.md`.

---

## 6. Checklist rápido para quem for executar

```
Settings → Code security
  [ ] Secret scanning: Enable
  [ ] Push protection: Enable
  [ ] Dependabot alerts: Enable
  [ ] Dependabot security updates: Enable
  [ ] Code scanning: CodeQL configurado (workflow avancado)

Settings → Branches → ruleset em "main"
  [ ] Require a pull request before merging
  [ ] Require status checks: "Qualidade e build"
  [ ] Require branches to be up to date
  [ ] Block force pushes
  [ ] Restrict deletions
```
