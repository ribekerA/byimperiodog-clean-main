# Design System - Guia de Uso

> Referência rápida para usar o Design System da By Imperio Dog

## 🚀 Início Rápido

### Importação

```tsx
import { Button, Input, Card, Badge, Alert } from '@/components/ui';
```

---

## 📦 COMPONENTES DISPONÍVEIS

### Button

Botão com múltiplas variantes e estados.

```tsx
import { Button } from '@/components/ui';

// Variantes
<Button variant="solid">Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
<Button variant="danger">Deletar</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="md">Médio</Button>
<Button size="lg">Grande</Button>

// Estados
<Button loading>Processando...</Button>
<Button disabled>Desabilitado</Button>
```

**Props principais:**
- `variant`: solid | outline | subtle | ghost | danger
- `size`: sm | md | lg | icon
- `loading`: boolean
- `disabled`: boolean

---

### Input

Campo de entrada com label, ícones e validação.

```tsx
import { Input } from '@/components/ui';
import { User, Mail } from 'lucide-react';

// Básico
<Input
  label="Nome completo"
  placeholder="Digite seu nome"
  required
/>

// Com ícones
<Input
  label="Email"
  type="email"
  leftIcon={<Mail className="h-4 w-4" />}
  placeholder="seu@email.com"
/>

// Com validação
<Input
  label="Telefone"
  error="Telefone inválido"
  helper="Formato: (11) 98765-4321"
/>
```

**Props principais:**
- `label`: string
- `helper`: string (texto de ajuda)
- `error`: string (mensagem de erro)
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode

---

### Textarea

Campo de texto multilinha com contador.

```tsx
import { Textarea } from '@/components/ui';

<Textarea
  label="Mensagem"
  placeholder="Digite sua mensagem..."
  maxLength={500}
  showCounter
  helper="Descreva suas dúvidas sobre o filhote"
/>
```

**Props principais:**
- `label`: string
- `helper`: string
- `error`: string
- `maxLength`: number
- `showCounter`: boolean

---

### Select

Campo de seleção estilizado.

```tsx
import { Select } from '@/components/ui';

const sexOptions = [
  { value: 'male', label: 'Macho' },
  { value: 'female', label: 'Fêmea' },
];

<Select
  label="Sexo"
  options={sexOptions}
  placeholder="Selecione o sexo"
  required
/>
```

**Props principais:**
- `label`: string
- `options`: SelectOption[]
- `placeholder`: string
- `error`: string
- `helper`: string

---

### Card

Container para agrupar conteúdo relacionado.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

// Composição básica
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
    <CardDescription>Descrição opcional</CardDescription>
  </CardHeader>
  
  <CardContent>
    <p>Conteúdo principal do card...</p>
  </CardContent>
  
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>

// Card interativo
<Card variant="default" interactive>
  <CardContent>
    Card clicável com hover effect
  </CardContent>
</Card>
```

**Variantes:**
- `default`: Branco com borda
- `elevated`: Com sombra maior
- `outline`: Apenas borda
- `highlight`: Com gradient sutil

---

### Badge

Rótulo visual para status, tags e contadores.

```tsx
import { Badge, StatusBadge } from '@/components/ui';

// Variantes
<Badge variant="success">Ativo</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="error">Cancelado</Badge>

// Tamanhos
<Badge size="sm">Pequeno</Badge>
<Badge size="md">Médio</Badge>
<Badge size="lg">Grande</Badge>

// Badge de status (especializado para filhotes)
<StatusBadge status="disponivel" />
<StatusBadge status="reservado" />
<StatusBadge status="vendido" />
```

**Variantes:**
- `default`: Cinza neutro
- `success`: Verde
- `warning`: Âmbar
- `error`: Vermelho
- `brand`: Verde marca
- `outline`: Apenas borda
- `neutral`: Cinza com borda

---

### Alert

Mensagem contextual para feedback.

```tsx
import { Alert } from '@/components/ui';

// Variantes
<Alert variant="success" title="Sucesso!" dismissible>
  Operação concluída com sucesso!
</Alert>

<Alert variant="error" title="Erro">
  Não foi possível processar sua solicitação.
</Alert>

<Alert variant="warning" title="Atenção">
  Verifique os dados antes de continuar.
</Alert>

<Alert variant="info" title="Informação">
  Este filhote está reservado até 15/12/2025.
</Alert>
```

**Props principais:**
- `variant`: info | success | warning | error
- `title`: string
- `dismissible`: boolean
- `onDismiss`: () => void
- `icon`: ReactNode (customizar ícone)

---

### Spinner

Indicador de carregamento.

```tsx
import { Spinner, InlineSpinner } from '@/components/ui';

// Tamanhos
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />

// Variantes
<Spinner variant="brand" />
<Spinner variant="accent" />
<Spinner variant="white" />

// Inline (com label)
<InlineSpinner label="Carregando filhotes..." />
```

**Props principais:**
- `size`: xs | sm | md | lg | xl
- `variant`: default | brand | accent | white

---

### EmptyState

Estado vazio com ícone e ação.

```tsx
import { EmptyState } from '@/components/ui';

