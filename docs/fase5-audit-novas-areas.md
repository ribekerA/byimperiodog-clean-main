# 🔍 Auditoria UX/UI + Acessibilidade — Fase 5 (Áreas Novas Pós-Dez/2025)

**Data:** 11 de julho de 2026
**Auditor:** Lead Product Engineer
**Escopo:** 4 áreas construídas após a auditoria de dez/2025 e nunca revisadas — CRM de Leads (widgets de IA), Contratos Digitais + ZapSign, AutoSalesEngine + Blog Autopilot/Wizard, AiMatchmakerChat (site público)
**Metodologia:** Nielsen Heuristics + WCAG 2.2 AA/AAA + Best Practices — mesma metodologia de `docs/admin-ux-audit.md`, com uma dimensão extra de **Segurança/Integridade** na área de Contratos, por ser um fluxo jurídico-financeiro exposto a clientes finais (não coberta pela rubrica original porque o admin panel não tinha rotas públicas nem webhooks externos).

Esta auditoria **não reavalia** o que já foi documentado em `docs/UI-UX-A11Y-AUDIT.md` e `docs/admin-ux-audit.md` (ex.: `LeadsCRM.tsx`/`queries.ts` — filtros com URL state e paginação server-side já confirmados corretos, fora de escopo aqui).

---

## 📊 Resumo Executivo

### Classificação Geral de Severidade (4 áreas)

| Categoria | Crítico | Alto | Médio | Baixo | Total |
|-----------|---------|------|-------|-------|-------|
| **CRM de Leads (widgets IA)** | 1 | 2 | 1 | 2 | **6** |
| **Contratos + ZapSign** | 3 | 3 | 1 | 1 | **8** |
| **AutoSalesEngine + Blog IA** | 1 | 1 | 2 | 2 | **6** |
| **AiMatchmakerChat** | 0 | 1 | 2 | 1 | **4** |
| **Cross-cutting (transversal)** | 0 | 0 | 3 | 0 | **3** |
| **TOTAL** | **5** | **7** | **9** | **6** | **27** |

### ⚠️ Resposta direta à pergunta que motivou esta auditoria

**Sim, há achados no mesmo nível (ou pior) que os "9 críticos" da auditoria de dezembro.** Os 3 críticos da área de **Contratos + ZapSign** (C1, C2, C3, ver abaixo) não são problemas de polimento de UI — são **falhas reais de segurança e integridade jurídica** num fluxo de assinatura de contrato com dados pessoais (CPF, RG, endereço) e valor comercial real:

- Um **webhook público sem verificação de assinatura** permite marcar qualquer contrato como "assinado" por qualquer pessoa que envie um POST forjado.
- Existe um **endpoint duplicado e órfão** (`app/contract/route.ts`) ainda ativo em produção, sem validação, capaz de sobrescrever silenciosamente os dados de um contrato já assinado.
- O endpoint "oficial" marca o contrato como `assinado` **mesmo que a assinatura não tenha sido enviada**, se chamado diretamente (fora do navegador).

Isso é qualitativamente diferente dos achados de usabilidade das outras 3 áreas (que são reais, mas na faixa "produto incompleto/inconsistente", não "explorável").

### Score Geral por Área

| Área | Usabilidade | Acessibilidade | Consistência | Escalabilidade |
|------|:---:|:---:|:---:|:---:|
| CRM de Leads (IA) | 62/100 ⚠️ | 50/100 ❌ | 58/100 ⚠️ | 75/100 ✅ |
| Contratos + ZapSign | 58/100 ⚠️ | 45/100 ❌ | 55/100 ⚠️ | 55/100 ⚠️ |
| AutoSales + Blog IA | 60/100 ⚠️ | 68/100 ⚠️ | 52/100 ⚠️ | 58/100 ⚠️ |
| AiMatchmakerChat | 80/100 ✅ | 76/100 ✅ | 62/100 ⚠️ | 65/100 ⚠️ |

**Nota positiva:** o `AiMatchmakerChat` é, de longe, a área com melhor engenharia de acessibilidade das 4 (`aria-live="polite"` no log de chat, `role`/`aria-label` consistentes, respeita `useReducedMotion`, fallback gracioso para quiz estático). Confirmamos também que **`is_partner_breeder`/`breeder_name` não são expostos** nem no `AiMatchmakerChat` nem nas rotas públicas `/contract/[code]` e `/contract/[code]/documento` — a regra de negócio é respeitada nestas 4 áreas (o vazamento já documentado em `AUDIT_REPORT.md` é em `app/filhotes/page.tsx`, fora deste escopo).

---

## 🤖 1. CRM de Leads — Widgets de IA

**Componentes:** `LeadAdvisorCards.tsx`, `LeadCrossMatchCard.tsx`, `LeadFraudBadge.tsx`, `LeadIntelCard.tsx`, `LeadPuppyRecommenderCard.tsx` (todos em `app/(admin)/admin/(protected)/leads/ui/`), orquestrados por `LeadDetailClient.tsx`.

