# Auditoria de estilo (ui-styling): byimperiodog.com.br, 17/11/2026

**Base:**
- O código local, com os ajustes de UX de hoje ainda sem commit.
- O site ao vivo, medido com Playwright nas sete páginas abaixo, no celular (390×844) e no desktop (1366×800):
  - home
  - /filhotes
  - página de filhote
  - /filhotes/sao-paulo
  - /contato
  - /blog
  - /sobre

**Critérios:** os da skill ui-styling, cobrindo:
- tokens de design consistentes
- acessibilidade (foco, contraste, HTML semântico)
- responsivo mobile-first
- tema escuro coerente
- classes estáticas, para o Tailwind gerar o CSS

---

## 1. O que está bem (medido)

| Critério | Resultado |
|---|---|
| **Contraste WCAG AA** | Nenhuma falha real nas 7 páginas × 2 telas. Os alarmes encontrados eram texto sobre foto ou gradiente e foram conferidos na captura. |
| **Paleta com tokens** | Em `tailwind.config.ts`, `zinc` e `emerald` apontam para variáveis com valores corrigidos para AA (`#047c59` e `#6b6b73`), com a justificativa no comentário. `:root` tem 84 variáveis. |
| **Foco no teclado** | Em 12 Tabs em cada página, todo elemento focado mostrou anel visível. Há regras globais `a:focus-visible` e `button:focus-visible` (globals.css:142). |
| **Pular para o conteúdo** | Presente em `app/(public)/layout.tsx`. |
| **Movimento reduzido** | Há 10 regras `prefers-reduced-motion` no CSS e 20 componentes que respeitam a preferência. |
| **Tipografia** | Só duas famílias: DM Sans no corpo e Playfair Display nos títulos. |
| **CSS do público separado do admin** | O `content` do Tailwind exclui o admin, e o admin tem configuração própria. |

---

## 2. Problemas, do mais ao menos importante

### 2.1 Classes que brigam entre si (médio)

O `cn()` (`src/lib/cn.ts`) só junta strings, sem `tailwind-merge`. Quando duas classes definem a mesma propriedade, quem vence é a ordem do CSS gerado, não a ordem no código.

- **Onde aparece:** o botão "Vamos conversar…" e o botão do fim das três páginas de estado (`filhotes/sao-paulo`, `minas-gerais`, `rio-de-janeiro`, linhas ~150 e ~246). Esse código vem de 12/07/2026 (`e4f0223`).
- **O que acontece hoje:** o botão leva `bg-[#25D366] hover:bg-[#20BA5A]`, mas ao vivo aparece verde-escuro com borda dourada, a cor do tema. O verde do WhatsApp nunca aparece, e o `!h-auto` e o `!whitespace-normal` estão ali só para vencer o `buttonVariants`.
- **Risco:** se a ordem do CSS mudar, o botão vira texto branco sobre `#25D366`, com contraste de **1,98:1**. O AA pede 4,5:1, então reprova.
- **Correção:** tirar `bg-[#25D366] hover:bg-[#20BA5A]` das seis linhas. O visual de hoje não muda.

### 2.2 Verde do WhatsApp fora do token (médio, envolve decisão de marca)

O token `--whatsapp: #1b7d53` existe e foi feito para passar no contraste. Mesmo assim, o código usa `#25D366` 9 vezes e `#20BA5A` 6 vezes.

- **Botão flutuante** (`WhatsAppFloat.tsx:238`): ícone branco sobre `#25D366` dá 1,98:1. Para ícone, o mínimo é 3:1.
- **A decisão é sua:** o verde claro é o que as pessoas reconhecem como WhatsApp.
  - **Opção A:** manter o verde e acrescentar uma borda escura de 2 px (`ring-2 ring-[#0f5132]`), que separa o botão de qualquer fundo.
  - **Opção B:** usar `bg-whatsapp` (`#1b7d53`, 5:1).

### 2.3 Texto pequeno demais (médio, já apontado na auditoria de UX)

No código público:
- `text-[9px]`: 2 vezes
- `text-[10px]`: 25 vezes
- `text-[11px]`: 41 vezes

Ao vivo, elementos com texto abaixo de 13 px:

| Página | Elementos |
|---|---|
| /blog | ~230 |
| home no celular | 100 |
| /sobre | 58 |

- **Arquivos com mais ocorrências:**
  - `puppies/MediaGallery.tsx` (7)
  - `sections/AiMatchmakerChat.tsx` (5)
  - `catalog/PuppyCinematicGallery.tsx` (4)
  - `ContractForm.tsx` (4)
  - `blog/PostCard.tsx` e `blog/BlogCard.tsx` (3 cada)
