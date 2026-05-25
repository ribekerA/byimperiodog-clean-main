import { expect } from 'vitest';

// Import dinâmico para evitar conflito de tipos estritos
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jestDomMatchers = require('@testing-library/jest-dom/matchers');
expect.extend(jestDomMatchers);

if (!HTMLElement.prototype.scrollIntoView) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  HTMLElement.prototype.scrollIntoView = function scrollIntoViewMock() {};
}
