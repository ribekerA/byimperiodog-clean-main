# Auditoria de marca (brand): byimperiodog.com.br, 17/11/2026

**Base:**
- O código local, com as correções de estilo de hoje ainda sem commit.
- O site ao vivo: 9 páginas lidas com Playwright, de onde saíram a imagem de compartilhamento, o título, os textos dos botões de WhatsApp e as fontes.
- Os arquivos de logo, ícone e imagem de compartilhamento abertos um a um.

**Critérios:** o checklist de consistência da skill brand, que cobre:
- logo
- cores
- tipografia
- imagens
- tom de voz
- termos da marca
- chamadas para ação
- canais (site, e-mail, ícones e compartilhamento)

---

## 1. O que está bem

| Critério | Resultado |
|---|---|
| **Nome da marca** | "By Imperio Dog" aparece 523 vezes no código. As variações se limitam ao contrato em PDF (maiúsculas), ao `short_name` do app ("Imperio Dog") e a palavras-chave de busca. No cabeçalho e no rodapé, o nome sai igual, com ®. |
| **Assinatura visual do site** | A coroa dourada mais "By Imperio Dog® Sementinhas de Amor" aparece igual no cabeçalho e no rodapé. |
| **Tipografia** | Ao vivo, as 9 páginas usam só DM Sans e Playfair Display. |
| **Títulos** | Todos terminam em "\| By Imperio Dog". |
| **Raça** | "Spitz Alemão Anão (Lulu da Pomerânia)" é cobrado pelos guardas de conteúdo. |
| **Paleta** | Verde-mata e dourado em variáveis. Os dourados ganharam `--ouro-*` hoje. |

---

## 2. Problemas, do mais ao menos importante

### 2.1 Três identidades diferentes (alto)

Quem encontra a marca fora do site vê outra coisa:

| Onde aparece | O que mostra |
|---|---|
| Cabeçalho e rodapé do site | Coroa dourada, nome em Playfair, fundo verde-escuro |
| Logo do Google (`byimperiologo.png`, usado no schema `Organization.logo`) | Foto de um filhote laranja sobre fundo branco, sem nome e sem coroa |
| `byimperiologo.svg` (97 KB) | A mesma foto vetorizada automaticamente, com quadrado branco de fundo. Só o `Navbar.tsx` usa, e ele não aparece no site. |
| Favicon, ícone do iPhone e ícones do app (192/512) | O mesmo filhote em versão "posterizada", de manchas de cor, sobre fundo branco |

- **Consequência:** na aba do navegador, na tela inicial do celular e no painel do Google, a marca é um filhote genérico. Não aparecem nem a coroa nem o nome que o visitante vê no site.
- **Correção:**
  - Um ícone com a coroa dourada sobre o verde-escuro do site, em 16, 32, 180, 192 e 512 px.
  - Um logo horizontal, coroa mais nome, para o schema.
  - A coroa já existe em `public/images/home/coroa.webp`, então não precisa criar desenho novo.

### 2.2 Imagem de compartilhamento sem a marca (alto)

- Ao vivo, todas as páginas mandam para WhatsApp, Facebook e Google uma de duas imagens: `og-default.jpg` ou `spitz-hero-desktop.webp`.
  - As duas são a mesma foto: 13 Spitz num gramado.
  - Nenhuma traz nome, coroa ou endereço.
  - A foto tem cara de imagem gerada por IA. **Não confirmei isso.** Se for, ela contradiz a regra do site de só mostrar o que é verdade, e é a primeira imagem que alguém vê quando o link é compartilhado no WhatsApp.
- `app/(public)/opengraph-image.tsx` desenha outro cartão, em verde-claro (`#16a34a`, verde padrão do Tailwind) e fonte do sistema, fora da paleta. Ao vivo, nenhuma das 9 páginas usa esse cartão.
- **Correção:** um cartão de 1200×630 no padrão do site:
  - fundo verde-mata
  - coroa
  - "By Imperio Dog® · Sementinhas de Amor" em Playfair
  - uma foto real do plantel
  - "Bragança Paulista, SP"

  O mesmo cartão passa a ser usado em todas as páginas. O `opengraph-image.tsx` é apagado ou passa a gerar esse cartão.

### 2.3 Nome jurídico diferente em cada lugar (médio, só você sabe a resposta)

| Onde | Nome |
|---|---|
| `src/domain/config.ts` (`legalName`, vai para o schema) | "By Imperio Dog Criação de Spitz Alemão" |
| Contrato na tela e no PDF (`contractPdf.ts`, "Razão Social") | "BY IMPERIO DOG" |

