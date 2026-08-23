# Delta final de consistência interna

Data da auditoria: 2026-08-22

Escopo: configuração de domínio, código morto, dados estruturados, canonical,
`llms.txt`, manifest e contrato. Nenhuma URL pública, preço, dependência,
versão de Next.js/React ou elemento visual foi alterado por este delta.

## Arquivos alterados

- `src/domain/config.ts`, `src/domain/puppy.ts`, `src/domain/README.md`
- `src/lib/structured-data.ts`, `src/lib/tracking.ts`, `src/lib/seo.core.ts`
- `src/lib/schema.ts`, `src/lib/schemas/product.ts`, `src/lib/blog/seo.ts`
- `src/lib/ai/catalog-seo.ts`, `src/lib/catalog/normalize.ts`
- `app/llms.txt/route.ts`, `app/manifest.ts`
- `app/(public)/contract/[code]/documento/page.tsx`
- `src/lib/contractPdf.ts`, `app/api/contract/route.ts`
- `package.json`, `scripts/check-banned-words.mjs`
- comentários não executáveis em duas páginas de catálogo e exemplo em
  `src/components/SeoHead.tsx`
- `tests/seo.core.test.ts`, `tests/unit/consistency-delta.test.ts`

## Código morto removido

- `BUSINESS_RULES`, com prazos, sinal, frete, parceiros, garantias e documentos
  não confirmados.
- `BUSINESS_GOALS`, com metas comerciais antigas.
- `SEO_CONFIG` e `ConfigHelpers`, sem importadores.
- Regras de prontidão comercial por 8/10 semanas e todas as funções com
  semântica de “adoção”.
- `readyForAdoptionDate` e o cálculo fixo de 60 dias no normalizador.
- Helpers de domínio sem consumidores, inclusive o alerta baseado em preço
  médio antigo.
- Emissores duplicados e sem importadores: `src/lib/schema/index.ts`,
  `src/lib/schema/jsonld.ts`, `src/lib/schema/puppy.ts`, `src/lib/jsonld.ts`,
  `src/components/SeoOrg.tsx`, `src/components/SeoArticle.tsx` e
  `src/components/catalog/PuppyCardPremium.tsx`.
- Builders de Organization/Product/OfferCatalog sem consumidores em
  `src/lib/schema.ts`.

## Configuração da raça

- Removido `Spitz Alemão Toy` como variação.
- Altura oficial: `21 cm ± 3 cm`.
- Peso oficial: `proporcional ao tamanho`.
- A faixa prática de peso deixou de existir na configuração e no `llms.txt`.
- A faixa prática ainda aparece em conteúdo editorial já corrigido, sempre
  identificada como referência prática e separada do padrão FCI; não foi
  reescrita neste delta.

## Schema antes e depois

| Tema | Antes | Depois |
| --- | --- | --- |
| Entidade | `/#organization` e `/#business` com fatos diferentes | uma entidade em `https://byimperiodog.com.br/#business` |
| Tipos | Organization e LocalBusiness concorrentes | mesmo `@id`, tipado como Organization/LocalBusiness |
| Área | país, dezenas de estados/cidades por interesse de busca e GeoCircle | somente `{ "@type": "Country", "name": "Brasil" }` |
| Endereço | cidade usada como rua, CEP genérico e coordenadas do centro | somente Bragança Paulista, SP, BR |
| alternateName | continha keyword de criador | apenas `Canil By Império Dog` e `Império Dog` |
| knowsAbout | lista de cores e keywords | Spitz Alemão Anão, Lulu da Pomerânia, Pomeranian e socialização de filhotes |
| sameAs | URLs divergentes/não confirmadas | somente Instagram confirmado |
| makesOffer | laudos, protocolo, mentoria e envio nacional | vacinado, vermifugado, consulta veterinária, hemograma, pedigree e base em Bragança Paulista |
| disponibilidade | reservado gerava `PreOrder` | `Offer` existe somente para status disponível; reservado/vendido omitem `Offer` |

Endereço final:

```json
{
  "@type": "PostalAddress",
  "addressLocality": "Bragança Paulista",
  "addressRegion": "SP",
  "addressCountry": "BR"
}
```

`sameAs` final:

```json
["https://www.instagram.com/byimperiodog"]
```

Instagram é o único perfil identificado pelo canal público vigente. Facebook,
YouTube, TikTok e Pinterest foram omitidos do schema até a responsável confirmar
as URLs oficiais exatas. Em especial, nenhum dos dois handles conflitantes do
TikTok foi escolhido por inferência.

## Canonical, llms.txt e manifest

- `SITE_ORIGIN` agora é invariável: `https://byimperiodog.com.br`.
- Override de banco pode alterar o caminho do canonical, mas não o domínio.
- Os builders globais de Organization, WebSite e navegação também ignoram uma
  origem alternativa recebida por parâmetro.
