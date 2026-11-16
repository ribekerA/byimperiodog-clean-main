# Google Ads API — passo a passo para o painel responder com dados reais

Para quem vai executar: dono da conta do Google Ads e do projeto do Google Cloud
`byimperiodog` (o mesmo que já serve GA4 e GTM). Nada aqui roda no código do
site: o código já está pronto e esperando credencial.

## Onde isto está hoje

Verificado no repositório e na própria conta em 07/11/2026, não suposto:

- Os três portões abaixo já passaram **em local**. A API está habilitada, o nível
  do projeto é Exploração, e `.env.local` tem `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN` e
  `INTEGRATIONS_ENCRYPTION_KEY`.
- `google_ads` está conectado desde 07/11/2026 13:05:27 UTC, no usuário admin
  real, com a conta **316-551-9817** ("Karen Cristina Ferreira", BRL,
  America/Sao_Paulo) escolhida. As dez rotas de `/api/admin/google-ads/`
  respondem 200.
- A outra conta do login, 112-221-5039, está desativada e devolve 403 em
  qualquer consulta. Não é falta de permissão: a conta morreu.
- Falta produção. As variáveis não estão no Netlify e as três URIs de
  redirecionamento de produção não estão registradas no Google Cloud. A
  `INTEGRATIONS_ENCRYPTION_KEY` do Netlify precisa ser idêntica à local, byte a
  byte — senão o token guardado fica ilegível e o painel pede reconexão sem dizer
  por quê. `GOOGLE_ADS_LOGIN_CUSTOMER_ID` fica vazia.
- A tela de consentimento está em "Testando", então o refresh token vence em 7
  dias: **reconectar até 14/11/2026**.

São três portões em série, e eles falham nesta ordem. Pular um faz o painel
mentir de um jeito específico: conta aparecendo como conectada e devolvendo lista
vazia.

| # | Portão | Onde se resolve |
|---|--------|-----------------|
| 1 | Nível de acesso do projeto no Google Cloud | console do Google Cloud |
| 2 | Credenciais OAuth no ambiente | Netlify (e `.env.local` para testar local) |
| 3 | Conta de Ads conectada e escolhida | `/admin/config/google-ads` |

## 1. Habilitar a Google Ads API no projeto

1. Abra <https://console.cloud.google.com/apis/library> e confira no seletor do
   topo que o projeto é o mesmo que já serve GA4 e GTM (`byimperiodog`).
2. Procure **Google Ads API** e clique em **Ativar**.

Sem isto o passo 2 não existe: a tela de nível de acesso só aparece para projeto
com a API habilitada.

## 2. Ver e subir o nível de acesso do projeto

Este é o portão que o código não consegue contornar.

1. Abra <https://console.cloud.google.com/google/ads-apis/overview>.
2. Veja o nível atual. Projeto novo nasce em **Test**.
3. Clique em **Upgrade access level** e peça **Explorer**.

O que cada nível significa na prática:

- **Test** — 15.000 operações por dia, mas só responde por conta de teste.
  Chamada em conta real falha (`CLOUD_PROJECT_NOT_APPROVED_FOR_PRODUCTION` nas
  versões recentes da API). É aqui que nasce o "conectou e não veio nada".
- **Explorer** — 2.880 operações por dia já em conta de produção, liberado de
  forma automática. É o nível mínimo para o painel servir para algo, e sobra para
  um painel operado à mão.
- **Basic** — revisão automatizada, costuma sair em minutos, mas exige
  verificação de marca do projeto. Vale quando as 2.880 operações apertarem.
- **Standard** — revisão manual do Google, e só depois de Basic.

Dois detalhes que economizam busca:

- **Developer token não é mais exigido.** O Google desligou o developer token em
  09/09/2026: o nível de acesso passou a pertencer ao projeto do Google Cloud que
  emitiu as credenciais OAuth, e o cabeçalho `developer-token`, quando enviado, é
  ignorado. O painel aceita `GOOGLE_ADS_DEVELOPER_TOKEN` se um projeto antigo
  ainda tiver um guardado, mas não pede. `ads.google.com/aw/apicenter`, a antiga
  Central de API, está desativada.
- **Conta gerenciadora (MCC) só se houver várias contas.** Para operar uma conta
  só, não precisa de MCC e `GOOGLE_ADS_LOGIN_CUSTOMER_ID` fica vazia — mandar
  esse cabeçalho sem ser gerenciador faz o Google recusar a chamada.

## 3. Cliente OAuth, redirect e escopo

1. Em <https://console.cloud.google.com/apis/credentials>, reutilize o cliente
   OAuth do tipo **Aplicativo da Web** que já serve GA4 e GTM, ou crie um.