- Num contrato, a razão social precisa ser a do CNPJ.
- **Resolvido em 17/11/2026:** o usuário confirmou que a razão social é "By Imperio Dog". O `legalName` foi trocado; o contrato já usava esse nome, em maiúsculas.

### 2.4 Duas frases de assinatura (médio)

- Visível no site: **"Sementinhas de Amor"**, ao lado do nome.
- Schema (`slogan`): "Criadora especializada em Spitz Alemão Anão (Lulu da Pomerânia)". Isso é uma descrição, não um slogan.
- **Correção:**
  - `slogan` passa a ser "Sementinhas de Amor".
  - A frase descritiva continua no `description`, onde já está.

### 2.5 Botões de WhatsApp com 19 textos diferentes (médio)

Contados ao vivo nas 9 páginas:

| Texto | Vezes |
|---|---|
| Tirar dúvida pelo WhatsApp | 52 |
| Ver disponibilidade | 20 |
| Conversar agora | 11 |
| Conversar agora — sem compromisso | 9 |
| Conversar no WhatsApp | 9 |
| Vamos conversar sobre o seu novo amor | 4 |
| Falar no WhatsApp | 3 |
| Seu novo amor está a uma conversa | 2 |
| Abrir WhatsApp agora | 1 |
| Perguntar pela/pelo [cor] | por cartão |

- A ação é sempre a mesma: abrir o WhatsApp.
- **Proposta de padrão, com três textos:**
  - **Botão principal da página:** "Conversar no WhatsApp"
  - **Cartão de filhote:** "Perguntar pela/pelo [cor]", que já é o padrão de /filhotes
  - **Link secundário dentro do texto:** "Tirar dúvida pelo WhatsApp"
- "Ver disponibilidade" deveria sair. Ele promete uma consulta de estoque, e o selo do cartão diz "Disponibilidade a confirmar".

### 2.6 App e e-mail fora da paleta (baixo)

- `app/manifest.ts`:
  - `background_color` é `#ffffff`. Ao abrir o site instalado na tela do celular, a tela pisca branca antes do verde.
  - `theme_color` é `#052e2b`, enquanto o fundo do site é `#062a18`.
- `src/lib/email.ts`: o cabeçalho é verde `#052e2b` com fonte do sistema, sem a coroa e sem o dourado.
- **Correção:**
  - No manifest, `background_color: "#062a18"`.
  - No e-mail, a coroa e o dourado `--ouro-400` (`#efc366`) no cabeçalho.

### 2.7 Não existe um guia de marca escrito (baixo)

- As regras estão espalhadas:
  - memórias do projeto
  - comentários de código
  - guardas (`content-guard`, `public-truth-guard`, `check-banned-words`)
- **Correção:** um `docs/marca.md` curto, com:
  - nome
  - assinatura
  - coroa e tamanhos mínimos
  - paleta (`--ouro-*` e verdes)
  - as duas fontes
  - os três textos de botão
  - as regras de texto que já valem ("Lulu da Pomerânia" em toda frase, preço "a partir de R$ X no PIX", nada inventado)
- O script `sync-brand-to-tokens` da skill **não** deve ser rodado. Ele sobrescreveria os tokens que já existem em `globals.css`.

---

## 3. Ajustes

| # | O quê | Onde | Precisa de você? |
|---|---|---|---|
| 1 | Ícones e logo com a coroa dourada no verde | `public/` + `structured-data.ts` | Aprovar o desenho |
| 2 | Cartão de compartilhamento com a marca | `og-default.jpg` + `opengraph-image.tsx` | Escolher a foto real |
| 3 | Mesma razão social no schema e no contrato | `config.ts`, `contractPdf.ts`, contrato | Sim: a razão social do CNPJ |
| 4 | `slogan` = "Sementinhas de Amor" | `config.ts` | Não |
| 5 | Três textos de botão de WhatsApp; sai "Ver disponibilidade" | componentes de CTA | Aprovar os textos |
| 6 | `background_color` do manifest e cabeçalho do e-mail | `manifest.ts`, `email.ts` | Não |
| 7 | `docs/marca.md` | `docs/` | Não |

## 4. O que não foi verificado

- Perfis de Instagram e Google Meu Negócio: foto, capa e bio.
- E-mails reais recebidos: conferi só o código.
- Se "Imperio" sem acento é a grafia registrada no INPI. O código é coerente consigo mesmo, com ®, mas não sei qual é o registro.
- A origem da foto dos 13 Spitz, se é foto real ou gerada.
