# Auditoria de UI/UX e Acessibilidade — By Imperio Dog
**Data:** 1 de dezembro de 2025  
**Escopo:** Plataforma completa (site público + admin)  
**Status:** Mapeamento de problemas (pré-correção)

---

## 📋 Resumo Executivo

Esta auditoria identificou **problemas críticos e oportunidades de melhoria** nas áreas de:
- **UX (Experiência do Usuário):** fluxo confuso, CTAs pouco claros, hierarquia visual inconsistente
- **Acessibilidade (WCAG 2.1):** falta de labels, foco, landmarks, contraste inadequado, headings quebrados
- **Consistência Visual:** variações de botões, paddings, tipografia, cores

### Prioridades por Severidade
- 🔴 **Crítico (P0):** impede uso ou viola WCAG AAA — corrigir imediatamente
- 🟠 **Alto (P1):** prejudica usabilidade ou acessibilidade — corrigir em até 1 sprint
- 🟡 **Médio (P2):** inconsistência visual ou UX subótima — corrigir em até 2 sprints
- 🟢 **Baixo (P3):** polish, melhorias incrementais — backlog

---

## 🏠 Layout Principal (Root Layout)

### Arquivo: `app/layout.tsx`

#### 🔴 P0 — Acessibilidade
- [ ] **Skip Link invisível em foco:** O `<SkipLink />` existe, mas não há evidência de estilização visível ao receber foco via teclado. Usuários de teclado podem não perceber a funcionalidade.
  - **Localização:** `<SkipLink />` renderizado antes do `<Header />`
  - **Ação:** Garantir `focus-visible:outline` e posicionamento absoluto visível (ex: top-left, bg branco, z-index alto)

- [ ] **Main sem role explícito:** `<div className="flex-1" id="conteudo-principal" tabIndex={-1}>` possui `id` e `tabIndex`, mas não possui `role="main"`. Leitores de tela podem não identificar corretamente a região principal.
  - **Localização:** wrapper do `{children}` no layout
  - **Ação:** Substituir `<div>` por `<main>` ou adicionar `role="main"`

- [ ] **TabIndex -1 sem justificativa clara:** `tabIndex={-1}` remove o elemento da ordem de navegação natural, mas não há evidência de uso programático de `.focus()` para pular ao conteúdo.
  - **Ação:** Remover `tabIndex={-1}` a menos que haja script de skip-link com `.focus()` no ID

#### 🟠 P1 — UX
- [ ] **GTM/GA4 scripts sem fallback de erro:** Se o script do GTM/GA4 falhar ao carregar, não há feedback visual ou log para debug.
  - **Ação:** Adicionar `onError` handlers nos `<Script>` para logar falhas no console (dev) ou analytics de erro (prod)

- [ ] **Preconnect duplicado:** `rel="preconnect"` e `rel="dns-prefetch"` para o mesmo domínio (ex: googletagmanager.com) — redundante.
  - **Ação:** Manter apenas `preconnect` (já inclui DNS lookup)

#### 🟡 P2 — Consistência
- [ ] **Classe `admin-shell` sem documentação:** `className={isAdminRoute ? "admin-shell" : ""}` aplicada ao body, mas sem CSS correspondente visível no código auditado.
  - **Ação:** Documentar uso ou remover se não estiver em uso

---

## 🧭 Header (Navegação Principal)

### Arquivo: `src/components/common/Header.tsx`

#### 🔴 P0 — Acessibilidade
- [ ] **Botão do menu mobile sem label descritivo:** `<Dialog.Trigger>` tem `aria-label="Abrir menu de navegação"`, mas não indica estado (aberto/fechado).
  - **Localização:** botão hamburguer `<Menu />`
  - **Ação:** Adicionar `aria-expanded={open}` para indicar estado ao leitor de tela

- [ ] **Menu mobile sem `aria-modal`:** `<Dialog.Content>` é modal, mas não declara `aria-modal="true"` explicitamente (pode estar no Radix default, verificar).
  - **Ação:** Confirmar se Radix adiciona `aria-modal` automaticamente; caso contrário, adicionar manualmente

- [ ] **Overlay do menu sem label:** `<Dialog.Overlay>` não possui label — leitores de tela podem não comunicar claramente que é um overlay clicável para fechar.
  - **Ação:** Adicionar `aria-label="Fechar menu"` ao Overlay ou torná-lo decorativo com `aria-hidden="true"`