Os 5 widgets seguem o mesmo padrão estrutural: botão dispara `fetch` para um endpoint `/api/admin/leads/*`, estado local (`useState`/`useTransition`) controla `pending`/`error`/`data`, resultado renderizado inline. Isso é bom para consistência interna — mas os 5 widgets **não seguem o padrão que já existe no resto do admin** (`useToast()` + `ConfirmDialog`).

### 🔴 CRÍTICO

#### L1. Ações de IA não têm feedback assíncrono acessível
**Problema:** Nenhum dos 5 widgets usa `aria-live` para anunciar quando a IA termina de processar, nem `useToast()` para confirmar sucesso.
**Localização:** `LeadIntelCard.tsx`, `LeadFraudBadge.tsx`, `LeadCrossMatchCard.tsx`, `LeadPuppyRecommenderCard.tsx`
**Evidência:**
```tsx
// LeadFraudBadge.tsx — clique em "Analisar" muda o DOM, mas nada é anunciado
const run = () => {
  setError(null);
  start(async () => {
    const res = await fetch("/api/admin/leads/fraud", { ... });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Erro ao avaliar fraude");
    setFraud(json.fraud); // ❌ sem role="status"/aria-live, sem toast
  });
};
```
**Impacto:** usuário de leitor de tela clica em "Analisar"/"Rodar"/"Processar IA"/"IA recomendar filhote" e não recebe nenhuma confirmação de que algo aconteceu até navegar manualmente até o resultado. Mesma classe de problema que o item 3.4 (Crítico) da auditoria de dezembro — mas reproduzida em 4 componentes novos que não existiam quando aquele item foi corrigido... e continua sem correção aqui.
**Recomendação:** adicionar `<div role="status" aria-live="polite" className="sr-only">{...}</div>` por widget (ou um único live region compartilhado na página), e trocar os `push({...})` ausentes por chamadas ao `useToast()` já usado por `LeadDetailClient` na mesma tela.
**Severidade:** 🔴 Crítico (WCAG 4.1.3) | **Esforço:** 3h

### 🟠 ALTO

#### L2. Aplicar status sugerido pela IA não pede confirmação
**Problema:** `LeadStatusSuggestionCard` (em `LeadAdvisorCards.tsx`) chama `onApply(suggestedStatus)` direto no `onClick`, incluindo para sugestões de `fechado` e `perdido`.
**Localização:** `LeadAdvisorCards.tsx:69-76`
**Evidência:**
```tsx
<button
  type="button"
  disabled={!canApply || mutating === suggestedStatus}
  onClick={() => suggestedStatus && onApply(suggestedStatus)}
  ...
>
  {mutating === suggestedStatus ? <Loader2 .../> : "Aplicar status"}
</button>
```
**Impacto:** um clique acidental em "Aplicar status" quando a IA sugere "perdido" descarta um lead ativo sem qualquer possibilidade de desfazer — exatamente o cenário que o item 1.2 (Crítico) da auditoria de dezembro já descrevia para `status="sold"` em filhotes, agora reproduzido para leads.
**Recomendação:** reusar o mesmo `ConfirmDialog` (`src/components/ui/confirm-dialog.tsx`) já existente no código, condicionado a `suggestedStatus === "perdido" || suggestedStatus === "fechado"`.
**Severidade:** 🟠 Alto | **Esforço:** 2h

#### L3. Nenhum widget usa o padrão de erro/sucesso do resto do admin
**Problema:** os 5 widgets renderizam erro como caixa vermelha inline sem `role="alert"`, e sucesso não gera nenhum toast — enquanto `LeadDetailClient.tsx`, no mesmo arquivo/página, usa `useToast()` para "Status atualizado" e "Mensagem copiada".
**Localização:** todos os 5 componentes em `leads/ui/`
**Impacto:** dentro da mesma tela de detalhe de lead, o usuário vê dois vocabulários de feedback diferentes lado a lado — reforça o item 5.3 (Médio) já catalogado em dezembro ("estados de erro variados"), agora presente também nos componentes mais novos e mais visíveis da tela.
**Recomendação:** padronizar todos os `catch`/`error` locais para usar `push({ type: "error", message })`.
**Severidade:** 🟠 Alto | **Esforço:** 3h

### 🟡 MÉDIO

