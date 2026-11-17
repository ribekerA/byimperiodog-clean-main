# 🎯 Roadmap de Desenvolvimento - byimperiodog

## ✅ Concluído (Últimas Implementações)

### 1. **Analytics & Tracking** ✅
- Sistema completo de eventos (GA4 + Facebook Pixel + TikTok)
- Tracking de WhatsApp clicks, newsletter, shares, lead forms
- Respeitando consentimento LGPD

### 2. **Consent Mode LGPD** ✅
- Banner de cookies com 4 categorias (necessários, funcionais, analytics, marketing)
- Google Consent Mode v2 integrado
- localStorage com versionamento (byimperiodog_consent_v1)
- Política de privacidade linkada

### 3. **Newsletter API** ✅
- Endpoint `/api/newsletter` com rate limiting (3/min)
- Validação Zod (email)
- Supabase integration
- Tratamento de duplicatas

### 4. **WhatsApp Consolidação** ✅
- Helper centralizado (`src/lib/whatsapp.ts`)
- buildWhatsAppLink() para URLs personalizadas
- Tracking em todos os CTAs

### 5. **Formulário de Lead LGPD** ✅
- 9 campos (nome, telefone, cidade, UF, sexo, cor, prazo, mensagem, consent)
- Validação RHF + Zod (client + server)
- Consentimento LGPD obrigatório
- Rate limiting (3/min por IP)
- Tracking de conversão
- Redirecionamento WhatsApp automático (2s)
- Migration Supabase completa (sql/leads.sql)

### 6. **CI Script Banned Words** ✅
- Script `check-banned-words.mjs` que falha build se encontrar:
  - adoção, doação, boutique, pet shop
- Integrado ao `npm run check:all`
- Percorre MDX, TSX, JSON (ignora node_modules/sql/docs)

---

## 🚀 Próximos Passos (Prioritários)

### P0 - Crítico (Deploy Imediato)

#### 1. **Aplicar Migration no Supabase** 🔴
```bash
# Executar manualmente ou via CI
supabase db push sql/leads.sql
```
**Por quê:** Tabela `leads` precisa existir para formulário funcionar.

#### 2. **Testar Formulário em Produção** 🔴
- Submit válido → verificar Supabase
- Rate limiting → 4 submits seguidos
- WhatsApp redirect → aguardar 2s
- Tracking → verificar GA4 + Facebook

#### 3. **Política de Privacidade** 🟡
**Arquivo:** `app/politica-de-privacidade/page.tsx`
- Criar página com texto LGPD compliant
- Seções: coleta, finalidade, armazenamento, direitos, contato
- Link ativo no ConsentBanner e LeadForm

---

### P1 - Alta Prioridade (1-2 Semanas)

#### 4. **Dashboard Admin de Leads** 🟡
**Arquivos:** `app/(admin)/leads/page.tsx`
- Tabela com leads recentes
- Filtros: status, origem (UTM), data
- Ações: marcar como "contacted", "qualified", "converted", "lost"
- Exportar CSV

**Funcionalidades:**
- Paginação (10/20/50 por página)
- Busca por nome/telefone
- Ordenação por created_at, status
- Badge colorido por status (pending/contacted/qualified/converted/lost)

#### 5. **Notificações de Novos Leads** 🟡
**Opções:**
- **Email** (SendGrid/Mailchimp): enviar para admin@byimperiodog.com.br
- **Webhook Slack/Discord**: notificação em tempo real
- **WhatsApp Business API**: alerta para equipe

**Implementação:**
```typescript
// app/api/leads/route.ts (após insert sucesso)
await sendNotification({
  type: 'new_lead',
  data: { nome, telefone, cidade, utm_source },
});
```

#### 6. **Email de Confirmação para Lead** 🟡
**Template:**
```
Olá [NOME]!

Recebemos sua solicitação de contato sobre nossos filhotes.

Nossa equipe entrará em contato pelo WhatsApp [TELEFONE] em até 2 horas (horário comercial).

Enquanto isso, conheça mais sobre nossa filosofia:
- [Link] Conheça nossa criação responsável
- [Link] FAQ - Perguntas frequentes
- [Link] Depoimentos de famílias felizes

Atenciosamente,
Equipe By Imperio Dog
```