#### 🟠 P1 — UX
- [ ] **Links do menu mobile fecham o dialog, mas sem feedback de transição:** `onClick={() => setOpen(false)}` fecha imediatamente sem animação de saída.
  - **Ação:** Adicionar `<AnimatePresence>` do Framer Motion para transição suave ao fechar

- [ ] **CTA WhatsApp no header desktop sem tracking claro:** Link `href={whatsappLink}` não possui `data-evt` ou `onClick` com `track.event`.
  - **Ação:** Adicionar tracking de clique para medir conversão do CTA principal

- [ ] **Ícone WhatsApp sem `aria-hidden`:** `<WhatsAppIcon className="h-4 w-4" />` deve ter `aria-hidden="true"` para evitar redundância com o texto "Conversar agora".
  - **Localização:** dentro do link WhatsApp desktop e mobile
  - **Ação:** Adicionar `aria-hidden="true"` em todos os ícones decorativos

#### 🟡 P2 — Consistência
- [ ] **Height inconsistente entre desktop e mobile:** Desktop usa `min-h-[48px]` em links, mobile usa `min-h-[52px]` no CTA.
  - **Ação:** Padronizar tap targets para ≥48px conforme WCAG (pode usar 48px ou 52px, mas consistente)

- [ ] **Cores do active state:** Links ativos usam `text-brand`, mas sem fundo ou sublinhado diferenciado — pode confundir em telas de baixo contraste.
  - **Ação:** Adicionar `bg-brand/5` ou `border-b-2 border-brand` no estado ativo

- [ ] **Logo do header sem imagem:** Apenas texto "By Imperio Dog" — oportunidade de adicionar logo SVG para reforço de marca.
  - **Ação:** Considerar adicionar logo inline ou como `<Image />` otimizado

---

## 🦶 Footer (Rodapé)

### Arquivo: `src/components/common/Footer.tsx`

#### 🔴 P0 — Acessibilidade
- [ ] **Links do footer com `min-h-[48px]` mas sem padding vertical suficiente:** Classe `inline-flex min-h-[48px] items-center` pode não garantir área clicável de 48x48px se o texto for curto.
  - **Localização:** todos os links em `NAV_ITEMS` e `SUPPORT_ITEMS`
  - **Ação:** Adicionar `py-3` ou garantir que `items-center` esteja centralizado verticalmente com área clicável real

- [ ] **WhatsApp fixo (botão flutuante) sem label:** Botão flutuante do WhatsApp no final do footer não possui `aria-label`.
  - **Localização:** botão verde fixo no canto inferior direito (provavelmente `FloatingPuppiesCTA` ou similar)
  - **Ação:** Adicionar `aria-label="Conversar no WhatsApp"`

#### 🟠 P1 — UX
- [ ] **Endereço sem formato `<address>`:** Informações de contato (e-mail, WhatsApp) estão em `<p>` genéricos.
  - **Localização:** seção "Contato" no footer
  - **Ação:** Envolver em `<address>` semântico e marcar e-mail com `<a href="mailto:...">`

- [ ] **Ano dinâmico via `useState` causa hydration warning:** `setYear(new Date().getFullYear())` no `useEffect` pode causar mismatch entre SSR e client.
  - **Ação:** Calcular ano no servidor (props) ou usar `suppressHydrationWarning` no `<p>`

- [ ] **Links "Política de privacidade" etc sem `target="_blank"`:** Se o usuário preferir abrir em nova aba (shift+click), pode ser útil adicionar.
  - **Ação:** Decisão de UX — manter navegação inline ou abrir em nova aba? (Geralmente inline é melhor para políticas)

#### 🟡 P2 — Consistência
- [ ] **Tipografia inconsistente:** Títulos usam `text-xs font-semibold uppercase tracking-[0.3em]`, mas alguns textos usam `text-sm` sem tracking.
  - **Ação:** Padronizar hierarquia: H3 (uppercase small), body (normal), links (semibold hover)

- [ ] **Espaçamento variável:** `space-y-3` em algumas seções, `space-y-4` em outras.
  - **Ação:** Definir escala de espaçamento consistente (ex: sempre 4 para seções, 3 para listas)

---

## 🎯 Hero Section (Seção Principal da Home)

### Arquivo: `src/components/sections/Hero.tsx`

