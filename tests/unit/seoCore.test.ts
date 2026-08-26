import { describe, it, expect } from 'vitest';

import { pageMetadata } from '../../src/lib/seo';
import { SITE_ORIGIN, canonical } from '../../src/lib/seo.core';

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

/**
 * Quem chega pelo anúncio chega com `?gclid=...` na barra de endereço. Se esse
 * parâmetro entrasse no canonical, o Google veria uma URL nova a cada clique
 * pago — a mesma página indexada dezenas de vezes, cada uma com o rastro de um
 * clique junto, e o sinal de ranking dividido entre elas.
 */
describe('parâmetros de anúncio não contaminam o canonical', () => {
  const parametros = [
    '?gclid=test',
    '?gbraid=test',
    '?wbraid=test',
    '?utm_source=google&utm_medium=cpc&utm_campaign=pesquisa',
    '?gclid=test&utm_source=google',
  ];

  it.each(parametros)('descarta %s', (query) => {
    expect(canonical(`/filhotes${query}`)).toBe(`${SITE_ORIGIN}/filhotes`);
  });

  it('descarta âncora também', () => {
    expect(canonical('/preco-spitz-anao#tabela')).toBe(`${SITE_ORIGIN}/preco-spitz-anao`);
    expect(canonical('/preco-spitz-anao?gclid=x#tabela')).toBe(`${SITE_ORIGIN}/preco-spitz-anao`);
  });

  it('não deixa a página virar a home quando só há parâmetro', () => {
    expect(canonical('?gclid=test')).toBe(SITE_ORIGIN);
  });

  it('chega limpo até o metadata da página, canonical e og:url juntos', () => {
    const meta = pageMetadata({
      title: 'Filhotes',
      path: '/filhotes?gclid=test&utm_source=google',
    });

    expect(meta.alternates?.canonical).toBe(`${SITE_ORIGIN}/filhotes`);
    expect(meta.openGraph?.url).toBe(`${SITE_ORIGIN}/filhotes`);
  });

  it('mantém o host canônico — nada de www nem domínio antigo', () => {
    const url = canonical('/spitz-alemao?gclid=test');
    expect(url.startsWith('https://byimperiodog.com.br/')).toBe(true);
    expect(url).not.toContain('www.');
  });
});
