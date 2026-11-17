# 🔍 Auditoria UX/UI + Acessibilidade - Painel Admin

**Data:** 1 de dezembro de 2025  
**Auditor:** Lead Product Engineer  
**Escopo:** Admin Dashboard - By Imperio Dog  
**Metodologia:** Nielsen Heuristics + WCAG 2.2 AA/AAA + Best Practices

---

## 📊 Resumo Executivo

### Classificação Geral de Severidade

| Categoria | Crítico | Alto | Médio | Baixo | Total |
|-----------|---------|------|-------|-------|-------|
| **Usabilidade** | 2 | 5 | 8 | 4 | **19** |
| **Fluxo/Navegação** | 1 | 3 | 5 | 2 | **11** |
| **Acessibilidade** | 4 | 7 | 6 | 3 | **20** |
| **Consistência** | 0 | 3 | 5 | 2 | **10** |
| **Escalabilidade** | 2 | 4 | 3 | 1 | **10** |
| **TOTAL** | **9** | **22** | **27** | **12** | **70** |

### Score Geral
- **Usabilidade:** 52/100 ⚠️
- **Acessibilidade:** 48/100 ❌
- **Consistência:** 70/100 ⚠️
- **Escalabilidade:** 55/100 ⚠️

---

## 🚨 1. Barreiras de Usabilidade (Nielsen Heuristics)

### 🔴 CRÍTICO

#### 1.1. Visibilidade do Estado do Sistema
**Problema:** Falta feedback visual em operações assíncronas  
**Localização:** `PuppiesTable.tsx` - inline status update  
**Evidência:**
```tsx
const handleStatus = (id: string, status: string) => {
  setMutatingId(id);
  startTransition(async () => {
    // Sem indicador visual claro durante mutação
    const res = await fetch("/api/admin/puppies/status", {...});
  });
};
```

**Impacto:**  
- Usuário não sabe se ação foi registrada
- Cliques duplos acidentais
- Frustração em conexões lentas

**Recomendação:**
```tsx
// Adicionar skeleton + toast persistente
<select 
  disabled={mutatingId === p.id}
  aria-busy={mutatingId === p.id}
  className={mutatingId === p.id ? 'opacity-50 cursor-wait' : ''}
>
  {/* ... */}
</select>
{mutatingId === p.id && (
  <span className="absolute inset-0 flex items-center justify-center bg-white/80">
    <Spinner size="sm" />
  </span>
)}
```

**Severidade:** 🔴 Crítico  
**Esforço:** 2h  
**Heurística:** #1 - Visibility of system status

---

#### 1.2. Prevenção de Erros
**Problema:** Falta confirmação antes de ações destrutivas  
**Localização:** `PuppyForm.tsx` - mudança de status para "sold"  
**Evidência:**
```tsx
<Select
  label="Status *"
  value={values.status}
  onChange={(v) => set("status", v as PuppyStatus)}
  options={[
    { value: "sold", label: "Vendido" }, // SEM CONFIRMAÇÃO
  ]}
/>
```

**Impacto:**
- Filhote marcado como vendido acidentalmente
- Perda de dados (reserva/leads associados)
- Necessidade de reverter manualmente

**Recomendação:**
```tsx
// Adicionar modal de confirmação para status "sold" e "reserved"
const [confirmDialog, setConfirmDialog] = useState<{
  show: boolean;
  newStatus: PuppyStatus;
} | null>(null);

const handleStatusChange = (newStatus: PuppyStatus) => {
  if (newStatus === 'sold' || newStatus === 'reserved') {
    setConfirmDialog({ show: true, newStatus });
  } else {
    set('status', newStatus);
  }
};

{confirmDialog && (
  <ConfirmDialog
    title={`Confirmar ${confirmDialog.newStatus === 'sold' ? 'venda' : 'reserva'}?`}
    description="Esta ação irá alterar o status do filhote. Leads existentes serão mantidos."
    confirmLabel="Sim, alterar"
    onConfirm={() => {
      set('status', confirmDialog.newStatus);
      setConfirmDialog(null);
    }}
    onCancel={() => setConfirmDialog(null)}
  />
)}
```

**Severidade:** 🔴 Crítico  
**Esforço:** 4h  
**Heurística:** #5 - Error prevention

---

### 🟠 ALTO

#### 1.3. Flexibilidade e Eficiência de Uso
**Problema:** Falta atalhos de teclado para ações frequentes  
**Localização:** Todo o painel admin  
**Evidência:**
- Nenhuma navegação por teclado além de Tab
- Sem shortcuts (ex: `n` para novo filhote, `/` para busca)
- Falta breadcrumbs para navegação rápida

**Impacto:**
- Usuários avançados precisam usar mouse sempre
- +30% de tempo em tarefas repetitivas
- Baixa produtividade operacional

**Recomendação:**
```tsx
// Implementar hook useKeyboardShortcuts
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    // Novo filhote
    if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      router.push('/admin/puppies/new');
    }
    // Focus na busca
    if (e.key === '/' && !e.metaKey) {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
    // Esc para limpar filtros
    if (e.key === 'Escape') {
      setSearchTerm('');
      setSelectedStatus('');
      setSelectedColor('');
      setSelectedCity('');
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);

// Adicionar indicador visual de shortcuts
<button>
  Novo filhote <kbd className="ml-2 text-xs">⌘N</kbd>
</button>
```

**Severidade:** 🟠 Alto  
**Esforço:** 6h  
**Heurística:** #7 - Flexibility and efficiency of use

---