2. Em **URIs de redirecionamento autorizados**, acrescente:

   ```
   https://byimperiodog.com.br/api/integrations/google_ads/callback
   ```

   E, se for testar na máquina:

   ```
   http://localhost:3000/api/integrations/google_ads/callback
   ```

3. Na tela de consentimento, acrescente o escopo
   `https://www.googleapis.com/auth/adwords`.

Sobre esse escopo: **não existe versão somente-leitura**. `adwords` é escopo
único de leitura e escrita. Quem autoriza aqui autoriza criar campanha, mexer em
orçamento e pausar anúncio — é o que o painel usa para as abas de otimização e
nova campanha, e é por isso que o aviso está escrito na tela antes do clique.

### A armadilha dos 7 dias

Tela de consentimento externa com status **Testing** faz o refresh token expirar
em 7 dias para qualquer escopo fora de nome, e-mail e perfil — e `adwords` é um
deles. Na prática: o painel pede reconexão toda semana, sem erro que explique o
motivo. Publicar o app (**In production**) resolve; com escopo sensível a
publicação passa por verificação do Google. Enquanto estiver em Testing, mantenha
a sua conta na lista de **Test users** (a mesma tela descrita em
[OAUTH_SETUP_FINAL.md](OAUTH_SETUP_FINAL.md)).

## 4. Variáveis no ambiente

Na Netlify, em **Site configuration → Environment variables** (e no `.env.local`
se for testar local):

| Variável | O que é |
|----------|---------|
| `GOOGLE_CLIENT_ID` | do cliente OAuth do passo 3 |
| `GOOGLE_CLIENT_SECRET` | do mesmo cliente |
| `INTEGRATIONS_ENCRYPTION_KEY` | chave que cifra o refresh token na tabela `integrations`; mínimo 32 bytes |
| `NEXT_PUBLIC_SITE_URL` | `https://byimperiodog.com.br`, usado para montar o redirect |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | só com MCC; fora disso, vazia |
| `GOOGLE_ADS_API_VERSION` | opcional, formato `vNN`; vazia usa a versão fixada no código |

Para gerar a chave de cifra:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Guarde essa chave. Trocá-la depois não quebra o build, mas torna ilegível todo
refresh token já gravado — o sintoma é reconexão exigida sem explicação, e o
conserto é reconectar.

Netlify só lê variável nova em build novo: depois de salvar é preciso **Trigger
deploy**. Como cada build consome crédito, vale juntar isso com o próximo deploy
em vez de gastar um só para as variáveis.

## 5. Conectar e escolher a conta

1. Abra `/admin/config/google-ads` e faça o login do admin.
2. Clique em **Verificar**. O cartão "Credenciais" precisa dizer *completas*; se
   listar variável faltando, é o passo 4 que não chegou ao build.
3. Clique em conectar com o Google e autorize.
4. Escolha a conta do Google Ads. Login com acesso a várias contas não define
   qual delas é esta, e tudo nas outras abas depende dessa escolha.
5. Se a conta aparecer marcada como **conta de teste**, o nível do projeto ainda
   é Test — volte ao passo 2.

## 6. O que o painel passa a mostrar

Com os três portões abertos, o relatório sai da própria conta:

- campanhas com custo, cliques, impressões, CTR, CPC e conversões por período;
- termos de busca, com os que só gastaram sinalizados;
- desempenho por palavra-chave;
- recomendações do Google, separadas por risco de gasto, porque aplicar
  recomendação de orçamento sem ler é o jeito mais rápido de dobrar custo;
- ações de conversão da conta, que é de onde saem o `AW-` e os labels.

## Quando der errado

| Sintoma | Causa provável |
|---------|----------------|
| Conta real conectada, lista vazia | Nível do projeto em Test (passo 2) |
| `CLOUD_PROJECT_NOT_APPROVED_FOR_PRODUCTION` | O mesmo: projeto não aprovado para produção |
| Botão de conectar não leva a nada | `GOOGLE_CLIENT_ID`/`SECRET` ausentes no build (passo 4) |
| Reconexão exigida toda semana | Tela de consentimento em Testing (passo 3) |
| `redirect_uri_mismatch` | URI do passo 3 diferente do domínio que serviu a página |
| Chamada recusada citando `login-customer-id` | Variável de MCC preenchida sem ser gerenciador |
| Token gravado some depois de trocar chave | `INTEGRATIONS_ENCRYPTION_KEY` mudou; reconectar |

Nomes de variável, limites de nível e a data do desligamento do developer token
valem para novembro de 2026; o Google muda esses números sem aviso, e a tela de
nível de acesso é sempre a fonte mais atual.
