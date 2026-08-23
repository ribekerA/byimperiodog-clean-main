import { describe, it, expect } from 'vitest';

import { canonical } from '../../src/lib/seo.core';

describe('canonical()', () => {
  it('normaliza caminhos relativos', () => {
    const url = canonical('/blog/teste');
    expect(url).toMatch(/\/blog\/teste$/);
  });
  it('evita barra dupla', () => {
    const a = canonical('blog/teste');
    expect(a.includes('//blog/')).toBe(false);
  });
});
