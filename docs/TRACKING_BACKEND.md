# Backend de Tracking Settings (Pixels & Analytics)

> Sistema completo de gerenciamento de pixels e analytics para By Império Dog

## 📋 Stack Confirmada

- **Framework:** Next.js 14+ com App Router
- **Linguagem:** TypeScript
- **Backend:** API Routes do Next.js
- **Banco de dados:** Supabase (PostgreSQL)
- **Autenticação Admin:** `@/lib/adminAuth`

---

## 🗄️ Modelo do Banco de Dados

### Tabela: `site_settings`

A tabela já existe no banco (SQL em `sql/site_settings.sql`):

```sql
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  
  -- Google Analytics / Tag Manager
  gtm_id text,
  ga4_id text,
  
  -- Meta/Facebook
  meta_pixel_id text,
  fb_capi_token text,              -- Server-side only
  meta_domain_verify text,
  
  -- TikTok
  tiktok_pixel_id text,
  tiktok_api_token text,           -- Server-side only
  
  -- Google Ads
  google_ads_id text,
  google_ads_label text,
  
  -- Outros pixels
  pinterest_tag_id text,
  hotjar_id text,
  clarity_id text,
  
  -- Pixels customizados
  custom_pixels jsonb default '[]'::jsonb,
  
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

## 🚀 API Routes

### 1. Rota Pública: `GET /api/settings/tracking`

**Arquivo:** `app/api/settings/tracking/route.ts`

**Propósito:** Buscar configurações públicas de tracking (sem tokens secretos)

**Autenticação:** ❌ Não requer (público)

**Response (200):**
```json
{
  "settings": {
    "gtm_id": "GTM-ABC123",
    "ga4_id": "G-ABCD12345",
    "meta_pixel_id": "1234567890123456",
    "tiktok_pixel_id": "C123ABC456DEF",
    "google_ads_id": "AW-123456789",
    "google_ads_label": "conversion_label",
    "pinterest_tag_id": "1234567890123",
    "hotjar_id": "123456",
    "clarity_id": "abcdef123456",
    "meta_domain_verify": "abcd1234",
    "custom_pixels": []
  }
}
```

**Cache:** 5 minutos (s-maxage=300)

**Exemplo de uso:**
```typescript
const response = await fetch('/api/settings/tracking');
const { settings } = await response.json();

if (settings.meta_pixel_id) {
  // Injetar Facebook Pixel
}
```

---

### 2. Rota Admin: `GET /api/admin/settings`

**Arquivo:** `app/api/admin/settings/route.ts`

**Propósito:** Buscar TODAS as configurações (incluindo tokens secretos)

**Autenticação:** ✅ Requer admin

**Response (200):**
```json
{
  "settings": {
    "id": 1,
    "gtm_id": "GTM-ABC123",
    "ga4_id": "G-ABCD12345",
    "meta_pixel_id": "1234567890123456",
    "fb_capi_token": "EAAxxxx...",        // ⚠️ Secreto
    "tiktok_api_token": "xxx...",          // ⚠️ Secreto
    "weekly_post_goal": 7,
    "updated_at": "2025-11-28T12:00:00Z"
  }
}
```

**Exemplo de uso:**
```typescript
const response = await fetch('/api/admin/settings', {
  credentials: 'include'
});
const { settings } = await response.json();
```

---

### 3. Rota Admin: `POST /api/admin/settings`

**Arquivo:** `app/api/admin/settings/route.ts`

**Propósito:** Atualizar configurações de tracking

**Autenticação:** ✅ Requer admin

**Request Body:**
```json
{
  "meta_pixel_id": "1234567890123456",
  "ga4_id": "G-ABCD12345",
  "gtm_id": "GTM-ABC123",
  "fb_capi_token": "EAAxxxx...",
  "weekly_post_goal": 7
}
```

**Validações implementadas:**

| Campo | Validação |
|-------|-----------|
| `meta_pixel_id` | Apenas números, 10-20 dígitos |
| `ga4_id` | Formato `G-XXXXXXXXXX` |
| `gtm_id` | Formato `GTM-XXXXXXX` |
| `tiktok_pixel_id` | Alfanumérico, 10-20 caracteres |
| `google_ads_id` | Formato `AW-XXXXXXXXXX` |
| `hotjar_id` | Apenas números, 6-10 dígitos |
| `clarity_id` | Alfanumérico, 10-15 caracteres |
| `pinterest_tag_id` | Apenas números, 13-16 dígitos |
| `weekly_post_goal` | Número inteiro entre 1 e 100 |

**Response (200):**
```json
{
  "settings": { /* configurações atualizadas */ }
}
```

**Response (400) - Erro de validação:**
```json
{
  "error": "Facebook Pixel ID deve conter apenas números (ex: 1234567890123456)"
}
```

**Response (401) - Não autenticado:**
```json
{
  "error": "Unauthorized"
}
```

**Response (500) - Erro interno:**
```json
{
  "error": "Database error message"
}
```

**Exemplo de uso:**
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

---

## 📁 Arquivos Criados/Atualizados

### Novos arquivos:

1. **`src/types/tracking.ts`**
   - Interfaces TypeScript para tracking settings
   - `TrackingSettings`, `PublicTrackingSettings`, `UpdateTrackingPayload`
   - Tipos de resposta da API

2. **`src/lib/tracking/validators.ts`**
   - Funções de validação para cada tipo de pixel/ID
   - `validateFacebookPixelId()`, `validateGoogleAnalyticsId()`, etc.
   - Retorna `{ valid: boolean, error?: string }`

3. **`app/api/settings/tracking/route.ts`**
   - Rota pública GET para buscar configurações
   - Filtra tokens secretos
   - Cache de 5 minutos

4. **`src/lib/tracking/examples.ts`**
   - Exemplos completos de uso das APIs
   - Funções helper para frontend e admin
   - Exemplos de payloads
   - Funções de teste de pixels

### Arquivos atualizados:

1. **`app/api/admin/settings/route.ts`**
   - ✅ Importação dos validadores
   - ✅ Validação de todos os IDs antes de salvar
   - ✅ Normalização de strings vazias para `null`
   - ✅ Adição de `fb_capi_token` e `tiktok_api_token` nos campos permitidos

---

## 🧪 Validações Implementadas

Todas as validações estão em `src/lib/tracking/validators.ts`:

```typescript
// Facebook Pixel
validateFacebookPixelId('1234567890123456')
// ✅ { valid: true }

