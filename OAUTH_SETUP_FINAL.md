# OAuth Google Analytics - Configuração Final

## ✅ Status Atual
- Credenciais OAuth configuradas
- Código corrigido
- TEST_USER_ID adicionado

## 🔧 Passos Finais (FAZER AGORA):

### 1. Atualizar Schema do Banco de Dados

Acesse o Supabase SQL Editor:
https://supabase.com/dashboard/project/npmnuihgydadihktglrd/sql

Cole e execute este SQL:

```sql
-- Adicionar constraints UNIQUE para permitir upsert
ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_user_provider_key;
ALTER TABLE public.integrations ADD CONSTRAINT integrations_user_provider_key UNIQUE (user_id, provider);

ALTER TABLE public.tracking_settings DROP CONSTRAINT IF EXISTS tracking_settings_user_key;
ALTER TABLE public.tracking_settings ADD CONSTRAINT tracking_settings_user_key UNIQUE (user_id);
```

### 2. Adicionar Test User no Google Cloud

Acesse: https://console.cloud.google.com/apis/credentials/consent?project=byimperiodog

1. Role até a seção **"Test users"**
2. Clique em **"+ ADD USERS"**
3. Digite: `byimperiodog@gmail.com`
4. Clique em **"SAVE"**

### 3. Adicionar Escopo Admin API

Na mesma tela (OAuth consent screen):

1. Clique em **"EDIT APP"**
2. Vá em **"Scopes"** (Escopos)
3. Clique em **"ADD OR REMOVE SCOPES"**
4. Adicione:
   - `https://www.googleapis.com/auth/analytics.readonly`
   - `https://www.googleapis.com/auth/analytics.edit`
   - `https://www.googleapis.com/auth/tagmanager.readonly`
   - `https://www.googleapis.com/auth/analytics.manage.users.readonly` ← **ADICIONAR ESTE**
5. Clique em **"UPDATE"** e **"SAVE AND CONTINUE"**

### 4. Reiniciar Servidor

```powershell
# Parar processos Node
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# Aguardar
Start-Sleep -Seconds 2

# Iniciar servidor
npm run dev
```

### 5. Testar Conexão

1. Acesse: http://localhost:3000/admin/tracking
2. Login: `@@Chowchow02`
3. Clique em **"Conectar via OAuth"** no card Google Analytics
4. Autorize o acesso
5. Deve redirecionar e mostrar "Conectado ✓"

## 🐛 Troubleshooting

### Se ainda aparecer "Não conectado":

Verifique os logs no terminal:
- `[oauth-callback] missing userId` → Reinicie o servidor
- `Failed to fetch GA properties: 403` → Adicione test user no Google
- `upsert error` → Execute o SQL no Supabase
- `403 access_denied` → Verifique se adicionou todos os escopos

### Verificar se salvou no banco:

```sql
-- No Supabase SQL Editor
SELECT * FROM public.integrations WHERE provider = 'google_analytics';
SELECT * FROM public.tracking_settings;
```

Se tiver registros, o OAuth funcionou!

## 📝 Resumo do que foi feito:

✅ Credenciais OAuth criadas no Google Cloud  
✅ Client ID e Secret configurados no `.env.local`  
✅ TEST_USER_ID adicionado  
✅ Código de auto-fetch implementado  
✅ SQL schema atualizado (constraints)  
⚠️ Falta: Executar SQL no Supabase  
⚠️ Falta: Adicionar test user no Google Console  

Após completar os passos 1 e 2, tudo vai funcionar! 🚀