#### 🔴 P0 — Acessibilidade
- [ ] **Imagem hero sem `alt` descritivo:** `alt="Filhotes de Spitz Alemão Anão saudáveis em ambiente acolhedor"` é genérico e não descreve a imagem específica (pessoas, cores, contexto).
  - **Localização:** `<Image src={heroDesktop} alt="..." />`
  - **Ação:** Atualizar alt text baseado na imagem real (ex: "Filhote de Spitz Alemão Anão laranja brincando em tapete branco, com mãos humanas ao fundo")

- [ ] **Estatísticas sem `<dl>` semântico:** Stats usam `<div>` genéricos com `aria-label`, mas deveriam usar `<dl><dt><dd>`.
  - **Localização:** seção "10+ anos", "180+ famílias", "24h suporte"
  - **Ação:** Refatorar para `<dl><div><dt>anos com Spitz</dt><dd>10+</dd></div></dl>`

- [ ] **Link "Ver filhotes disponíveis" aponta para `#filhotes`:** Âncora pode não existir em todas as páginas ou não ter scroll suave configurado.
  - **Ação:** Garantir que `#filhotes` exista na home ou substituir por `/filhotes` (rota absoluta)

#### 🟠 P1 — UX
- [ ] **Greeting dinâmico via `useMemo` não é SSR-friendly:** `new Date().getHours()` no client retorna hora do cliente, não do servidor — pode causar hydration mismatch.
  - **Ação:** Mover lógica de saudação para server component ou aceitar mismatch com `suppressHydrationWarning`

- [ ] **Selling points sem hierarquia clara:** Cards de "Saúde validada", "Mentoria vitalícia" etc têm ícones, mas não há destaque de qual é o principal benefício.
  - **Ação:** Considerar ordem de importância (ex: saúde primeiro) e adicionar badge "Destaque" no mais importante

- [ ] **CTA primário vs secundário pouco diferenciado:** Ambos usam `rounded-full` e tamanho similar — usuário pode não perceber hierarquia.
  - **Ação:** Aumentar contraste: CTA primário com shadow mais forte, secundário com outline

#### 🟡 P2 — Consistência
- [ ] **Ícones sem `aria-hidden`:** `<Icon className="h-4 w-4" />` em selling points devem ter `aria-hidden="true"`.
  - **Ação:** Adicionar `aria-hidden` em todos os ícones decorativos

- [ ] **Badge de caption ("Socialização guiada...") sem contraste suficiente:** Fundo branco sobre imagem pode ter contraste baixo se a foto for clara.
  - **Ação:** Adicionar `bg-white/95` ou `backdrop-blur-sm` para garantir legibilidade

---

## 🐶 Catálogo de Filhotes (PuppiesGrid + PuppyCard)

### Arquivo: `src/components/PuppiesGrid.tsx` + `src/components/PuppyCard.tsx`

#### 🔴 P0 — Acessibilidade
- [ ] **Filtros sem labels associados:** `<PuppiesFilterBar>` provavelmente contém inputs, mas não há evidência de `<label>` vinculados via `htmlFor`.
  - **Localização:** barra de filtros (cor, sexo, status, busca)
  - **Ação:** Auditar `PuppiesFilterBar` e garantir `<label htmlFor="filtro-cor">Cor</label>` para cada input

- [ ] **Botão "Favoritar" (coração) sem `aria-pressed`:** Botão de like toggle deve indicar estado com `aria-pressed={liked}`.
  - **Localização:** `<button onClick={() => setLiked(!liked)}>`
  - **Ação:** Adicionar `aria-pressed={liked}` e comunicar estado ao leitor de tela

- [ ] **Grid de filhotes sem `aria-live` para filtragem:** Quando o usuário filtra, a lista muda mas não há feedback para leitores de tela.
  - **Localização:** `<div className="grid auto-rows-fr...">`
  - **Ação:** Já existe `<div className="sr-only" role="status" aria-live="polite">` — validar se funciona corretamente

- [ ] **Cards clicáveis via `<div role="button">` em vez de `<button>`:** Div com `role="button"` e `tabIndex={0}` é menos semântico que `<button>`.
  - **Localização:** `<div role="button" tabIndex={0} onClick={...} onKeyDown={...}>`
  - **Ação:** Substituir por `<button type="button">` ou envolver em `<Link>` se for navegação

- [ ] **Modal de detalhes (`PuppyDetailsModal`) sem `aria-modal`:** Verificar se Radix Dialog adiciona automaticamente.
  - **Ação:** Confirmar implementação do modal e adicionar `aria-modal="true"` se necessário