#### L4. Sem transparência sobre o que a IA faz com os dados do lead
**Problema:** botões como "Processar IA", "Analisar" (FraudGuard), "Rodar" (CrossMatch) não explicam ao operador o que é enviado ao modelo (mensagem do lead, telefone, etc.) nem retêm essa informação depois de gerada — se o admin sair da página e voltar, o insight de `LeadFraudBadge`/`LeadCrossMatchCard`/`LeadPuppyRecommenderCard` é perdido (só `LeadIntelCard` recebe `initial` do servidor).
**Localização:** `LeadFraudBadge.tsx`, `LeadCrossMatchCard.tsx`, `LeadPuppyRecommenderCard.tsx`
**Recomendação:** persistir o último resultado de cada widget (mesmo padrão de `insight` que `LeadIntelCard` já recebe via prop) e adicionar `helpText` curto ("A IA usa mensagem, cidade e preferências do lead para calcular isso").
**Severidade:** 🟡 Médio | **Esforço:** 4h

### 🟢 BAIXO

**L5. Rótulos de botão inconsistentes entre os 5 widgets** — "IA recomendar filhote", "Processar IA", "Analisar", "Rodar" para a mesma ação semântica ("disparar uma chamada de IA"). Padronizar em um verbo único (ex.: sempre "Gerar com IA"). Esforço: 1h

**L6. Cards de recomendação não linkam de volta ao contexto** — "Abrir filhote" (`LeadPuppyRecommenderCard`) abre em nova aba mas não indica que o resultado da IA ficará perdido se a aba original for fechada/atualizada. Esforço: 1h

---

## 📄 2. Contratos Digitais + Assinatura ZapSign

**Escopo:** `/admin/contracts` (`app/(admin)/admin/(protected)/contracts/page.tsx`), rotas públicas `/contract/[code]` e `/contract/[code]/documento`, `ContractForm.tsx`, e as APIs: `app/api/contract/route.ts`, `app/contract/route.ts` (⚠️ ver C2), `app/api/admin/contracts/route.ts`, `app/api/admin/contracts/[id]/zapsign/route.ts`, `app/api/webhooks/zapsign/route.ts`.

Esta é a área de **maior risco real** das 4, porque é o único fluxo das quatro que (a) é público, (b) coleta CPF/RG/endereço, (c) tem valor comercial e (d) gera um documento com validade jurídica citando MP 2.200-2/2001.

### 🔴 CRÍTICO — Segurança / Integridade Jurídica

#### C1. Webhook do ZapSign sem verificação de assinatura
**Problema:** `app/api/webhooks/zapsign/route.ts` aceita qualquer POST e usa o corpo (`token`, `status`, `external_id`) para decidir se marca um contrato como `assinado`, sem checar nenhum segredo compartilhado, header de assinatura HMAC ou IP de origem.
**Evidência:**
```ts
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token: docToken, status: docStatus, external_id: contractCode, signed_file: signedFileUrl } = body;
  // ...
  if (docStatus === "finished") {
    updates.status = "assinado";
    updates.signed_at = new Date().toISOString();
    updates.signed_pdf_url = signedFileUrl ?? null; // ❌ URL arbitrária, aceita de qualquer chamador
  }
  await sb.from("contracts").update(updates).eq("id", contract.id);
}
```
`src/lib/zapsign.ts` também não define nenhum mecanismo de verificação de webhook (não há `webhook_secret` nem checagem de assinatura em lugar nenhum do código).
**Impacto:** qualquer pessoa que descubra (ou adivinhe) o `code` de 12 caracteres de um contrato pendente pode fazer `POST /api/webhooks/zapsign` com `{ external_id: "<code>", status: "finished", signed_file: "<url qualquer>" }` e o sistema vai marcar o contrato como legalmente assinado, com um PDF "assinado" apontando para qualquer URL — sem que a compradora tenha realmente assinado nada.
**Recomendação:** validar o header de assinatura que o ZapSign envia (`X-ZapSign-Signature` ou equivalente, conforme docs da API), rejeitando qualquer requisição sem HMAC válido contra `ZAPSIGN_API_TOKEN`/webhook secret dedicado.
**Severidade:** 🔴 Crítico (Segurança) | **Esforço:** 3h

#### C2. Endpoint duplicado e órfão em produção permite adulterar contrato já assinado
**Problema:** existe um segundo endpoint de submissão de contrato, `app/contract/route.ts` (POST em `/contract`, **sem** `/api`), que não é chamado por `ContractForm.tsx` (confirmado — o form usa `/api/contract`) mas continua compilado e acessível publicamente. Ao contrário do endpoint oficial, ele:
- não valida o payload com Zod (aceita qualquer JSON);
- **não verifica `contract.status === "assinado"`** antes de sobrescrever `payload` e reenviar `hemograma`/`laudo`;
- nunca seta `status`/`signed_at` — então um contrato pode ficar "assinado" no `/api/contract` oficial, mas ter seus dados de comprador silenciosamente trocados via este endpoint sem qualquer rastro.
**Evidência:**
```ts
// app/contract/route.ts — sem zod, sem checar status, sem checar assinado
const { data: contract } = await sb.from("contracts").select("id").eq("code", code).single();
// ... upload de arquivos ...
await sb.from("contracts").update({ payload, ...uploads }).eq("id", contract.id);
// ❌ nenhuma verificação de status="assinado" — sobrescreve dados de um contrato já fechado
```
**Impacto:** vetor de adulteração de documento legal — dados do comprador (nome, CPF, endereço) num contrato já assinado podem ser reescritos silenciosamente por qualquer requisição a este endpoint órfão, sem gerar novo `signed_at`, novo log ou qualquer alerta.
**Recomendação:** remover o arquivo `app/contract/route.ts` (dead code) ou, se houver uso externo desconhecido, unificar com a lógica validada de `app/api/contract/route.ts`.
**Severidade:** 🔴 Crítico (Segurança/Integridade de dados) | **Esforço:** 1h (é só deletar, após confirmar que nada externo aponta pra lá)

