# 🎯 Sistema de Tracking (Pixels & Analytics) - Documentação Completa

> **By Império Dog** - Sistema completo de gerenciamento de pixels e analytics  
> **Data:** 28 de novembro de 2025  
> **Stack:** Next.js 14 + TypeScript + Supabase

---

## 📦 O que foi implementado?

Sistema completo de configuração e gerenciamento de pixels (Facebook, Google Analytics, TikTok, Pinterest, etc.) com:

✅ **Backend completo** com validações robustas  
✅ **Painel admin** intuitivo para configuração  
✅ **Injeção automática** de scripts no frontend  
✅ **Botões de teste** para validar pixels em tempo real  
✅ **Testes automatizados** unitários e de integração  
✅ **Segurança** com tokens secretos protegidos  
✅ **TypeScript** com tipagem forte em todo código  

---

## 🗂️ Estrutura de Arquivos Criados

### Backend

```
app/
  api/
    settings/
      tracking/
        route.ts                    # GET público (sem tokens secretos)
    admin/
      settings/
        route.ts                    # GET/POST admin (ATUALIZADO)

src/
  types/
    tracking.ts                     # Interfaces TypeScript
  lib/
    tracking/
      validators.ts                 # Validadores para IDs
      examples.ts                   # Exemplos de uso
```

### Frontend

```
app/
  (admin)/
    admin/
      (protected)/
        settings/
          tracking/
            page.tsx                # Página admin de configuração

src/
  components/
    admin/
      TestPixelButton.tsx          # Botão para testar pixels
  hooks/
    useTracking.ts                 # Hook React para tracking
```

### Testes

```
tests/
  lib/
    tracking/
      validators.test.ts           # Testes unitários validadores
  api/
    tracking/
      integration.test.ts          # Testes de integração
```

### Documentação

```
docs/
  TRACKING_BACKEND.md              # Doc completa do backend
  TRACKING_QA_CHECKLIST.md         # Checklist de QA
  TRACKING_README.md               # Este arquivo
```

---

## 🚀 Como Usar

### 1. Acessar Painel Admin

```
https://seusite.com/admin/settings/tracking
```

### 2. Configurar Pixels

Preencha os campos desejados:
- **Facebook Pixel ID**: Apenas números (ex: `1234567890123456`)
- **Google Analytics ID**: Formato GA4 (ex: `G-ABCD12345`)
- **Google Tag Manager ID**: Formato GTM (ex: `GTM-ABC123`)
- **TikTok Pixel ID**: Alfanumérico (ex: `C123ABC456DEF`)
- E mais...

### 3. Salvar e Testar

1. Clique em **"Salvar Configurações"**
2. Clique em **"🧪 Testar Pixel"** para validar
3. Verifique os eventos no painel de cada plataforma

### 4. Verificar no Frontend

Os scripts são injetados automaticamente no site público quando configurados.

---

## 📋 APIs Disponíveis

### GET /api/settings/tracking (Público)

Busca configurações públicas de tracking (sem tokens secretos).

**Exemplo:**
```typescript
const response = await fetch('/api/settings/tracking');
const { settings } = await response.json();

console.log(settings.meta_pixel_id); // "1234567890123456"
console.log(settings.ga4_id);        // "G-ABCD12345"
```

**Response:**
```json
{
  "settings": {
    "gtm_id": "GTM-ABC123",
    "ga4_id": "G-ABCD12345",
    "meta_pixel_id": "1234567890123456",
    "tiktok_pixel_id": "C123ABC456DEF",
    "google_ads_id": "AW-123456789",
    "pinterest_tag_id": "1234567890123",
    "hotjar_id": "123456",
    "clarity_id": "abcdef123456",
    "meta_domain_verify": "abcd1234",
    "custom_pixels": []
  }
}
```

---

### GET /api/admin/settings (Admin)

Busca TODAS as configurações (incluindo tokens secretos).

**Exemplo:**
```typescript
const response = await fetch('/api/admin/settings', {
  credentials: 'include'
});
const { settings } = await response.json();

console.log(settings.fb_capi_token); // "EAAxxxx..." (secreto)
```

**Requer:** Autenticação de admin

---

