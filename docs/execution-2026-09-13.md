# Execução da auditoria — 13/09/2026

Escopo: correções técnicas e comerciais da auditoria autorizada. Preservar nomes, URLs e mídias reais das filhotes; não aumentar investimento nem prometer posição/índice de qualidade.

## Primeira etapa

| Item | Execução |
| --- | --- |
| Pinterest | GTM 18 publicado e matriz inicial de consentimento verificada com coleta interceptada. |
| Preços | Componentes MDX renderizados no servidor usam a matriz do domínio. Artigos de preços, cores e preto corrigidos; FAQ sem valor divergente da laranja. |
| Anúncio branco | Prévia de textos validada; aplicação depende de confirmação das trocas exatas. Nenhum orçamento, lance ou segmentação alterado. |
| Celular | Resumo/preço/contato antes da galeria; banner compacto; CTA flutuante considera altura do banner. |
| Imagens | Catálogo com Next Image responsivo; galeria sem segunda imagem decorativa; fotos inteiras sem alteração do animal. |
| Dependências | Tiptap e sharp atualizados; novel sem uso removido e dependências transitivas corrigidas. npm audit: zero vulnerabilidades na verificação. |
| Contatos | Formulário e chat exigem confirmação e id do backend; captura de preferência não finge sucesso no erro. Testes sem criar contatos reais ou enviar mensagens. |

## Segunda etapa

- GA4: fuso de São Paulo, sem valor fictício para clique e isolamento de hosts de teste.
- Tipos de clique separados e consentimento respeitado também no armazenamento. Não converter WBRAID/GBRAID em GCLID. **Integração desses dois campos com CRM ainda não implantada**: a chave local principal foi rejeitada e a verificação de uma fonte alternativa depende de autorização específica.
- Galeria sem botão contendo outros botões; controle de zoom nativo acessível por teclado.
- Pomeranian: resposta inicial direta, tabela única, ligação com fotos reais, guia de escolha e contato contextual.
- Descrição da variante laranja com laço rosa diferenciada, mantendo canonical/URL.
- Wolf sable continua fora da promoção/sitemap conforme política comercial já registrada; não ampliar escopo comercial automaticamente.
- Backend de curtidas: erro 503 permanece pendente de diagnóstico autenticado. Não foram inventadas contagens nem alterado o banco sem verificar o alvo.
- Sitemap: submissão prevista após confirmação do deploy.
- CSP: permanece como implantação futura gradual com homologação das integrações, não como proteção já ativa.

## Dados comerciais necessários para a terceira etapa

Antes de ativar importações offline ou mudar objetivos de lances, aprovar critérios operacionais:

1. Lead qualificado: registrar critério real usado pela equipe e responsável pela classificação.
2. Visita/videochamada: registrar confirmação, data e vínculo ao mesmo lead.
3. Reserva e venda: usar pagamento/resultado real, identificador estável, valor real e tratamento de cancelamento.
4. Deduplicar estágios por lead; não enviar nome, telefone, e-mail ou mensagem em parâmetros comuns do GA4.
5. Comparar custo por contato qualificado e fechamento, não somente clique no WhatsApp.

Geografia, negativas de preço, novas campanhas e orçamento devem passar por prévia específica com limite aprovado. Não há autorização inferida para expansão indiscriminada. Conteúdo de saúde demanda revisão profissional identificada; não inventar revisão veterinária.

## Homologação e reversão

- Build, testes de consentimento, preços, formulários, editor e navegação antes de publicar.
- Testes no navegador bloqueiam POSTs e coleta de plataformas; não clicar nos próprios anúncios.
- Evidências brutas de contas guardadas fora do código para não expor dados operacionais.
- Alterações de código reversíveis por commit; nenhuma exclusão de mídia real, lead ou histórico de campanhas.
- GTM: backup da versão 17 preservado localmente; qualquer reversão precisa manter o bloqueio de Pinterest sem marketing.
- Sem garantia de nota 10, primeira posição, receita ou prazo de reindexação. Medir laboratório separadamente de Core Web Vitals reais.
