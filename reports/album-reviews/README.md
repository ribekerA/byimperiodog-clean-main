# Álbum e avaliações

Alterações solicitadas: resumo removido da hero; seção de avaliações imediatamente após o álbum; foto de Emily com PomPom incluída entre as primeiras imagens do álbum, com cidade informada pela usuária.

A mesma foto, sem edição, foi transferida para `public/clientes/emily-pompom.jpg`. O cartão de família existente usa esse mesmo caminho. O gerador do álbum agora emite 38 fotos, sem duplicar o arquivo de imagem. As 33 avaliações Google transcritas, a nota 4,9 e o total de 35 foram preservados.

Verificação local em 390 e 1440 px: ordem das seções confirmada, resumo ausente, foto carregada e ampliação/fechamento por teclado funcionando. Zero overflow e zero violações axe WCAG A/AA detectadas no álbum e nas avaliações. ESLint aprovado. Evidências: `local-validation.json` e capturas nesta pasta.

O teste reproduzível é `node scripts/album-reviews-check.mjs`; `CHECK_URL` permite verificar o domínio após a publicação sem enviar contatos nem eventos de analytics.
