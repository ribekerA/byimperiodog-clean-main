import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
    setupFiles: ['tests/setup/test-env.ts'],
    coverage: { reporter: ['text','html','json-summary'], enabled: true, reportsDirectory: 'coverage' },
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://npmnuihgydadihktglrd.supabase.co',
      // Valor falso de proposito. Aqui esteve uma service_role de producao, o que
      // significa que a suite inteira rodava com RLS ignorada contra o banco real.
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'chave-anon-de-teste'
    }
  },
  resolve: {
    alias: {
      // Espelha os paths do tsconfig. Sem '@/content' e '@/domain' o vitest
      // resolvia para src/content e src/domain — pastas que nao existem — e
      // qualquer teste de componente que importasse dai quebrava na coleta.
      '@/lib': resolve(__dirname, './src/lib'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/types': resolve(__dirname, './src/types'),
      '@/domain': resolve(__dirname, './src/domain'),
      '@/content': resolve(__dirname, './content'),
      '@/public': resolve(__dirname, './public'),
      '@': resolve(__dirname, './src'),
    }
  }
});
