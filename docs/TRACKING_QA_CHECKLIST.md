# Checklist de QA - Sistema de Tracking (Pixels & Analytics)

> By Imperio Dog - Sistema de Pixels/Analytics  
> Data: 28 de novembro de 2025

## 📋 Checklist de Testes

### 1. Backend - APIs ✅

#### GET /api/settings/tracking (Público)
- [ ] Retorna configurações sem autenticação
- [ ] Não expõe tokens secretos (fb_capi_token, tiktok_api_token)
- [ ] Retorna objeto vazio quando não há configurações
- [ ] Cache de 5 minutos está funcionando
- [ ] Responde com status 200 em caso de sucesso
- [ ] Responde com status 500 em caso de erro do banco

#### GET /api/admin/settings (Admin)
- [ ] Requer autenticação de admin
- [ ] Retorna TODAS as configurações (incluindo tokens secretos)
- [ ] Retorna status 401 se não autenticado
- [ ] Retorna status 200 com dados completos

#### POST /api/admin/settings (Admin)
- [ ] Requer autenticação de admin
- [ ] Valida Facebook Pixel ID (apenas números, 10-20 dígitos)
- [ ] Valida Google Analytics ID (formato G-XXXXXXXXXX)
- [ ] Valida Google Tag Manager ID (formato GTM-XXXXXXX)
- [ ] Valida TikTok Pixel ID (alfanumérico, 10-20 chars)
- [ ] Valida Google Ads ID (formato AW-XXXXXXXXXX)
- [ ] Valida Hotjar ID (apenas números, 6-10 dígitos)
- [ ] Valida Clarity ID (alfanumérico, 10-15 chars)
- [ ] Valida Pinterest Tag ID (apenas números, 13-16 dígitos)
- [ ] Valida Weekly Post Goal (1-100)
- [ ] Retorna status 400 com mensagem clara de erro para validações
- [ ] Retorna status 200 com dados atualizados em caso de sucesso
- [ ] Normaliza strings vazias para null
- [ ] Aceita null para desabilitar pixels
- [ ] Registra log de ações admin

---

### 2. Frontend - Validadores ✅

#### validateFacebookPixelId()
- [ ] Aceita ID numérico válido (1234567890123456)
- [ ] Aceita valores vazios (null, undefined, '')
- [ ] Rejeita IDs com letras
- [ ] Rejeita IDs muito curtos (< 10 dígitos)
- [ ] Rejeita IDs muito longos (> 20 dígitos)
- [ ] Remove espaços antes de validar

#### validateGoogleAnalyticsId()
- [ ] Aceita formato GA4 (G-ABCD12345)
- [ ] Aceita letras maiúsculas e minúsculas
- [ ] Aceita valores vazios
- [ ] Rejeita formato antigo (UA-12345-1)
- [ ] Rejeita IDs sem prefixo G-
- [ ] Rejeita caracteres especiais

#### Outros Validadores
- [ ] validateGTMId() aceita GTM-ABC123
- [ ] validateTikTokPixelId() aceita alfanumérico
- [ ] validateGoogleAdsId() aceita AW-123456789
- [ ] validateHotjarId() aceita apenas números
- [ ] validateClarityId() aceita alfanumérico
- [ ] validatePinterestTagId() aceita apenas números
- [ ] validateWeeklyPostGoal() aceita 1-100

---

### 3. Frontend - Página Admin ✅

#### Carregamento Inicial
- [ ] Mostra loading state durante carregamento
- [ ] Carrega configurações existentes nos campos
- [ ] Exibe mensagem de erro se falhar ao carregar

#### Formulário
- [ ] Todos os campos são editáveis
- [ ] Campos numéricos validam entrada
- [ ] Botão "Salvar" desabilita durante salvamento
- [ ] Mostra indicador de loading ao salvar
- [ ] Exibe mensagem de sucesso após salvar
- [ ] Exibe mensagem de erro com detalhes se falhar
- [ ] Mensagem de sucesso desaparece após 5 segundos

#### Botões "Testar Pixel"
- [ ] Botão Facebook Pixel aparece quando ID está configurado
- [ ] Botão Google Analytics aparece quando ID está configurado
- [ ] Botão TikTok Pixel aparece quando ID está configurado
- [ ] Botão Pinterest Tag aparece quando ID está configurado
- [ ] Botões desabilitam se ID estiver vazio
- [ ] Botões mostram loading durante teste
- [ ] Alert de sucesso mostra instruções para verificar
- [ ] Alert de erro mostra se pixel não está carregado