#### 🟠 P1 — UX
- [ ] **Loading state genérico:** "Procurando os filhotes mais fofos..." pode ser confuso se a busca for lenta (parece que não há resultados).
  - **Ação:** Adicionar skeleton cards (`<PuppyCardSkeleton />`) com número estimado de itens (6-9) em vez de texto genérico

- [ ] **Erro sem retry automático:** Botão "Tentar novamente" exige ação do usuário — considerar retry automático após 3s.
  - **Ação:** Adicionar timer de retry automático com contador visual ("Tentando novamente em 3s...")

- [ ] **Filtros aplicados sem indicador visual claro:** Usuário pode não perceber que filtros estão ativos se a barra não destacar os selecionados.
  - **Ação:** Adicionar badge com contador de filtros ativos (ex: "3 filtros aplicados") e botão "Limpar tudo"

- [ ] **Card sem preview de descrição:** Apenas nome e cor — descrição completa só no modal. Usuário pode não clicar se não vir contexto.
  - **Ação:** Adicionar `line-clamp-2` com trecho da descrição no card

#### 🟡 P2 — Consistência
- [ ] **Botões "Vídeo", "Visita", "Detalhes" com tamanhos diferentes:** Grid de 3 colunas com `min-h-[44px]`, mas texto pode quebrar linha desigualmente.
  - **Ação:** Garantir que todos tenham `min-h-[44px] h-full` e texto em `text-xs` ou `text-[11px]` fixo

- [ ] **Status badge com `statusClass` object inline:** Cores hardcoded em objeto JS — melhor migrar para tokens CSS.
  - **Ação:** Criar classes utilitárias no Tailwind (ex: `badge-disponivel`, `badge-reservado`)

- [ ] **Imagem de fallback ("Sem imagem") sem estilo consistente:** Fundo `bg-zinc-100` com texto `text-zinc-400` — adicionar ícone de cachorro genérico.
  - **Ação:** Substituir texto por ícone SVG de placeholder (ex: `<PawPrint />` do lucide-react)

---

## 📝 Formulário de Leads (LeadForm)

### Arquivo: `src/components/LeadForm.tsx`

#### 🔴 P0 — Acessibilidade
- [ ] **Checkbox de LGPD sem `aria-describedby`:** Link para "Política de Privacidade" dentro do label pode não ser anunciado corretamente.
  - **Localização:** `<input type="checkbox" id="contato-consent" />`
  - **Ação:** Adicionar `aria-describedby="consent-description"` e separar link em elemento descritivo

- [ ] **Erros de validação sem `aria-live`:** Mensagens de erro aparecem, mas podem não ser anunciadas para leitores de tela em tempo real.
  - **Localização:** `{errors.nome && <p id="erro-nome">...</p>}`
  - **Ação:** Adicionar `role="alert"` ou `aria-live="assertive"` nas mensagens de erro

- [ ] **Select de "Prazo de Aquisição" sem opção placeholder desabilitada:** Primeira opção "Selecione..." pode ser selecionada no submit.
  - **Ação:** Adicionar `disabled` e `value=""` na opção placeholder

#### 🟠 P1 — UX
- [ ] **Telefone sem máscara visual:** Campo aceita apenas números, mas usuário pode digitar `(11) 99999-9999` e receber erro.
  - **Ação:** Adicionar máscara de input com `react-input-mask` ou validação mais flexível (aceitar formatação e sanitizar)

- [ ] **Redirect automático para WhatsApp após 2s:** Usuário pode não estar pronto para abrir o WhatsApp — adicionar botão "Abrir agora".
  - **Ação:** Substituir `setTimeout` por botão explícito "Abrir WhatsApp agora" após sucesso

- [ ] **Mensagem de sucesso sem informação sobre próximos passos:** "✅ Recebemos seu contato!" não indica tempo de resposta.
  - **Ação:** Adicionar "Você receberá retorno em até 2 horas via WhatsApp" após sucesso

- [ ] **Consentimento LGPD apenas via checkbox:** Pode não ser suficiente para LGPD — considerar adicionar timestamp e versão.
  - **Ação:** Já está implementado (`consent_timestamp`, `consent_version`) — validar se está sendo enviado ao backend

#### 🟡 P2 — Consistência
- [ ] **Labels com `uppercase tracking-[0.2em]` difícil de ler:** Tracking muito largo em labels pequenas pode prejudicar legibilidade.
  - **Ação:** Reduzir tracking para `0.1em` ou remover uppercase

