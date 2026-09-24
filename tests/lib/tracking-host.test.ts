import { describe, expect, it } from 'vitest';

import { isProductionTrackingHost } from '@/lib/tracking-host';

describe('Isolamento de dados de produção', () => {
  it.each(['localhost', '127.0.0.1', 'deploy-preview-42--byimperiodog.netlify.app', 'byimperiodog.com.br.example.org', 'byimperiodog.netlify.app'])('recusa %s', (host) => {
    expect(isProductionTrackingHost(host)).toBe(false);
  });
  it.each(['byimperiodog.com.br', 'www.byimperiodog.com.br'])('permite %s', (host) => {
    expect(isProductionTrackingHost(host)).toBe(true);
  });
});
