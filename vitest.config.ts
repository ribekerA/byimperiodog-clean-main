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
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbW51aWhneWRhZGloa3RnbHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2OTAwODYsImV4cCI6MjA3MTI2NjA4Nn0.fKsON7BroWxgzxVaF0V4Jh3AZdKlW0a70J29fGvTjGg'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/components': resolve(__dirname, './src/components'),
    }
  }
});
