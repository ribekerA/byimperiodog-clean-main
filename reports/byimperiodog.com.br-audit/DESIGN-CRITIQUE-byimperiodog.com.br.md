# Crítica de design: byimperiodog.com.br, 17/11/2026

**Escopo e método:**
- 8 páginas do site ao vivo, no celular (390×844) e no desktop (1366×800), capturadas e medidas com Playwright:
  - home
  - /filhotes
  - /preco-spitz-anao
  - /filhotes/sao-paulo
  - /contato
  - /sobre
  - /blog
  - página de um filhote (branco, fêmea)
- As correções de hoje ainda não publicadas não entram aqui:
  - estilo
  - textos pequenos
  - páginas de estado reescritas
- **Fase:** site em produção. A crítica é de polimento, não de exploração.
- **Fora de alcance por decisão já tomada:** os blocos aprovados da home (`.hm`, `.vt`, `.vf`). Onde aparecem abaixo, são só observação, sem proposta de mudança.

---

## Impressão geral

O site passa de cara o que é: um canil de Spitz com preço visível e um botão de WhatsApp sempre à mão. Verde-mata, dourado e Playfair dão um ar caprichado e coerente.

A maior oportunidade não está na estética, está no **excesso de chamadas para a mesma ação**:
- até 56 links de WhatsApp numa só página;
- três cores diferentes de botão para o mesmo destino;
- textos repetidos.

Isso dilui o botão que importa.

---

## 1. Primeira impressão (2 segundos)

| Página | O que chama o olho primeiro | Está certo? |
|---|---|---|
| Home (celular) | Os 4 filhotes, o nome "By Imperio Dog" e os dois cartões de preço | ✅ Sim. Em uma tela já se vê raça, preço por sexo e o primeiro filhote. |
| Home (desktop) | Título dourado sobre os filhotes, depois os cartões Machos/Fêmeas | ✅ Sim, mas o título passa por cima do focinho dos 4 cães (bloco aprovado, só observação). |
| /filhotes (desktop) | Hero com um filhote grande e "Beleza, carinho e companheirismo" | ⚠️ A tela inteira é o hero. Não aparece nenhum filhote à venda nem botão. Quem clicou em "Filhotes" precisa rolar para ver filhotes. |
| /filhotes (celular) | Hero menor, logo depois os selos e os cartões | ✅ Melhor que no desktop. |
| Página do filhote | Título, preço, botão "Ver disponibilidade" | ✅ Hierarquia boa. |
| /blog (desktop) | Selo "CONTEÚDO PREMIUM · GRATUITO" e o título | ⚠️ "Premium" e "gratuito" juntos soam contraditórios e cheiram a marketing. |

---

## 2. Usabilidade

| Achado | Severidade | Recomendação |
|---|---|---|
| **/preco-spitz-anao mostra a mesma página de /filhotes**: mesmo H1, mesma altura e mesmos elementos. Quem busca "preço" cai numa vitrine sem nenhuma explicação de preço no topo. | 🔴 Crítico | Confirmar se é redirecionamento proposital. Se for, a vitrine precisa responder "quanto custa" logo no topo (faixa de preço por sexo, como a home já faz). Se não for, restaurar a página de preço. |
| **"Ver disponibilidade" (8 componentes) ao lado do selo "Disponibilidade a confirmar"**. O botão promete consulta de estoque, e o selo diz que não há estoque confirmado. | 🟡 Moderado | Trocar por "Perguntar pela/pelo [cor]", que já é o texto do cartão de /filhotes. |
| **56 links de WhatsApp no /blog**: cada cartão de artigo tem "Ler artigo" e mais um botão de WhatsApp do mesmo tamanho. | 🟡 Moderado | Deixar só "Ler artigo" nos cartões e um único bloco de WhatsApp no meio e no fim da lista. Pela Lei de Hick, duas escolhas iguais em cada cartão atrasam a decisão principal, que é ler. |
| **Formulário de contato com 8 campos e o consentimento.** Só Nome e WhatsApp são obrigatórios, mas os opcionais (sexo, cor, prazo) não estão marcados como tal. Só "Cidade" e "Estado" dizem "(opcional)". | 🟡 Moderado | Marcar todos os opcionais, ou recolhê-los em "Quer adiantar detalhes?". Cada campo a mais na tela custa conclusões. |
| O exemplo no campo WhatsApp ("11999887766") tem o mesmo tom de um valor já digitado. | 🟢 Menor | Clarear o placeholder ou trocar por "DDD + número". A dica de baixo já explica. |
| **A caixa de cookies ocupa cerca de 110 px no celular** e cobre o preço ou o botão do primeiro cartão em todas as páginas até alguém responder. | 🟢 Menor | Já foi reduzida (commit `a155653`, ainda sem push). Conferir depois do deploy. |
| No /filhotes/sao-paulo, a frase "Consulte as opções atuais pelo WhatsApp" aparece 3 vezes em uma tela e meia. | 🟢 Menor | Já mexido na reescrita local das páginas de estado, ainda sem commit. Conferir no deploy. |

---

## 3. Hierarquia visual

- **O que chama o olho primeiro:**
  - Na home e na página do filhote: preço e foto, o que está certo.
  - No /filhotes desktop: um hero decorativo, o que está errado, porque o conteúdo da página é a vitrine.
- **Fluxo de leitura:**
  - Celular: foto → nome → cor/sexo → preço → botão, uma coluna limpa.
  - Página do filhote (desktop): foto à esquerda e decisão à direita, bom padrão de e-commerce.
- **Ênfase:**
  - O preço em laranja-dourado nos cartões é o elemento mais forte depois da foto. Correto.
  - O botão "Ver disponibilidade" do cartão (verde, ~70 px de altura, texto de ~24 px) é maior que o preço e que o título. Nos cartões da home ele parece um banner, não um botão (bloco `.vt` aprovado, só observação).
