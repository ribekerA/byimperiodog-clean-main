import { expect } from 'vitest';

// Import dinâmico para evitar conflito de tipos estritos
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jestDomMatchers = require('@testing-library/jest-dom/matchers');
expect.extend(jestDomMatchers);

// Este setup roda em todo arquivo de teste, inclusive nos que pedem o ambiente
// node em vez de jsdom — e la HTMLElement nao existe. Sem a guarda, um teste de
// codigo de servidor morre na coleta com "HTMLElement is not defined".
if (typeof HTMLElement !== "undefined" && !HTMLElement.prototype.scrollIntoView) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  HTMLElement.prototype.scrollIntoView = function scrollIntoViewMock() {};
}
