# Design System – By Imperio Dog

**Atualizado no Sprint 3** para incluir sistema completo de tokens padronizados.

Este guia consolida o padrão visual e de UX para o portal. Utilize sempre os tokens e componentes abaixo antes de criar estilos novos.

---

## 📐 Sistema de Spacing (Sprint 3)

Escala baseada em múltiplos de 4px para consistência vertical e horizontal:

```css
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

**Uso no Tailwind:**
```tsx
// ✅ Correto - usando tokens
<div className="space-y-[var(--space-6)]">
<div className="px-[var(--space-4)] py-[var(--space-2)]">
<div className="gap-[var(--space-3)]">

// ❌ Evitar - hardcoded
<div className="space-y-6">
<div className="px-4 py-2">
```

---

## 🔘 Border Radius Scale (Sprint 3)

```css
--radius-none: 0;
--radius-sm: 0.25rem;   /* 4px - inputs, small badges */
--radius-md: 0.5rem;    /* 8px - buttons, cards */
--radius-lg: 0.75rem;   /* 12px - large cards */
--radius-xl: 1rem;      /* 16px - modals */
--radius-2xl: 1.5rem;   /* 24px - hero cards, tables */
--radius-3xl: 2rem;     /* 32px - special cards */
--radius-full: 9999px;  /* pills, badges, avatars */
```

**Quando usar:**
- **sm**: Inputs pequenos, tags
- **md**: Botões, cards padrão
- **lg**: Cards grandes
- **xl**: Modais, dialogs
- **2xl**: Hero cards, tabelas
- **full**: Pills, badges, avatares

---

## 🌑 Elevation (Shadows) Scale (Sprint 3)

Sistema de elevação com 6 níveis (0-5):

```css
--elevation-0: none;
--elevation-1: 0 1px 2px 0 rgba(0, 0, 0, 0.04);                    /* subtle hover */
--elevation-2: 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04);  /* cards */
--elevation-3: 0 4px 8px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);  /* dropdowns */
--elevation-4: 0 8px 16px -4px rgba(0, 0, 0, 0.10), 0 4px 8px -2px rgba(0, 0, 0, 0.06); /* modals */
--elevation-5: 0 16px 32px -8px rgba(0, 0, 0, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.08); /* floating */
```

**Quando usar:**
- **elevation-1**: Hover states
- **elevation-2**: Cards, tabelas (padrão)
- **elevation-3**: Dropdowns, popovers
- **elevation-4**: Modais, dialogs
- **elevation-5**: Floating action bars

---

## Tokens (já existentes no projeto)
- **Cores (CSS vars)**: `--bg`, `--surface`, `--surface-2`, `--text`, `--text-muted`, `--brand`, `--brand-foreground`, `--accent`, `--accent-foreground`, `--border`, `--error`, `--success`, `--warning`.
- **Tipografia**: headings com peso semibold/bold; body 14–16px; usar classes `text-[var(--text)]` e `text-[var(--text-muted)]` para hierarquia.
  - Fluid typography scale: `--font-size-xs` até `--font-size-4xl` com suporte responsivo via `clamp()`
  - Line heights: `--line-tight` (1.15), `--line-snug` (1.25), `--line-normal` (1.45), `--line-relaxed` (1.65)
- **Espaçamentos**: Usar tokens `--space-*` (ver seção acima). Grid/padding consistentes.
- **Transições**: `--ease-standard`, `--ease-enter`, `--ease-exit` com durações `--dur-150`, `--dur-250`, `--dur-400`

## Componentes base
- **Botões (`src/components/ui/button.tsx`)**  
  Variants: `solid` (primário), `outline` (secundário), `ghost` (terciário), `danger`.  
  Sizes: `sm`, `md`, `lg`, `icon`.  
  Regras: sempre usar estes variants; evitar classes inline personalizadas salvo ajustes mínimos de largura/margem.

- **Inputs (`src/components/ui/input.tsx`)**  
  Padrão para campos de texto. Labels sempre visíveis, `aria-invalid`/`aria-required` quando aplicável.

- **Cards (`src/components/ui/FormCard.tsx` ou wrappers equivalentes)**  
  Usar bordas `border-[var(--border)]`, fundo `bg-[var(--surface)]`, `rounded-xl`, `p-4/5`, `shadow-sm` quando necessário. Evitar criar novos estilos de card sem reutilizar esse padrão.

- **Tipografia**  
  H1 único por página; H2 para seções; H3/H4 para subtópicos. Não usar headings para estilizar texto não estrutural. Classes utilitárias de cor/texto/peso em vez de inline styles.

## Padrões de uso por página/área
- **Home / Catálogo / Cor / Cidade / Intenções**:  
  - Botões principais: `Button` com `variant="solid"`; secundarios `outline`; terciário `ghost`.  
  - CTA WhatsApp e formulários: manter hierarchy (um primário por dobra).  
  - Cards de filhotes: imagem com dimensões definidas, texto body 14–16px, título semibold.  
  - Estados vazios: usar o mesmo card style com borda tracejada ou mensagem clara.

- **Detalhe de filhote**:  
  - Badges de status com cores consistentes (`bg-green-100 text-green-800` para disponível).  
  - CTA principal (WhatsApp) usa Button solid; secundário outline.  
  - FAQ e blocos informativos dentro de cards (bordas/superfícies padrão).

- **Blog (lista, categorias, tags, posts)**:  
  - Cards de post seguem o mesmo padrão de card (thumbnail com `object-cover`, título semibold, excerpt muted).  
  - Paginação com botões `outline` e aria-label claros.

- **Admin**:  
  - Reutilizar `Button` e `Input`; tabelas com cabeçalho claro e células com padding consistente; modais/dialogs usando `dialog.tsx`.

## Acessibilidade (sempre aplicar)
- Labels explícitas em inputs; `aria-live` para mensagens de erro/sucesso em formulários.  
- Breadcrumbs dentro de `<nav aria-label="breadcrumbs">`.  
- Heading único H1 por página; ordem lógica de H2/H3.  
- Alt em todas imagens; definir largura/altura para evitar CLS.  
- Foco visível (já suportado em Button/Input; manter).

## Estados de interação
- Hover: clarear fundo em `outline/ghost`; darken em `solid`.  
- Active: leve redução de brilho/opacidade (0.95) sem alterar layout.  
- Disabled: `opacity-50` e `cursor-not-allowed` (já aplicado em Button/Input).  

## Como aplicar
- Priorizar o uso de `Button`, `Input`, `FormCard` e utilitários de cor/tipografia já existentes.  
- Evitar estilos inline; centralizar ajustes em componentes base.  
- Para novos cards (filhotes, posts, métricas admin), reutilizar o padrão: `rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4/5 shadow-sm`.

## Próximos passos sugeridos
- Revisar componentes específicos (PuppyCard, Blog PostCard, FilterBar) para consumir diretamente `Button`/`Input` e padronizar tipografia.  
- Corrigir textos com acentos remanescentes e garantir heading/aria conforme checklist de a11y anterior.  
- Ajustar hero/images com dimensões e `priority` seletivo para melhorar CWV.
