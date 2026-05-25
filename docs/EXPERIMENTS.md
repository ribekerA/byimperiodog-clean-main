# Experimentos A/B

Este projeto possui uma infraestrutura simples de A/B testing baseada em:
- Tabela `experiments` (configurações: chave, status, variantes, janelas de execução)
- Coleta de eventos em `/api/analytics` (tabela `analytics_events`)
- UI Admin em `/admin/experiments` (CRUD + métricas por variante)

## Eventos esperados
- `experiment_view` com `meta { experiment: string, variant: string }`
- `experiment_conversion` com `meta { experiment: string, variant: string, ... }`

## Helpers no cliente
Use os helpers abaixo para sortear a variante, emitir eventos para pixels e persistir no backend:

```ts
import { chooseVariant } from "@/lib/experiments";
import { experimentView, experimentConversion } from "@/lib/track";

// 1) Sortear (e fixar) a variante para o usuário (sticky via localStorage)
const variant = chooseVariant("hero-cta", [
	{ key: "A", weight: 50 },
	{ key: "B", weight: 50 },
]);

// 2) Ao renderizar a variante escolhida
experimentView("hero-cta", variant);

// No ponto de conversão (ex.: lead enviado com sucesso)
experimentConversion("hero-cta", variant, { leadId: "123" });
```

Os helpers:
- Disparam para GA4/FB/TikTok/Pinterest (quando scripts estiverem ativos)
- Enviam um POST para `/api/analytics` usando `navigator.sendBeacon` quando possível (fallback via fetch)

## Criando experimentos
- Acesse `/admin/experiments`
- Clique em "Criar Experimento" e preencha: nome, chave e rótulos de variantes (ex.: A, B)
- Use o botão Play/Pause para controlar execução

Alternativa via script: `npm run seed` cria/atualiza um experimento de demo `hero-cta` com variantes A/B.

## Métricas
A página Admin chama `GET /api/admin/experiments/metrics?key=<experiment>` e agrega:
- Views: contagem de `experiment_view`
- Conversions: contagem de `experiment_conversion`
- Conversion Rate: conversions / views

Recomendado manter os eventos consistentes (mesma `variant` do usuário) e emitir conversão somente uma vez por sessão ou por lead.

## Observações
- Garanta que `sql/experiments.sql` foi aplicado no banco (use `scripts/apply-supabase-migrations.ps1` ou rode o SQL no editor do Supabase).
- A coleta `/api/analytics` é resiliente; se variáveis não estiverem configuradas, o endpoint responde `202` e não quebra o UX.
