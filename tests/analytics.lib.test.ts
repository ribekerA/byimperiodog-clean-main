import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

type FetchSpy = ReturnType<typeof vi.fn>;
interface NavigatorMock { sendBeacon: (...args: unknown[]) => boolean; onLine: boolean }

function restoreEnv() { process.env = { ...ORIGINAL_ENV }; }
function flushMicrotasks() { return Promise.resolve(); }

// Helper para simular ambiente de produção / desenvolvimento sem reatribuir NODE_ENV diretamente (read‑only em build types)
function setProd(prod: boolean) {
  if (prod) {
    process.env.FAKE_ENV = 'production';
    (process as unknown as { env: Record<string, string> }).env.NODE_ENV = 'production';
  } else {
    process.env.FAKE_ENV = 'development';
    (process as unknown as { env: Record<string, string> }).env.NODE_ENV = 'development';
  }
}

describe('analytics client (analytics.ts)', () => {
  let fetchSpy: FetchSpy;
  let beaconSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    restoreEnv();
    setProd(true);
    // reset globals
    // @ts-expect-error removing for test reinit
    delete global.navigator;
  fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchSpy as unknown as typeof fetch;

    beaconSpy = vi.fn().mockReturnValue(true);
    const nav: NavigatorMock = { sendBeacon: beaconSpy, onLine: true };
    // @ts-expect-error test navigator mock
    global.navigator = nav;
    // @ts-expect-error location mock
    global.location = { pathname: '/test-path' };
    // Mock window para initWebVitals (checa typeof window)
    // @ts-expect-error window mock
    global.window = {};
  });

  afterEach(() => {
    restoreEnv();
    vi.useRealTimers();
    vi.resetModules();
  });

  async function load() {
    vi.resetModules();
    return await import('../src/lib/analytics');
  }

  it('skips when disabled via env', async () => {
    process.env.DISABLE_ANALYTICS = '1';
    const { logEvent } = await load();
    logEvent('evt_disabled');
    await flushMicrotasks();
    expect(beaconSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('skips in dev without FORCE', async () => {
    setProd(false);
    const { logEvent } = await load();
    logEvent('evt_dev');
    await flushMicrotasks();
    expect(beaconSpy).not.toHaveBeenCalled();
  });

  it('forces in dev when NEXT_PUBLIC_FORCE_ANALYTICS=1', async () => {
    setProd(false);
    process.env.NEXT_PUBLIC_FORCE_ANALYTICS = '1';
    const { logEvent } = await load();
    logEvent('evt_forced');
    await flushMicrotasks();
    expect(beaconSpy).toHaveBeenCalledTimes(1);
  });

  it('dedupes identical (name+id+path) inside 15s window', async () => {
    vi.useFakeTimers();
    const { logEvent } = await load();
    logEvent('dup', { x: 1 });
    await flushMicrotasks();
    logEvent('dup', { x: 2 });
    await flushMicrotasks();
    expect(beaconSpy).toHaveBeenCalledTimes(1);
    // flush pending timer scheduling
    vi.runOnlyPendingTimers();
    vi.advanceTimersByTime(16_000); // expira janela de 15s
    logEvent('dup', { x: 3 });
    await flushMicrotasks();
    expect(beaconSpy).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  }, 10000);

  it('falls back to fetch when sendBeacon returns false', async () => {
    beaconSpy.mockReturnValue(false);
    const { logEvent } = await load();
    logEvent('fallback');
    await flushMicrotasks();
    expect(beaconSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const bodySent = (fetchSpy.mock.calls[0][1] as { body: string }).body;
    expect(bodySent).toContain('"name":"fallback"');
  });

  it('skips when offline', async () => {
    // @ts-expect-error navigator test mutation
    global.navigator.onLine = false;
    const { logEvent } = await load();
    logEvent('offline_evt');
    await flushMicrotasks();
    expect(beaconSpy).not.toHaveBeenCalled();
  });

  it('initWebVitals loads web-vitals and posts metrics', async () => {
    const mod = await load();
    const { __setWebVitalsTest, __getAnalyticsGates, initWebVitals } = mod;
    const gates = __getAnalyticsGates();
    expect(gates.DISABLED).toBe(false);
    expect(gates.IS_PROD || gates.FORCE).toBe(true);
    expect(gates.windowDefined).toBe(true);

    // Local arrays para capturar callbacks
    const lcpCbs: Array<(m: { value: number; id: string; name: string }) => void> = [];
    const inpCbs: Array<(m: { value: number; id: string; name: string }) => void> = [];
    const clsCbs: Array<(m: { value: number; id: string; name: string }) => void> = [];
    __setWebVitalsTest({
      onLCP: cb => lcpCbs.push(cb),
      onINP: cb => inpCbs.push(cb),
      onCLS: cb => clsCbs.push(cb),
    });

    await initWebVitals();
    await flushMicrotasks();
    expect(lcpCbs).toHaveLength(1);
    // Dispara métrica simulada
    lcpCbs[0]({ value: 123, id: 'metric1', name: 'LCP' });
    await flushMicrotasks();
    expect(beaconSpy).toHaveBeenCalled();
  });
});