#### C3. Contrato é marcado "assinado" mesmo sem assinatura válida
**Problema:** em `app/api/contract/route.ts`, o `status: "assinado"` é setado **incondicionalmente** no update final, independentemente de `uploadSignature()` ter retornado um path válido ou `null`.
**Evidência:**
```ts
const [hemogramaPath, laudoPath, signaturePath] = await Promise.all([...]);
await sb.from("contracts").update({
  payload: buyerData,
  signature_path: signaturePath ?? undefined, // pode ser null
  status: "assinado", // ❌ sempre "assinado", mesmo se signaturePath for null
  signed_at: new Date().toISOString(),
  ...
}).eq("id", contract.id);
```
O front-end (`ContractForm.tsx`) impede o envio sem assinatura (`if (!signature) { setError(...); return; }`), mas isso é só uma checagem de UI — qualquer chamada direta à API (curl, Postman, script) pode enviar `signature: ""` e o backend mesmo assim grava `status: "assinado"`.
**Impacto:** regra de negócio "contrato só é válido com assinatura" só existe no cliente, não no servidor — viola o princípio de nunca confiar em validação client-side para um documento com efeito jurídico.
**Recomendação:** no backend, só permitir `status: "assinado"` se `signaturePath` for truthy; caso contrário retornar 422 "assinatura obrigatória".
**Severidade:** 🔴 Crítico (Regra de negócio / integridade jurídica) | **Esforço:** 1h

### 🟠 ALTO

#### C4. Link público sem expiração, rate limit ou lockout
**Problema:** o código de 12 caracteres (`randomUUID().replace(/-/g,"").slice(0,12).toUpperCase()`) é a única barreira de acesso às rotas `/contract/[code]` e `/contract/[code]/documento`, que expõem dados pessoais completos (CPF, RG, endereço, assinatura) uma vez preenchidos. Não há rate limiting em `/api/contract`, nem expiração de link, nem qualquer log de tentativas de acesso a códigos inválidos.
**Localização:** `app/api/admin/contracts/route.ts` (geração do código), `app/contract/[code]/page.tsx`, `app/contract/[code]/documento/page.tsx`
**Impacto:** o espaço de códigos (12 chars hex, ~2⁴⁸ combinações) torna força bruta impraticável isoladamente, mas combinado com C1/C2/C3 (nenhuma dessas rotas verifica quem está chamando) não há defesa em profundidade — um único vazamento de código (ex.: print de WhatsApp, cache de proxy, histórico de navegador compartilhado) dá acesso irrestrito e permanente ao documento.
**Recomendação:** adicionar expiração (`expires_at`) e rate limiting básico por IP nas rotas públicas de contrato.
**Severidade:** 🟠 Alto | **Esforço:** 4h

#### C5. Labels do formulário público não associados via `htmlFor`/`id` (WCAG A)
**Problema:** `ContractForm.tsx` usa `<label>` puramente visual (sem `htmlFor`) seguido de `<input>` sem `id` correspondente, em todos os 14 campos do formulário.
**Evidência:**
```tsx
<label className="mb-1 block text-xs font-semibold text-zinc-600">Nome completo *</label>
<input name="nome" required placeholder="Exatamente como consta no documento" className={inputCls} />
```
**Impacto WCAG:** **1.3.1 Info and Relationships (A)** ❌ FAIL / **4.1.2 Name, Role, Value (A)** ❌ FAIL — mesma classe do item 3.2 (Crítico) já documentado em dezembro para o admin, mas aqui reproduzido no formulário **público, voltado ao cliente final**, que coleta CPF/RG num contrato de compra — usuários de leitor de tela não conseguem confirmar o que estão preenchendo em campos sensíveis.
**Recomendação:** adicionar `id`/`htmlFor` em todos os campos (mesmo fix do item 3.2, aplicado aqui).
**Severidade:** 🟠 Alto (WCAG A) | **Esforço:** 2h

