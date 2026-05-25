/**
 * Testes E2E - Módulo de Tracking/Pixels
 * By Império Dog - Sistema de Pixels/Analytics
 * 
 * Testes completos do fluxo:
 * 1. Login no admin
 * 2. Navegar para /admin/settings/tracking
 * 3. Configurar Facebook Pixel e Google Analytics
 * 4. Salvar configurações
 * 5. Testar pixels
 * 6. Verificar injeção no frontend
 */

import { test, expect } from '@playwright/test';

// Configurações de teste
// Ajuste: sistema atual utiliza somente senha (campo "Senha") sem email.
// Usa ordem de fallback para reutilizar senha real configurada em .env.local.
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD
  || process.env.NEXT_PUBLIC_ADMIN_PASS
  || process.env.ADMIN_PASS
  || 'test123';
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Tracking Settings - Configuração de Pixels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    const passwordField = page.locator('input#admin-password');
    await expect(passwordField).toBeVisible();
    await passwordField.fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /Entrar no painel/i }).click();
    await page.waitForURL(/\/admin(?!\/login)/);
  });

  test('deve acessar a página de configuração de tracking', async ({ page }) => {
    // Navegar para página de tracking
    // Nova rota de pixels
    await page.goto(`${BASE_URL}/admin/pixels`);
    await expect(page.locator('h1')).toContainText('Pixels e Consentimento');
    // Campos agora são por ambiente: production.gtmId etc.
    await expect(page.getByPlaceholder('GTM-XXXXXXX')).toBeVisible();
    await expect(page.getByPlaceholder('G-XXXXXXXXX')).toBeVisible();
    await expect(page.getByPlaceholder('1234567890')).toBeVisible();
  });

  test('deve configurar Facebook Pixel ID', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/pixels`);
    
    const testPixelId = '12345678'; // dentro do padrão 8-20 dígitos
    // Marcar consentimento de marketing (necessário para salvar)
    await page.getByText(/Requer consentimento para marketing/i).click();
    // Preencher campo (Meta Pixel)
    const metaInput = page.getByPlaceholder('1234567890');
    await metaInput.fill(testPixelId);
    await page.getByRole('button', { name: /Salvar configuracoes/i }).click();
    await expect(page.getByText(/Configuracoes atualizadas com sucesso/i)).toBeVisible({ timeout: 8000 });
    await page.reload();
    await expect(metaInput).toHaveValue(testPixelId);
  });

  test('deve configurar Google Analytics ID', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/pixels`);
    
    const testGA4Id = 'G-ABCDEF1234';
    
    // Preencher campo
    // Consentimento analytics
    await page.getByText(/Requer consentimento para analytics/i).click();
    const gaInput = page.getByPlaceholder('G-XXXXXXXXX');
    await gaInput.fill(testGA4Id);
    await page.getByRole('button', { name: /Salvar configuracoes/i }).click();
    await expect(page.getByText(/Configuracoes atualizadas com sucesso/i)).toBeVisible({ timeout: 8000 });
    await page.reload();
    await expect(gaInput).toHaveValue(testGA4Id);
  });

  test('deve validar formato de Facebook Pixel ID', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/pixels`);
    
    // Tentar salvar ID inválido (com letras)
    const metaInput = page.getByPlaceholder('1234567890');
    await metaInput.fill('abc123xyz'); // inválido (letras)
    
    // Salvar
    await page.getByText(/Requer consentimento para marketing/i).click();
    await page.getByRole('button', { name: /Salvar configuracoes/i }).click();
    
    // Esperar mensagem de erro
    await expect(page.getByText(/Pixel Meta deve conter somente 8-20 digitos/i)).toBeVisible({ timeout: 8000 });
  });

  test('deve validar formato de Google Analytics ID', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/pixels`);
    
    // Tentar salvar ID inválido (formato antigo UA-)
    const gaInput = page.getByPlaceholder('G-XXXXXXXXX');
    await gaInput.fill('UA-12345-1');
    
    // Salvar
    await page.getByText(/Requer consentimento para analytics/i).click();
    await page.getByRole('button', { name: /Salvar configuracoes/i }).click();
    
    // Esperar mensagem de erro
    await expect(page.getByText(/Formato GA4 invalido/i)).toBeVisible({ timeout: 8000 });
  });

  test('deve permitir limpar campos (desabilitar pixels)', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/pixels`);
    
    // Preencher campo
    const metaInput = page.getByPlaceholder('1234567890');
    await page.getByText(/Requer consentimento para marketing/i).click();
    await metaInput.fill('12345678');
    await page.getByRole('button', { name: /Salvar configuracoes/i }).click();
    await expect(page.getByText(/Configuracoes atualizadas com sucesso/i)).toBeVisible();
    
    // Limpar campo
    await metaInput.fill('');
    await page.getByRole('button', { name: /Salvar configuracoes/i }).click();
    await expect(page.getByText(/Configuracoes atualizadas com sucesso/i)).toBeVisible();
    
    // Recarregar e verificar que está vazio
    await page.reload();
    await expect(metaInput).toHaveValue('');
  });
});

test.describe('Tracking Settings - Teste de Pixels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    const passwordField = page.locator('input#admin-password');
    await passwordField.fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /Entrar no painel/i }).click();
    await page.waitForURL(/\/admin(?!\/login)/);
    await page.goto(`${BASE_URL}/admin/pixels`);
    await page.getByText(/Requer consentimento para marketing/i).click();
    await page.getByText(/Requer consentimento para analytics/i).click();
    await page.getByPlaceholder('1234567890').fill('12345678');
    await page.getByPlaceholder('G-XXXXXXXXX').fill('G-ABCDEF1234');
    await page.getByRole('button', { name: /Salvar configuracoes/i }).click();
    await expect(page.getByText(/Configuracoes atualizadas com sucesso/i)).toBeVisible();
  });

  test('botão "Testar Facebook Pixel" deve estar visível', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/pixels`);
    
    // Verificar que botão de teste aparece
    await expect(page.getByRole('button', { name: /Testar Facebook Pixel/i })).toBeVisible();
  });

  test('botão "Testar Google Analytics" deve estar visível', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/pixels`);
    
    // Verificar que botão de teste aparece
    await expect(page.getByRole('button', { name: /Testar Google Analytics/i })).toBeVisible();
  });

  test('clicar em "Testar Pixel" deve mostrar feedback', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/pixels`);
    
    // Mock do window.fbq para simular pixel carregado
    await page.evaluate(() => {
      (window as unknown as { fbq: () => void }).fbq = () => {};
    });
    
    // Listener para alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Evento de teste enviado');
      await dialog.accept();
    });
    
    // Clicar no botão de teste
    await page.getByRole('button', { name: /Testar Facebook Pixel/i }).click();
  });
});

