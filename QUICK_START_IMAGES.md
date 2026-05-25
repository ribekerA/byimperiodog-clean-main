# 🚀 Guia de Início Rápido - Pipeline de Imagens

## ⚡ Instalação (5 minutos)

### 1. Instalar Dependências

```powershell
npm install sharp uuid @types/uuid
```

**Nota**: `sharp` pode levar alguns minutos para instalar devido a binários nativos.

---

## 📁 2. Organizar Suas Imagens

### Estrutura de Pastas

Crie pastas dentro de `raw-images/` seguindo este padrão:

```
raw-images/
├── spitz-branco-macho/
│   ├── foto1.jpg
│   ├── foto2.png
│   └── ...
├── spitz-laranja-femea/
│   └── foto.jpg
└── lulu-caramelo-macho/
    └── hero.jpg
```

**Padrão da pasta**: `{slug}-{cor}-{sexo}`
- `slug`: nome do filhote (ex: spitz, lulu, poodle)
- `cor`: branco, laranja, caramelo, preto, etc.
- `sexo`: macho ou femea

### Exemplo Prático

```powershell
# Criar pasta para filhote
mkdir raw-images\spitz-branco-macho

# Copiar foto
copy C:\Downloads\foto-filhote.jpg raw-images\spitz-branco-macho\
```

---

## ▶️ 3. Processar Imagens

### Comando Principal

```powershell
npm run images:process
```

### O que acontece:
1. ✅ Analisa qualidade (blur, exposição, resolução)
2. ✅ Redimensiona para 3 tamanhos (1200px, 600px, 300px)
3. ✅ Ajusta brilho, saturação e contraste
4. ✅ Aplica sharpening
5. ✅ Gera WebP + JPEG para cada tamanho
6. ✅ Salva em `public/puppies/{slug}/`

### Saída Esperada

```
📸 Processando: spitz-branco-macho
  ✅ hero-uuid.webp (78 KB)
  ✅ hero-uuid.jpg (145 KB)
  ✅ card-uuid.webp (32 KB)
  ✅ card-uuid.jpg (68 KB)
  ✅ thumbnail-uuid.webp (14 KB)
  ✅ thumbnail-uuid.jpg (28 KB)

✅ Sucesso: 6 imagens | ❌ Erros: 0
```

---

## 🖼️ 4. Usar nas Páginas

### Exemplo com next/image

```tsx
import { getNextImageProps } from '@/lib/images';
import Image from 'next/image';

export default function PuppyPage() {
  // Buscar props automáticas (width, height, src, srcSet)
  const imageProps = getNextImageProps('spitz-branco', 'hero', {
    priority: true, // LCP otimizado
  });

  return <Image {...imageProps} alt="Filhote Spitz Branco" />;
}
```

### Exemplo com <picture> (WebP + fallback)

```tsx
import { getPictureProps } from '@/lib/images';

export default function PuppyCard() {
  const pictureProps = getPictureProps(
    'spitz-branco',
    'Filhote Spitz Branco',
    'card'
  );

  return <picture {...pictureProps} />;
}
```

---

## 🔍 5. Validar Qualidade

### Apenas Analisar (sem processar)

```powershell
npm run images:analyze
```

Detecta:
- ❌ Baixa resolução (< 500px)
- ❌ Blur (Laplacian variance < 100)
- ❌ Subexposição (brightness < 30)
- ❌ Superexposição (brightness > 225)
- ⚠️ Arquivo grande (> 500 KB)

---

## 🧹 6. Limpar Imagens Processadas

```powershell
npm run images:clean
```

Remove tudo de `public/puppies/` para reprocessar.

---

## ☁️ 7. Upload para Supabase (Opcional)

### Configurar Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### Criar Bucket

1. Acessar [Supabase Dashboard](https://app.supabase.com)
2. Storage → Create Bucket
3. Nome: `puppy-images`
4. ✅ Public bucket

### Usar no Código

```tsx
import { getPuppyImages } from '@/lib/images';

const images = getPuppyImages('spitz-branco', {
  useSupabase: true, // URLs do CDN
});

console.log(images.hero.webp); 
// https://xxx.supabase.co/storage/v1/object/public/puppy-images/...
```

---

## 🎯 Checklist de Sucesso

- [ ] Dependências instaladas (`npm install sharp uuid`)
- [ ] Pastas criadas (`raw-images/`, `public/puppies/`)
- [ ] Imagens organizadas (`raw-images/{slug}-{cor}-{sexo}/`)
- [ ] Pipeline executado (`npm run images:process`)
- [ ] 6 arquivos gerados por imagem (3 sizes × 2 formats)
- [ ] Componentes usando `getNextImageProps()`
- [ ] Width/height fixos (CLS = 0)
- [ ] LCP melhorado (< 2.5s)

---

## 📊 Resultados Esperados

### Antes
- 🐢 Imagem 1200×1200: 450 KB (JPEG)
- 📉 LCP: 4.2s
- 📉 CLS: 0.35

### Depois
- 🚀 Hero WebP: 78 KB (-83%)
- 🚀 Card WebP: 32 KB (-93%)
- ✅ LCP: 1.8s (-57%)
- ✅ CLS: 0.02 (-94%)

---

## 🆘 Problemas Comuns

### sharp não instala

```powershell
npm install --force sharp
# ou
npm install --platform=win32 sharp
```

### "Nenhuma imagem encontrada"

Verifique estrutura da pasta:
```
raw-images/
└── nome-cor-sexo/   ← Padrão correto
    └── foto.jpg
```

### Erro de permissão

Execute como Administrador ou verifique permissões da pasta.

---

## 📖 Documentação Completa

Ver: `scripts/image-pipeline/README.md` (500 linhas)

## 🔗 Próximos Passos

1. **Integrar com PuppyCardPremium**
2. **Adicionar upload no admin**
3. **Configurar Supabase Storage**
4. **Testar Core Web Vitals no Lighthouse**