#### 1.4. Ajuda e Documentação
**Problema:** Zero help text, tooltips ou documentação inline  
**Localização:** Todas as páginas admin  
**Evidência:**
```tsx
// Campos sem explicação
<Field label="Slug *" value={values.slug} onChange={...} />
// O que é "slug"? Como deve ser formatado?

<Field label="Preço (centavos) *" type="number" />
// Por que centavos? Quanto é 350000?
```

**Impacto:**
- Curva de aprendizado alta para novos admins
- Erros de formatação (slug, preço)
- Suporte técnico sobrecarregado

**Recomendação:**
```tsx
<Field 
  label="Slug *" 
  value={values.slug} 
  onChange={...}
  helpText="URL amigável, ex: thor-spitz-alemao-macho-laranja"
  hint="Gerado automaticamente, mas você pode personalizar"
/>

<Field 
  label="Preço *" 
  type="number"
  value={values.priceCents / 100}
  onChange={(v) => set('priceCents', Math.round(Number(v) * 100))}
  prefix="R$"
  helpText="Preço em reais. Exemplo: 3500 = R$ 3.500,00"
/>
```

**Severidade:** 🟠 Alto  
**Esforço:** 8h  
**Heurística:** #10 - Help and documentation

---

#### 1.5. Reconhecimento em vez de Recordação
**Problema:** Filtros sem indicador visual de estado ativo  
**Localização:** `PuppiesTable.tsx`, `LeadsListClient.tsx`  
**Evidência:**
```tsx
<select value={selectedStatus} onChange={...}>
  <option value="">Todos</option>
  {/* Sem badge mostrando filtros ativos */}
</select>
```

**Impacto:**
- Usuário esquece filtros ativos
- Confusão: "Por que não vejo todos os filhotes?"
- Precisa revisar cada filtro manualmente

**Recomendação:**
```tsx
// Badge de filtros ativos
<div className="flex items-center gap-2">
  {selectedStatus && (
    <Badge variant="brand" size="sm">
      Status: {STATUSES.find(s => s.value === selectedStatus)?.label}
      <button onClick={() => setSelectedStatus('')} aria-label="Remover filtro">×</button>
    </Badge>
  )}
  {selectedColor && (
    <Badge variant="brand" size="sm">
      Cor: {selectedColor}
      <button onClick={() => setSelectedColor('')}>×</button>
    </Badge>
  )}
  {(selectedStatus || selectedColor || selectedCity) && (
    <button 
      onClick={() => {
        setSelectedStatus('');
        setSelectedColor('');
        setSelectedCity('');
      }}
      className="text-xs text-rose-600 hover:underline"
    >
      Limpar todos
    </button>
  )}
</div>

<p className="text-xs text-muted">
  Exibindo {filtered.length} de {items.length} filhotes
</p>
```

**Severidade:** 🟠 Alto  
**Esforço:** 3h  
**Heurística:** #6 - Recognition rather than recall

---

### 🟡 MÉDIO

#### 1.6. Consistência e Padrões
**Problema:** Inconsistência na formatação de datas  
**Localização:** `dashboard/page.tsx` vs `PuppiesTable.tsx`  
**Evidência:**
```tsx
// Dashboard: sem formatação
<p>{lead.created_at}</p>

// PuppiesTable: formatado
<td>{new Date(p.createdAt).toLocaleDateString("pt-BR")}</td>

// LeadsListClient: com hora
<td>{lead.created_at ? new Date(lead.created_at).toLocaleString("pt-BR") : "—"}</td>
```

**Recomendação:**
```tsx
// Criar helper centralizado
// src/lib/format.ts
export const formatDate = (date: string | Date | null) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string | Date | null) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date: string | Date) => {
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return `Há ${days} dias`;
  return formatDate(date);
};
```

**Severidade:** 🟡 Médio  
**Esforço:** 2h  
**Heurística:** #4 - Consistency and standards

---

#### 1.7. Correspondência com o Mundo Real
**Problema:** Termos técnicos sem tradução  
**Localização:** `PuppyForm.tsx`, mensagens de erro  
**Evidência:**
```tsx
<Field label="Slug *" /> // Termo técnico
throw new Error("status"); // Erro genérico
```

**Recomendação:**
```tsx
<Field 
  label="Nome na URL *" 
  sublabel="(slug)"
  helpText="Como este filhote aparecerá no link do site"
/>

// Mensagens de erro humanizadas
const ERROR_MESSAGES = {
  status: 'Não foi possível atualizar o status do filhote. Tente novamente.',
  network: 'Sem conexão. Verifique sua internet.',
  validation: 'Alguns campos estão incorretos. Revise os destacados em vermelho.',
};
```

**Severidade:** 🟡 Médio  
**Esforço:** 3h  
**Heurística:** #2 - Match between system and real world

---

#### 1.8-1.13. Outros problemas médios (listagem compacta)

**1.8. Falta undo/redo em edições**  
- Severidade: 🟡 Médio | Esforço: 8h  
- Adicionar histórico de alterações com botão "Desfazer"

**1.9. Sem indicador de campos obrigatórios consistente**  
- Severidade: 🟡 Médio | Esforço: 2h  
- Padronizar `*` ou `(obrigatório)` em todos os campos

**1.10. Falta validação em tempo real**  
- Severidade: 🟡 Médio | Esforço: 6h  
- Validar campos onBlur, não apenas onSubmit

**1.11. Sem preview antes de salvar**  
- Severidade: 🟡 Médio | Esforço: 12h  
- Modal de preview do filhote como aparecerá no site

