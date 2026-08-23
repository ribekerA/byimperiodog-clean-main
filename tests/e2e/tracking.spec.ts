import { expect, test, type Page } from '@playwright/test';

import { signAdminSession } from '../../src/lib/adminSession';
import type { TrackingConfig } from '../../src/lib/tracking/getTrackingConfig';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

const emptyConfig = (): TrackingConfig => ({
  isGTMEnabled: false,
  gtmContainerId: null,
  isGAEnabled: false,
  gaMeasurementId: null,
  isFacebookEnabled: false,
  facebookPixelId: null,
  isTikTokEnabled: false,
  tiktokPixelId: null,
  metaDomainVerification: null,
  googleSiteVerification: null,
  googleAdsId: null,
  hotjarId: null,
  clarityId: null,
  pinterestId: null,
});

type TrackingApiMock = {
  getConfig: (environment?: string) => TrackingConfig;
  requests: Array<{ method: string; pathname: string }>;
};

async function addLocalAdminSession(page: Page) {
  if (!process.env.ADMIN_SESSION_SECRET) {
    throw new Error('ADMIN_SESSION_SECRET precisa estar configurado para os E2E locais.');
  }

  const token = await signAdminSession({
    userId: 'playwright-local',
    email: 'playwright@local.test',
    name: 'Playwright Local',
    role: 'owner',
  });

  await page.context().addCookies([
    {
      name: 'admin_session',
      value: token,
      url: BASE_URL,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

async function mockTrackingApi(page: Page): Promise<TrackingApiMock> {
  const configs: Record<string, TrackingConfig> = {
    production: emptyConfig(),
    staging: emptyConfig(),
    development: emptyConfig(),
  };
  const requests: TrackingApiMock['requests'] = [];

  await page.route('**/api/admin/tracking-settings**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push({ method: request.method(), pathname: url.pathname });

    if (request.method() === 'GET') {
      const environment = url.searchParams.get('environment') || 'production';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ environment, config: configs[environment] ?? emptyConfig() }),
      });
      return;
    }

    if (request.method() === 'POST') {
      const payload = request.postDataJSON() as Partial<TrackingConfig> & { environment?: string };
      const environment = payload.environment || 'production';
      const current = configs[environment] ?? emptyConfig();
      configs[environment] = {
        ...current,
        ...Object.fromEntries(
          Object.entries(payload).filter(([key]) => key !== 'environment')
        ),
      } as TrackingConfig;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ environment, config: configs[environment] }),
      });
      return;
    }

    await route.fulfill({
      status: 405,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Method not allowed' }),
    });
  });

  // A rota mais específica é registrada por último porque o Playwright
  // avalia os handlers na ordem inversa de registro.
  await page.route('**/api/admin/tracking-settings/history**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push({ method: request.method(), pathname: url.pathname });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ history: [] }),
    });
  });

  return {
    getConfig: (environment = 'production') => configs[environment],
    requests,
  };
}

