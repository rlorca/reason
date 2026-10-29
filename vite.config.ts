import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { target: 'es2022', assetsInlineLimit: 0 },
  server: { host: true },
  test: { include: ['tests/**/*.test.ts'] },
} as any);