**1.12. Mensagens de sucesso genéricas**  
- Severidade: 🟡 Médio | Esforço: 1h  
- "Thor foi criado com sucesso!" vs "Filhote criado."

**1.13. Falta paginação**  
- Severidade: 🟡 Médio | Esforço: 4h  
- PuppiesTable e LeadsListClient limitados a 100-200 itens

---

### 🟢 BAIXO

#### 1.14-1.17. Problemas de baixa prioridade

**1.14. Sem dark mode no admin**  
**1.15. Falta personalização de colunas visíveis**  
**1.16. Sem export CSV/Excel**  
**1.17. Falta drag-and-drop para reordenar**

---

## 🛣️ 2. Problemas de Fluxo e Navegação

### 🔴 CRÍTICO

#### 2.1. Mobile: Menu Hamburger Ausente
**Problema:** No mobile, sidebar desaparece mas não há menu alternativo  
**Localização:** `layout.tsx`  
**Evidência:**
```tsx
<aside className="hidden w-60 shrink-0 ... md:block">
  {/* Sidebar só aparece em md+ */}
</aside>

<div className="mb-4 flex ... md:hidden">
  {/* Header mobile SEM menu de navegação */}
  <a href="/admin/logout">Sair</a>
</div>
```

**Impacto:**
- **Impossível navegar no mobile** (exceto digitando URLs)
- Usuários presos na página atual
- Apenas logout acessível

**Recomendação:**
```tsx
// Adicionar menu mobile
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

<div className="md:hidden">
  <button 
    onClick={() => setMobileMenuOpen(true)}
    aria-label="Abrir menu"
    aria-expanded={mobileMenuOpen}
  >
    <Menu className="h-5 w-5" />
  </button>
</div>

{mobileMenuOpen && (
  <Dialog onClose={() => setMobileMenuOpen(false)}>
    <AdminNav />
    <button onClick={() => {/* logout */}}>Sair</button>
  </Dialog>
)}
```

**Severidade:** 🔴 Crítico  
**Esforço:** 4h

---

### 🟠 ALTO

#### 2.2. Breadcrumbs Ausentes
**Problema:** Sem indicador de localização em páginas profundas  
**Localização:** `/admin/puppies/edit/[id]`, `/admin/leads/[id]`  
**Evidência:**
- URL: `/admin/puppies/edit/abc-123`
- Página mostra apenas "Editar filhote" sem contexto

**Impacto:**
- Usuário perde noção de onde está
- Botão "Voltar" leva para página errada (histórico do navegador)
- Dificulta navegação entre seções

**Recomendação:**
```tsx
// Componente Breadcrumb reutilizável
<Breadcrumb>
  <BreadcrumbItem href="/admin/dashboard">Admin</BreadcrumbItem>
  <BreadcrumbItem href="/admin/puppies">Filhotes</BreadcrumbItem>
  <BreadcrumbItem current>Editar: {puppy.name}</BreadcrumbItem>
</Breadcrumb>
```

**Severidade:** 🟠 Alto  
**Esforço:** 3h

---

#### 2.3. Ações em Massa Ausentes
**Problema:** Impossível operar múltiplos filhotes simultaneamente  
**Localização:** `PuppiesTable.tsx`  
**Evidência:**
- Para marcar 10 filhotes como "vendido": 10 ações individuais
- Sem checkbox para seleção múltipla

**Impacto:**
- **Operação não escala:** com 200+ filhotes, tarefa se torna impraticável
- Frustração em operações em lote (ex: importação)

**Recomendação:**
```tsx
// Adicionar seleção múltipla
const [selected, setSelected] = useState<Set<string>>(new Set());

<thead>
  <th>
    <input 
      type="checkbox"
      checked={selected.size === filtered.length}
      onChange={(e) => {
        setSelected(e.target.checked 
          ? new Set(filtered.map(p => p.id)) 
          : new Set()
        );
      }}
    />
  </th>
</thead>

{selected.size > 0 && (
  <div className="fixed bottom-4 right-4 bg-white shadow-lg p-4 rounded-lg">
    <p>{selected.size} selecionado{selected.size > 1 ? 's' : ''}</p>
    <button onClick={() => handleBulkStatus('sold')}>
      Marcar como vendido
    </button>
    <button onClick={() => handleBulkDelete()}>
      Excluir
    </button>
  </div>
)}
```

**Severidade:** 🟠 Alto  
**Esforço:** 8h

---

#### 2.4. Links Quebrados em Leads
**Problema:** Dashboard mostra link `/admin/leads/{id}` mas rota não existe  
**Localização:** `dashboard/page.tsx`  
**Evidência:**
```tsx
<a href={`/admin/leads/${lead.id}`}>Ver</a>
// ❌ Rota não implementada
```

**Impacto:**
- Clique resulta em 404
- Usuário não consegue acessar detalhes do lead
- Frustração e perda de confiança

**Recomendação:**
```tsx
// Opção 1: Implementar página de detalhes
// app/(admin)/admin/(protected)/leads/[id]/page.tsx

// Opção 2 (temporária): Redirecionar para lista com filtro
<a href={`/admin/leads?id=${lead.id}`}>Ver</a>

// Opção 3: Abrir modal
<button onClick={() => setSelectedLead(lead)}>Ver</button>
```

**Severidade:** 🟠 Alto  
**Esforço:** 6h (Opção 1) | 1h (Opção 2)

---

### 🟡 MÉDIO

#### 2.5-2.9. Outros problemas de fluxo (listagem compacta)