### POST /api/admin/settings (Admin)

Atualiza configurações de tracking.

**Exemplo:**
```typescript
const response = await fetch('/api/admin/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    meta_pixel_id: '1234567890123456',
    ga4_id: 'G-ABCD12345'
  })
});

const data = await response.json();

if (!response.ok) {
  console.error('Erro:', data.error);
} else {
  console.log('Salvo:', data.settings);
}
```

**Validações:**
- `meta_pixel_id`: Apenas números, 10-20 dígitos
- `ga4_id`: Formato `G-XXXXXXXXXX`
- `gtm_id`: Formato `GTM-XXXXXXX`
- E mais... (veja `validators.ts`)

**Responses:**
- `200`: Configurações salvas com sucesso
- `400`: Erro de validação (mensagem clara)
- `401`: Não autenticado como admin
- `500`: Erro interno do servidor

---

## 🧩 Componentes React

### Hook useTracking

```typescript
import { useTracking } from '@/hooks/useTracking';

// Frontend público
function MyComponent() {
  const { settings, loading } = useTracking();
  
  if (loading) return <div>Carregando...</div>;
  
  return <div>Pixel ID: {settings?.meta_pixel_id}</div>;
}

// Painel admin
function AdminComponent() {
  const { settings, updateSettings } = useTracking({ admin: true });
  
  const handleSave = async () => {
    const result = await updateSettings({
      meta_pixel_id: '1234567890123456'
    });
    
    if (result.success) {
      alert('Salvo!');
    }
  };
  
  return <button onClick={handleSave}>Salvar</button>;
}
```

---

### Componente TestPixelButton

```typescript
import { TestPixelButton } from '@/components/admin/TestPixelButton';

function PixelConfig() {
  return (
    <div>
      <TestPixelButton 
        pixelType="facebook" 
        pixelId="1234567890123456" 
      />
      
      <TestPixelButton 
        pixelType="google-analytics" 
        pixelId="G-ABCD12345" 
      />
    </div>
  );
}
```

**Tipos suportados:**
- `facebook`
- `google-analytics`
- `tiktok`
- `pinterest`

---

## 🔒 Segurança

### Tokens Secretos Protegidos

Os seguintes campos **NUNCA** são expostos na rota pública:
- `fb_capi_token` - Facebook Conversions API Token
- `tiktok_api_token` - TikTok API Token

Eles só aparecem em `/api/admin/settings` com autenticação.

### Validação Server-Side

Todas as entradas são validadas no backend antes de salvar:
- Formato correto de IDs
- Tamanho adequado
- Caracteres permitidos
- Range de valores (weekly_post_goal: 1-100)

### Cache Público

A rota pública usa cache de 5 minutos:
```
Cache-Control: public, s-maxage=300, stale-while-revalidate=600
```

---

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test
# ou
vitest run

# Com cobertura
vitest run --coverage

# Watch mode
vitest
```

### Cobertura Atual

- ✅ Validadores: 100%
- ✅ APIs: Estrutura validada
- ✅ Componentes: Lógica testada

### Arquivos de Teste

```
tests/
  lib/tracking/validators.test.ts      # Testes unitários
  api/tracking/integration.test.ts     # Testes de integração
