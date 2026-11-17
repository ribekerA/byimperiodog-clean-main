# Web Stories AMP - By Imperio Dog

## 📖 Visão Geral

Sistema completo de criação e gerenciamento de **Web Stories AMP** para aparecer no Google Discover e Pesquisa. Web Stories são um formato visual e imersivo que combina imagens, vídeos, animações e texto em uma experiência mobile-first.

## 🎯 Benefícios

- ✅ **Visibilidade no Google Discover**: Stories aparecem como cards visuais no feed personalizado
- ✅ **Rich Snippets na Pesquisa**: Resultados visuais com thumbnails na Pesquisa Google
- ✅ **Experiência Mobile-First**: Formato otimizado para toque e deslize
- ✅ **AMP Válido**: Páginas ultra-rápidas e otimizadas
- ✅ **SEO-Friendly**: Indexação completa pelo Google com metadata estruturado

## 🚀 Como Usar

### 1. Acesse o Painel Admin
Vá para `/admin` e clique no card **"Web Stories AMP"** na dashboard.

### 2. Crie uma Nova Web Story
1. Clique em **"+ Nova Web Story"**
2. Preencha os metadados obrigatórios:
   - **Título**: Máximo 70 caracteres (ex: "Filhote Spitz Alemão Branco")
   - **Slug**: URL da story (ex: `filhote-spitz-alemao-branco`)
   - **Publisher**: Nome do site (ex: "By Imperio Dog")
   - **Imagem de Capa**: Mínimo 640x853px (proporção 3:4)
   - **Logotipo**: Mínimo 96x96px (proporção 1:1)
   - **Status**: Rascunho ou Publicada

3. Adicione páginas à story:
   - **Tipo**: Imagem ou Vídeo
   - **URL da Mídia**: Link completo (https://...)
   - **Texto**: Opcional, máximo ~280 caracteres
   - **Duração**: Para imagens, tempo em segundos

4. Clique em **"Criar Web Story"**

### 3. Gerencie Web Stories
- **Ver**: Abre a story AMP em nova aba
- **Editar**: Modifica título, páginas ou status
- **Excluir**: Remove permanentemente a story

## 📂 Estrutura de Arquivos

```
app/
├── (admin)/
│   └── admin/
│       └── (protected)/
│           ├── dashboard/
│           │   └── page.tsx          # Card Web Stories adicionado
│           └── web-stories/
│               ├── page.tsx           # Lista de Web Stories
│               └── new/
│                   └── page.tsx       # Formulário de criação
├── api/
│   └── admin/
│       └── web-stories/
│           ├── route.ts               # GET (listar) e POST (criar)
│           └── [id]/
│               └── route.ts           # DELETE (excluir)
├── web-stories/
│   └── [slug]/
│       └── page.tsx                   # Página AMP pública
└── sitemap.ts                         # Atualizado com Web Stories

sql/
└── migrations/
    └── create_web_stories_table.sql   # Tabela Supabase
```

## 🗄️ Banco de Dados

### Tabela: `web_stories`

| Campo        | Tipo       | Descrição                                  |
|--------------|------------|--------------------------------------------|
| `id`         | UUID       | Identificador único                        |
| `title`      | TEXT       | Título da story (máx. 70 caracteres)      |
| `slug`       | TEXT       | URL amigável (único)                       |
| `publisher`  | TEXT       | Nome do editor/site                        |
| `poster_url` | TEXT       | URL da imagem de capa (640x853px)         |
| `logo_url`   | TEXT       | URL do logotipo (96x96px)                  |
| `status`     | TEXT       | `draft` ou `published`                     |
| `pages`      | JSONB      | Array de páginas da story                  |
| `created_at` | TIMESTAMPTZ| Data de criação                            |
| `updated_at` | TIMESTAMPTZ| Data da última atualização                 |

### Executar Migration

```bash
# No painel do Supabase, vá em SQL Editor e execute:
sql/migrations/create_web_stories_table.sql
```

## 📱 Formato das Páginas (JSONB)

```json
[
  {
    "id": "page-1",
    "type": "image",
    "media_url": "https://exemplo.com/imagem.jpg",
    "text": "Texto opcional para exibir sobre a imagem",
    "duration": 5
  },
  {
    "id": "page-2",
    "type": "video",
    "media_url": "https://exemplo.com/video.mp4",
    "text": "Vídeo do filhote brincando"
  }
]
```

## 🎨 Boas Práticas

### Design
- ✅ Use imagens de alta qualidade (sem pixelização)
- ✅ Evite texto gravado na imagem (use o campo `text`)
- ✅ Mantenha texto curto (~280 caracteres por página)
- ✅ Prefira vídeos de até 60 segundos
- ✅ Use animações com moderação

### SEO
- ✅ Títulos descritivos com menos de 70 caracteres
- ✅ Slug amigável e único
- ✅ Imagem de capa sem texto gravado
- ✅ Conteúdo completo e útil
- ✅ Não crie stories apenas comerciais

### Técnico
- ✅ Imagem de capa: mínimo 640x853px (proporção 3:4)
- ✅ Logotipo: mínimo 96x96px (proporção 1:1)
- ✅ URLs válidas e acessíveis
- ✅ Teste no [Google Web Stories Validator](https://search.google.com/test/web-stories)

## 🔍 Validação AMP

Após criar uma Web Story, valide se ela é AMP válida:

1. Acesse a story em `/web-stories/[seu-slug]`
2. Teste na [Ferramenta de Teste de Web Stories do Google](https://search.google.com/test/web-stories)
3. Corrija eventuais erros

## 🌐 URLs Públicas

As Web Stories são acessíveis publicamente em:
```
https://seusite.com/web-stories/[slug]
```

Exemplo:
```
https://byimperiodogkennel.com/web-stories/filhote-spitz-alemao-branco
```

## 📊 Indexação

As Web Stories são automaticamente:
- ✅ Adicionadas ao `sitemap.xml`
- ✅ Configuradas com metadados OpenGraph
- ✅ Marcadas com `rel="canonical"`
- ✅ Prontas para indexação pelo Google

## 🛠️ Tecnologias

- **Next.js 14** (App Router)
- **AMP Story** (Framework Google)
- **Supabase** (Banco de dados)
- **TypeScript**
- **Framer Motion** (Animações)

## 📚 Recursos Adicionais

- [Documentação Oficial AMP Stories](https://amp.dev/documentation/components/amp-story/)
- [Guia Google Web Stories](https://developers.google.com/search/docs/appearance/web-stories)
- [Ferramenta de Teste de Web Stories](https://search.google.com/test/web-stories)
- [Práticas Recomendadas Google](https://developers.google.com/search/docs/appearance/web-stories-best-practices)

## 🎯 Próximos Passos

1. ✅ Execute a migration SQL no Supabase
2. ✅ Crie sua primeira Web Story no painel admin
3. ✅ Valide a story com a ferramenta do Google
4. ✅ Publique e monitore a indexação no Google Search Console

---

**Desenvolvido para By Imperio Dog Kennel** 🐕