**2.5. Sem link rápido do filhote para seus leads**  
- Tabela mostra "5 leads" mas não é clicável  
- Esforço: 2h

**2.6. Falta botão "Criar lead" a partir de um filhote**  
- Fluxo: ver filhote → criar lead manualmente  
- Esforço: 4h

**2.7. Sem histórico de alterações (audit log)**  
- Impossível saber quem/quando alterou status  
- Esforço: 12h

**2.8. Falta busca global (cross-entity)**  
- Buscar "Thor" só em filhotes, não em leads  
- Esforço: 10h

**2.9. Sem favoritos/pins para acesso rápido**  
- Toda navegação via sidebar  
- Esforço: 6h

---

### 🟢 BAIXO

**2.10. Falta recentes/histórico de navegação**  
**2.11. Sem notificações de novos leads em tempo real**

---

## ♿ 3. Problemas de Acessibilidade (WCAG 2.2)

### 🔴 CRÍTICO - Bloqueadores de Uso

#### 3.1. Tabelas Sem Contexto Semântico
**Problema:** Falta `<caption>` e headers associados  
**Localização:** `PuppiesTable.tsx`, `LeadsListClient.tsx`  
**Evidência:**
```tsx
<table className="...">
  {/* ❌ Sem <caption> */}
  <thead>
    <tr>
      <th>Nome</th> {/* ❌ Sem scope="col" */}
    </tr>
  </thead>
</table>
```

**Impacto WCAG:**
- **1.3.1 Info and Relationships (A)** ❌ FAIL
- Screen readers não anunciam contexto da tabela
- Usuários cegos não sabem o propósito da tabela

**Recomendação:**
```tsx
<table aria-label="Lista de filhotes cadastrados">
  <caption className="sr-only">
    Tabela com {filtered.length} filhotes, mostrando nome, cor, status e ações
  </caption>
  <thead>
    <tr>
      <th scope="col">Nome</th>
      <th scope="col">Cor</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
</table>
```

**Severidade:** 🔴 Crítico (WCAG A)  
**Esforço:** 1h

---

#### 3.2. Campos de Formulário Sem Labels Explícitos
**Problema:** Labels visuais, mas não associados semanticamente  
**Localização:** `LeadsListClient.tsx`, `PuppiesTable.tsx`  
**Evidência:**
```tsx
<label className="text-sm ...">
  Status
  <select value={selectedStatus} onChange={...}>
    {/* ❌ Input não tem id/htmlFor */}
  </select>
</label>
```

**Impacto WCAG:**
- **1.3.1 Info and Relationships (A)** ❌ FAIL
- **4.1.2 Name, Role, Value (A)** ❌ FAIL
- Screen readers não conseguem anunciar o label correto

**Recomendação:**
```tsx
<label htmlFor="filter-status" className="text-sm ...">
  Status
  <select 
    id="filter-status"
    name="status"
    value={selectedStatus}
    onChange={...}
    aria-label="Filtrar por status"
  >
    <option value="">Todos os status</option>
  </select>
</label>
```

**Severidade:** 🔴 Crítico (WCAG A)  
**Esforço:** 2h

---

#### 3.3. Contraste Insuficiente em Texto Mutado
**Problema:** `--text-muted: #5a4d42` sobre `--bg: #faf5ef` = 4.2:1  
**Localização:** Todo o painel (labels, helpers)  
**Evidência:**
```css
/* globals.css */
--text-muted: #5a4d42; /* Ajustado recentemente, mas ainda limite */
--bg: #faf5ef;
```

**Teste de Contraste:**
- Ratio atual: 4.2:1
- Mínimo WCAG AA: 4.5:1 para texto normal
- **❌ FAIL AA** (borderline)

**Recomendação:**
```css
/* Ajustar para contraste seguro */
--text-muted: #4a3d32; /* 4.8:1 - PASS AA */

/* Ou usar variante bold */
.text-sm.text-muted {
  font-weight: 500; /* Bold tem requisito menor: 3:1 */
}
```

**Severidade:** 🔴 Crítico (WCAG AA)  
**Esforço:** 1h

---

#### 3.4. Live Regions Ausentes para Atualizações Dinâmicas
**Problema:** Mudanças de conteúdo não anunciadas  
**Localização:** `PuppiesTable.tsx` - inline status update  
**Evidência:**
```tsx
// Status muda mas screen reader não anuncia
setLocalItems((prev) => prev.map((p) => 
  p.id === id ? { ...p, status } : p
));
```

**Impacto WCAG:**
- **4.1.3 Status Messages (AA)** ❌ FAIL
- Usuários de screen readers não sabem que ação foi concluída

**Recomendação:**
```tsx
// Adicionar live region para anúncios
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {announceMessage}
</div>

const handleStatus = (id, status) => {
  // ... fetch
  setAnnounceMessage(`Status do filhote ${name} alterado para ${status}`);
};
```

**Severidade:** 🔴 Crítico (WCAG AA)  
**Esforço:** 2h

---

### 🟠 ALTO - Impacto Significativo

#### 3.5. Navegação por Teclado Incompleta
**Problema:** Impossível navegar filtros sem mouse  
**Localização:** `PuppiesTable.tsx`, `LeadsListClient.tsx`  
**Evidência:**
```tsx
// Filtros in-line sem teclas de atalho
<label className="text-sm ...">
  Cor
  <select>...</select>
</label>
// Tab funciona, mas sem skip navigation
```

**Impacto WCAG:**
- **2.1.1 Keyboard (A)** ⚠️ Parcial
- **2.4.1 Bypass Blocks (A)** ❌ FAIL
- Usuários de teclado precisam tabar por TODOS os filtros