test.describe('Frontend - Injeção de Scripts', () => {
  test('deve injetar Facebook Pixel no frontend quando configurado', async ({ page }) => {
    // Configurar pixel primeiro
    await page.goto(`${BASE_URL}/admin/login`);
    const passwordField = page.locator('input#admin-password');
    await passwordField.fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /Entrar no painel/i }).click();
    await page.waitForURL(/\/admin(?!\/login)/);
    await page.goto(`${BASE_URL}/admin/pixels`);
    await page.getByText(/Requer consentimento para marketing/i).click();
    await page.getByPlaceholder('1234567890').fill('12345678');
    await page.getByRole('button', { name: /Salvar configuracoes/i }).click();
    await expect(page.getByText(/Configuracoes atualizadas com sucesso/i)).toBeVisible();
    
    // Ir para página pública
    await page.goto(`${BASE_URL}/`);
    
    // Verificar que script foi injetado
    const fbqExists = await page.evaluate(() => {
      const win = window as unknown as { fbq?: () => void };
      return typeof win.fbq === 'function';
    });
    
    expect(fbqExists).toBeTruthy();
  });

  test('deve injetar Google Analytics no frontend quando configurado', async ({ page }) => {
    // Configurar GA4
    await page.goto(`${BASE_URL}/admin/login`);
    const passwordField = page.locator('input#admin-password');
    await passwordField.fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /Entrar no painel/i }).click();
    await page.waitForURL(/\/admin(?!\/login)/);
    await page.goto(`${BASE_URL}/admin/pixels`);
    await page.getByText(/Requer consentimento para analytics/i).click();
    await page.getByPlaceholder('G-XXXXXXXXX').fill('G-ABCDEF1234');
    await page.getByRole('button', { name: /Salvar configuracoes/i }).click();
    await expect(page.getByText(/Configuracoes atualizadas com sucesso/i)).toBeVisible();
    
    // Ir para página pública
    await page.goto(`${BASE_URL}/`);
    
    // Verificar que script foi injetado
    const gtagExists = await page.evaluate(() => {
      const win = window as unknown as { gtag?: () => void };
      return typeof win.gtag === 'function';
    });
    
    expect(gtagExists).toBeTruthy();
  });

  test('não deve injetar pixels quando não configurados', async ({ page }) => {
    // Limpar configurações
    await page.goto(`${BASE_URL}/admin/login`);
    const passwordField = page.locator('input#admin-password');
    await passwordField.fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /Entrar no painel/i }).click();
    await page.waitForURL(/\/admin(?!\/login)/);
    await page.goto(`${BASE_URL}/admin/pixels`);
    // Marcar ambos consentimentos para permitir salvar vazio
    await page.getByText(/Requer consentimento para marketing/i).click();
    await page.getByText(/Requer consentimento para analytics/i).click();
    await page.getByPlaceholder('1234567890').fill('');
    await page.getByPlaceholder('G-XXXXXXXXX').fill('');
    await page.getByRole('button', { name: /Salvar configuracoes/i }).click();
    
    // Ir para página pública
    await page.goto(`${BASE_URL}/`);
    
    // Aguardar um pouco para garantir que não injetou
    await page.waitForTimeout(2000);
    
    // Verificar que scripts NÃO foram injetados
    const fbqExists = await page.evaluate(() => {
      const win = window as unknown as { fbq?: () => void };
      return typeof win.fbq === 'function';
    });
    
    expect(fbqExists).toBeFalsy();
  });
});

test.describe('API - Endpoints de Tracking', () => {
  test('GET /api/settings/tracking deve retornar configurações públicas', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/settings/tracking`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('settings');
    expect(data.settings).toHaveProperty('meta_pixel_id');
    expect(data.settings).toHaveProperty('ga4_id');
    
    // Não deve expor tokens secretos
    expect(data.settings).not.toHaveProperty('fb_capi_token');
    expect(data.settings).not.toHaveProperty('tiktok_api_token');
  });

  test('POST /api/admin/settings deve requerer autenticação', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/admin/settings`, {
      data: {
        meta_pixel_id: '1234567890123456',
      },
    });
    
    // Deve retornar 401 sem autenticação
    expect(response.status()).toBe(401);
  });
});