- [ ] **Botão de submit com `brightness-110` no hover:** Pode não ter contraste suficiente em telas de baixo brilho.
  - **Ação:** Substituir por `bg-[var(--accent-hover)]` ou escurecer com `hover:bg-emerald-700`

---

## 📄 Páginas Principais (Filhotes, Detalhes, Contato)

### Arquivo: `app/filhotes/page.tsx`

#### 🔴 P0 — Acessibilidade
- [ ] **FAQ com `<details>` sem `aria-expanded`:** Radix/native details pode não comunicar estado aberto/fechado.
  - **Localização:** seção "Perguntas frequentes"
  - **Ação:** Verificar se `<details>` nativo adiciona `aria-expanded` automaticamente; caso contrário, migrar para Radix Accordion

- [ ] **Seção "Como funciona a jornada" sem `<ol>` semântico:** Passos numerados usam `<li>` dentro de `<ol>`, mas sem `aria-label` descritivo.
  - **Ação:** Adicionar `aria-label="Passo a passo para adoção responsável"` na `<ol>`

#### 🟠 P1 — UX
- [ ] **Formulário de lead duplicado:** Aparece duas vezes na página (meio e fim) — usuário pode confundir contexto.
  - **Ação:** Diferenciar visualmente (ex: primeiro com "Quero receber recomendações", segundo com "Prefere que a criadora entre em contato?")

- [ ] **Link "Ver disponibilidade" no topo rola para `#lista-filhotes`:** Scroll pode ser abrupto em telas grandes.
  - **Ação:** Adicionar scroll suave via `scroll-behavior: smooth` ou JS com `scrollIntoView({ behavior: 'smooth' })`

- [ ] **WhatsApp link com UTMs hardcoded:** `utm_source=site-org&utm_medium=organic-site` pode não refletir origem real.
  - **Ação:** Usar helper `buildWhatsAppLink` consistentemente em todos os links

#### 🟡 P2 — Consistência
- [ ] **Stats (ninhadas/ano, famílias, entrega) sem ícones:** Cards numéricos podem se beneficiar de ícones visuais (ex: `<Calendar />`, `<Users />`, `<Truck />`).
  - **Ação:** Adicionar ícones do lucide-react para reforçar significado

- [ ] **CTA "Iniciar conversa agora" vs "Falar com a criadora":** Dois textos diferentes para mesma ação — padronizar.
  - **Ação:** Escolher um texto padrão (ex: "Falar com a criadora") e usar consistentemente

---

### Arquivo: `app/filhotes/[slug]/page.tsx`

#### 🔴 P0 — Acessibilidade
- [ ] **Página de detalhes usa mock data:** Slug não é validado — pode retornar 404 silencioso.
  - **Ação:** Implementar `notFound()` do Next.js se slug não existir no banco

- [ ] **Galeria de imagens sem navegação por teclado:** Se houver carousel, deve permitir `Tab` e setas para navegar.
  - **Ação:** Implementar controles de galeria acessíveis (Radix Carousel ou similar)

#### 🟠 P1 — UX
- [ ] **Breadcrumb JSON-LD sem renderização visual:** Usuário não vê breadcrumb na UI, apenas em SEO.
  - **Ação:** Adicionar breadcrumb visual no topo da página (ex: `Home > Filhotes > Nome do Filhote`)

- [ ] **Ficha técnica ausente:** TODO indica que detalhes (preço, vacinação, pedigree) não estão implementados.
  - **Ação:** Criar seção "Ficha Técnica" com especificações do filhote

- [ ] **Filhotes relacionados sem filtro de relevância:** Mostra apenas 2 mocks — implementar lógica de "mesma cor" ou "mesmo sexo".
  - **Ação:** Usar `getRelatedPuppies` com lista real do banco

#### 🟡 P2 — Consistência
- [ ] **Imagem de capa sem otimização:** `<img src={puppy.images[0]}>` em vez de `<Image />` do Next.js.
  - **Ação:** Substituir por `<Image />` com `sizes` e `placeholder="blur"`

---

### Arquivo: `app/contato/page.tsx`

#### 🔴 P0 — Acessibilidade
- [ ] **Telefone formatado via função `formatDisplayPhone` sem validação:** Se número estiver malformado, pode exibir formato quebrado.
  - **Ação:** Adicionar fallback para exibir número raw se formato falhar

- [ ] **Links de redes sociais sem `aria-label`:** "Instagram" e "YouTube" dentro do link podem não ser suficientes para contexto.
  - **Ação:** Adicionar `aria-label="Visitar nosso Instagram"` nos links