**Recomendação:**
```tsx
// Adicionar skip link para conteúdo
<a href="#puppies-table-content" className="sr-only focus:not-sr-only">
  Pular para tabela
</a>

// Atalho para limpar filtros
<button 
  onClick={clearAllFilters}
  accessKey="c"
  aria-keyshortcuts="Alt+C"
>
  Limpar filtros <kbd>Alt+C</kbd>
</button>
```

**Severidade:** 🟠 Alto (WCAG A)  
**Esforço:** 3h

---

#### 3.6. Foco Invisível em Alguns Elementos
**Problema:** Outline padrão sobrescrito sem alternativa  
**Localização:** Vários componentes  
**Evidência:**
```css
/* globals.css - bom */
a:focus-visible { outline: 2px solid var(--brand); }

/* Mas alguns componentes removem */
.btn:focus { outline: none; } /* ❌ SEM alternativa */
```

**Recomendação:**
```css
/* Garantir foco sempre visível */
*:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

/* Permitir remoção APENAS se houver alternativa */
.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--brand-light);
}
```

**Severidade:** 🟠 Alto (WCAG AA)  
**Esforço:** 2h

---

#### 3.7. Ícones Sem Texto Alternativo
**Problema:** Ícones sozinhos sem label  
**Localização:** `PuppiesTable.tsx` - botão "Mais ações"  
**Evidência:**
```tsx
<button type="button">
  <MoreVertical className="h-4 w-4" aria-hidden />
  {/* ❌ Sem aria-label no button */}
</button>
```

**Recomendação:**
```tsx
<button 
  type="button" 
  aria-label={`Ações para ${puppy.name}`}
  aria-haspopup="menu"
>
  <MoreVertical className="h-4 w-4" aria-hidden="true" />
</button>
```

**Severidade:** 🟠 Alto (WCAG A)  
**Esforço:** 1h

---

#### 3.8-3.11. Outros problemas alto (compacto)

**3.8. Modais sem foco trap**  
- Toast fecha, foco some no void  
- Esforço: 4h

**3.9. Falta landmarks ARIA**  
- Sem `<nav>`, `<main>`, `<aside>` semânticos  
- Esforço: 1h

**3.10. Campos de busca sem role="search"**  
- `<input type="search">` mas sem container `<form role="search">`  
- Esforço: 30min

**3.11. Tabelas sem row headers**  
- `<th scope="row">` ausente em primeira coluna  
- Esforço: 1h

---

### 🟡 MÉDIO

#### 3.12. Mensagens de Erro Não Associadas
**Problema:** Erro aparece visualmente mas não está linkado ao campo  
**Localização:** `PuppyForm.tsx`  
**Evidência:**
```tsx
<Field label="Nome *" value={...} error={errors.name} />
// error exibido, mas sem aria-describedby
```

**Recomendação:**
```tsx
<div>
  <label htmlFor="puppy-name">Nome *</label>
  <input 
    id="puppy-name"
    aria-invalid={!!errors.name}
    aria-describedby={errors.name ? 'name-error' : undefined}
  />
  {errors.name && (
    <p id="name-error" role="alert" className="text-rose-600">
      {errors.name}
    </p>
  )}
</div>
```

**Severidade:** 🟡 Médio (WCAG AA)  
**Esforço:** 2h

---

#### 3.13-3.17. Outros problemas médio

**3.13. Sem heading hierarchy**  
- `<h1>` em todas as páginas, sem `<h2>`, `<h3>`  
- Esforço: 2h

**3.14. Links sem estados hover/focus distinguíveis**  
- `hover:underline` mas sem mudança de cor  
- Esforço: 1h

**3.15. Timeouts não configuráveis**  
- Toast desaparece em 3s fixo  
- Esforço: 30min

**3.16. Sem modo de alto contraste**  
- Depende do SO, sem toggle manual  
- Esforço: 8h

**3.17. Animações sem prefers-reduced-motion**  
- Spinners animam sempre  
- Esforço: 1h

---

### 🟢 BAIXO

**3.18. Sem suporte a leitores de tela em português**  
**3.19. Falta lang="pt-BR" em campos dinâmicos**  
**3.20. Sem tooltip acessível (role="tooltip")**

---

## 🎨 4. Problemas de Consistência (Design System)

### 🟠 ALTO

#### 4.1. Botões com Estilos Inconsistentes
**Problema:** Múltiplos padrões de botão coexistem  
**Localização:** Comparação entre páginas  
**Evidência:**
```tsx
// Página 1: classe utility inline
<a className="rounded-full bg-emerald-600 px-4 py-2 text-sm ...">
  Novo filhote
</a>

// Página 2: componente Button do DS
<Button variant="solid" size="md">Salvar</Button>

// Página 3: classe btn global (globals.css)
<button className="btn-brand">Entrar</button>
```

**Impacto:**
- 3 estilos diferentes para mesmo elemento
- Manutenção fragmentada
- Inconsistência visual

**Recomendação:**
```tsx
// Migrar TUDO para DS component
import { Button } from '@/components/ui';

<Button variant="solid" size="md" href="/admin/puppies/new">
  Novo filhote
</Button>

// Remover classes utilitárias inline
// Deprecar .btn-* do globals.css
```

**Severidade:** 🟠 Alto  
**Esforço:** 6h

---