#### C6. Envio ao ZapSign sem confirmação — ação real e irreversível
**Problema:** o botão "ZapSign" em `ContractsPage` chama `sendToZapSign(c.id)` direto no `onClick`, sem `ConfirmDialog`. Essa ação gera um PDF, cria um documento no ZapSign e **dispara WhatsApp/e-mail automático para o comprador real**.
**Localização:** `app/(admin)/admin/(protected)/contracts/page.tsx:302-307`
**Impacto:** um clique acidental em qualquer linha da tabela de contratos (a linha inteira é clicável para expandir detalhes: `onClick={() => setExpanded(...)}` no `<tr>`, com o botão ZapSign dentro dela) dispara uma mensagem real para o cliente pedindo assinatura — reproduz exatamente o item 1.2 (Crítico) da auditoria de dezembro ("falta confirmação antes de ações destrutivas"), agora numa ação que **envia comunicação real a um terceiro**, não apenas altera um registro interno.
**Recomendação:** `ConfirmDialog` obrigatório antes de `sendToZapSign`, mostrando telefone/e-mail do destinatário.
**Severidade:** 🟠 Alto | **Esforço:** 2h

### 🟡 MÉDIO

#### C7. SQL de migração cru exposto na UI de produção
**Problema:** `ContractsPage` tem uma constante `SQL_MIGRATION` com um `ALTER TABLE` literal, renderizada num banner quando a criação de contrato falha por causa de uma constraint `NOT NULL` que nunca foi corrigida no banco.
**Evidência:**
```tsx
const SQL_MIGRATION = `-- Execute no Supabase SQL Editor para habilitar contratos sem filhote vinculado:
ALTER TABLE contracts ALTER COLUMN puppy_id DROP NOT NULL;`;
...
{sqlAlert && (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
    <p className="text-sm font-semibold text-amber-900">⚠️ Ação necessária no Supabase</p>
    <pre>{SQL_MIGRATION}</pre>
```
**Impacto:** é um placeholder/band-aid deixado em produção — indica que a migração real (`puppy_id` deveria aceitar `NULL` para contratos sem filhote vinculado, um caso de uso que o próprio formulário de criação já suporta) nunca foi aplicada ao banco. Expor instruções de schema numa tela de produto é um code smell de "TODO esquecido", e força qualquer admin que tentar criar um contrato sem filhote a rodar SQL manualmente.
**Recomendação:** aplicar a migração de fato (`ALTER TABLE contracts ALTER COLUMN puppy_id DROP NOT NULL;`) e remover o banner.
**Severidade:** 🟡 Médio | **Esforço:** 15min (é literalmente rodar o SQL que já está escrito)

### 🟢 BAIXO

**C8. `onClick` morto em Server Component + fallback redundante** — `app/contract/[code]/documento/page.tsx` é um Server Component (sem `"use client"`) que declara `<button onClick={() => window.print()}>`, um function prop que não pode ser serializado nesse contexto, e por isso o mesmo arquivo adiciona um `<script dangerouslySetInnerHTML>` que reimplementa o clique via `document.querySelector('button')?.addEventListener(...)`. O handler JSX é morto/confuso — indica fronteira server/client não resolvida corretamente; deveria ser extraído para um pequeno Client Component (`<PrintButton />`) e o `<script>` inline removido. Esforço: 1h

---

## 🚀 3. AutoSalesEngine + Autopilot de Blog por IA

**Escopo:** `src/lib/ai/autoSalesEngine.ts` (+ `scripts/auto-sales-worker.ts`, disparado por `app/api/leads/route.ts` a cada lead novo), `/admin/blog/autopilot` (`app/(admin)/admin/(protected)/blog/autopilot/page.tsx` + `app/api/admin/blog/autopilot/route.ts`), `/admin/blog/editor/wizard` (`app/(admin)/admin/(protected)/blog/editor/wizard/page.tsx`).

### 🔴 CRÍTICO

#### A2. Ações de IA em massa e irreversíveis sem confirmação
**Problema:** "Corrigir SEO automaticamente" (autopilot) reescreve metadados de SEO de múltiplos posts de uma vez; "Iniciar geração automática" com `publishMode = "published"` **publica ao vivo, no site público**, artigos inteiros escritos por IA — nenhuma das duas ações tem `ConfirmDialog` ou qualquer etapa de aprovação humana intermediária.
**Localização:** `app/(admin)/admin/(protected)/blog/autopilot/page.tsx` — `applyFixes()` (linha 195) e `startGeneration()` (linha 167)
**Evidência:**
```tsx
<button onClick={applyFixes} disabled={applyingFixes} ...>
  Corrigir SEO automaticamente
</button>
// ...
<button onClick={startGeneration} ...>
  Iniciar geração automática →
</button>
```
Nenhum dos dois passa por `ConfirmDialog`; `startGeneration` nem mostra um resumo do que vai ser publicado antes de disparar.
**Impacto:** reproduz o item 1.2 (Crítico) da auditoria de dezembro ("falta confirmação antes de ações destrutivas"), mas com um raio de dano maior — aqui a ação afeta **conteúdo público indexável pelo Google**, não apenas um registro interno. Um clique apressado com `publishMode: "published"` marcado publica N artigos gerados por IA sem revisão humana.
**Recomendação:** `ConfirmDialog` mostrando contagem de posts afetados/tópicos selecionados antes de `applyFixes`/`startGeneration`; para `publishMode === "published"`, exigir uma segunda confirmação explícita ("Publicar {N} artigos agora, sem revisão?").
**Severidade:** 🔴 Crítico | **Esforço:** 3h

