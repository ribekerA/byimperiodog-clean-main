import { loadEnvConfig } from '@next/env';
import { defineConfig, devices } from '@playwright/test';

loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  workers: process.env.CI ? undefined : 2,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], process.env.CI ? ['github'] : ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
  // Qual servidor sobe para o smoke.
  //
  // Local o padrao e `npm run dev`, que e o que ja esta de pe na maquina de
  // quem desenvolve. No CI o smoke roda depois do `npm run build`, e o que
  // interessa ali e a saida de producao -- outro compilador, outro cache,
  // outro HTML. Passar no dev e reprovar no build ja aconteceu neste projeto,
  // entao o comando e uma variavel em vez de uma constante.
  webServer: {
    command: process.env.PLAYWRIGHT_WEB_SERVER || 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