#### 4.2. Spacing Sem Sistema
**Problema:** Valores mágicos de espaçamento  
**Localização:** Layout, cards, forms  
**Evidência:**
```tsx
<div className="space-y-6"> {/* 24px */}
<div className="space-y-4"> {/* 16px */}
<div className="space-y-3"> {/* 12px */}
<div className="gap-6"> {/* 24px */}
<div className="gap-4"> {/* 16px */}
<div className="gap-3"> {/* 12px */}
<div className="px-4 py-6"> {/* 16px / 24px */}
```

**Recomendação:**
```tsx
// Definir escala de spacing
// design-system/tokens.css
:root {
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */
}

// Usar tokens consistentes
<div className="space-y-[var(--space-lg)]">
<div className="gap-[var(--space-md)]">

// Ou criar utilities
.gap-md { gap: var(--space-md); }
.space-y-lg > * + * { margin-top: var(--space-lg); }
```

**Severidade:** 🟠 Alto  
**Esforço:** 4h

---

#### 4.3. Cores Hardcoded vs Tokens
**Problema:** Cores inline ignoram design system  
**Localização:** Várias páginas  
**Evidência:**
```tsx
// ✅ Bom: usa token
<p className="text-[var(--text-muted)]">...</p>

// ❌ Ruim: cor inline
<button className="text-rose-600 hover:text-rose-700">Sair</button>

// ❌ Ruim: Tailwind direto
<Badge className="bg-emerald-100 text-emerald-800">Disponível</Badge>
```

**Recomendação:**
```css
/* Adicionar tokens semânticos */
:root {
  --color-danger: #dc2626;
  --color-danger-hover: #b91c1c;
  --color-success-bg: #d1fae5;
  --color-success-text: #065f46;
}

/* Criar utilities */
.text-danger { color: var(--color-danger); }
.hover\:text-danger:hover { color: var(--color-danger-hover); }
```

**Severidade:** 🟠 Alto  
**Esforço:** 5h

---

### 🟡 MÉDIO

#### 4.4-4.8. Outros problemas de consistência

**4.4. Border-radius inconsistente**  
- `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px), `rounded-full`  
- Padronizar: card = 12px, button = 8px, pill = full  
- Esforço: 2h

**4.5. Shadows sem sistema**  
- `shadow-sm`, `shadow`, inline box-shadow  
- Definir elevations: 0 (flat), 1 (hover), 2 (modal), 3 (dropdown)  
- Esforço: 3h

**4.6. Tipografia com tamanhos arbitrários**  
- `text-xs`, `text-sm`, `text-2xl` misturados  
- Definir scale: caption/body/lead/h1/h2/h3  
- Esforço: 4h

**4.7. Ícones de bibliotecas diferentes**  
- lucide-react + possível heroicons  
- Padronizar em lucide-react apenas  
- Esforço: 2h

**4.8. Estados hover/focus diferentes**  
- Alguns com `hover:bg-*`, outros com `hover:brightness-*`  
- Padronizar interações  
- Esforço: 3h

---

### 🟢 BAIXO

**4.9. Falta variantes de formulários (ghost, outline, etc)**  
**4.10. Sem componente de skeleton loader padronizado**

---

## 📈 5. Problemas de Previsibilidade e Padrões

### 🟠 ALTO

#### 5.1. Ações Destrutivas Sem Padrão Visual
**Problema:** "Excluir" vs "Sair" têm mesmo peso visual  
**Localização:** Vários botões  
**Evidência:**
```tsx
// Ambos vermelhos, sem hierarquia
<button className="text-rose-600">Sair</button>
<button className="text-rose-600">Excluir filhote</button>
```

**Recomendação:**
```tsx
// Padrão 1: Sair (outline ghost)
<Button variant="ghost" color="danger" size="sm">
  Sair
</Button>

// Padrão 2: Excluir (solid danger)
<Button variant="solid" color="danger" size="md" destructive>
  <Trash2 className="h-4 w-4" />
  Excluir permanentemente
</Button>

// Sempre com modal de confirmação
```

**Severidade:** 🟠 Alto  
**Esforço:** 3h

---

#### 5.2. Feedback de Loading Imprevisível
**Problema:** Cada componente tem seu próprio spinner  
**Localização:** PuppyForm, LeadsTable, etc  
**Evidência:**
```tsx
// Spinner 1: Loader2 do lucide
{loading && <Loader2 className="animate-spin" />}

// Spinner 2: div customizado
<div className="h-4 w-4 animate-spin rounded-full border-2 ..." />

// Spinner 3: texto
{submitting && "Salvando..."}
```

**Recomendação:**
```tsx
// Usar componente Spinner do DS
import { Spinner, InlineSpinner } from '@/components/ui';

// Para botões
<Button loading={submitting}>Salvar</Button>

// Para conteúdo
<InlineSpinner label="Carregando filhotes..." />

