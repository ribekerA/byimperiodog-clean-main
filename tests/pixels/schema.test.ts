import { describe, it, expect } from 'vitest';
import { environmentSchema } from '../../app/(admin)/admin/(protected)/pixels/schema';

function baseEnv(overrides: Partial<any> = {}) {
  return {
    gtmId: undefined,
    ga4Id: undefined,
    metaPixelId: undefined,
    tiktokPixelId: undefined,
    googleAdsId: undefined,
    googleAdsConversionLabel: undefined,
    pinterestId: undefined,
    hotjarId: undefined,
    clarityId: undefined,
    metaDomainVerification: undefined,
    analyticsConsent: true,
    marketingConsent: false,
    ...overrides,
  };
}

describe('environmentSchema valid patterns', () => {
  it('accepts empty (undefined) identifiers', () => {
    const parsed = environmentSchema.parse(baseEnv());
    expect(parsed.gtmId).toBe('');
    expect(parsed.ga4Id).toBe('');
  });

  it('accepts valid identifiers', () => {
    const parsed = environmentSchema.parse(baseEnv({
      gtmId: 'GTM-ABCD12',
      ga4Id: 'G-ABCDEF1234',
      metaPixelId: '12345678',
      tiktokPixelId: 'ABC123',
      googleAdsId: 'AW-123456789',
      pinterestId: '12345',
      hotjarId: '12345',
      clarityId: 'ABCDEF1',
      metaDomainVerification: 'tokenVALUE123_-',
    }));
    expect(parsed.gtmId).toBe('GTM-ABCD12');
    expect(parsed.ga4Id).toBe('G-ABCDEF1234');
  });
});

describe('environmentSchema invalid patterns', () => {
  it('rejects invalid GTM id', () => {
    expect(() => environmentSchema.parse(baseEnv({ gtmId: 'INVALID' }))).toThrow();
  });
  it('rejects invalid GA4 id', () => {
    expect(() => environmentSchema.parse(baseEnv({ ga4Id: 'G-TOO-SHORT' }))).toThrow();
  });
  it('rejects invalid Meta Pixel id', () => {
    expect(() => environmentSchema.parse(baseEnv({ metaPixelId: 'abc123' }))).toThrow();
  });
  it('rejects invalid TikTok Pixel id', () => {
    expect(() => environmentSchema.parse(baseEnv({ tiktokPixelId: '***' }))).toThrow();
  });
  it('rejects invalid Google Ads id', () => {
    expect(() => environmentSchema.parse(baseEnv({ googleAdsId: '123456' }))).toThrow();
  });
  it('rejects invalid Pinterest id', () => {
    expect(() => environmentSchema.parse(baseEnv({ pinterestId: 'abcd' }))).toThrow();
  });
  it('rejects invalid Hotjar id', () => {
    expect(() => environmentSchema.parse(baseEnv({ hotjarId: 'abc' }))).toThrow();
  });
  it('rejects invalid Clarity id', () => {
    expect(() => environmentSchema.parse(baseEnv({ clarityId: '??' }))).toThrow();
  });
  it('rejects invalid Meta Domain Verification token', () => {
    expect(() => environmentSchema.parse(baseEnv({ metaDomainVerification: 'short' }))).toThrow();
  });
});

describe('environmentSchema consent aggregate rule', () => {
  it('fails when no consent selected', () => {
    expect(() => environmentSchema.parse(baseEnv({ analyticsConsent: false, marketingConsent: false }))).toThrow();
  });
  it('passes when at least one consent selected (marketing)', () => {
    const parsed = environmentSchema.parse(baseEnv({ analyticsConsent: false, marketingConsent: true }));
    expect(parsed.marketingConsent).toBe(true);
  });
});