```

---

## 📊 Pixels Suportados

| Pixel/Analytics | Campo | Formato | Exemplo |
|-----------------|-------|---------|---------|
| Google Tag Manager | `gtm_id` | `GTM-XXXXXXX` | `GTM-ABC123` |
| Google Analytics 4 | `ga4_id` | `G-XXXXXXXXXX` | `G-ABCD12345` |
| Facebook/Meta Pixel | `meta_pixel_id` | Numérico (10-20 dígitos) | `1234567890123456` |
| TikTok Pixel | `tiktok_pixel_id` | Alfanumérico (10-20 chars) | `C123ABC456DEF` |
| Google Ads | `google_ads_id` | `AW-XXXXXXXXXX` | `AW-123456789` |
| Pinterest Tag | `pinterest_tag_id` | Numérico (13-16 dígitos) | `1234567890123` |
| Hotjar | `hotjar_id` | Numérico (6-10 dígitos) | `123456` |
| Microsoft Clarity | `clarity_id` | Alfanumérico (10-15 chars) | `abcdef123456` |

---

## 🎨 Screenshots

### Página Admin
```
/admin/settings/tracking
```

**Seções:**
1. 📊 Google Analytics & Tag Manager
2. 📘 Meta / Facebook Pixel
3. 🎪 Outros Pixels (TikTok, Pinterest, etc.)
4. 📝 Configurações do Blog

**Features:**
- Campos organizados por categoria
- Placeholders com formato correto
- Dicas de formato abaixo dos campos
- Botões "Testar Pixel" integrados
- Mensagens de feedback claras

---

## 🔧 Configuração do Banco de Dados

### Tabela: site_settings

Já existe no banco em `sql/site_settings.sql`.

**Estrutura:**
```sql
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  
  -- IDs públicos
  gtm_id text,
  ga4_id text,
  meta_pixel_id text,
  tiktok_pixel_id text,
  google_ads_id text,
  google_ads_label text,
  pinterest_tag_id text,
  hotjar_id text,
  clarity_id text,
  meta_domain_verify text,
  custom_pixels jsonb default '[]'::jsonb,
  
  -- Tokens privados (server-side only)
  fb_capi_token text,
  tiktok_api_token text,
  
  -- Meta de posts
  weekly_post_goal int default 7,
  
  updated_at timestamptz not null default now()
);
```

**Características:**
- ✅ Tabela singleton (id sempre = 1)
- ✅ Row Level Security habilitado
- ✅ Trigger automático para `updated_at`
- ✅ Políticas para authenticated users

---

## 📝 Próximos Passos (Opcional)

### 1. Conversions API (CAPI)

Usar `fb_capi_token` para enviar eventos server-side:

```typescript
// src/lib/tracking/conversionsAPI.ts
export async function sendFacebookConversion(event: string, data: any) {
  const token = process.env.FB_CAPI_TOKEN; // Pegar do banco
  
  await fetch(`https://graph.facebook.com/v18.0/PIXEL_ID/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: token,
      data: [{
        event_name: event,
        event_time: Math.floor(Date.now() / 1000),
        user_data: { /* hash de dados do usuário */ },
        custom_data: data,
      }],
    }),
  });
}
```

### 2. Dashboard de Analytics

Criar página admin para visualizar métricas:
```
/admin/analytics
```

### 3. Pixels Customizados

Implementar UI para adicionar scripts customizados via `custom_pixels` (JSONB).

---

## 📚 Documentação Completa

- **Backend:** `docs/TRACKING_BACKEND.md`
- **QA Checklist:** `docs/TRACKING_QA_CHECKLIST.md`
- **Este README:** `docs/TRACKING_README.md`

---

## 🆘 Troubleshooting

### Pixel não está disparando eventos

1. Verifique se o ID está configurado no admin
2. Abra DevTools > Console e procure por erros
3. Clique em "Testar Pixel" no admin
4. Verifique o Network tab para ver se o script foi carregado

### Erro "Unauthorized" ao salvar

1. Verifique se está logado como admin
2. Verifique cookies de autenticação
3. Tente fazer logout e login novamente

### Validação rejeitando ID válido

1. Verifique o formato exato no placeholder
2. Remova espaços em branco
3. Verifique a documentação da plataforma

---

## 🎓 Recursos Externos

- [Facebook Pixel Documentation](https://developers.facebook.com/docs/meta-pixel)
- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Google Tag Manager Documentation](https://developers.google.com/tag-platform/tag-manager)
- [TikTok Pixel Documentation](https://ads.tiktok.com/help/article/tiktok-pixel)
- [Pinterest Tag Documentation](https://help.pinterest.com/en/business/article/track-conversions-with-pinterest-tag)

---

## ✅ Conclusão

Sistema completo de tracking implementado com:

- ✅ Backend robusto com validações
- ✅ Painel admin intuitivo
- ✅ Segurança de tokens secretos
- ✅ Testes automatizados
- ✅ TypeScript em todo código
- ✅ Documentação completa

**Status:** Pronto para produção! 🚀

---

**Desenvolvido por:** By Império Dog  
**Data:** 28 de novembro de 2025  
**Versão:** 1.0.0