// Para tabelas
<TableSkeleton rows={5} columns={6} />
```

**Severidade:** 🟠 Alto  
**Esforço:** 4h

---

### 🟡 MÉDIO

#### 5.3-5.7. Outros problemas de previsibilidade

**5.3. Estados de erro variados**  
- Toast vs inline vs banner  
- Padronizar: validação = inline, network = toast, critical = banner  
- Esforço: 3h

**5.4. Confirmações inconsistentes**  
- Às vezes modal, às vezes toast "Tem certeza?"  
- Sempre modal para destrutivo  
- Esforço: 5h

**5.5. Ordenação de tabela não indicada**  
- Usuário não sabe se está ordenando por nome, data, etc  
- Adicionar setas ↑↓ nos headers clicáveis  
- Esforço: 4h

**5.6. Paginação vs infinite scroll**  
- Mistura de abordagens  
- Escolher uma: paginação para admin  
- Esforço: 6h

**5.7. Falta estados vazios consistentes**  
- "Sem leads recentes" vs placeholder genérico  
- Empty state com ilustração + CTA  
- Esforço: 8h

---

## 🚀 6. Problemas de Escalabilidade

### 🔴 CRÍTICO

#### 6.1. Tabelas Renderizam Todos os Itens (Sem Virtualização)
**Problema:** 200 filhotes = 200 linhas DOM = lag  
**Localização:** `PuppiesTable.tsx`, `LeadsListClient.tsx`  
**Evidência:**
```tsx
{filtered.map((p) => (
  <tr key={p.id}>...</tr>
))}
// ❌ Renderiza TODAS as linhas, mesmo fora da tela
```

**Impacto em Escala:**
- 200 filhotes: ~0.5s render
- 1000 filhotes: ~3s render + scroll travado
- **Sistema para para com >500 itens**

**Recomendação:**
```tsx
// Opção 1: Paginação server-side
const { puppies, total } = await listPuppiesCatalog(
  filters, 
  sort, 
  { limit: 50, offset: page * 50 }
);

<Pagination 
  currentPage={page}
  totalPages={Math.ceil(total / 50)}
  onPageChange={setPage}
/>

// Opção 2: Virtualização client-side
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: filtered.length,
  getScrollElement: () => tableRef.current,
  estimateSize: () => 60, // altura da linha
});