#### 7. **Tracking Avançado (Blog)** 🟢
**Arquivo:** `app/blog/[slug]/page.tsx`
- **Scroll depth tracking** (25%, 50%, 75%, 100%)
- **Read completion** (tempo estimado vs. tempo real)
- **Click tracking** em links internos
- **Share tracking** (já implementado em ShareButtons)

**Implementação:**
```typescript
// Hook useScrollTracking
useEffect(() => {
  const handleScroll = () => {
    const scrollPercent = (window.scrollY / document.body.scrollHeight) * 100;
    if (scrollPercent >= 25 && !tracked25) {
      trackScrollDepth(slug, 25);
      setTracked25(true);
    }
    // ... 50%, 75%, 100%
  };
  window.addEventListener('scroll', handleScroll);
}, []);
```

#### 8. **Puppy Modal Tracking** 🟢
**Arquivo:** `src/components/PuppyModal.tsx` (ou similar)
- Tracking ao abrir modal: `trackPuppyModalOpen(puppyId, puppyName)`
- Tracking ao clicar "Quero esse filhote" → WhatsApp
- Tracking ao fechar sem ação

---

### P2 - Melhorias (2-4 Semanas)

#### 9. **Automação de Follow-up** 🔵
**Sistema:**
- Agendar tarefas automáticas (ex: "Ligar em 2 horas")
- Notificar admin se lead não foi contactado em 24h
- Escalar para "lost" se 7 dias sem resposta

**Implementação:**
- Edge Functions no Supabase (cron jobs)
- Ou Vercel Cron Jobs (vercel.json)

#### 10. **Integração CRM** 🔵
**Opções:**
- RD Station Marketing
- HubSpot
- Pipedrive
- ActiveCampaign

**Sync:**
- Novos leads → criar contato no CRM
- Status changes → atualizar pipeline

#### 11. **A/B Testing (Formulário)** 🔵
**Variações:**
- Título: "Quero um filhote" vs. "Orientação personalizada"
- Campos obrigatórios: mínimos (4) vs. completos (9)
- CTA: "Enviar" vs. "Receber contato"
- Cores: accent vs. brand

**Tool:** Google Optimize ou Vercel Edge Config

#### 12. **Máscaras de Input** 🔵
**Biblioteca:** `react-input-mask` ou `input-otp`
- Telefone: `(11) 99988-7766`
- CEP (futuro): `12345-678`

#### 13. **Autocomplete de Cidade** 🔵
**API:** ViaCEP ou IBGE
- Digitar UF → carregar cidades
- Select com busca (react-select)

#### 14. **JSON-LD e Metadata Avançada** 🔵
**Schemas:**
- Organization (empresa)
- WebSite (breadcrumbs + sitelinks)
- Product (filhotes)
- FAQPage (FAQ)
- BlogPosting (artigos)

**Arquivo:** `src/lib/jsonld.ts`
```typescript
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "By Imperio Dog",
  url: "https://byimperiodog.com.br",
  logo: "https://byimperiodog.com.br/logo.png",
  sameAs: [
    "https://instagram.com/byimperiodog",
    "https://facebook.com/byimperiodog",
  ],
};
```

#### 15. **Design System Tokens** 🔵
**Arquivo:** `tailwind.config.ts`
- Consolidar cores (brand, accent, text, border)
- Tipografia (font-family, sizes, weights)
- Spacing (scale 4px)
- Shadows (elevation system)

**Aplicar em:**
- Header, Footer, Buttons
- Forms, Cards, Modals
- Blog components

#### 16. **Home Page Revisão** 🔵
**Seções:**
1. Hero (H1 + CTA + imagem destaque)
2. Diferenciais (3-4 cards)
3. Grid de Filhotes (com modal)
4. Processo (timeline 1-2-3-4)
5. Depoimentos (carrossel)
6. FAQ (accordion)
7. CTA Final (formulário ou WhatsApp)

**Foco:**
- Acessibilidade (landmarks, ARIA)
- Performance (lazy load, WebP)
- Conversão (CTAs estratégicos)

#### 17. **Blog Evergreen** 🔵
**Categorias Pilares:**
- Cuidados com Filhotes
- Raças e Características
- Treinamento e Comportamento
- Saúde e Nutrição

**Ações:**
- Links internos para Filhotes/FAQ/Processo
- BlogPosting JSON-LD em todos os posts
- Related posts (3-4 sugestões)