validateFacebookPixelId('abc123')
// ❌ { valid: false, error: 'deve conter apenas números' }

// Google Analytics
validateGoogleAnalyticsId('G-ABCD12345')
// ✅ { valid: true }

validateGoogleAnalyticsId('UA-12345-1')
// ❌ { valid: false, error: 'deve começar com G-' }

// Valores vazios são válidos (desabilita o pixel)
validateFacebookPixelId('')
// ✅ { valid: true }

validateFacebookPixelId(null)
// ✅ { valid: true }
```

---

## 💻 Exemplos de Uso no Frontend

### 1. Buscar configurações públicas (Client Component)

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { PublicTrackingSettings } from '@/types/tracking';

export function TrackingLoader() {
  const [settings, setSettings] = useState<PublicTrackingSettings | null>(null);

  useEffect(() => {
    fetch('/api/settings/tracking')
      .then(res => res.json())
      .then(data => setSettings(data.settings));
  }, []);

  useEffect(() => {
    if (settings?.meta_pixel_id) {
      // Injetar Facebook Pixel
      console.log('Facebook Pixel ID:', settings.meta_pixel_id);
    }

    if (settings?.ga4_id) {
      // Injetar Google Analytics
      console.log('GA4 ID:', settings.ga4_id);
    }
  }, [settings]);

  return null;
}
```

### 2. Buscar configurações no Server Component

```typescript
import type { PublicTrackingSettings } from '@/types/tracking';

async function getTrackingSettings(): Promise<PublicTrackingSettings | null> {
  try {
    const res = await fetch('https://yoursite.com/api/settings/tracking', {
      next: { revalidate: 300 } // 5 minutos
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    return data.settings;
  } catch {
    return null;
  }
}

export async function RootLayout() {
  const tracking = await getTrackingSettings();
  
  return (
    <html>
      <head>
        {tracking?.meta_pixel_id && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${tracking.meta_pixel_id}');
                fbq('track', 'PageView');
              `
            }}
          />
        )}
      </head>
      <body>{/* ... */}</body>
    </html>
  );
}
```

### 3. Formulário de configuração no Admin

```typescript
'use client';

import { useState, useEffect } from 'react';

export function TrackingSettingsForm() {
  const [loading, setLoading] = useState(false);
  const [facebookPixelId, setFacebookPixelId] = useState('');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Carregar configurações atuais
  useEffect(() => {
    fetch('/api/admin/settings', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setFacebookPixelId(data.settings.meta_pixel_id || '');
          setGoogleAnalyticsId(data.settings.ga4_id || '');
        }
      });
  }, []);

  // Salvar configurações
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const response = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        meta_pixel_id: facebookPixelId || null,
        ga4_id: googleAnalyticsId || null,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || 'Erro ao salvar');
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Facebook Pixel ID
        </label>
        <input
          type="text"
          value={facebookPixelId}
          onChange={(e) => setFacebookPixelId(e.target.value)}
          placeholder="1234567890123456"
          className="w-full border rounded px-3 py-2"
        />
        <p className="text-xs text-gray-500 mt-1">
          Apenas números (ex: 1234567890123456)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Google Analytics ID (GA4)
        </label>
        <input
          type="text"
          value={googleAnalyticsId}
          onChange={(e) => setGoogleAnalyticsId(e.target.value)}
          placeholder="G-ABCD12345"
          className="w-full border rounded px-3 py-2"
        />
        <p className="text-xs text-gray-500 mt-1">
          Formato: G-XXXXXXXXXX
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 px-4 py-3 rounded">
          ✅ Configurações salvas com sucesso!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Salvando...' : 'Salvar Configurações'}
      </button>
    </form>
  );
}
```

### 4. Testar Pixel (Botão no Admin)

```typescript
'use client';