- O comando de validação de produção usa o domínio vigente; o atalho de staging
  antigo foi removido porque não existe substituto confirmado.
- Referências ao domínio antigo que restaram estão somente em documentação
  Markdown histórica; não há ocorrência executável.
- `llms.txt` declara consulta veterinária, hemograma completo, vacinação,
  vermifugação, pedigree, altura `21 cm ± 3 cm` e peso proporcional ao tamanho.
- O manifest recebeu descrição factual, preservando PWA, ícones e cores.

## Teste de vazamento: classificação dos resíduos

- Não restou ocorrência executável de `Spitz Alemão Toy`, altura antiga,
  idade fixa comercial, frete grátis, garantia de 90 dias, suporte vitalício em
  configuração, metas antigas, GeoCircle, CEP fictício, TikTok divergente,
  `PreOrder` ou domínio antigo.
- `90 dias` remanescente é janela de analytics/GCLID ou alerta de tempo em
  estoque; não é garantia de saúde.
- `72 horas` remanescente está no contrato bloqueado e em orientação editorial
  de adaptação inicial; os dois usos têm semânticas diferentes.
- `1,5–3,5 kg` remanescente está somente em páginas editoriais que o identificam
  como referência prática, não como padrão FCI.
- `R$ 3.500` remanescente está em exemplos técnicos antigos de formatação de
  centavos; nenhum cálculo, catálogo, IA ou meta usa esse valor após a limpeza.
- `Atestado de saúde` remanescente é nome de campo técnico/documento enviado no
  fluxo contratual, não promessa comercial nova.
- `laudos veterinários` ainda aparece em copy pública previamente revisada e em
  metadados editoriais. Por instrução expressa de não reescrever essas páginas
  neste delta, as ocorrências não foram substituídas cegamente. O schema e o
  `llms.txt` usam apenas os fatos confirmados.
- As menções ao domínio antigo que restaram em arquivos `.md` são documentação
  histórica, sem importação ou execução.

## BLOCKER CONTRATUAL

Existem duas fontes ativas do mesmo modelo contratual:

1. `app/(public)/contract/[code]/documento/page.tsx`, documento HTML/impressão.
2. `src/lib/contractPdf.ts`, PDF enviado pelo fluxo ZapSign em
   `app/api/admin/contracts/[id]/zapsign/route.ts`.

Ambas precisam ser aprovadas e atualizadas juntas. Divergências que exigem
decisão da responsável e revisão jurídica:

- identificação da raça ainda como “Spitz Alemão (Lulu da Pomerânia)”, sem a
  identificação precisa “Spitz Alemão Anão”;
- obrigação de V8 importada;
- calendário fixo de Antirrábica, Giárdia e Bronchi-Shield;
- vermifugação a cada seis meses;
- proibição de exposição por no mínimo 21 dias após a última dose;
- avaliação clínica em 72 horas;
- reembolso integral ou substituição do animal;
- recusa de reclamações de saúde depois das 72 horas;
- vídeo e fotos da entrega como obrigação universal;
- suporte de WhatsApp por toda a vida do animal;
- exoneração ampla de responsabilidade nas cláusulas 4/5;
- foro exclusivo de Bragança Paulista sem ressalva expressa aos direitos legais.

O conflito central permanece deliberadamente sem solução automática:

- a configuração antiga dizia garantia de saúde de 90 dias e foi removida;
- o contrato atual limita a avaliação/reclamação a 72 horas;
- a regra comercial informada prevê garantia contratual vitalícia para condições
  hereditárias, mas os termos jurídicos ainda não estão no contrato aprovado.

Até a aprovação, o site/schema não deve prometer garantia hereditária vitalícia.
Nenhuma cláusula foi reescrita neste delta. A única alteração factual no fluxo
contratual foi trocar o Gmail antigo pelo canal empresarial centralizado
`contato@byimperiodog.com.br` no HTML, PDF e fallback de notificação da API.

## Validação

- Typecheck: aprovado (`npm run typecheck`).
- Lint direcionado aos arquivos deste delta: aprovado, zero erros; permanecem
  avisos preexistentes.
- Lint global: bloqueado pelo débito existente da migração (491 erros e 594
  avisos em arquivos fora deste delta).
- Palavras banidas: aprovado (`npm run check:banned-words`).
- Testes direcionados: 14/14 aprovados.
- Suíte completa: aprovada, com 43 arquivos de teste aprovados e 1 ignorado;
  284 testes aprovados e 3 ignorados (`npm test`).
- Build de produção: aprovado (`npm run build`). O Next.js compilou, validou
  TypeScript e gerou as 133 páginas. Durante a geração local, a leitura remota
  de `site_settings` falhou por indisponibilidade de rede, mas o fallback foi
  aplicado e o processo terminou com código 0.

Nenhum commit, push ou deploy foi executado.
