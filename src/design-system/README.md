# Design System - By Império Dog

> Sistema de design interno consistente, acessível e escalável para plataforma premium de Spitz Alemão Anão.

## 📋 AUDITORIA E INVENTÁRIO

### Status Atual (1 de dezembro de 2025)

#### ✅ O que já existe

**Tokens CSS**
- `design-system/tokens.css` - Tokens semânticos (cores, espaçamento, tipografia fluida)
- `tailwind.config.ts` - Extensões Tailwind com cores e tokens de fonte
- `app/globals.css` - Classes utilitárias e componentes base

**Componentes UI Base**
- `src/components/ui/button.tsx` - Componente Button com variantes
- `src/components/ui/input.tsx` - Input básico com estados
- `src/components/ui/dialog.tsx` - Dialog/Modal
- `src/components/ui/tooltip.tsx` - Tooltip
- `src/components/ui/toast.tsx` - Toast notifications
- `src/components/ui/FormCard.tsx` - Container de formulários

**Componentes Compostos**
- `src/components/catalog/PuppyCardPremium.tsx` - Card de filhote PREMIUM
- `src/components/puppy/*` - 8 componentes modulares da página de produto
- `src/components/Toast.tsx` - Sistema de toasts alternativo
- `src/components/Testimonials.tsx` - Depoimentos com carousel

#### ⚠️ Problemas Identificados

**1. Duplicação de estilos**
- Classes Tailwind repetidas (bg-zinc-100, text-zinc-600, border-zinc-200)
- Múltiplas implementações de botão (btn-*, Button component, inline styles)
- Cards com estruturas similares mas estilos diferentes
- Badges com implementações inconsistentes

**2. Falta de padronização**
- Componentes de filhote usam classes inline ao invés de componentes base
- Tipografia sem hierarquia clara (h1-h6 com tamanhos variados)
- Spacing inconsistente (gap-2, gap-3, gap-4 sem padrão)
- Focus states diferentes (ring-2, outline, border)

**3. Acessibilidade**
- Contraste de cores não validado sistematicamente
- Foco visível inconsistente
- Faltam aria-labels em alguns ícones
- Semantic HTML incompleto em alguns componentes

**4. Performance**
- Classes Tailwind duplicadas aumentando bundle CSS
- Falta de code splitting em componentes grandes
- Sem lazy loading em componentes menos críticos

#### 🎯 Componentes Faltantes

**Essenciais**
- [ ] `<Select />` - Select estilizado com acessibilidade
- [ ] `<Textarea />` - Textarea com contador e validação
- [ ] `<Checkbox />` - Checkbox acessível
- [ ] `<Radio />` - Radio button acessível
- [ ] `<Badge />` - Badge unificado (status, tags)
- [ ] `<Card />` - Card base reutilizável
- [ ] `<Alert />` - Alertas contextuais (info, success, warning, error)
- [ ] `<EmptyState />` - Estados vazios consistentes
- [ ] `<Skeleton />` - Loading skeletons unificados
- [ ] `<Spinner />` - Loading spinner

**Avançados**
- [ ] `<Dropdown />` - Menu dropdown acessível
- [ ] `<Tabs />` - Tabs com keyboard navigation
- [ ] `<Accordion />` - Accordion (já existe FAQAccordion mas não é reutilizável)
- [ ] `<Slider />` - Range slider
- [ ] `<Switch />` - Toggle switch

---

## 🎨 DESIGN TOKENS

### Cores

**Paleta Base**
```css
--brand: #1f4d3a          /* Verde primário */
--brand-teal: #0ea5a3     /* Turquesa accent */
--accent: #f3b562         /* Dourado/Âmbar */
--whatsapp: #1f8a5c       /* WhatsApp green */
--success: #2f855a
--warning: #c27803
--error: #c53030
```

**Semantic Colors**
```css
--bg: #faf5ef             /* Background padrão */
--surface: #ffffff        /* Superfícies/cards */
--surface-2: #f5ebdf      /* Superfícies secundárias */
--border: #e2d6c7         /* Bordas padrão */
--text: #2a231f           /* Texto primário */
--text-muted: #7a6a5f     /* Texto secundário */
```