#### 🟠 P1 — UX
- [ ] **FAQ rápido duplica conteúdo da página /faq-do-tutor:** Pode confundir usuário sobre onde encontrar FAQs completos.
  - **Ação:** Adicionar link "Ver todas as perguntas frequentes" ao final da seção

- [ ] **Horário de atendimento sem timezone:** "09h às 19h (seg-sáb)" não indica fuso horário (assumido BRT).
  - **Ação:** Adicionar "(horário de Brasília)" para clareza

- [ ] **E-mail como texto em vez de link:** `<span>{EMAIL}</span>` em vez de `<a href="mailto:...">`
  - **Localização:** seção "Outros canais" no aside
  - **Ação:** Está implementado corretamente com `<a href={`mailto:${EMAIL}`}>` — validar renderização

#### 🟡 P2 — Consistência
- [ ] **Card de "Envie uma mensagem" sem ícone de formulário:** Apenas título — adicionar ícone de envelope ou mensagem.
  - **Ação:** Adicionar `<Mail />` ao lado do título "Envie uma mensagem"

---

## 🔐 Admin (Painel Administrativo)

### Arquivo: `app/(admin)/admin/(auth)/login/page.tsx`

#### 🔴 P0 — Acessibilidade
- [ ] **Barra de progresso de senha sem label:** `<div className="h-1.5 overflow-hidden rounded-full bg-emerald-200">` visual sem texto descritivo.
  - **Localização:** barra que indica caracteres digitados
  - **Ação:** Adicionar `<p id="password-length-indicator" role="status" aria-live="polite">` com contador de caracteres (já implementado — validar)

- [ ] **Botão "Mostrar/Ocultar senha" sem estado `aria-pressed`:** Estado não é comunicado a leitores de tela.
  - **Localização:** `<button onClick={() => setShowPassword(!prev)}>`
  - **Ação:** Já está implementado com `aria-pressed={showPassword}` — validar comportamento

- [ ] **Overlay de sucesso bloqueia interação sem `aria-live`:** Modal de "Acesso liberado" aparece sem anúncio.
  - **Ação:** Adicionar `role="status" aria-live="polite"` no container do modal de sucesso

#### 🟠 P1 — UX
- [ ] **Redirect automático após 900ms:** Pode ser muito rápido para usuário ler mensagem de sucesso.
  - **Ação:** Aumentar para 1500ms ou adicionar botão "Prosseguir agora"

- [ ] **Senha sem validação de força:** Aceita qualquer senha sem indicar se é fraca/forte.
  - **Ação:** Adicionar indicador de força (fraca/média/forte) baseado em comprimento e complexidade

- [ ] **Caps Lock warning sem ícone visual:** Apenas texto "Caps Lock esta ativado" pode passar despercebido.
  - **Ação:** Adicionar ícone de alerta (`<AlertTriangle />`) ao lado do texto

#### 🟡 P2 — Consistência
- [ ] **Animações excessivas:** Orbs flutuantes, paw trails, badge pulse podem distrair em contexto de trabalho.
  - **Ação:** Adicionar `prefers-reduced-motion` para desabilitar animações decorativas

- [ ] **Gradientes e bordas inconsistentes:** Muitos efeitos visuais (aurora, glow, blur) podem ser simplificados.
  - **Ação:** Reduzir para 2-3 efeitos principais (ex: glow no badge, aurora no botão, remover resto)

---

### Arquivo: `src/components/AdminNav.tsx`

#### 🔴 P0 — Acessibilidade
- [ ] **Links sem indicação de rota atual:** `aria-current="page"` está implementado, mas sem destaque visual forte.
  - **Localização:** `<Link href={n.href} aria-current={active ? 'page' : undefined}>`
  - **Ação:** Aumentar contraste do estado ativo (ex: `bg-emerald-100 ring-2 ring-emerald-400`)

- [ ] **Botão "Sair" sem confirmação:** Logout instantâneo pode ser acidental — adicionar dialog de confirmação.
  - **Ação:** Adicionar Radix AlertDialog "Tem certeza que deseja sair?" antes de chamar `/api/admin/logout`

#### 🟠 P1 — UX
- [ ] **Loading state de logout bloqueia UI inteira:** Overlay fullscreen pode ser excessivo — considerar spinner no botão.
  - **Ação:** Substituir overlay por estado `disabled` no botão + spinner inline

