import { describe, expect, it } from "vitest";

// @ts-expect-error Standalone diagnostic CLI has no TypeScript declarations.
import { AUDIT_PATHS, psiURL, summarizeField, summarizeLighthouse } from "../scripts/psi-validation.mjs";

describe("PageSpeed evidence", () => {
  it("requests every category without overwriting performance", () => {
    expect(psiURL("https://byimperiodog.com.br/", "mobile").searchParams.getAll("category"))
      .toEqual(["performance", "seo", "accessibility", "best-practices"]);
    expect(AUDIT_PATHS).toHaveLength(6);
  });
  it("does not invent scores or INP from missing or legacy FID measurements", () => {
    const result = summarizeLighthouse({ audits: { "max-potential-fid": { numericValue: 12 } } });
    expect(result.performance).toBeNull();
    expect(result.inpMs).toBeNull();
    expect(result.lcpMs).toBeNull();
    expect(result.cls).toBeNull();
    expect(result.tbtMs).toBeNull();
  });
  it("separates field p75 and converts the PSI CLS scale", () => {
    expect(summarizeField(undefined).status).toBe("SEM DADOS SUFICIENTES");
    const result = summarizeField({ metrics: {
      LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2400 },
      INTERACTION_TO_NEXT_PAINT: { percentile: 180 },
      CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 9 },
    } });
    expect(result).toMatchObject({ lcpMs: 2400, inpMs: 180, cls: 0.09 });
  });
});