test.describe('Admin de tracking - acesso', () => {
  test('login exibe os campos atuais de email e senha', async ({ page }) => {
    await page.goto('/admin/login');

    await expect(page.getByRole('heading', { name: 'Acesso Admin' })).toBeVisible();
    await expect(page.getByPlaceholder('admin@exemplo.com')).toBeVisible();
    await expect(page.getByPlaceholder('********')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('rota protegida redireciona visitante para o login', async ({ page }) => {
    await page.goto('/admin/config/tracking');

    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});

test.describe('Admin de tracking - configuração isolada', () => {
  let api: TrackingApiMock;

  test.beforeEach(async ({ page }) => {
    await addLocalAdminSession(page);
    api = await mockTrackingApi(page);
    await page.goto('/admin/config/tracking');
    await expect(page.getByRole('heading', { name: 'Tracking & Pixels' })).toBeVisible();
  });

  test('exibe os campos da rota atual', async ({ page }) => {
    await expect(page.getByPlaceholder('GTM-XXXXXXX')).toBeVisible();
    await expect(page.getByPlaceholder('G-XXXXXXXXXX')).toBeVisible();
    await expect(page.getByPlaceholder('1234567890')).toBeVisible();
    await expect(page.getByPlaceholder('C4A3XXXXXXXXXX')).toBeVisible();
  });

  test('salva Meta Pixel somente no mock local e preserva após recarregar', async ({ page }) => {
    await page.getByPlaceholder('1234567890').fill('1234567890');
    await page.getByRole('switch', { name: 'Ativar Meta / Facebook Pixel' }).check({ force: true });
    await page.getByRole('button', { name: 'Salvar configurações' }).click();

    await expect(page.getByText('Tracking salvo com sucesso.')).toBeVisible();
    expect(api.getConfig().facebookPixelId).toBe('1234567890');
    expect(api.getConfig().isFacebookEnabled).toBe(true);

    await page.reload();
    await expect(page.getByPlaceholder('1234567890')).toHaveValue('1234567890');
  });

  test('salva Google Analytics somente no mock local', async ({ page }) => {
    await page.getByPlaceholder('G-XXXXXXXXXX').fill('G-ABCD123456');
    await page.getByRole('switch', { name: 'Ativar Google Analytics 4' }).check({ force: true });
    await page.getByRole('button', { name: 'Salvar configurações' }).click();

    await expect(page.getByText('Tracking salvo com sucesso.')).toBeVisible();
    expect(api.getConfig().gaMeasurementId).toBe('G-ABCD123456');
    expect(api.getConfig().isGAEnabled).toBe(true);
  });

  test('valida Meta Pixel curto sem enviar POST', async ({ page }) => {
    await page.getByPlaceholder('1234567890').fill('12');
    await expect(page.getByText('Formato inválido')).toBeVisible();
    await page.getByRole('button', { name: 'Salvar configurações' }).click();

    await expect(page.getByText('Corrija os campos antes de salvar.')).toBeVisible();
    expect(api.requests.filter((request) => request.method === 'POST')).toHaveLength(0);
  });

  test('valida o formato antigo do Google Analytics sem enviar POST', async ({ page }) => {
    await page.getByPlaceholder('G-XXXXXXXXXX').fill('UA-12345-1');
    await expect(page.getByText('Formato inválido')).toBeVisible();
    await page.getByRole('button', { name: 'Salvar configurações' }).click();

    await expect(page.getByText('Corrija os campos antes de salvar.')).toBeVisible();
    expect(api.requests.filter((request) => request.method === 'POST')).toHaveLength(0);
  });

  test('permite limpar um ID salvo', async ({ page }) => {
    const input = page.getByPlaceholder('1234567890');
    const toggle = page.getByRole('switch', { name: 'Ativar Meta / Facebook Pixel' });
    await input.fill('1234567890');
    await toggle.check({ force: true });
    await page.getByRole('button', { name: 'Salvar configurações' }).click();
    await expect(page.getByText('Tracking salvo com sucesso.')).toBeVisible();

    await input.fill('');
    await toggle.uncheck({ force: true });
    await page.getByRole('button', { name: 'Salvar configurações' }).click();
    await expect(page.getByText('Tracking salvo com sucesso.').last()).toBeVisible();

    expect(api.getConfig().facebookPixelId).toBe('');
    expect(api.getConfig().isFacebookEnabled).toBe(false);
  });

  test('gera diagnóstico local sem chamada de gravação', async ({ page }) => {
    await page.getByRole('button', { name: 'Testar configuração' }).click();

    await expect(page.getByText('Diagnóstico', { exact: true })).toBeVisible();
    expect(api.requests.filter((request) => request.method === 'POST')).toHaveLength(0);
  });

  test('troca de ambiente carregando apenas dados simulados', async ({ page }) => {
    await page.getByRole('button', { name: 'Staging' }).click();

    await expect(page.getByText('Ambiente Staging carregado.')).toBeVisible();
    expect(api.requests.some((request) => request.pathname === '/api/admin/tracking-settings')).toBe(true);
  });

  test('histórico vazio é carregado pelo mock local', async ({ page }) => {
    await page.getByRole('button', { name: 'Histórico' }).click();

    await expect(page.getByText('Nenhuma alteração registrada ainda.')).toBeVisible({ timeout: 10_000 });
    expect(api.requests.some((request) => request.pathname.endsWith('/history'))).toBe(true);
  });
});

test.describe('APIs de tracking', () => {
  test('GET público responde com campos públicos e sem segredos', async ({ request }) => {
    const response = await request.get('/api/settings/tracking');
    const data = await response.json();

    expect(response.ok()).toBe(true);
    expect(data).toHaveProperty('settings');
    expect(data.settings).toHaveProperty('meta_pixel_id');
    expect(data.settings).toHaveProperty('ga4_id');
    expect(data.settings).not.toHaveProperty('fb_capi_token');
    expect(data.settings).not.toHaveProperty('tiktok_api_token');
  });

  test('POST administrativo sem autenticação retorna 401', async ({ request }) => {
    const response = await request.post('/api/admin/tracking-settings', {
      data: { environment: 'production', facebookPixelId: '1234567890' },
    });

    expect(response.status()).toBe(401);
  });
});