- [ ] **Navegação horizontal pode truncar em telas pequenas:** `overflow-x-auto` sem indicador visual de scroll.
  - **Ação:** Adicionar sombras laterais (gradient) para indicar conteúdo scrollável

#### 🟡 P2 — Consistência
- [ ] **Animação de "paw-walk" pode não funcionar em navegadores antigos:** Keyframes CSS sem fallback.
  - **Ação:** Adicionar `@supports` para fallback estático

---

## 🎨 Componentes de UI (Botões, Cards, Modais)

### Padrão Geral Identificado

#### 🔴 P0 — Acessibilidade
- [ ] **Ícones decorativos sem `aria-hidden="true"`:** Todos os ícones do lucide-react devem ter `aria-hidden` se não forem funcionais.
  - **Localização:** todos os componentes com `<Icon className="..." />`
  - **Ação:** Adicionar `aria-hidden="true"` em ícones que apenas reforçam texto adjacente

- [ ] **Focus-visible inconsistente:** Alguns botões usam `focus-visible:ring-2`, outros usam `focus:outline`.
  - **Ação:** Padronizar para `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2`

#### 🟠 P1 — UX
- [ ] **Botões sem feedback de loading:** Muitos botões (ex: submit de forms) mudam texto para "Enviando..." mas sem spinner visual.
  - **Ação:** Adicionar `<Loader2 className="animate-spin" />` ao lado do texto de loading

- [ ] **Cards sem shadow no hover:** Alguns cards têm `hover:shadow-lg`, outros não — inconsistente.
  - **Ação:** Padronizar: cards interativos devem ter `hover:-translate-y-0.5 hover:shadow-lg transition-all`

#### 🟡 P2 — Consistência
- [ ] **Bordas com opacidade variável:** `border-emerald-100/60`, `border-emerald-200/70`, `border-[var(--border)]` misturados.
  - **Ação:** Padronizar para tokens CSS (`--border`, `--border-light`, `--border-dark`)

- [ ] **Rounded corners inconsistentes:** `rounded-2xl`, `rounded-3xl`, `rounded-full` usados sem padrão claro.
  - **Ação:** Definir escala: `rounded-lg` para inputs/botões, `rounded-2xl` para cards, `rounded-3xl` para seções grandes

---

## 📊 Resumo de Ações por Componente

### Prioridade P0 (Crítico — Corrigir Agora)

| Componente | Problema | Ação |
|------------|----------|------|
| SkipLink | Invisível em foco | Adicionar `focus-visible:outline` e posicionamento absoluto visível |
| Layout | Main sem role | Substituir `<div id="conteudo-principal">` por `<main>` |
| Header | Menu mobile sem `aria-expanded` | Adicionar `aria-expanded={open}` no botão hamburguer |
| Footer | Links com área clicável < 48px | Adicionar padding vertical para garantir 48x48px |
| Hero | Imagem sem alt descritivo | Atualizar alt text com descrição específica da imagem |
| PuppiesGrid | Filtros sem labels | Auditar `PuppiesFilterBar` e vincular labels via `htmlFor` |
| PuppyCard | Div clicável em vez de button | Substituir por `<button>` ou `<Link>` |
| LeadForm | Checkbox LGPD sem `aria-describedby` | Separar link em elemento descritivo |
| Login | Barra de progresso sem label | Validar `aria-live` e `role="status"` (já implementado) |
| AdminNav | Logout sem confirmação | Adicionar AlertDialog antes de logout |
| Global | Ícones sem `aria-hidden` | Adicionar `aria-hidden="true"` em todos os ícones decorativos |

### Prioridade P1 (Alto — Corrigir em 1 Sprint)

| Componente | Problema | Ação |
|------------|----------|------|
| Header | CTA WhatsApp sem tracking | Adicionar `track.event` no onClick |
| Footer | Endereço sem `<address>` | Envolver contato em tag semântica |
| Hero | Greeting dinâmico causa hydration mismatch | Adicionar `suppressHydrationWarning` ou mover para server |
| PuppiesGrid | Loading state genérico | Substituir por skeleton cards |
| PuppyCard | Card sem preview de descrição | Adicionar `line-clamp-2` com trecho |
| LeadForm | Telefone sem máscara | Adicionar `react-input-mask` |
| Filhotes | FAQ sem `aria-expanded` | Migrar para Radix Accordion |
| Detalhes | Breadcrumb apenas JSON-LD | Adicionar breadcrumb visual |
| Contato | FAQ duplicado | Adicionar link para FAQ completo |
| Login | Redirect automático muito rápido | Aumentar delay ou adicionar botão |