#### Validação Visual
- [ ] Placeholders mostram formato correto
- [ ] Dicas de formato aparecem abaixo dos campos
- [ ] Seções bem organizadas (Google, Meta, Outros, Blog)
- [ ] Ícones ajudam a identificar seções
- [ ] Campos secretos (CAPI tokens) são do tipo password
- [ ] Informações importantes destacadas no final

---

### 4. Frontend - Hook useTracking ✅

#### Modo Público
- [ ] Carrega configurações de /api/settings/tracking
- [ ] Não requer autenticação
- [ ] Auto-load funciona ao montar componente
- [ ] Retorna apenas configurações públicas

#### Modo Admin
- [ ] Carrega configurações de /api/admin/settings
- [ ] Requer autenticação (credentials: include)
- [ ] Função updateSettings() funciona
- [ ] Retorna configurações completas (com tokens)

#### Estados
- [ ] loading = true durante carregamento
- [ ] error contém mensagem se falhar
- [ ] settings contém dados após carregar
- [ ] refetch() recarrega configurações

---

### 5. Frontend - Componente TestPixelButton ✅

#### Facebook Pixel
- [ ] Verifica se window.fbq existe
- [ ] Dispara evento 'Lead' com metadata de teste
- [ ] Mostra mensagem de sucesso
- [ ] Mostra mensagem de erro se pixel não carregado
- [ ] Loga evento no console

#### Google Analytics
- [ ] Verifica se window.gtag existe
- [ ] Dispara evento 'test_tracking'
- [ ] Mostra mensagem de sucesso
- [ ] Mostra mensagem de erro se GA não carregado

#### TikTok Pixel
- [ ] Verifica se window.ttq existe
- [ ] Dispara evento 'SubmitForm'
- [ ] Mostra mensagem de sucesso

#### Pinterest Tag
- [ ] Verifica se window.pintrk existe
- [ ] Dispara evento 'lead'
- [ ] Mostra mensagem de sucesso

---

### 6. Integração com Sistema Existente ✅

#### Componente Pixels
- [ ] Pixels.tsx continua funcionando normalmente
- [ ] Carrega configurações de getPixelsSettings()
- [ ] Injeta scripts corretamente

#### Componente TrackingScripts
- [ ] Dispara pageView em todas as plataformas
- [ ] Escuta eventos de navegação SPA
- [ ] Web Vitals inicializam corretamente
- [ ] Eventos delegados de click funcionam

#### Layout Root
- [ ] TrackingScripts carrega lazy (ssr: false)
- [ ] Não carrega em rotas admin
- [ ] JSON-LD continua funcionando
- [ ] Resource hints estão corretos

---

### 7. Testes Automatizados ✅

#### Testes Unitários
- [ ] Todos os validadores têm testes
- [ ] Casos de sucesso cobertos
- [ ] Casos de erro cobertos
- [ ] Edge cases cobertos (null, undefined, empty)

#### Testes de Integração
- [ ] Estrutura de payload validada
- [ ] Segurança validada (tokens secretos)
- [ ] Normalização de dados validada

#### Cobertura
- [ ] Executar: `npm test` ou `vitest run`
- [ ] Cobertura mínima: 80%
- [ ] Sem erros ou warnings

---

### 8. Segurança 🔐

#### Dados Sensíveis
- [ ] fb_capi_token NUNCA exposto em /api/settings/tracking
- [ ] tiktok_api_token NUNCA exposto em /api/settings/tracking
- [ ] Tokens aparecem apenas em /api/admin/settings
- [ ] Campos password no formulário para tokens

#### Autenticação
- [ ] Rota admin requer autenticação
- [ ] Rota pública não requer autenticação
- [ ] Mensagem 401 clara se não autenticado

#### Validação
- [ ] Todas as entradas validadas no backend
- [ ] Mensagens de erro não expõem detalhes internos
- [ ] Logs não expõem dados sensíveis

---

### 9. Performance ⚡

