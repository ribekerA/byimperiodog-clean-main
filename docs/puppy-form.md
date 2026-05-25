# Arquitetura Puppy Form

## Objetivo
Unificar criação e edição de filhotes (puppies) reduzindo duplicação de lógica de validação, manipulação de mídia e UX de erros acessível.

## Componentes
- Hook `usePuppyForm`: estado + validação + submit + foco/scroll de erros.
- Componente `PuppyForm` (create) e `EditPuppyForm` inline em `puppies/page.tsx` (edit) consomem o hook.
- `MediaGallery`: upload + reorder + seleção de capa.
- DTO: `PuppyDTO` em `types/puppy.ts` com `normalizePuppy` conciliando aliases legacy (nome/name, midia/media, nascimento/birthdate etc.).

## Fluxo de Dados
1. (Edit) Record bruto vindo do backend -> `normalizePuppy` -> estado inicial do hook.
2. (Create) Estado inicial vazio com defaults.
3. Usuário edita campos -> `set(k,v)` atualiza estado.
4. Mídia: `setMedia` reordena garantindo capa em posição 0. `setCover` força item como capa.
5. Submit: `validate()` gera `errors`. Se ok, faz `adminFetch` POST/PUT para `/api/admin/puppies`.
6. Sucesso create: reseta estado; sucesso edit: mantém valores atualizados.

## Validação
Campos validados:
- `nome`, `color`: obrigatórios
- `price_display`: precisa converter para > 0 (centavos) via `parseBRLToCents`
- URLs (`image_url`, `video_url`): prefixo http(s)
- `nascimento`: formato YYYY-MM-DD
Erros acumulados em `errors` e summary controlado por `showSummary`.

## Acessibilidade
- Summary com `aria-live` (no consumo) e foco automático no primeiro campo inválido (`firstErrorRef`).
- `scrollIntoView` para bloco de resumo.

## Testes
Arquivo: `tests/unit/usePuppyForm.test.tsx`
Cenários:
- Inicialização modo create
- Validação de obrigatórios quando vazio
- Fluxo de sucesso após preencher mínimos
Mocks: `useToast`, `adminFetch`.

## Extensão Futura
- Adicionar validação de formato de vídeo (ex: YouTube embed) se necessário.
- Unificar formatação/parse de preço em util único.
- Adicionar teste de fluxo edit simulando record normalizado.

## Notas de Implementação
- Evitar duplicar lógica de cover: sempre mantemos `image_url` coerente com índice 0 de `midia` (garantido por `setMedia`/`setCover`).
- Hook não conhece UI; somente expõe refs e flags.
- `normalizePuppy` garante estabilidade mesmo que backend ainda retorne campos antigos.