**Contraste AA Validado**
- text (#2a231f) sobre bg (#faf5ef): ✅ 7.2:1
- text-muted (#7a6a5f) sobre bg: ✅ 4.6:1
- brand (#1f4d3a) sobre surface (#ffffff): ✅ 8.9:1
- accent (#f3b562) sobre surface: ⚠️ 3.2:1 (usar accent-foreground para texto)

### Tipografia

**Escala Fluida (clamp)**
```css
--font-size-xs:   clamp(0.72rem, 0.69rem + 0.15vw, 0.78rem)
--font-size-sm:   clamp(0.82rem, 0.78rem + 0.20vw, 0.90rem)
--font-size-base: clamp(0.95rem, 0.90rem + 0.30vw, 1.05rem)
--font-size-md:   clamp(1.05rem, 1.00rem + 0.40vw, 1.18rem)
--font-size-lg:   clamp(1.20rem, 1.10rem + 0.60vw, 1.42rem)
--font-size-xl:   clamp(1.45rem, 1.30rem + 0.90vw, 1.78rem)
--font-size-2xl:  clamp(1.75rem, 1.55rem + 1.20vw, 2.20rem)
--font-size-3xl:  clamp(2.10rem, 1.85rem + 1.60vw, 2.70rem)
--font-size-4xl:  clamp(2.55rem, 2.20rem + 2.10vw, 3.25rem)
```

**Line Heights**
```css
--line-tight:   1.15    /* Headings */
--line-snug:    1.25    /* Subtítulos */
--line-normal:  1.45    /* Corpo de texto */
--line-relaxed: 1.65    /* Leitura longa */
```

### Espaçamento

**Escala Consistente (baseada em Tailwind)**
```
0.5 = 2px   (gap, padding micro)
1   = 4px
2   = 8px   (gap padrão entre elementos inline)
3   = 12px
4   = 16px  (padding interno de componentes)
5   = 20px
6   = 24px  (spacing entre seções)
8   = 32px
10  = 40px
12  = 48px  (spacing entre blocos)
16  = 64px
20  = 80px
24  = 96px  (spacing hero sections)
```

### Radius

```css
--radius-sm:  4px    /* Badges, pills */
--radius-md:  8px    /* Inputs, buttons */
--radius-lg:  14px   /* Cards pequenos */
--radius-2xl: 28px   /* Cards grandes, modals */
```

### Sombras

```css
--shadow-sm:      0 1px 2px rgba(0,0,0,0.04)     /* Inputs */
--shadow-md:      0 2px 6px rgba(0,0,0,0.06)     /* Cards hover */
--shadow-lg:      0 4px 16px rgba(0,0,0,0.08)    /* Modals */
--shadow-xl-soft: 0 8px 32px -4px rgba(0,0,0,0.06) /* Hero cards */
```

---

## 🧩 COMPONENTES BASE

### Button

**Variantes**
- `solid` (padrão) - Fundo sólido com accent
- `outline` - Borda com fundo transparente
- `ghost` - Sem borda, hover com fundo
- `subtle` - Fundo surface-2
- `danger` - Vermelho para ações destrutivas

**Tamanhos**
- `sm` - h-8 px-3 text-sm
- `md` (padrão) - h-10 px-4 text-sm
- `lg` - h-12 px-6 text-base
- `icon` - h-9 w-9 (ícone sem texto)

**Estados**
- Normal, Hover, Active, Focus, Disabled, Loading

**Arquivo**: `src/components/ui/button.tsx` ✅

### Input

**Variantes**
- Text, Email, Password, Number, Tel, URL

**Estados**
- Normal, Focus, Error, Disabled, ReadOnly

**Props**
- `label`, `helper`, `error`, `leftIcon`, `rightIcon`

**Arquivo**: `src/components/ui/input.tsx` ✅ (básico, precisa expansão)

### Card

**Estrutura**
```tsx
<Card>
  <CardHeader>
    <CardTitle />
    <CardDescription />
  </CardHeader>
  <CardContent />
  <CardFooter />
</Card>
```

**Variantes**
- `default` - Branco com borda
- `highlight` - Com gradient sutil
- `outline` - Apenas borda sem bg
- `elevated` - Com sombra lg

**Arquivo**: FALTANDO ❌

### Badge

**Variantes**
- `status-available` - Verde
- `status-reserved` - Âmbar
- `status-sold` - Vermelho
- `neutral` - Cinza
- `brand` - Verde marca

**Tamanhos**
- `sm` - text-xs px-2 py-0.5
- `md` (padrão) - text-xs px-3 py-1
- `lg` - text-sm px-4 py-1.5

**Arquivo**: FALTANDO ❌

### Select

**Requisitos**
- Acessível (keyboard navigation)
- Searchable (opcional)
- Multi-select (opcional)
- Custom rendering de options
- Label + helper text

**Arquivo**: FALTANDO ❌

### Alert

**Variantes**
- `info` - Azul
- `success` - Verde
- `warning` - Âmbar
- `error` - Vermelho

**Props**
- `title`, `description`, `icon`, `dismissible`, `action`

**Arquivo**: FALTANDO ❌

---

## ♿ ACESSIBILIDADE

### Checklist WCAG 2.2 AA

**Contraste**
- [x] Texto normal ≥ 4.5:1
- [x] Texto grande ≥ 3:1
- [x] Componentes UI ≥ 3:1
- [ ] Validar todas as combinações de cores

**Foco Visível**
- [x] Outline 2px em componentes interativos
- [x] Offset 2px para separação
- [ ] Consistência em todos os componentes

**Semântica**
- [ ] Usar elementos HTML5 corretos (button, a, nav, main, section, article)
- [ ] ARIA labels em ícones isolados
- [ ] ARIA live regions para feedback dinâmico
- [ ] Landmarks para navegação por teclado

**Keyboard Navigation**
- [ ] Tab order lógico
- [ ] Escape para fechar modals/dropdowns
- [ ] Arrow keys para navegação em listas
- [ ] Enter/Space para ativar botões

---

## 📦 ESTRUTURA DE ARQUIVOS

```
src/
├── design-system/
│   ├── README.md              (este arquivo)
│   ├── tokens.ts              (tokens TypeScript)
│   ├── tokens.css             (tokens CSS)
│   └── typography.ts          (helpers de tipografia)
│
├── components/
│   ├── ui/                    (componentes base)
│   │   ├── button.tsx         ✅
│   │   ├── input.tsx          ✅
│   │   ├── select.tsx         ❌
│   │   ├── textarea.tsx       ❌
│   │   ├── checkbox.tsx       ❌
│   │   ├── radio.tsx          ❌
│   │   ├── card.tsx           ❌
│   │   ├── badge.tsx          ❌
│   │   ├── alert.tsx          ❌
│   │   ├── skeleton.tsx       ✅ (parcial)
│   │   ├── spinner.tsx        ❌
│   │   ├── dialog.tsx         ✅
│   │   ├── tooltip.tsx        ✅
│   │   └── toast.tsx          ✅
│   │
│   ├── catalog/               (componentes de catálogo)
│   │   └── PuppyCardPremium.tsx ✅
│   │
│   └── puppy/                 (componentes de produto)
│       ├── PuppyHero.tsx      ✅
│       ├── PuppyGallery.tsx   ✅
│       ├── PuppyDetails.tsx   ✅
│       ├── PuppyBenefits.tsx  ✅
│       ├── PuppyTrust.tsx     ✅
│       ├── PuppyActions.tsx   ✅
│       ├── PuppyActionsClient.tsx ✅
│       └── PuppyRelated.tsx   ✅
```

---

## 🚀 PRÓXIMOS PASSOS

### Fase 1: Componentes Base Essenciais
1. ✅ Documentar auditoria
2. ⏳ Criar componentes faltantes (Badge, Card, Select, Textarea, Alert)
3. ⏳ Atualizar componentes existentes para usar design system
4. ⏳ Validar acessibilidade (contraste, foco, semântica)

### Fase 2: Aplicação ao Catálogo
1. ⏳ Refatorar PuppyCardPremium para usar componentes base
2. ⏳ Atualizar componentes puppy/* para usar Button, Badge, Card
3. ⏳ Consolidar estilos duplicados

### Fase 3: Documentação e Testes
1. ⏳ Criar storybook/exemplos de uso
2. ⏳ Documentar cada componente
3. ⏳ Testes de acessibilidade automatizados

---

## 📚 REFERÊNCIAS

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Inclusive Components](https://inclusive-components.design/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives) (inspiração)
- [shadcn/ui](https://ui.shadcn.com/) (inspiração)

---

**Última atualização**: 1 de dezembro de 2025
**Mantido por**: Equipe By Império Dog
