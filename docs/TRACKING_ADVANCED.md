/**
 * Documentação - Sistema de Tracking/Pixels Avançado
 * By Imperio Dog - Guia Completo
 * 
 * Este documento descreve todas as funcionalidades avançadas implementadas
 * no módulo de tracking/pixels.
 */

# Sistema Avançado de Tracking/Pixels - By Imperio Dog

## 📊 Funcionalidades Implementadas

### 1. ✅ Dashboard de Analytics
**Localização:** `/admin/analytics`

**Recursos:**
- Visualização de métricas em tempo real
- Gráficos de pageviews, conversões e tráfego
- Filtros por período (24h, 7d, 30d, 90d)
- Métricas de dispositivos e origens de tráfego
- Top páginas por visualizações

**API:** `GET /api/admin/analytics?period=7d`

**Tipos:** `src/types/analytics.ts`
- `AnalyticsMetrics` - Estrutura de métricas
- `AnalyticsEvent` - Eventos de tracking
- `AnalyticsPeriod` - Períodos de análise

---

### 2. ✅ Testes E2E com Playwright
**Localização:** `tests/e2e/tracking.spec.ts`

**Cobertura de Testes:**

#### Configuração de Pixels
- Acessar página de configuração
- Configurar Facebook Pixel ID
- Configurar Google Analytics ID
- Validar formatos de IDs
- Limpar campos (desabilitar pixels)

#### Teste de Pixels
- Botões "Testar Facebook Pixel" e "Testar Google Analytics"
- Feedback de eventos de teste
- Verificação de alertas

#### Injeção de Scripts no Frontend
- Verificar injeção do Facebook Pixel quando configurado
- Verificar injeção do Google Analytics quando configurado
- Garantir que pixels NÃO são injetados quando não configurados

#### API Endpoints
- GET `/api/settings/tracking` retorna configurações públicas
- POST `/api/admin/settings` requer autenticação
- Garantir que tokens secretos não são expostos

**Como Executar:**
```bash
# Configurar variáveis de ambiente
$env:TEST_ADMIN_EMAIL="admin@test.com"
$env:TEST_ADMIN_PASSWORD="senha123"
$env:TEST_BASE_URL="http://localhost:3000"

# Executar testes
npx playwright test tests/e2e/tracking.spec.ts

# Modo UI (visual)
npx playwright test --ui

# Modo debug
npx playwright test --debug
```

---

### 3. ✅ Webhooks de Eventos
**Localização:** `/admin/webhooks`

**Recursos:**
- Criar webhooks para notificações de conversões
- Configurar eventos a serem monitorados
- Testar webhooks com evento de teste
- Ver histórico de entregas (sucessos/erros)
- Assinatura HMAC SHA-256 para segurança

**Eventos Suportados:**
- `lead_form_submit` - Formulário de lead enviado
- `puppy_reservation` - Reserva de filhote
- `contact_form` - Formulário de contato
- `whatsapp_click` - Clique no WhatsApp
- `phone_click` - Clique no telefone
- `purchase` - Compra realizada
- `page_view` - Visualização de página
- `test_event` - Evento de teste

**APIs:**
- `GET /api/admin/webhooks` - Listar webhooks
- `POST /api/admin/webhooks` - Criar webhook
- `GET /api/admin/webhooks/[id]` - Buscar webhook
- `PATCH /api/admin/webhooks/[id]` - Atualizar webhook
- `DELETE /api/admin/webhooks/[id]` - Remover webhook
- `POST /api/admin/webhooks/[id]/test` - Testar webhook

**Dispatcher:** `src/lib/webhooks/dispatcher.ts`
- `dispatchWebhookEvent()` - Disparar evento
- Retry automático com backoff exponencial
- Registro de todas as entregas
- Desabilita webhook após 10 erros consecutivos

**Exemplo de Uso:**
```typescript
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatcher';

// Notificar lead de formulário
await dispatchWebhookEvent('lead_form_submit', {
  name: 'João Silva',
  email: 'joao@example.com',
  phone: '11999999999',
  message: 'Quero adotar um filhote'
}, {
  page_url: '/reserve-seu-filhote',
  user_agent: req.headers['user-agent']
});
```

**Formato do Payload:**
```json
{
  "event": "lead_form_submit",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "11999999999"
  },
  "metadata": {
    "user_agent": "Mozilla/5.0...",
    "ip": "192.168.1.1",
    "page_url": "/reserve-seu-filhote",
    "referrer": "https://google.com"
  }
}
```

**Headers Enviados:**
```
Content-Type: application/json
X-Webhook-Signature: <HMAC SHA-256>
X-Webhook-Event: lead_form_submit
User-Agent: ByImperioDog-Webhook/1.0
```

---

### 4. ✅ A/B Testing de Pixels
**Localização:** `/admin/pixel-experiments`

**Recursos:**
- Criar experimentos com 2 variantes (controle vs teste)
- Configurar % de tráfego que participa do experimento
- Iniciar/pausar/finalizar experimentos
- Ver resultados com métricas detalhadas
- Cálculo de significância estatística
- Recomendação automática de vencedor