### 🟠 ALTO

#### A1. AutoSalesEngine roda 100% às cegas — zero visibilidade/controle no admin
**Problema:** toda vez que um lead é criado (exceto waitlist), `app/api/leads/route.ts` dispara `createAutoSalesSequence(leadId)` de forma fire-and-forget, que grava uma sequência de follow-ups automáticos em `autosales_sequences`/`autosales_logs`, processada por um worker externo (`scripts/auto-sales-worker.ts`, cron/loop separado do Next.js). **Não existe nenhuma página em `/admin` que renderize essas tabelas.**
**Evidência:**
```ts
// app/api/leads/route.ts
if (!isWaitlist) {
  import("@/lib/ai/autoSalesEngine")
    .then(({ createAutoSalesSequence }) => createAutoSalesSequence(leadId))
    .catch((err) => console.error("[API /leads] autoSales:", err)); // ❌ só console.error, ninguém no admin vê
}
```
A função `markAutoSalesHuman()` (que existiria para um admin "assumir" a conversa manualmente) existe no código mas **não é chamada de nenhum lugar da UI** — é uma funcionalidade de escape sem botão que a acione.
**Impacto:** viola Nielsen #1 (visibilidade do status do sistema) e #3 (controle do usuário) de forma mais severa que qualquer item equivalente na auditoria de dezembro — lá, o problema era falta de feedback numa ação que o usuário disparou; aqui, o sistema toma decisões de estratégia de venda e agenda mensagens **sem que o admin saiba que isso está acontecendo**, sem tela para ver quais leads têm sequência ativa, sem botão para pausar/cancelar. Se o worker falhar silenciosamente (só loga no console do processo, não em lugar nenhum visível ao time), a automação simplesmente para e ninguém percebe.
**Recomendação:** criar uma aba/seção em `/admin/leads` ou `/admin/autosales` listando sequências ativas, próximo passo, e um botão que chama `markAutoSalesHuman`.
**Severidade:** 🟠 Alto | **Esforço:** 8h

### 🟡 MÉDIO

#### A3. Padrões de feedback divergentes dentro da própria feature "Blog IA"
**Problema:** `AutopilotPage` mostra erro em `<div className="rounded-xl border-rose-200...">` sem `role="alert"`; `WizardPage` (mesma feature, uma tela ao lado) usa `<div role="alert" className="...">⚠️ {error}</div>`. Nenhuma das duas usa `useToast()`.
**Localização:** `blog/autopilot/page.tsx:244-248` vs `blog/editor/wizard/page.tsx:231-235`
**Recomendação:** padronizar em `role="alert"` + considerar migrar para `useToast()` como o resto do admin.
**Severidade:** 🟡 Médio | **Esforço:** 1h

#### A4. Falhas de IA engolidas silenciosamente
**Problema:** em `AutopilotPage.generatePost` e `WizardPage.handleGenerate`, chamadas para gerar imagem de capa (DALL·E) e sugestões de SEO estão em `try { ... } catch {}` — se falharem, o artigo é criado sem capa/SEO e **nada avisa o usuário que isso aconteceu**.
**Evidência:**
```tsx
try {
  const ri = await adminFetch("/api/admin/blog/ai/image", { ... });
  const ji = await ri.json();
  imageUrl = ji?.url ?? "";
} catch {} // ❌ falha de geração de imagem é invisível
```
**Recomendação:** capturar o erro e mostrar um aviso não bloqueante ("Não foi possível gerar a imagem de capa — você pode adicionar manualmente depois").
**Severidade:** 🟡 Médio | **Esforço:** 2h

### 🟢 BAIXO

**A5. `QualityBar` do wizard usa heurística arbitrária** (ex.: título ≥10 caracteres = 20 pontos) sem relação com qualidade real de SEO/conteúdo — pode dar "Excelente" a um rascunho raso. Esforço: 3h para religar a critérios reais (ex.: reaproveitar `seo-suggestions`).

**A6. Barra de progresso do wizard é simulada, não real** — os saltos 10% → 55% → 75% → 100% são fixos por etapa, não refletem o tempo real de cada chamada de API. Esforço: 2h.

---

## 💬 4. AiMatchmakerChat (site público)