#### APIs
- [ ] Cache de 5 minutos na rota pública
- [ ] Queries otimizadas (select apenas campos necessários)
- [ ] Resposta rápida (< 100ms)

#### Frontend
- [ ] TrackingScripts carrega lazy
- [ ] useTracking não recarrega desnecessariamente
- [ ] Formulário admin não trava durante salvamento

#### Scripts de Pixels
- [ ] Scripts injetados de forma assíncrona
- [ ] Não bloqueiam main thread
- [ ] RequestIdleCallback usado quando disponível

---

### 10. Acessibilidade ♿

#### Formulário
- [ ] Labels associados aos inputs
- [ ] Mensagens de erro anunciadas
- [ ] Botões têm texto descritivo
- [ ] Campos desabilitados quando apropriado
- [ ] Navegação por teclado funciona

---

### 11. UX / Usabilidade 🎨

#### Feedback Visual
- [ ] Loading states claros
- [ ] Mensagens de sucesso visíveis e temporárias
- [ ] Mensagens de erro visíveis e persistentes
- [ ] Ícones ajudam a identificar seções

#### Informações
- [ ] Placeholders mostram formato correto
- [ ] Dicas de formato abaixo dos campos
- [ ] Box informativo no final da página
- [ ] Instruções claras para testes de pixel

---

## 🧪 Testes Manuais Essenciais

### Teste 1: Configurar Facebook Pixel
1. Acessar /admin/settings/tracking
2. Inserir Facebook Pixel ID válido (apenas números)
3. Clicar em "Salvar Configurações"
4. Verificar mensagem de sucesso
5. Clicar em "Testar Pixel"
6. Verificar evento no Facebook Event Manager

### Teste 2: Configurar Google Analytics
1. Inserir GA4 ID (formato G-XXXX)
2. Salvar
3. Clicar em "Testar Analytics"
4. Verificar evento no Google Analytics (Tempo Real)

### Teste 3: Validação de Erro
1. Inserir Facebook Pixel ID inválido (com letras)
2. Clicar em "Salvar"
3. Verificar mensagem de erro clara
4. Corrigir e salvar novamente

### Teste 4: Desabilitar Pixel
1. Limpar campo de Facebook Pixel ID
2. Salvar
3. Verificar que pixel foi desabilitado
4. Recarregar página pública e verificar que script não foi injetado

### Teste 5: Frontend Público
1. Configurar pixels no admin
2. Abrir página pública do site
3. Verificar no DevTools que scripts foram injetados
4. Verificar eventos no Network tab

---

## ✅ Critérios de Aceitação

### Backend
- [x] Tabela `site_settings` existe no banco
- [x] API pública retorna apenas IDs públicos
- [x] API admin retorna todos os dados
- [x] API admin valida todos os campos
- [x] Tokens secretos não são expostos publicamente

### Frontend - Admin
- [x] Página /admin/settings/tracking acessível
- [x] Formulário carrega configurações existentes
- [x] Validações funcionam antes de salvar
- [x] Botões "Testar Pixel" funcionam
- [x] Feedback visual claro para usuário

### Frontend - Público
- [x] Scripts de pixels são injetados automaticamente
- [x] Pixels disparam pageView
- [x] Performance não degradada

### Testes
- [x] Testes unitários cobrem validadores
- [x] Testes de integração cobrem APIs
- [x] Sem erros ao executar suite de testes

### Documentação
- [x] README completo com exemplos
- [x] Checklist de QA documentado
- [x] Tipos TypeScript documentados

---

## 🚀 Comandos Úteis

```bash
# Executar testes
npm test
# ou
vitest run

# Executar testes com cobertura
vitest run --coverage

# Executar testes em watch mode
vitest

# Verificar tipos TypeScript
npx tsc --noEmit

# Rodar desenvolvimento
npm run dev
```

---

## 📚 Referências para Testes

### Facebook Event Manager
https://business.facebook.com/events_manager2

### Google Analytics Real-Time
https://analytics.google.com/ > Tempo Real > Eventos

### TikTok Events Manager
https://ads.tiktok.com/marketing_api/apps

### Pinterest Tag Manager
https://ads.pinterest.com/conversion_tags/

---

**Status:** ✅ Implementação Completa  
**Última Atualização:** 28 de novembro de 2025  
**Desenvolvedor:** By Imperio Dog
