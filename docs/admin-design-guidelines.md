# Diretrizes de Design — Painel Admin (By Império Dog)

Guia de referência rápida para manter consistência visual, UX e acessibilidade AA/AAA no admin.

## 1) Hierarquia visual padrão
- H1: 28–32px, bold; apenas um por página.
- H2: 20–22px, semibold; títulos de seção.
- H3: 16–18px, semibold; subtítulos ou blocos internos.
- Body: 14–16px, regular; usar 14px em tabelas e meta info, 16px em textos principais.
- Espaçamentos: base 8px; padrões: 8/12/16/24/32.

## 2) Paleta de cores (semantic tokens)
- Texto: `--text` (primário), `--text-muted` (secundário).
- Fundo: `--surface` (cards claros), `--surface-2` (fundos de seções), `--border` (bordas sutis).
- Ação principal: verde (ex.: `#059669` / `#10b981` para hover).
- Ação de alerta/erro: vermelho (ex.: `#dc2626` / `#f87171`).
- Aviso/pendência: âmbar (ex.: `#d97706` / `#fbbf24`).
- Informativo: azul (ex.: `#2563eb` / `#60a5fa`).
- Sucesso: mesma família do verde; Erro: vermelho; Info: azul.
- Background Admin: cinza-claro neutro (`#f7f8fa`).

## 3) Tipografia
- Família: fonte padrão do projeto (inter/dm sans) — manter consistente.
- Títulos: bold/semibold conforme hierarquia; espaçamento inferior 8–12px.
- Body: regular; linhas ~1.5 de altura.
- Metainformação: 12–13px, `--text-muted`.

## 4) Layout padronizado
- Grid base: 2 colunas em desktop (`sidebar` + `conteúdo`), mobile com menu colapsável.
- Spacing global: padding lateral 16–24px no conteúdo.
- Cards: borda 1px `--border`, raio 12–16px, sombra leve (elevation-1/2).
- Head/footers: bordas separadoras com `--border`.
- Breadcrumb visível no topo, seguido de título e subtítulo.

## 5) Componentes base UI
- Botão primário: fundo verde, texto branco, raio full, foco visível.
- Botão secundário: borda `--border`, fundo branco, texto `--text`.
- Ghost/terciário: texto apenas, sem borda, com foco/hover claros.
- Tags/Badges: pill com cor semântica e texto 11–12px.
- Cards métricos: título pequeno + valor grande; descrição opcional.
- Dialog/Modal: título claro, body com espaçamento interno, botão primário + secundário.

## 6) Padrões de tabelas
- Cabeçalho: 11–12px uppercase, `--text-muted`.
- Linhas: 14px; hover com `--surface-2`.
- Bordas horizontais suaves (`--border`), raio externo 12–16px.
- Acessibilidade: `role="table"`, `aria-label` e `aria-sort` nos th; foco visível em ações.
- Ações rápidas alinhadas à direita; links de detalhes sublinham no hover.

## 7) Padrões de formulários
- Labels sempre visíveis, acima do campo.
- Campos: altura 40–44px, borda `--border`, raio 10–12px, foco com outline + ring verde.
- Placeholders só como apoio (não substituem label).
- Mensagens de erro abaixo do campo em vermelho; sucesso/info em verde/azul.
- Agrupamento lógico: grid 2 colunas em desktop, 1 coluna em mobile.

## 8) Padrões de feedback (sucesso/erro)
- Toasts: canto inferior direito, cores semânticas (verde/azul/vermelho), `aria-live="polite"`.
- Inline: caixas com borda e fundo semântico (verde, azul, vermelho), ícone e texto curto.
- Mensagens claras, sem jargão técnico.

## 9) Padrões de loading/skeleton
- Skeletons em cards/tabelas: barras cinza-claro (`--surface`) com animação suave.
- Spinners apenas em botões de ação e loads breves; preferir skeleton para listas.
- Em ações otimistas, desabilitar controles e mostrar estado “salvando…” visível.

## 10) Navegação e breadcrumbs
- Sidebar fixa/colapsável; item ativo com cor primária e leve realce.
- Breadcrumb no topo: links de níveis anteriores + página atual sem link, separado por ícone.
- Ações principais (CTA) ao lado do título sempre que possível.

## 11) Acessibilidade (AA/AAA)
- Contraste mínimo AA para texto/botões; não remover outline sem substituir.
- Tabela com cabeçalhos `scope="col"`, `aria-sort` quando aplicável, `caption` sr-only.
- Formulários: `aria-invalid`, `aria-describedby` para mensagens de erro.
- Roles adequados em modais/dialogs e `aria-live` em toasts/feedback.
- Navegação por teclado garantida em links/botões/inputs; ordem lógica de foco.