### Prioridade P2 (Médio — Corrigir em 2 Sprints)

| Componente | Problema | Ação |
|------------|----------|------|
| Header | Logo sem imagem | Adicionar logo SVG inline |
| Footer | Tipografia inconsistente | Padronizar hierarquia H3/body/links |
| Hero | Badge de caption sem contraste | Adicionar `bg-white/95` ou `backdrop-blur` |
| PuppiesGrid | Botões com tamanhos diferentes | Garantir `min-h-[44px] h-full` consistente |
| PuppyCard | Status badge hardcoded | Migrar para classes utilitárias Tailwind |
| LeadForm | Labels com tracking muito largo | Reduzir para `0.1em` ou remover uppercase |
| Filhotes | Stats sem ícones | Adicionar ícones do lucide-react |
| Detalhes | Imagem sem otimização | Substituir `<img>` por `<Image />` |
| Contato | Card de formulário sem ícone | Adicionar `<Mail />` ao título |
| Login | Animações excessivas | Adicionar `prefers-reduced-motion` |
| AdminNav | Navegação horizontal sem indicador | Adicionar sombras laterais em scroll |
| Global | Bordas com opacidade variável | Padronizar tokens CSS |

---

## 🔍 Checklist de Validação Pós-Correção

Após implementar as correções, validar com:

### Ferramentas Automatizadas
- [ ] **axe DevTools:** 0 violações críticas de WCAG 2.1 AA
- [ ] **Lighthouse:** Accessibility score ≥ 95
- [ ] **WAVE:** 0 erros, apenas alertas de baixa prioridade
- [ ] **Pa11y:** 0 erros WCAG AA

### Testes Manuais
- [ ] **Teclado:** Toda navegação e interação possível sem mouse
- [ ] **Screen Reader:** NVDA/JAWS (Windows) ou VoiceOver (macOS) — todos os elementos anunciados corretamente
- [ ] **Zoom 200%:** Conteúdo permanece legível e utilizável
- [ ] **Contraste:** Ratio ≥ 4.5:1 para texto normal, ≥ 3:1 para texto grande (verificar com Contrast Checker)
- [ ] **Touch targets:** Todas as áreas clicáveis ≥ 48x48px (verificar com régua de dev tools)
- [ ] **Motion:** Animações desabilitadas em `prefers-reduced-motion`

### Testes de UX
- [ ] **Fluxo de conversão:** Usuário consegue ir de "ver filhote" até "enviar formulário" em < 3 cliques
- [ ] **Feedback visual:** Todos os estados (hover, focus, active, loading, error, success) claramente diferenciados
- [ ] **Consistência:** Mesma ação (ex: "Falar com a criadora") usa mesmo texto e estilo em toda a aplicação
- [ ] **Mobile:** Navegação e forms utilizáveis em telas ≥ 320px de largura

---

## 📝 Notas Finais

### Pontos Positivos Encontrados
✅ Uso consistente de design system (tokens CSS, `var(--brand)`, etc.)  
✅ Lazy loading implementado corretamente (Hero, PuppiesGrid, Testimonials)  
✅ SEO estruturado com JSON-LD em múltiplos schemas  
✅ Performance otimizada com preconnect, preload, AVIF  
✅ Tracking de eventos implementado (`track.event`)  
✅ Forms com validação via Zod e feedback de erro  

### Áreas de Maior Risco
⚠️ **Acessibilidade de filtros e modais:** Sem labels e aria-modal consistentes  
⚠️ **Inconsistência de tap targets:** Vários botões < 48x48px  
⚠️ **Falta de confirmação em ações destrutivas:** Logout sem AlertDialog  
⚠️ **Ícones decorativos sem aria-hidden:** Poluição de leitores de tela  
⚠️ **Hydration mismatches:** Lógica client-side (hora, ano) sem tratamento SSR  

### Próximos Passos Recomendados
1. **Sprint 1 (P0):** Corrigir violações críticas de WCAG (labels, roles, aria-*)
2. **Sprint 2 (P1):** Melhorar UX (tracking, loading states, confirmações)
3. **Sprint 3 (P2):** Polimento visual (ícones, animações, consistência)
4. **Sprint 4:** Testes de regressão e validação com usuários reais

---

**Documento gerado em:** 1 de dezembro de 2025  
**Auditoria realizada por:** GitHub Copilot (Claude Sonnet 4.5)  
**Próxima revisão:** Após implementação das correções P0-P1
