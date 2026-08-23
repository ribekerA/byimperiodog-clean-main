import { expect } from 'vitest';

// Import dinâmico para evitar conflito de tipos estritos

const jestDomMatchers = require('@testing-library/jest-dom/matchers');
expect.extend(jestDomMatchers);

// Este setup roda em todo arquivo de teste, inclusive nos que pedem o ambiente
// node em vez de jsdom — e la HTMLElement nao existe. Sem a guarda, um teste de
// codigo de servidor morre na coleta com "HTMLElement is not defined".
if (typeof HTMLElement !== "undefined" && !HTMLElement.prototype.scrollIntoView) {

  HTMLElement.prototype.scrollIntoView = function scrollIntoViewMock() {};
}
