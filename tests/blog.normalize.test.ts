import { describe, it, expect } from 'vitest';

import { normalizeTags, sanitizeCategory } from '../src/lib/blog/normalize';

describe('normalizeTags', () => {
  it('retorna array vazio para undefined/null', () => {
    expect(normalizeTags(undefined)).toEqual([]);
  expect(normalizeTags(null as unknown as undefined)).toEqual([]);
  });
  it('normaliza array misto e remove duplicados / espaços', () => {
    expect(normalizeTags([' Tag ', 'tag', 'Outra', 'outra '])).toEqual(['tag', 'outra']);
  });
  it('divide string por vírgula e normaliza', () => {
    expect(normalizeTags('Tag, Outra ,  terceira')).toEqual(['tag', 'outra', 'terceira']);
  });
  it('ignora valores não string/array', () => {
    expect(normalizeTags(123)).toEqual([]);
    expect(normalizeTags({ a: 1 })).toEqual([]);
  });
});

describe('sanitizeCategory', () => {
  it('retorna null para vazio', () => {
    expect(sanitizeCategory(undefined)).toBeNull();
    expect(sanitizeCategory('   ')).toBeNull();
  });
  it('trim e retorna string', () => {
    expect(sanitizeCategory('  Pets  ')).toBe('Pets');
  });
  it('coerção de tipos', () => {
    expect(sanitizeCategory(123)).toBe('123');
  });
});
