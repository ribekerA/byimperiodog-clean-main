# OpenAI — configuração rápida

Para habilitar geração real de conteúdo e imagens via OpenAI:

1) Crie um arquivo `.env.local` na raiz com as variáveis:

```
OPENAI_API_KEY=sk_...
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://byimperiodog.com.br
```

2) Reinicie o servidor Next (dev ou build) para que as variáveis sejam lidas.

3) Teste endpoints com o script:

```powershell
.
\scripts\test-api-endpoints.ps1
```

4) Observações:
 - A rota `/api/admin/blog/ai/image` usa a API de imagens do OpenAI (endpoint v1/images/generations) quando `OPENAI_API_KEY` estiver presente; caso contrário, retorna uma URL fallback.
 - Se precisar que eu valide a integração, me forneça a chave temporariamente no seu ambiente ou rode o script acima e compartilhe o output.
