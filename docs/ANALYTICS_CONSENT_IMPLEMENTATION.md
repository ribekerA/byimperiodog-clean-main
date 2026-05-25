# Sistema de Analytics, Tracking e Consent Mode LGPD

**Data:** 23 de outubro de 2025  
**Status:** ✅ Implementado e integrado

---

## 🎯 Objetivos Alcançados

1. ✅ **Endpoint de Newsletter** com rate limiting e validação
2. ✅ **Sistema de Consent Mode LGPD** (Google Consent Mode v2)
3. ✅ **Tracking de Eventos** (GA4, Facebook Pixel, TikTok)

---

## 📦 Arquivos Criados/Modificados

### Novos Arquivos

1. **`src/lib/consent.ts`**
   - Gerenciamento de preferências de consentimento (LGPD)
   - localStorage para persistência
   - Integração com Google Consent Mode v2
   - Tipos: `ConsentCategory`, `ConsentPreferences`, `ConsentState`
   - Funções: `loadConsent()`, `saveConsent()`, `acceptAllConsent()`, `rejectAllConsent()`, `hasConsent()`, `getCurrentConsent()`, `setDefaultConsent()`

2. **`src/components/ConsentBanner.tsx`**
   - Banner de cookies com UI/UX acessível
   - Modo simples (aceitar/rejeitar/preferências)
   - Modo avançado (configuração detalhada por categoria)
   - Animações com framer-motion
   - ARIA labels e roles apropriados
   - Categorias:
     - ✅ Necessários (sempre ativo)
     - 🔧 Funcionais (preferências, tema)
     - 📊 Analytics (GA4, Hotjar, Clarity)
     - 📢 Marketing (Facebook, TikTok, Pinterest)

3. **`src/lib/events.ts`**
   - Tracking de eventos respeitando consentimento
   - Funções:
     - `trackWhatsAppClick(source, label)`
     - `trackNewsletterSubscribe(source)`
     - `trackShare(platform, content)`
     - `trackLeadFormSubmit(formName)`
     - `trackPuppyModalOpen(puppyId, puppyName)`
     - `trackCTAClick(ctaName, location)`
   - Integração com GA4 e Facebook Pixel

### Arquivos Modificados

1. **`app/api/newsletter/route.ts`**
   - ✅ Rate limiting (3 req/min por IP)
   - ✅ Validação com Zod
   - ✅ Tratamento de unique_violation (23505)
   - ✅ Respostas HTTP apropriadas (400, 429, 500)
   - ✅ Remoção de console.logs

2. **`app/layout.tsx`**
   - ✅ Import de `ConsentBanner`
   - ✅ Renderiza `<ConsentBanner />` em rotas não-admin
   - ✅ Ordem de imports corrigida

3. **`src/components/Footer.tsx`**
   - ✅ Import de `trackWhatsAppClick` e `trackNewsletterSubscribe`
   - ✅ Tracking no CTA principal do WhatsApp (footer-cta)
   - ✅ Tracking no botão flutuante do WhatsApp (footer-floating)
   - ✅ Tracking ao inscrever newsletter (footer-newsletter)

4. **`src/components/blog/ShareButtons.tsx`**
   - ✅ Import de `trackShare`
   - ✅ Tracking em todos os botões de compartilhamento:
     - WhatsApp
     - Facebook
     - Twitter
     - Copy Link

---

## 🔐 Sistema de Consentimento (LGPD)

### Categorias de Cookies

| Categoria | Obrigatório | Descrição | Exemplos |
|-----------|-------------|-----------|----------|
| **Necessários** | ✅ Sim | Essenciais para funcionamento | Autenticação, carrinho, segurança |
| **Funcionais** | ⚙️ Opcional | Preferências do usuário | Tema, idioma, configurações UI |
| **Analytics** | 📊 Opcional | Análise de uso | GA4, Hotjar, Clarity |
| **Marketing** | 📢 Opcional | Anúncios personalizados | Facebook Pixel, TikTok, Pinterest |

### Fluxo de Consentimento

```
Usuário visita site
    ↓
ConsentBanner aparece (se não houver consentimento salvo)
    ↓
Opções:
  - Aceitar Todos → salva all:true
  - Rejeitar → salva only necessary:true
  - Preferências → modal avançado com toggles
    ↓
Salva em localStorage (byimperiodog_consent_v1)
    ↓
Atualiza Google Consent Mode (gtag('consent', 'update', ...))
    ↓
Dispara evento customizado 'consentUpdated'
    ↓
Pixels e trackers respeitam preferências
```

### Google Consent Mode v2