<EmptyState
  variant="search"
  title="Nenhum filhote encontrado"
  description="Tente ajustar os filtros de busca ou entre em contato conosco."
  action={{
    label: "Limpar filtros",
    onClick: handleClearFilters,
    variant: "solid"
  }}
  secondaryAction={{
    label: "Falar com atendente",
    onClick: handleContact
  }}
/>
```

**Variantes:**
- `default`: Estado padrão
- `search`: Sem resultados de busca
- `error`: Erro ao carregar
- `empty`: Lista vazia

---

## 🎨 DESIGN TOKENS

### Uso de Cores

```tsx
// Usando tokens CSS
<div className="bg-[var(--brand)] text-[var(--brand-contrast)]">
  Fundo com cor da marca
</div>

// Usando tokens TypeScript
import { colors } from '@/design-system/tokens';

const styles = {
  backgroundColor: colors.brand.DEFAULT,
  color: colors.brand.contrast,
};
```

### Tipografia

```tsx
// Classes Tailwind com tokens
<h1 className="text-3xl font-bold">Título Grande</h1>
<p className="text-base leading-relaxed">Parágrafo com line-height confortável</p>
<small className="text-xs text-[var(--text-muted)]">Texto auxiliar</small>
```

### Espaçamento

```tsx
// Usar escala consistente
<div className="space-y-4">  {/* 16px entre filhos */}
  <div className="p-6">       {/* 24px padding */}
    <div className="gap-3">   {/* 12px gap */}
```

---

## ♿ ACESSIBILIDADE

### Foco Visível

Todos os componentes interativos têm foco visível automático:

```tsx
<Button>Botão acessível</Button>
// Foco: outline 2px + offset 2px automático
```

### Labels e ARIA

```tsx
// Input com label associado
<Input
  id="email"
  label="Email"
  aria-describedby="email-helper"
/>

// Botão com ícone precisa aria-label
<button aria-label="Fechar modal">
  <X className="h-4 w-4" />
</button>
```

### Contraste de Cores

Todas as combinações validadas para WCAG AA:

```tsx
// ✅ Correto
<div className="bg-[var(--brand)] text-[var(--brand-contrast)]">
  Contraste validado (8.9:1)
</div>

// ⚠️ Cuidado
<div className="bg-[var(--accent)] text-[var(--text)]">
  Use accent-foreground para texto (3.2:1 insuficiente)
</div>
```

---

## 📐 PADRÕES DE COMPOSIÇÃO

### Formulário Completo

```tsx
import { Input, Select, Textarea, Button, Alert } from '@/components/ui';

function ContactForm() {
  return (
    <form className="space-y-6">
      <Input
        label="Nome"
        placeholder="Seu nome completo"
        required
      />
      
      <Input
        label="Email"
        type="email"
        placeholder="seu@email.com"
        required
      />
      
      <Select
        label="Interesse"
        options={[
          { value: 'buy', label: 'Comprar filhote' },
          { value: 'info', label: 'Informações gerais' },
        ]}
        required
      />
      
      <Textarea
        label="Mensagem"
        placeholder="Como podemos ajudar?"
        maxLength={500}
        showCounter
      />
      
      <Alert variant="info">
        Respondemos em até 24 horas úteis.
      </Alert>
      
      <Button type="submit" size="lg" className="w-full">
        Enviar mensagem
      </Button>
    </form>
  );
}
```

### Card de Filhote (simplificado)

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Badge, Button } from '@/components/ui';

function SimplePuppyCard({ puppy }) {
  return (
    <Card variant="elevated" interactive>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{puppy.name}</CardTitle>
          <StatusBadge status={puppy.status} />
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-[var(--text-muted)]">
          {puppy.color} • {puppy.gender}
        </p>
      </CardContent>
      
      <CardFooter>
        <Button variant="outline" className="w-full">
          Ver detalhes
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

## 🔧 CUSTOMIZAÇÃO

### Extendendo Componentes

```tsx
import { Button, ButtonProps } from '@/components/ui';

function WhatsAppButton(props: ButtonProps) {
  return (
    <Button
      variant="solid"
      className="bg-[var(--whatsapp)] hover:bg-[var(--whatsapp)]/90"
      {...props}
    >
      <WhatsAppIcon className="h-4 w-4" />
      {props.children}
    </Button>
  );
}
```

### Temas Personalizados

```tsx
// Usando CSS custom properties
<div style={{ '--accent': '#FF6B6B' }}>
  <Button>Botão com cor personalizada</Button>
</div>
```

---

## 📚 Recursos Adicionais

- **Tokens completos**: `src/design-system/tokens.ts`
- **Auditoria**: `src/design-system/README.md`
- **Componentes**: `src/components/ui/`
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG22/quickref/

---

**Última atualização**: 1 de dezembro de 2025
**Mantido por**: Equipe By Imperio Dog