export function TestPixelButton({ pixelId }: { pixelId: string }) {
  const handleTest = () => {
    if (typeof window === 'undefined') return;

    // Testar Facebook Pixel
    if (typeof (window as any).fbq === 'function') {
      (window as any).fbq('track', 'Lead', {
        content_name: 'Teste de Pixel - Admin',
        source: 'admin_test_button',
        test_event: true,
      });
      alert('✅ Evento de teste enviado! Verifique no Event Manager do Facebook.');
    } else {
      alert('❌ Facebook Pixel não está carregado. Verifique a configuração.');
    }
  };

  return (
    <button
      onClick={handleTest}
      className="bg-purple-600 text-white px-4 py-2 rounded"
    >
      🧪 Testar Pixel
    </button>
  );
}
```

---

## ✅ Checklist de Implementação

### Backend ✅

- [x] Tabela `site_settings` no Supabase (já existia)
- [x] Tipos TypeScript (`src/types/tracking.ts`)
- [x] Validadores (`src/lib/tracking/validators.ts`)
- [x] Rota pública GET `/api/settings/tracking`
- [x] Rota admin GET `/api/admin/settings` (atualizada)
- [x] Rota admin POST `/api/admin/settings` (atualizada com validações)
- [x] Exemplos de uso (`src/lib/tracking/examples.ts`)

### Validações ✅

- [x] Facebook Pixel ID (apenas números, 10-20 dígitos)
- [x] Google Analytics ID (formato `G-XXXXXXXXXX`)
- [x] Google Tag Manager ID (formato `GTM-XXXXXXX`)
- [x] TikTok Pixel ID (alfanumérico, 10-20 caracteres)
- [x] Google Ads ID (formato `AW-XXXXXXXXXX`)
- [x] Hotjar ID (apenas números, 6-10 dígitos)
- [x] Clarity ID (alfanumérico, 10-15 caracteres)
- [x] Pinterest Tag ID (apenas números, 13-16 dígitos)
- [x] Weekly Post Goal (número inteiro, 1-100)

### Segurança ✅

- [x] Tokens secretos não expostos na rota pública
- [x] Autenticação admin obrigatória para POST
- [x] Validação de entrada em todos os campos
- [x] Log de ações admin
- [x] Normalização de strings vazias para `null`

---

## 🔐 Segurança

### Tokens Secretos

Os seguintes campos **NUNCA** são expostos na rota pública (`/api/settings/tracking`):

- `fb_capi_token` - Facebook Conversions API Token
- `tiktok_api_token` - TikTok API Token

Eles só são retornados na rota admin (`/api/admin/settings`) com autenticação.

### Rate Limiting

A rota pública usa cache de 5 minutos para reduzir carga no banco:

```typescript
headers: {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
}
```

---

## 🧪 Testando a API

### 1. Testar GET público

```bash
curl https://yoursite.com/api/settings/tracking
```

### 2. Testar GET admin

```bash
curl https://yoursite.com/api/admin/settings \
  -H "Cookie: your-auth-cookie"
```

### 3. Testar POST admin (sucesso)

```bash
curl -X POST https://yoursite.com/api/admin/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "meta_pixel_id": "1234567890123456",
    "ga4_id": "G-ABCD12345"
  }'
```

### 4. Testar POST admin (erro de validação)

```bash
curl -X POST https://yoursite.com/api/admin/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "meta_pixel_id": "abc123",
    "ga4_id": "UA-12345-1"
  }'
```

Resposta esperada:
```json
{
  "error": "Facebook Pixel ID deve conter apenas números (ex: 1234567890123456)"
}
```

---

## 📝 Próximos Passos (Frontend)

1. **Criar componente de injeção de pixels** (próximo prompt)
   - Carregar configurações via `getTrackingSettings()`
   - Injetar scripts dinamicamente no `<head>`
   - Suportar Facebook Pixel, GA4, GTM, etc.

2. **Criar página de admin** (próximo prompt)
   - Formulário de configuração
   - Botão "Testar Pixel"
   - Preview das configurações atuais

3. **Testes automatizados** (próximo prompt)
   - Testes unitários dos validadores
   - Testes de integração das APIs
   - Testes E2E do formulário admin

---

## 📚 Referências

- [Facebook Pixel Documentation](https://developers.facebook.com/docs/meta-pixel)
- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Google Tag Manager Documentation](https://developers.google.com/tag-platform/tag-manager)
- [TikTok Pixel Documentation](https://ads.tiktok.com/help/article/tiktok-pixel)

---

**Desenvolvido por:** By Império Dog  
**Data:** 28 de novembro de 2025  
**Stack:** Next.js 14 + TypeScript + Supabase
