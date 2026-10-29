import { defineConfig, devices } from '@playwright/test';

const phone = { ...devices['Pixel 7'], browserName: 'chromium' as const };
export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', trace: 'off', screenshot: 'off' },
  webServer: { command: 'npm run build && npx vite preview --port 4173 --strictPort', port: 4173, reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: 'desktop-1440x900', use: { viewport: { width: 1440, height: 900 }, hasTouch: false } },
    { name: 'phone-portrait-390x844', use: { ...phone, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } },
    { name: 'phone-landscape-844x390', use: { ...phone, viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } },
  ],
});
