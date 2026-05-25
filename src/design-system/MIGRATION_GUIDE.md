# 🔄 Guia de Migração: Aplicando o Design System

Este guia demonstra como refatorar componentes existentes para usar o Design System.

## 📋 Índice

- [Estratégia de Migração](#estratégia-de-migração)
- [Exemplo: PuppyCardPremium](#exemplo-puppycardpremium)
- [Checklist de Migração](#checklist-de-migração)
- [Padrões Comuns](#padrões-comuns)

---

## 🎯 Estratégia de Migração

### Ordem de Prioridade

1. **Componentes de Alta Visibilidade** (catálogo, cards de filhote)
2. **Formulários** (inputs, selects, textareas)
3. **Componentes de Feedback** (alerts, toasts, empty states)
4. **Componentes Administrativos** (dashboard, admin forms)

### Princípios

- ✅ **Não quebrar funcionalidades** - Manter todas as props e callbacks
- ✅ **Refatorar gradualmente** - Um componente por vez
- ✅ **Testar após cada mudança** - Garantir que tudo funciona
- ✅ **Reduzir código** - Aproveitar componentes reutilizáveis

---

## 📦 Exemplo: PuppyCardPremium

### Antes (Código Atual)

```tsx
// src/components/catalog/PuppyCardPremium.tsx (680 linhas)

export function PuppyCardPremium({ puppy }: PuppyCardPremiumProps) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Header com Imagem */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
        <Image
          src={puppy.imagemPrincipal}
          alt={puppy.nome}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Badge de Status */}
        <div className="absolute left-4 top-4">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-sm",
            puppy.status === "disponivel" 
              ? "bg-emerald-500/90 text-white"
              : puppy.status === "reservado"
              ? "bg-amber-500/90 text-white"
              : "bg-zinc-500/90 text-white"
          )}>
            {puppy.status === "disponivel" ? "Disponível" : puppy.status === "reservado" ? "Reservado" : "Vendido"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-zinc-900 mb-1">{puppy.nome}</h3>
          <p className="text-sm text-zinc-600">{puppy.raca}</p>
        </div>

        {/* Detalhes */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-zinc-600">
            <CalendarIcon className="h-4 w-4" />
            <span>{formatDate(puppy.dataNascimento)}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-600">
            <MapPinIcon className="h-4 w-4" />
            <span>{puppy.localizacao}</span>
          </div>
        </div>

        {/* Botão CTA */}
        <button
          onClick={() => router.push(`/filhotes/${puppy.id}`)}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Ver Detalhes
        </button>
      </div>
    </article>
  );
}
```

### Depois (Com Design System)

```tsx
// src/components/catalog/PuppyCardPremium.tsx (REFATORADO - ~200 linhas)

import { CalendarIcon, MapPinIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Button, Card, CardContent, CardFooter, CardHeader, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';

export interface PuppyCardPremiumProps {
  puppy: {
    id: string;
    nome: string;
    raca: string;
    status: 'disponivel' | 'reservado' | 'vendido';
    imagemPrincipal: string;
    dataNascimento: string;
    localizacao: string;
    preco?: number;
  };
}

export function PuppyCardPremium({ puppy }: PuppyCardPremiumProps) {
  const router = useRouter();

  return (
    <Card
      variant="elevated"
      interactive
      className="overflow-hidden"
    >
      {/* Header com Imagem */}
      <CardHeader noPadding>
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
          <Image
            src={puppy.imagemPrincipal}
            alt={puppy.nome}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Badge de Status usando StatusBadge */}
          <div className="absolute left-4 top-4">
            <StatusBadge status={puppy.status} />
          </div>

          {/* Preço (se disponível) */}
          {puppy.preco && (
            <div className="absolute right-4 bottom-4">
              <div className="rounded-lg bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
                <p className="text-xs font-medium text-zinc-600">A partir de</p>
                <p className="text-lg font-bold text-emerald-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(puppy.preco)}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-zinc-900 mb-1">
            {puppy.nome}
          </h3>
          <p className="text-sm text-zinc-600">{puppy.raca}</p>
        </div>

        {/* Detalhes */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-zinc-600">
            <CalendarIcon className="h-4 w-4" />
            <span>{formatDate(puppy.dataNascimento)}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-600">
            <MapPinIcon className="h-4 w-4" />
            <span>{puppy.localizacao}</span>
          </div>
        </div>
      </CardContent>

      {/* Footer com Botão CTA */}
      <CardFooter>
        <Button
          onClick={() => router.push(`/filhotes/${puppy.id}`)}
          variant="solid"
          size="lg"
          className="w-full"
        >
          Ver Detalhes
        </Button>
      </CardFooter>
    </Card>
  );
}

function formatDate(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffDays < 7) return `${diffDays} dias`;
  if (diffWeeks < 8) return `${diffWeeks} semanas`;
  
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} meses`;
}
```

### ✨ Benefícios da Refatoração

| Antes | Depois | Melhoria |
|-------|--------|----------|
| 680 linhas | ~200 linhas | **-70% código** |
| Estilos duplicados | Componentes reutilizáveis | **Consistência** |
| Card customizado | `<Card>` do Design System | **Manutenibilidade** |
| Badge inline | `<StatusBadge>` tipado | **Type Safety** |
| Button customizado | `<Button variant="solid">` | **Acessibilidade** |
| Sem composição | CardHeader/Content/Footer | **Flexibilidade** |

---

## ✅ Checklist de Migração

### Para Cada Componente:

- [ ] **Identificar elementos reutilizáveis**
  - Divs com border/rounded → `<Card>`
  - Botões customizados → `<Button>`
  - Badges de status → `<Badge>` ou `<StatusBadge>`
  - Inputs com label → `<Input>`, `<Textarea>`, `<Select>`

- [ ] **Substituir classes repetidas**
  - `bg-zinc-100 border border-zinc-200 rounded-lg` → `<Card variant="outline">`
  - `bg-emerald-600 text-white rounded-lg px-4 py-2` → `<Button variant="solid">`
  - `text-xs text-zinc-600` → Use tokens de tipografia

- [ ] **Garantir acessibilidade**
  - Verificar `aria-label` em ícones
  - Testar navegação por teclado
  - Validar contraste de cores

- [ ] **Testar funcionalidade**
  - Todas as props funcionam?
  - Callbacks executam corretamente?
  - Layout responsivo mantido?

- [ ] **Reduzir código**
  - Remover estilos inline duplicados
  - Consolidar variantes (ex: 5 tipos de botão → 1 Button com variants)
  - Eliminar componentes locais que já existem no UI

---

## 🔧 Padrões Comuns

### 1. Substituir Containers Customizados

**Antes:**
```tsx
<div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
  <h3 className="text-lg font-semibold mb-2">Título</h3>
  <p className="text-sm text-zinc-600">Descrição...</p>
</div>
```

**Depois:**
```tsx
<Card variant="outline">
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição...</CardDescription>
  </CardHeader>
</Card>
```

### 2. Substituir Botões Customizados

**Antes:**
```tsx
<button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg">
  Enviar
</button>
```

**Depois:**
```tsx
<Button variant="solid" size="md">
  Enviar
</Button>
```

### 3. Substituir Badges de Status

**Antes:**
```tsx
<span className={cn(
  "px-2 py-1 rounded-full text-xs",
  status === "disponivel" ? "bg-green-100 text-green-800" : "bg-gray-100"
)}>
  {status}
</span>
```

**Depois:**
```tsx
<StatusBadge status={status} />
```

### 4. Substituir Inputs com Label

**Antes:**
```tsx
<div>
  <label className="block text-sm font-medium text-zinc-700 mb-1">
    Email
  </label>
  <input
    type="email"
    className="w-full border border-zinc-300 rounded-lg px-3 py-2"
  />
  {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
</div>
```

**Depois:**
```tsx
<Input
  label="Email"
  type="email"
  error={error}
/>
```

### 5. Substituir Estados Vazios

**Antes:**
```tsx
{results.length === 0 && (
  <div className="text-center py-12">
    <SearchIcon className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-zinc-900 mb-2">
      Nenhum resultado encontrado
    </h3>
    <p className="text-sm text-zinc-600 mb-4">
      Tente ajustar seus filtros
    </p>
    <button onClick={handleClear}>Limpar Filtros</button>
  </div>
)}
```

**Depois:**
```tsx
{results.length === 0 && (
  <EmptyState
    variant="search"
    title="Nenhum resultado encontrado"
    description="Tente ajustar seus filtros"
    action={{
      label: 'Limpar Filtros',
      onClick: handleClear
    }}
  />
)}
```

### 6. Substituir Alerts/Feedback

**Antes:**
```tsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-600" />
      <div>
        <h4 className="font-medium text-red-900">Erro</h4>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    </div>
  </div>
)}
```

**Depois:**
```tsx
{error && (
  <Alert variant="error" title="Erro">
    {error}
  </Alert>
)}
```

---

## 🎯 Próximos Passos

1. **Refatorar PuppyCardPremium** (maior impacto visual)
2. **Atualizar componentes do catálogo** (src/components/catalog/*)
3. **Migrar página do produto** (app/filhotes/[id]/puppy/*)
4. **Refatorar formulários** (reserve-seu-filhote, contato)
5. **Atualizar componentes admin** (dashboard, admin forms)

---

## 💡 Dicas

- **Refatore progressivamente**: Um componente por vez
- **Teste após cada mudança**: Garanta que tudo funciona
- **Mantenha funcionalidades**: Não remova props ou callbacks
- **Use TypeScript**: O Design System é totalmente tipado
- **Aproveite a composição**: CardHeader, CardContent, CardFooter são flexíveis
- **Consulte a documentação**: `src/design-system/overview.md` tem exemplos completos

---

**Documentação Relacionada:**
- [Design System Overview](./overview.md)
- [Auditoria Completa](./README.md)
- [Tokens](./tokens.ts)