- **Correção:** `text-[9px]`, `text-[10px]` e `text-[11px]` viram `text-xs` (12 px) em texto que alguém lê, como legendas, datas e metadados. Os 10 px ficam só para selos decorativos. Nos cartões do blog, o resumo fica com 14 px no mínimo.

### 2.4 Dourados e verdes soltos no CSS (baixo para médio)

- `app/globals.css` tem **119 cores hex diferentes**.
- Os desenhos `.hm`, `.vt` e `.vf` usam dourados muito parecidos, mas não iguais: `#efc366`, `#f0d083`, `#f8dc8e`, `#e2b24d`, `#f3b562`. Cada novo ajuste tende a criar mais um.
- Nos `.tsx` públicos há 14 hex arbitrários. Os de Google, Facebook, X e Pinterest são cores de marca e devem ficar.
- **Correção:** criar uma escala `--ouro-100…900` e `--verde-mata-*` em `:root` e trocar aos poucos, só quando o arquivo já estiver sendo mexido. Não vale uma troca em massa, porque o desenho da home e o de /filhotes foram aprovados pixel a pixel.

### 2.5 Tema escuro meio ligado (baixo)

- O `tailwind.config.ts` não define `darkMode`, então vale o padrão do Tailwind 3: `media`.
- Há 45 classes `dark:` em componentes públicos: `blog/Prose.tsx` (renderizado em todo post), `blog/Comments.tsx`, `politica-editorial` e outros.
- Elas só têm efeito quando o celular do visitante está no modo escuro. O site não tem tema escuro, então isso pode produzir combinações que nunca foram desenhadas.
- **Teste ao vivo:** comparei o post `/blog/nomes-lulu-da-pomerania` e a home nos modos claro e escuro, e os parágrafos ficaram iguais. Por enquanto, não há nada quebrado visível.
- **Correção:** acrescentar `darkMode: "class"` no config. Assim nenhum `dark:` dispara sem uma classe que o site nunca põe. É uma linha, mas mexe no CSS de todo o site, então precisa de build e conferência do blog.

### 2.6 Componentes de `ui/` pouco usados (baixo)

| Componente de `src/components/ui/` | Arquivos públicos que usam |
|---|---|
| `button` | 11 |
| `input` | 4 |
| `toast` | 3 |
| `card`, `badge`, `select`, `dialog`, `tooltip`, `alert` | 0 |

- Os botões e chips são escritos à mão em cada página. É a causa da diferença entre os filtros da home e os de /filhotes, já apontada na auditoria de UX.
- **Correção:** não migrar tudo. Criar um `Chip` único para os filtros e um `variant="whatsapp"` no `buttonVariants`, que resolve o 2.1 e o 2.2 de uma vez.

### 2.7 Painel admin (baixo, fora do site público)

- `system/health/SystemHealthUI.tsx:202-209` monta classes como `` `text-${card.color}-600` ``. O Tailwind não enxerga classe montada, e `tailwind.admin.config.ts` não tem `safelist`. As cores amarelo, vermelho, roxo e azul dos cartões de saúde podem não aparecer. Não abri a tela para confirmar.
- **Correção:** um mapa fixo, por exemplo `{ emerald: "text-emerald-600 border-emerald-100", ... }`.
- z-index sem escala: `9999`, `9998`, `10000`, `120`, `100` espalhados. Só vale atacar se aparecer sobreposição errada.

---

## 3. Ajustes rápidos

| # | O quê | Onde | Muda o visual? |
|---|---|---|---|
| 1 | Tirar `bg-[#25D366] hover:bg-[#20BA5A]` dos botões | 3 páginas de estado, 6 linhas | Não |
| 2 | `darkMode: "class"` | `tailwind.config.ts` | Não, se o blog for conferido depois do build |
| 3 | `text-[9/10/11px]` → `text-xs` em texto lido | MediaGallery, PostCard, BlogCard, PuppyCinematicGallery | Sim, de leve: textos 1 a 3 px maiores |
| 4 | Borda escura no botão flutuante, ou `bg-whatsapp` | `WhatsAppFloat.tsx` | Sim, depende da sua escolha |
| 5 | Mapa fixo de cores na tela de saúde | admin | Só no admin |

## 4. O que não foi verificado

- Leitor de tela de verdade: conferi só a estrutura e a ordem de foco.
- As páginas do admin no navegador.
- A página de filhote com galeria aberta (lightbox) e o chat do `AiMatchmakerChat`, que não aparecem sem interação.
