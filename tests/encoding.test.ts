import { spawnSync } from 'node:child_process';

import { describe, it, expect } from 'vitest';

/**
 * A deteccao de mojibake mora em scripts/check-encoding.mjs; aqui so a
 * executamos.
 *
 * Antes havia uma segunda lista de padroes dentro deste arquivo, e ela apodreceu
 * do mesmo jeito que a do script: os "padroes proibidos" eram 'Alemão', 'Anão' e
 * 'pós-' -- portugues escrito corretamente. Num site sobre Spitz Alemão isso
 * acusava 311 arquivos. O teste reprovava em toda execucao e, por reprovar
 * sempre, nao informava nada.
 *
 * Uma lista so, em um lugar so, e o que impede as duas de divergirem de novo.
 */
describe('encoding integrity', () => {
  it(
    'nao contem mojibake (scripts/check-encoding.mjs)',
    () => {
      const resultado = spawnSync(process.execPath, ['scripts/check-encoding.mjs'], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });

      // A saida do script vai junto da assercao: sem isso a falha apareceria
      // como "esperado 0, recebido 1" e o arquivo culpado ficaria escondido.
      expect(resultado.status, resultado.stderr || resultado.stdout).toBe(0);
    },
    60_000
  );
});