#### 18. **Acessibilidade Avançada** 🔵
**Features:**
- SkipLink (pular para conteúdo)
- Foco visível (outline customizado)
- Landmarks ARIA (header, main, nav, aside, footer)
- prefers-reduced-motion (respeitar configuração)
- Auditar com Axe DevTools

---

## 📊 Métricas de Sucesso

### KPIs de Conversão
- **Taxa de Conversão (Lead → WhatsApp)**: > 80%
- **Taxa de Qualificação (Lead → Qualified)**: > 50%
- **Taxa de Conversão (Qualified → Converted)**: > 30%
- **Tempo Médio de Resposta**: < 2 horas

### KPIs de Tráfego
- **Bounce Rate**: < 40%
- **Tempo Médio na Página (Blog)**: > 2 min
- **Pages per Session**: > 3
- **Newsletter Signup Rate**: > 5%

### KPIs de Qualidade
- **Lighthouse Performance**: > 90
- **Lighthouse Accessibility**: 100
- **Core Web Vitals (CWV)**: All Green
- **Zero Banned Words**: ✅ (CI enforcement)

---

## 🛠️ Stack Tecnológica

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Forms:** React Hook Form + Zod
- **Animation:** Framer Motion

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (admin routes)
- **Storage:** Supabase Storage (imagens de filhotes)
- **Edge Functions:** Supabase Edge Functions

### Analytics
- **Google Analytics 4:** GA4 events
- **Facebook Pixel:** Meta conversions
- **TikTok Pixel:** TikTok Ads (preparado)
- **Google Consent Mode v2:** LGPD compliance

### DevOps
- **Hosting:** Vercel (Edge Network)
- **CI/CD:** GitHub Actions
- **Monitoring:** Vercel Analytics + Sentry (futuro)

---

## 📅 Timeline Sugerida

### Semana 1-2 (Deploy Crítico)
- [ ] Aplicar migration `sql/leads.sql`
- [ ] Criar página `/politica-de-privacidade`
- [ ] Testar formulário em produção
- [ ] Configurar notificações de leads (email/Slack)

### Semana 3-4 (Admin Dashboard)
- [ ] Dashboard de leads (visualizar, filtrar, editar status)
- [ ] Email de confirmação para leads
- [ ] Tracking avançado (scroll depth, puppy modal)

### Semana 5-6 (CRM & Automação)
- [ ] Integração CRM (RD Station ou HubSpot)
- [ ] Automação de follow-up
- [ ] A/B testing setup

### Semana 7-8 (SEO & Performance)
- [ ] JSON-LD schemas
- [ ] Blog evergreen (categorias, links internos)
- [ ] Home page revisão (Hero, CTAs, FAQ)

### Semana 9-10 (Polimento)
- [ ] Design system tokens
- [ ] Acessibilidade avançada
- [ ] Máscaras de input + autocomplete cidade

---

## 🎓 Recursos Educacionais

### Documentação Criada
- ✅ `docs/WHATSAPP_CONSOLIDATION.md`
- ✅ `docs/ANALYTICS_CONSENT_IMPLEMENTATION.md`
- ✅ `docs/LEAD_FORM_IMPLEMENTATION.md`
- ✅ `docs/ROADMAP.md` (este arquivo)

### Próximas Documentações
- [ ] `docs/ADMIN_DASHBOARD.md`
- [ ] `docs/CRM_INTEGRATION.md`
- [ ] `docs/SEO_STRATEGY.md`
- [ ] `docs/ACCESSIBILITY_AUDIT.md`

---

## 🏁 Conclusão

**Status Atual:** 🟢 **Fundação Sólida Completa**

**Principais Conquistas:**
- ✅ Analytics e tracking com LGPD compliance
- ✅ Formulário de leads robusto e seguro
- ✅ CI enforcement de palavras banidas
- ✅ WhatsApp strategy consolidada

**Próximos Focos:**
1. **Deploy** (migration + política de privacidade)
2. **Admin Tools** (dashboard de leads)
3. **Automação** (notificações + follow-up)
4. **SEO** (JSON-LD + blog evergreen)

**Meta Final:** 🎯 **Máquina de Conversão LGPD Compliant**

---

**Última atualização:** 23 de outubro de 2025  
**Versão:** 1.0  
**Mantenedor:** GitHub Copilot + Equipe By Imperio Dog