O sistema implementa corretamente o [Google Consent Mode v2](https://developers.google.com/tag-platform/security/guides/consent):

- `ad_storage`: Cookies de publicidade
- `ad_user_data`: Dados do usuário para anúncios
- `ad_personalization`: Personalização de anúncios
- `analytics_storage`: Cookies de analytics
- `functionality_storage`: Cookies funcionais
- `personalization_storage`: Personalização de conteúdo
- `security_storage`: Cookies de segurança (sempre granted)

---

## 📊 Tracking de Eventos

### Eventos Implementados

| Evento | Onde Dispara | Pixels |
|--------|--------------|--------|
| `whatsapp_click` | Footer CTA, botão flutuante | GA4 (Contact), FB (Contact) |
| `newsletter_subscribe` | Footer newsletter form | GA4 (conversion), FB (Subscribe) |
| `share` | ShareButtons (WhatsApp, FB, Twitter, Link) | GA4 (share) |
| `generate_lead` | LeadForm (futuro) | GA4 (Lead), FB (Lead) |
| `view_item` | Puppy modal (futuro) | GA4 (view_item) |
| `cta_click` | CTAs genéricos | GA4 (cta_click) |

### Parâmetros de Tracking

Exemplo de evento `whatsapp_click`:

```typescript
{
  event_category: 'conversion',
  event_label: 'CTA Principal Footer',
  source: 'footer-cta'
}
```

---

## 🔧 API de Newsletter

### Endpoint: `POST /api/newsletter`

**Request Body:**
```json
{
  "email": "usuario@exemplo.com"
}
```

**Validação:**
- Email válido (Zod schema)
- Trim e lowercase automático
- Rate limiting: 3 tentativas/minuto por IP

**Responses:**

| Status | Caso | Mensagem |
|--------|------|----------|
| 200 | Sucesso | "Inscrição confirmada!" |
| 200 | Email já existe | "E-mail já inscrito" |
| 400 | Email inválido | "E-mail inválido" |
| 429 | Rate limit | "Muitas tentativas. Aguarde um momento." |
| 500 | Erro interno | "Falha ao inscrever" |

**Rate Limiting:**
- Baseado em IP (x-forwarded-for ou x-real-ip)
- Janela de 1 minuto
- Máximo 3 requisições
- Limpeza automática de entradas antigas

---

## ✅ Conformidade LGPD

### Requisitos Atendidos

- ✅ **Consentimento explícito** antes de carregar pixels de marketing
- ✅ **Granularidade** (4 categorias distintas)
- ✅ **Transparência** (descrição clara de cada categoria)
- ✅ **Revogação** (usuário pode mudar preferências a qualquer momento)
- ✅ **Persistência** (localStorage com versão da política)
- ✅ **Acessibilidade** (ARIA labels, focus management, keyboard navigation)
- ✅ **Link para Política de Privacidade** no banner

### Versão da Política

- Versão atual: `1.0`
- Key: `byimperiodog_consent_v1`
- Se a versão mudar, consentimento é invalidado (usuário precisa aceitar novamente)

---

## 🧪 Como Testar

### 1. Consent Banner

1. Limpar localStorage: `localStorage.clear()`
2. Recarregar página
3. Verificar aparecimento do banner
4. Testar opções:
   - **Aceitar Todos** → localStorage deve ter all:true
   - **Rejeitar** → apenas necessary:true
   - **Preferências** → modal com toggles funcionando

### 2. Google Consent Mode

```javascript
// No console do DevTools
window.gtag('get', '<GA4_ID>', 'consent')
```

Deve retornar objeto com status de consentimento atualizado.

### 3. Tracking de Eventos

```javascript
// Habilitar debug do GA4
window.gtag('config', '<GA4_ID>', { debug_mode: true });

// Clicar em WhatsApp → verificar evento 'whatsapp_click' no console
// Inscrever newsletter → verificar evento 'newsletter_subscribe'
```

### 4. Rate Limiting

```bash
# Fazer 4 requests rápidas
for i in {1..4}; do
  curl -X POST http://localhost:3000/api/newsletter \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
done
```

A 4ª deve retornar 429 (Too Many Requests).

---

## 📈 Métricas e KPIs

### Conversão

- Cliques em WhatsApp (por origem)
- Inscrições em newsletter
- Envios de formulário de lead
- Abertura de modais de filhotes

### Engagement

- Compartilhamentos sociais
- Scroll depth (blog)
- Tempo de leitura (blog)
- Comentários

### Funil

```
Visualização → CTA Click → WhatsApp → Lead
```

---

## 🚀 Próximos Passos

### P1 (Prioridade Alta)

- [ ] Adicionar tracking em `LeadForm.tsx`
- [ ] Tracking de abertura de modal de filhotes
- [ ] Script no CI para verificar banned words ("adoção", "doação", "boutique")
- [ ] Dashboard de analytics (página `/admin/analytics`)

### P2 (Melhorias Futuras)

- [ ] Server-side tracking via Google Tag Manager Server
- [ ] Integração com serviço de email marketing (Mailchimp/SendGrid)
- [ ] A/B testing de CTAs
- [ ] Heatmaps (Hotjar/Clarity)
- [ ] Session replay para debugging

---

## 📝 Checklist de Qualidade

- [x] Lint/Typecheck: PASS
- [x] Build: sem erros
- [x] Imports ordenados
- [x] Sem console.logs
- [x] Tipos TypeScript corretos
- [x] ARIA labels e roles
- [x] Keyboard navigation
- [x] Mobile responsive
- [x] Prefers-reduced-motion respeitado (animações)
- [x] Rate limiting testado
- [x] Zod validation funcionando
- [x] localStorage persistência OK
- [x] Google Consent Mode v2 implementado

---

## 🔗 Referências

- [Google Consent Mode v2](https://developers.google.com/tag-platform/security/guides/consent)
- [LGPD (Lei 13.709/2018)](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Facebook Pixel Events](https://developers.facebook.com/docs/meta-pixel/reference)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/events)

---

**Autor:** GitHub Copilot  
**Revisão:** Aguardando testes em staging e validação do usuário