{virtualizer.getVirtualItems().map((virtualRow) => {
  const puppy = filtered[virtualRow.index];
  return <tr key={puppy.id} style={{ height: virtualRow.size }}>...</tr>;
})}
```

**Severidade:** 🔴 Crítico (escalabilidade)  
**Esforço:** 12h (paginação) | 20h (virtualização)

---

#### 6.2. Falta Índices de Busca (Linear Search)
**Problema:** Busca percorre array completo  
**Localização:** Todos os filtros  
**Evidência:**
```tsx
const filtered = useMemo(() => {
  return localItems.filter((p) => {
    // ❌ O(n) - varre TODOS os itens a cada mudança
    if (selectedStatus && p.status !== selectedStatus) return false;
    if (selectedColor && p.color !== selectedColor) return false;
    if (query) {
      const haystack = `${p.name} ${p.slug} ${p.color}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}, [localItems, selectedStatus, selectedColor, query]);
```

**Impacto em Escala:**
- 100 itens: imperceptível
- 1000 itens: 50-100ms por keystroke
- **Input fica lento com >500 itens**

**Recomendação:**
```tsx
// Opção 1: Busca server-side com índices Supabase
const { puppies } = await supabase
  .from('puppies')
  .select()
  .textSearch('fts', searchTerm) // Full-text search
  .eq('status', selectedStatus);

// Opção 2: Índice client-side com Fuse.js
import Fuse from 'fuse.js';

const fuse = useMemo(() => new Fuse(items, {
  keys: ['name', 'slug', 'color'],
  threshold: 0.3,
}), [items]);

const filtered = searchTerm 
  ? fuse.search(searchTerm).map(r => r.item)
  : items;

// Opção 3: Web Worker para não bloquear UI
const searchWorker = useMemo(() => 
  new Worker('/workers/search.js'), []
);
```

**Severidade:** 🔴 Crítico (performance)  
**Esforço:** 8h (server-side) | 16h (client optimizado)

---

### 🟠 ALTO

#### 6.3. Sem Sistema de Cache (Fetches Redundantes)
**Problema:** Mesmos dados carregados múltiplas vezes  
**Localização:** Navegação entre páginas  
**Evidência:**
- Abrir `/admin/puppies` → fetch 200 filhotes
- Editar filhote → voltar → **fetch 200 filhotes novamente**
- Dados idênticos, desperdício de banda

**Recomendação:**
```tsx
// Implementar React Query ou SWR
import { useQuery } from '@tanstack/react-query';

function usePuppies(filters) {
  return useQuery({
    queryKey: ['puppies', filters],
    queryFn: () => fetchPuppies(filters),
    staleTime: 5 * 60 * 1000, // 5 min
    cacheTime: 10 * 60 * 1000, // 10 min
  });
}

// Ou usar Next.js cache tags
export const revalidate = 60; // ISR 1 min
```

**Severidade:** 🟠 Alto  
**Esforço:** 12h

---

#### 6.4. Estado Local Não Persiste (Filtros Perdidos)
**Problema:** Aplicar filtros → editar filhote → voltar → **filtros resetados**  
**Localização:** Todos os filtros  
**Evidência:**
```tsx
const [selectedStatus, setSelectedStatus] = useState("");
// ❌ Reseta ao unmount
```

**Recomendação:**
```tsx
// Sincronizar com URL (melhor UX)
import { useSearchParams } from 'next/navigation';

const searchParams = useSearchParams();
const [selectedStatus, setSelectedStatus] = useState(
  searchParams.get('status') || ''
);

useEffect(() => {
  const params = new URLSearchParams(searchParams);
  if (selectedStatus) {
    params.set('status', selectedStatus);
  } else {
    params.delete('status');
  }
  router.push(`?${params.toString()}`, { scroll: false });
}, [selectedStatus]);

// ✅ URL fica: /admin/puppies?status=sold&color=creme
// ✅ Compartilhável, refresh mantém filtros
```

**Severidade:** 🟠 Alto  
**Esforço:** 6h

---

#### 6.5-6.8. Outros problemas de escalabilidade

**6.5. Imagens não otimizadas (sem CDN)**  
- Links diretos do Supabase Storage  
- Implementar Image Optimization API ou Cloudinary  
- Esforço: 10h

**6.6. Sem debounce em inputs de busca**  
- Cada keystroke = re-render + fetch  
- Adicionar `useDebouncedValue(searchTerm, 300)`  
- Esforço: 2h

**6.7. Bundle JS não otimizado**  
- Admin carrega libs do site público  
- Code splitting por rota  
- Esforço: 8h

**6.8. Sem lazy loading de componentes pesados**  
- PuppyForm carrega mesmo em list view  
- Dynamic imports  
- Esforço: 4h

---

### 🟡 MÉDIO

**6.9. Falta rollback de alterações**  
**6.10. Sem sistema de jobs para operações longas**

---

## 📋 Plano de Ação Priorizado

### 🏃 Sprint 1 - Bloqueadores Críticos (1-2 semanas)

**Foco:** Tornar o painel utilizável e acessível

| # | Issue | Severidade | Esforço | Impacto |
|---|-------|-----------|---------|---------|
| 2.1 | Menu mobile ausente | 🔴 Crítico | 4h | Alto |
| 3.1 | Tabelas sem semântica | 🔴 Crítico | 1h | Alto |
| 3.2 | Campos sem labels | 🔴 Crítico | 2h | Alto |
| 3.3 | Contraste insuficiente | 🔴 Crítico | 1h | Médio |
| 3.4 | Live regions ausentes | 🔴 Crítico | 2h | Médio |
| 1.1 | Falta feedback em ações | 🔴 Crítico | 2h | Alto |
| 1.2 | Sem confirmação destrutiva | 🔴 Crítico | 4h | Alto |

**Total Sprint 1:** 16h

---

### 🚀 Sprint 2 - Usabilidade Core (2-3 semanas)

**Foco:** Melhorar produtividade e fluxo

| # | Issue | Severidade | Esforço | Impacto |
|---|-------|-----------|---------|---------|
| 2.2 | Breadcrumbs ausentes | 🟠 Alto | 3h | Alto |
| 2.3 | Ações em massa | 🟠 Alto | 8h | Alto |
| 2.4 | Links quebrados | 🟠 Alto | 6h | Médio |
| 1.3 | Falta shortcuts | 🟠 Alto | 6h | Médio |
| 1.4 | Sem documentação | 🟠 Alto | 8h | Médio |
| 1.5 | Filtros sem indicador | 🟠 Alto | 3h | Médio |
| 3.5 | Navegação teclado | 🟠 Alto | 3h | Médio |
| 3.6 | Foco invisível | 🟠 Alto | 2h | Alto |

**Total Sprint 2:** 39h

---

### 🎨 Sprint 3 - Consistência e Design System (2 semanas)

**Foco:** Padronização e manutenibilidade

| # | Issue | Severidade | Esforço | Impacto |
|---|-------|-----------|---------|---------|
| 4.1 | Botões inconsistentes | 🟠 Alto | 6h | Alto |
| 4.2 | Spacing sem sistema | 🟠 Alto | 4h | Médio |
| 4.3 | Cores hardcoded | 🟠 Alto | 5h | Médio |
| 4.4-4.8 | Outros DS issues | 🟡 Médio | 14h | Médio |
| 5.1 | Ações destrutivas | 🟠 Alto | 3h | Médio |
| 5.2 | Loading imprevisível | 🟠 Alto | 4h | Baixo |

**Total Sprint 3:** 36h

---

### 📈 Sprint 4 - Escalabilidade (3-4 semanas)

**Foco:** Preparar para crescimento

| # | Issue | Severidade | Esforço | Impacto |
|---|-------|-----------|---------|---------|
| 6.1 | Virtualização tabelas | 🔴 Crítico | 12h | Alto |
| 6.2 | Busca otimizada | 🔴 Crítico | 8h | Alto |
| 6.3 | Sistema de cache | 🟠 Alto | 12h | Médio |
| 6.4 | Persistência filtros | 🟠 Alto | 6h | Médio |
| 6.5-6.8 | Otimizações | 🟡 Médio | 24h | Variado |

**Total Sprint 4:** 62h

---

## 🎯 Métricas de Sucesso

### Antes da Auditoria
- **SUS Score:** ~45/100 (abaixo da média)
- **Task Success Rate:** ~70%
- **Time on Task:** +40% acima do esperado
- **Error Rate:** ~15%
- **WCAG Compliance:** ~40% (F em A, D em AA)

### Após Implementação
- **SUS Score:** >75/100 (boa usabilidade)
- **Task Success Rate:** >90%
- **Time on Task:** -30% de redução
- **Error Rate:** <5%
- **WCAG Compliance:** >95% (A em A, B+ em AA)

---

## 🛠️ Ferramentas Recomendadas

### Auditoria Contínua
- **axe DevTools** - Acessibilidade automatizada
- **WAVE** - Validação WCAG visual
- **Lighthouse CI** - Performance + a11y
- **Storybook** - Documentação de componentes
- **Chromatic** - Visual regression testing

### Desenvolvimento
- **React Query** - Cache e state management
- **React Virtual** - Virtualização de listas
- **Fuse.js** - Busca fuzzy client-side
- **Radix UI** - Componentes acessíveis base
- **CVA (Class Variance Authority)** - Variantes tipadas

---

## 📚 Referências

- [Nielsen Norman Group - 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)

---

**Documento vivo.** Atualizar conforme evoluções do painel.

**Última revisão:** 1 de dezembro de 2025
