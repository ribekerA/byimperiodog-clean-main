# Contrato — pontos que exigem decisão humana

Documento de **auditoria**, não de redação. Nenhuma cláusula foi reescrita.
Texto jurídico não se altera sem redação aprovada pela responsável do canil e
revisão de quem responde por ela — por isso o que segue é uma lista de decisões
pendentes, com o texto exato que está em produção hoje e o arquivo onde ele mora.

Data da auditoria: 25/08/2026.

---

## 1. São duas fontes do mesmo contrato — e elas precisam mudar juntas

| Fonte | Arquivo | Onde aparece |
| --- | --- | --- |
| Documento HTML / impressão | `app/(public)/contract/[code]/documento/page.tsx` | Página que o comprador abre pelo link do contrato |
| PDF assinado | `src/lib/contractPdf.ts` | Arquivo enviado ao ZapSign por `app/api/admin/contracts/[id]/zapsign/route.ts` |

As duas hoje dizem a mesma coisa, cláusula por cláusula. **Qualquer alteração
aprovada precisa ser aplicada nos dois arquivos no mesmo commit.** Mudar só um
produz um contrato assinado diferente do contrato exibido — e o que vale
juridicamente é o assinado.

---

## 2. Itens auditados, com o texto que está no ar

### 2.1 Identificação da raça — **divergente do resto do site**

> "Spitz Alemão (Lulu da Pomerânia)"
> — `contractPdf.ts:129`, `contractPdf.ts:154`, `documento/page.tsx:137`, `documento/page.tsx:167`

O site inteiro foi padronizado para **"Spitz Alemão Anão"**, com "Lulu da
Pomerânia" tratado como sinônimo popular apresentado uma vez por página. O
contrato ficou fora dessa padronização e continua identificando o animal pelo
nome antigo, sem a qualificação "Anão".

**Decisão necessária:** manter a identificação atual por segurança jurídica de
contratos já assinados, ou alinhar ao padrão do site. É identificação do objeto
do contrato — não é ajuste editorial.

### 2.2 V8 importada — obrigação de marca/origem

> "vacinação obrigatória (V8 importada) de acordo com a idade"
> — cláusula 1.1, `contractPdf.ts:167` e `documento/page.tsx:180`

O contrato afirma, como fato da entrega, que a vacina aplicada é importada.
**Decisão necessária:** confirmar que isso é verdade para 100% das entregas. Se
houver uma única entrega com vacina nacional, a cláusula é uma declaração falsa
assinada pelo vendedor.

### 2.3 Cronograma de vacinação — Antirrábica, Giárdia, Bronchi-Shield

> "Cumprir o cronograma de vacinação: V8, Antirrábica, Giárdia e Bronchi-Shield"
> — cláusula 4, `contractPdf.ts:173` e `documento/page.tsx:209`

O contrato transforma um calendário vacinal específico em **obrigação do
comprador**, e o descumprimento dele aciona a cláusula 8 (isenção total do
vendedor). Giárdia e Bronchi-Shield não são vacinas de aplicação universal — a
indicação é clínica e varia por região e por rotina do veterinário do comprador.

**Decisão necessária:** confirmar com médico veterinário se o canil quer mesmo
exigir contratualmente essas duas, sabendo que o veterinário do comprador pode
não indicá-las e que isso, na letra do contrato, faria o comprador perder toda a
cobertura.

### 2.4 Vermifugação a cada 6 meses

> "Vermifugar o animal a cada 6 meses conforme orientação veterinária"
> — cláusula 4, `documento/page.tsx:210`

Mesma estrutura do item anterior: obrigação do comprador ligada à isenção da
cláusula 8. Como o próprio texto diz "conforme orientação veterinária", há
conflito interno — se o veterinário orientar intervalo diferente, o comprador
descumpre a primeira metade da frase obedecendo a segunda.

### 2.5 Exposição só 21 dias após a última dose

> "Não expor o filhote a locais públicos, pet shops ou contato com outros cães
> antes de completar todas as vacinas (mínimo de 21 dias após a última dose)"
> — cláusula 4, `documento/page.tsx:211`

Idem: obrigação verificável de forma difícil, ligada à isenção total.

### 2.6 Prazo de 72 horas — **o ponto mais sensível**

> "3.1. O comprador deverá levar o filhote a uma clínica veterinária […] no prazo
> máximo de **72 horas** a contar da data de entrega."
> "3.3. Após esse prazo, não serão aceitas reclamações relacionadas à saúde do animal."
> — `contractPdf.ts:171`, `documento/page.tsx:199-201`

**Este é o bloqueio principal.** Três textos convivem hoje:

1. A configuração antiga do site prometia **garantia de saúde de 90 dias** — já
   removida do site nesta rodada.
2. O contrato limita avaliação e reclamação a **72 horas**.
3. A regra comercial informada verbalmente prevê **garantia vitalícia para
   condições hereditárias**, e esses termos **não existem no contrato**.

Além disso, cláusula que exclui reclamação de saúde após 72 horas colide de
frente com o art. 26 do Código de Defesa do Consumidor (prazo de 90 dias para
vício em produto durável) e com o art. 51, I (nulidade de cláusula que exonera o
fornecedor). Não é opinião sobre redação — é conflito com norma cogente.

**Decisão necessária:** definir a garantia real, escrever a cláusula com apoio
jurídico e aplicá-la nas duas fontes. **Enquanto isso não acontecer, o site não
promete garantia hereditária vitalícia em nenhum lugar** — e não deve passar a
prometer.

### 2.7 Reembolso integral ou substituição do animal

> "o vendedor se compromete a **reembolsar integralmente o valor pago** ou
> substituir o animal, a critério do comprador."
> — cláusula 3.3 do HTML (`documento/page.tsx:201`); no PDF, 3.2 (`contractPdf.ts:171`)

Duas observações de auditoria:

- **A numeração diverge entre as fontes.** O mesmo conteúdo é 3.3 no HTML e 3.2
  no PDF, e o HTML tem um 3.3 com outro texto. Citar "cláusula 3.2" numa
  discussão vira ambiguidade.
- O PDF diz apenas "reembolsará integralmente ou substituirá"; o HTML acrescenta
  **"a critério do comprador"**. É diferença material de quem escolhe.

### 2.8 Suporte vitalício por WhatsApp

> "o suporte por WhatsApp diretamente com a criadora permanece disponível ao
> comprador **pela vida do animal, sem custo adicional**"
> — cláusula 7.2, `contractPdf.ts:179`, `documento/page.tsx:229`

É uma obrigação sem prazo final, assumida pessoalmente pela criadora. O canil
existe desde 2013; um Spitz vive de 12 a 16 anos. **Decisão necessária:**
confirmar que é isso mesmo que se quer assinar, ou qualificar o compromisso
(horário comercial, canal, sucessão).

### 2.9 Isenção ampla de responsabilidade (cláusula 8)

> "O descumprimento das obrigações previstas nas cláusulas 4 e 5 exime o vendedor
> de **qualquer responsabilidade posterior**, inclusive no tocante à saúde ou
> desenvolvimento do animal."
> — `contractPdf.ts:181`, `documento/page.tsx:234`

A cláusula 5 inclui manter alimentação "de padrão semelhante" a Farmina N&D
Puppy. Na letra do contrato, **trocar a ração** dispensaria o vendedor de
qualquer responsabilidade, inclusive por problema congênito sem relação nenhuma
com alimentação. Também é o tipo de exoneração alcançada pelo art. 51, I do CDC.

### 2.10 Foro de Bragança Paulista sem ressalva

> "As partes elegem o foro da comarca de Bragança Paulista – SP"
> — cláusula 9.1, `contractPdf.ts:183`, `documento/page.tsx:239`

Sem ressalva de que o consumidor pode ajuizar no seu próprio domicílio (art. 101,
I do CDC). O canil vende para outros estados — Jundiaí, Rio de Janeiro, Minas.

### 2.11 Vídeo e fotos da entrega como obrigação universal

> "vídeo e fotos do momento da entrega"
> — cláusula 2, `contractPdf.ts:169`

Está na lista do que "será fornecido no ato da entrega". **Decisão necessária:**
confirmar que isso acontece em toda entrega, inclusive nas que envolvem
transporte a outro estado.

---

## 3. O que NÃO foi feito, de propósito

- Nenhuma cláusula reescrita, renumerada, suavizada ou removida.
- Nenhuma promessa de garantia adicionada ao site, ao schema ou ao contrato.
- Nenhuma harmonização automática entre HTML e PDF — as divergências dos itens
  2.7 estão apenas **relatadas**, porque escolher qual das duas versões vale é
  decisão da responsável, não do código.

## 4. Ordem sugerida para resolver

1. **2.6 (72 horas × garantia real)** — é o que trava a comunicação comercial.
2. **2.9 e 2.10** — exoneração ampla e foro, pelo risco de nulidade.
3. **2.7** — alinhar numeração e "a critério do comprador" entre as duas fontes.
4. **2.2, 2.3, 2.11** — confirmar se cada afirmação de fato é verdadeira em 100%
   das entregas.
5. **2.1** — identificação da raça, junto com a próxima revisão do modelo.
6. **2.8** — qualificar ou manter o suporte vitalício.
