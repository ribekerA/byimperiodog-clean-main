# By Império Dog — Monorepo Web (Skeleton)

Projeto base para migrar do WordPress para **Next.js** com **painel admin**, **contrato online**, **captura de leads** e base para **IA/SEO**.

## Stack
- Next.js 14 (App Router) + TypeScript
- TailwindCSS
- Supabase (a conectar)
- Zod + React Hook Form

## Como rodar
```bash
npm i
cp .env.example .env.local
# preencha as variáveis
npm run dev
```

## Diretórios
- `app/` rotas e páginas (App Router)
- `src/components/` componentes de UI
- `src/lib/` libs (ex.: supabase client)
- `app/api/` rotas de API (leads/contract)

## Próximos passos
- Conectar Supabase (tabelas: leads, customers, puppies, contracts)
- Implementar upload em Storage
- Conectar WhatsApp / e-mail via webhook
- Autenticação real no /admin (Supabase Auth)
- CMS headless (Sanity) para blog
- Pixels: Meta + Google Tag via Head

## Notas rápidas

Dev helper (Windows PowerShell) para iniciar sem predev:

```powershell
node scripts/gen-client-photos.mjs; $env:CI='true'; npx cross-env NEXT_DISABLE_VERSION_CHECK=1 NEXT_TELEMETRY_DISABLED=1 next dev -p 3000
```

Smoke test para endpoint SEO (após rodar dev):

```powershell
node scripts/test-seo-endpoint.js
```

TypeScript check:

```powershell
npx tsc --noEmit
```

> Este esqueleto é para começar rápido. Vamos iterar e sofisticar conforme o roadmap.