**APIs:**
- `GET /api/admin/pixel-experiments` - Listar experimentos
- `POST /api/admin/pixel-experiments` - Criar experimento
- `GET /api/admin/pixel-experiments/[id]` - Buscar experimento
- `PATCH /api/admin/pixel-experiments/[id]` - Atualizar experimento
- `DELETE /api/admin/pixel-experiments/[id]` - Remover experimento
- `GET /api/admin/pixel-experiments/[id]/results` - Ver resultados

**Métricas Analisadas:**
- Visitantes únicos
- Visualizações de página
- Conversões (leads, reservas, compras)
- Taxa de conversão
- Tempo médio no site
- Taxa de rejeição

**Exemplo de Experimento:**
```typescript
// Variante de Controle
{
  name: "Pixel Original",
  meta_pixel_id: "123456789012345",
  ga4_id: "G-ABC123456"
}

// Variante de Teste
{
  name: "Pixel Novo",
  meta_pixel_id: "999888777666555",
  ga4_id: "G-XYZ789012"
}

// Configuração
{
  name: "Teste Facebook Pixel Novo",
  description: "Comparar performance do pixel antigo vs novo",
  traffic_split: 50 // 50% dos usuários participam
}
```

**Resultados:**
- Significância estatística calculada (teste Z)
- Recomendação: `control`, `test` ou `inconclusive`
- Mínimo de 95% de confiança para recomendar mudança

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Necessárias

#### `webhooks`
```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  status TEXT DEFAULT 'active',
  secret TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_triggered_at TIMESTAMP,
  error_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0
);
```

#### `webhook_deliveries`
```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  response_status INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP
);
```

#### `pixel_experiments`
```sql
CREATE TABLE pixel_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  traffic_split INTEGER DEFAULT 50,
  control_variant_id UUID REFERENCES pixel_variants(id),
  test_variant_id UUID REFERENCES pixel_variants(id),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  winner_variant_id UUID
);
```

#### `pixel_variants`
```sql
CREATE TABLE pixel_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  meta_pixel_id TEXT,
  ga4_id TEXT,
  gtm_id TEXT,
  tiktok_pixel_id TEXT,
  google_ads_id TEXT,
  linkedin_partner_id TEXT,
  twitter_pixel_id TEXT,
  pinterest_tag_id TEXT,
  snapchat_pixel_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Próximos Passos

### Para executar o sistema:

1. **Criar tabelas no Supabase:**
   - Execute os scripts SQL acima no Supabase SQL Editor

2. **Configurar ambiente:**
   - Certifique-se de que `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configurados

3. **Testar funcionalidades:**
   ```bash
   # Iniciar servidor
   npm run dev
   
   # Acessar admin
   http://localhost:3000/admin/settings/tracking
   http://localhost:3000/admin/webhooks
   http://localhost:3000/admin/pixel-experiments
   http://localhost:3000/admin/analytics
   
   # Executar testes E2E
   npx playwright test tests/e2e/tracking.spec.ts
   ```

4. **Integrar dispatcher de webhooks:**
   - Adicione chamadas para `dispatchWebhookEvent()` nos formulários de lead
   - Exemplo: ao enviar formulário de reserva, notificar webhooks

5. **Implementar atribuição de experimentos:**
   - Criar lógica para atribuir usuários a variantes A/B
   - Salvar em cookie ou session storage
   - Usar variante correta ao carregar pixels

---

## 📝 Checklist de Implementação

- [x] Dashboard de Analytics
  - [x] Tipos TypeScript
  - [x] API endpoint
  - [x] Página de visualização (existente)
  
- [x] Testes E2E com Playwright
  - [x] Testes de configuração
  - [x] Testes de validação
  - [x] Testes de injeção de scripts
  - [x] Testes de API
  
- [x] Webhooks de Eventos
  - [x] Tipos TypeScript
  - [x] APIs CRUD
  - [x] Dispatcher com retry
  - [x] Página de gerenciamento
  - [x] Endpoint de teste
  
- [x] A/B Testing de Pixels
  - [x] Tipos TypeScript
  - [x] APIs de experimentos
  - [x] API de resultados
  - [x] Página de gerenciamento
  - [x] Cálculo de significância estatística

---

## 🎯 Funcionalidades Extras Sugeridas

### 1. Relatórios Agendados
- Enviar relatórios diários/semanais por email
- Resumo de métricas e conversões

### 2. Alertas Automáticos
- Notificar quando taxa de conversão cai X%
- Alertar quando pixel para de funcionar

### 3. Integração com CRM
- Enviar leads automaticamente para CRM via webhook
- Sincronização bidirecional

### 4. Heatmaps e Session Recording
- Integração com Hotjar/Clarity
- Visualizar comportamento do usuário

### 5. Painel de ROI
- Calcular retorno sobre investimento em ads
- Custo por lead/conversão