**Componente:** `src/components/sections/AiMatchmakerChat.tsx`, montado em `app/page.tsx`. Consome `app/api/matchmaker/route.ts` (Groq/Llama streaming) e `app/api/transcribe route` (voz).

Esta é a área com melhor execução das 4: `role="log"` + `aria-live="polite"` no container de mensagens, `aria-label` em todos os botões icon-only (microfone, enviar), `useReducedMotion()` respeitado, fallback automático para `PuppyMatcherQuiz` estático se a API falhar, e nenhuma exposição de `is_partner_breeder`/`breeder_name` (confirmado — o catálogo usado é uma string estática no system prompt e `content/puppies-static.ts`, nenhum dos dois contém esses campos).

### 🟠 ALTO

#### M2. Sucesso de captura de lead é mostrado mesmo se a gravação falhar
**Problema:** `LeadInlineForm.onSubmit` marca `setDone(true)` (mostra "✅ Perfeito, {nome}!") **antes** de saber se o `fetch("/api/leads", ...)` teve sucesso — e o erro é descartado em `catch {}`.
**Evidência:**
```tsx
<LeadInlineForm
  onSubmit={async (nome, telefone) => {
    setLeadSubmitted(true);
    setShowLeadForm(false);
    try {
      await fetch("/api/leads", { method: "POST", ..., keepalive: true });
    } catch {} // ❌ se falhar, o visitante já viu "criadora vai entrar em contato"
  }}
/>
```
(O próprio `LeadInlineForm` já seta `setDone(true)` internamente antes mesmo de chamar `onSubmit`.)
**Impacto:** é o mesmo padrão de "sucesso genérico"/falta de feedback de erro real do item 1.12 da auditoria de dezembro, mas aqui o dano é direto ao negócio: se `/api/leads` falhar (rede, validação, rate limit), **o lead é perdido silenciosamente** e o visitante acredita que será contatado. Não há retry nem log client-side que permita recuperar esse contato depois.
**Recomendação:** só mostrar a confirmação de sucesso após o `fetch` resolver com `res.ok`; em caso de falha, oferecer link direto de WhatsApp como fallback ("Não deu pra salvar automaticamente — clique aqui pra falar direto no WhatsApp").
**Severidade:** 🟠 Alto | **Esforço:** 2h

### 🟡 MÉDIO

#### M1. "↺ Recomeçar" reseta a conversa inteira sem confirmação
**Problema:** o botão de reset chama `setMessages([OPENING_MESSAGE])` + limpa matches/lead direto no `onClick`, descartando o match e o histórico da conversa sem aviso.
**Localização:** `AiMatchmakerChat.tsx:845-859`
**Impacto:** baixo risco (não é dado sensível), mas o usuário pode perder o contexto de um match que gostou por engano — vale ao menos um "tem certeza?" leve ou um "desfazer" de 3s.
**Severidade:** 🟡 Médio | **Esforço:** 1h

#### M4. Catálogo/preços do chat vivem hardcoded no system prompt, sem fonte única de verdade
**Problema:** `CATALOG` em `app/api/matchmaker/route.ts` é uma string Markdown fixa com nomes, cores e preços — mantida manualmente, desincronizada do banco de dados (`puppies` table) e do `content/puppies-static.ts` usado para renderizar os `MatchCard`s.
**Impacto:** se um filhote for vendido ou o preço mudar no admin, a IA pode continuar recomendando/cotando um preço ou filhote que não existe mais até alguém lembrar de editar o prompt manualmente. Isso é um problema de consistência/escalabilidade, não de segurança — mas gera atrito real com clientes ("no chat disse R$X, mas no WhatsApp é R$Y").
**Recomendação:** gerar o bloco `CATALOG` dinamicamente a partir da mesma fonte que popula `content/puppies-static.ts`/o catálogo público, em vez de string fixa.
**Severidade:** 🟡 Médio | **Esforço:** 4h

### 🟢 BAIXO

**M3. Erros de voz (permissão negada, sem suporte) usam a mesma região `aria-live="polite"` do chat normal**, em vez de `assertive` — são mensagens mais acionáveis (o usuário precisa ir mudar uma permissão do navegador) que poderiam se perder se o usuário não estiver com foco na região. Esforço: 30min.

---

## 🔗 5. Achados Transversais (Cross-cutting)

### 🟡 MÉDIO

**X1. Nenhuma das 4 áreas novas usa o `ConfirmDialog` já existente no design system** (`src/components/ui/confirm-dialog.tsx`, usado hoje só em `PuppiesPageClient.tsx`). As 4 ações de maior impacto identificadas nesta auditoria (L2, C6, A2, e o envio ZapSign) todas poderiam reusar o mesmo componente em vez de reinventar (ou simplesmente omitir) a confirmação. Esforço agregado: coberto pelos itens individuais acima.