- **Espaço em branco:**
  - No /filhotes/sao-paulo (celular), os 4 benefícios (Retirada, Registro, Criação, Suporte) ficam um embaixo do outro, cada um com ícone, título e uma linha, ocupando uma tela inteira para quatro frases.
  - Uma grade 2×2 resolveria em um terço da altura.
  - Verificar se a reescrita local já mudou isso.
- **Tamanho das páginas no celular:**

  | Página | Altura | Telas |
  |---|---|---|
  | Home | 16.794 px | ~20 |
  | /blog | 29.036 px | ~34 |

  No blog, a lista completa de artigos vem sem paginação. Paginar ou carregar mais a partir do 12º artigo.

---

## 4. Consistência

| Elemento | Inconsistência | Recomendação |
|---|---|---|
| **Cor do botão de WhatsApp** | Três cores para a mesma ação: dourado-laranja no cabeçalho ("Conversar agora"), verde-mata nos cartões e nas páginas, verde-WhatsApp `#25D366` no botão flutuante. | Escolher uma regra: botão principal verde-mata com borda dourada, flutuante em verde-WhatsApp. O do cabeçalho dourado é o único botão dourado do site e compete com o preço, que também é dourado. |
| **Texto do botão de WhatsApp** | 19 textos diferentes (ver auditoria de marca, item 2.5). | Três textos fixos. |
| **Rótulos de formulário** | Maiúsculas com espaçamento largo ("NOME COMPLETO", "COR PREFERIDA"), enquanto todo o resto do site usa frase normal. | Usar frase normal ("Nome completo"). Lê mais rápido e combina com o resto. |
| **Selos de topo de seção** | "NOSSA HISTÓRIA", "PERGUNTAS FREQUENTES", "CONTEÚDO PREMIUM · GRATUITO", "ARTIGO EM DESTAQUE": às vezes em pílula com borda, às vezes texto solto. | Escolher um dos dois formatos. |
| **Emoji no H1** | /contato: "Fala comigo diretamente 💬". É o único título com emoji. | Tirar o emoji. Ele sai com aparência diferente em cada celular. |
| **Primeira pessoa** | /contato e /sobre falam "comigo", "Comecei"; o resto do site fala "nós" ou "a criadora". | Decidir a voz. Primeira pessoa funciona bem e é mais quente, mas então vale para o site todo. |

---

## 5. Acessibilidade

- **Contraste:**
  - A paleta já foi corrigida para AA: `#047c59` e `#6b6b73` medem acima de 4,5:1 nos fundos claros do site.
  - Texto dourado sobre verde-mata: passa nos títulos grandes. Nos textos pequenos em dourado (selos como "NOSSA HISTÓRIA") não medi.
- **Alvos de toque** (medidos no celular):

  | Alvo | Tamanho medido | Situação |
  |---|---|---|
  | Chips de cor da home (Branco, Laranja…) | 28 px de altura | Abaixo dos 44 px recomendados (bloco aprovado) |
  | Caixa de consentimento do formulário | 16×16 px | Pequena, mas o texto ao lado é clicável. Conferir se o `<label>` envolve o texto todo. |
  | Links do rodapé ("Início", "Saiba mais", "Política de Privacidade") | 16–17 px de altura | Pequenos |
  | Bolinhas da galeria do filhote | 24×44 px | Aceitáveis |
  | Perguntas do FAQ | 23–26 px | Pequenas, mas ocupam a largura toda |

- **Texto pequeno:**
  - Antes das correções de hoje, o /blog tinha 121 trechos abaixo de 13 px no celular e o /sobre tinha 41.
  - A troca de `text-[10/11px]` por `text-xs` (~11,6 px), ainda sem publicar, cobre parte disso.
  - O resto são datas e selos decorativos.
- **Rolagem lateral:** nenhuma página rola de lado no celular.

---

## O que funciona bem

- **Preço visível e honesto** em todo cartão e na página do filhote, no formato padrão ("A partir de R$ X no PIX"), com a reserva explicada ("50% do valor, conforme contrato").
- **Página do filhote com padrão de loja:** foto à esquerda, decisão à direita, migalhas de navegação, contador de vídeos e de fotos.
- **Identidade forte e coerente no site:** verde-mata, dourado, Playfair nos títulos e DM Sans no texto, em todas as páginas.
- **Prova de confiança perto do preço:** "Procedência", "Pós-reserva", "Documentação", "Suporte veterinário".
- **Contato completo:** horário, cidade, telefone, Google e YouTube na mesma página, e o formulário diz o que acontece depois do envio.

---

## Prioridades

1. **Resolver /preco-spitz-anao.** Quem busca preço precisa ver preço no topo. Hoje vê o hero da vitrine, e no desktop nem um filhote aparece na primeira tela.
2. **Subir a vitrine no /filhotes desktop.** Reduzir o hero para cerca de 40% da altura, ou pôr a primeira fileira de cartões dentro da primeira tela. É a página de destino dos anúncios e do menu.
3. **Uma regra só para o WhatsApp:** uma cor de botão, três textos fixos, e menos links repetidos (sair dos cartões do blog). Trocar "Ver disponibilidade" por "Perguntar pela/pelo [cor]".
4. **Formulário de contato mais curto:** recolher os 3 campos opcionais e usar rótulos em frase normal.
5. **Detalhes:**
   - selo "Premium · Gratuito"
   - emoji no H1
   - benefícios das páginas de estado em grade 2×2
   - paginação do blog

**Fora do alcance desta crítica (blocos aprovados da home):**
- título por cima dos focinhos
- botão do cartão maior que o preço
- chips de 28 px

Só registro. Não proponho mexer sem você pedir.