**X2. Nenhum widget/página de IA nas 4 áreas usa `useToast()` para feedback de sucesso/erro das próprias ações de IA** — mesmo em páginas (`ContractsPage`, `LeadDetailClient`) que já importam e usam `useToast()` para outras ações na mesma tela. O padrão de toast existe e funciona; ele só não foi estendido às features de IA construídas depois. Esforço agregado: coberto pelos itens L1/L3/A3 acima.

**X3. Regra de negócio `is_partner_breeder`/`breeder_name` — verificado e RESPEITADO nas 4 áreas.** Nenhum dos catálogos usados por `AiMatchmakerChat` (system prompt + `content/puppies-static.ts`) ou pelas rotas públicas de contrato (`select("id,name")` / `select("code,status,...")`) inclui esses campos. Registrado aqui como confirmação positiva, não como pendência.

---

## 📋 Plano de Ação Priorizado

### 🏃 Sprint 1 — Segurança e Bloqueadores Críticos (3-5 dias)

**Foco:** fechar os 3 buracos de segurança/integridade jurídica em Contratos antes de qualquer outra coisa

| # | Issue | Severidade | Esforço |
|---|-------|-----------|---------|
| C2 | Remover endpoint órfão `app/contract/route.ts` | 🔴 Crítico | 1h |
| C3 | Não marcar `assinado` sem `signaturePath` válido | 🔴 Crítico | 1h |
| C7 | Aplicar migração `puppy_id DROP NOT NULL` (SQL já escrito) | 🟡 Médio | 15min |
| C1 | Verificação de assinatura no webhook ZapSign | 🔴 Crítico | 3h |
| A2 | Confirmação antes de aplicar SEO em massa / publicar artigos IA | 🔴 Crítico | 3h |
| L1 | `aria-live` + toast nas ações de IA do CRM de leads | 🔴 Crítico | 3h |

**Total Sprint 1:** ~11h + 15min

---

### 🚀 Sprint 2 — Prevenção de Erros e Controle do Usuário (1-2 semanas)

| # | Issue | Severidade | Esforço |
|---|-------|-----------|---------|
| C6 | `ConfirmDialog` antes de enviar ao ZapSign | 🟠 Alto | 2h |
| L2 | `ConfirmDialog` ao aplicar status "perdido"/"fechado" sugerido por IA | 🟠 Alto | 2h |
| M2 | Não confirmar sucesso de lead antes do `fetch` resolver | 🟠 Alto | 2h |
| A1 | Tela mínima de visibilidade/controle do AutoSalesEngine | 🟠 Alto | 8h |
| C4 | Rate limit + expiração nos links públicos de contrato | 🟠 Alto | 4h |
| C5 | `htmlFor`/`id` no `ContractForm` público | 🟠 Alto | 2h |

**Total Sprint 2:** ~20h

---

### 🎨 Sprint 3 — Consistência entre Áreas Novas e o Resto do Admin (1 semana)

| # | Issue | Severidade | Esforço |
|---|-------|-----------|---------|
| L3 | Migrar erros dos 5 widgets de IA para `useToast()` | 🟠 Alto | 3h |
| A3 | Unificar `role="alert"` entre autopilot e wizard | 🟡 Médio | 1h |
| A4 | Avisar quando geração de imagem/SEO falhar silenciosamente | 🟡 Médio | 2h |
| L4 | Persistir resultado dos widgets de IA entre navegações | 🟡 Médio | 4h |
| M4 | Gerar catálogo do chat a partir da fonte real de dados | 🟡 Médio | 4h |
| C8 | Extrair botão de impressão do Server Component | 🟢 Baixo | 1h |

**Total Sprint 3:** ~15h

---

### 📈 Sprint 4 — Polimento (Baixa Prioridade)

L5, L6, A5, A6, M1, M3 — itens de baixo impacto, agrupáveis em qualquer sprint de manutenção. Esforço agregado: ~9h.

---

## 🎯 Observação Final

As 4 áreas foram construídas rapidamente após dezembro/2025 e replicam, ponto a ponto, os mesmos anti-padrões que a auditoria anterior já havia identificado no resto do admin (falta de `ConfirmDialog`, falta de `useToast`, labels sem `htmlFor`, live regions ausentes) — ou seja, os padrões corretos existem no código-base, mas não foram propagados para o código novo. A exceção é o `AiMatchmakerChat`, que foi claramente construído com mais atenção a acessibilidade desde o início.

O achado que exige ação mais urgente não é de UX — é a combinação **C1 + C2 + C3**: o fluxo de contrato tem três caminhos independentes pelos quais um contrato pode ser marcado como "assinado" sem uma assinatura real ter ocorrido. Isso deveria ser tratado como incidente de segurança, não como item de backlog de design.

**Documento vivo.** Atualizar conforme os itens forem corrigidos.

**Última revisão:** 11 de julho de 2026
