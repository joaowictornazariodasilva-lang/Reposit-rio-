import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end suite: boots a fresh API (temporary database, mock payments) and the
 * Vite dev server, then drives the real UI on desktop and phone viewports.
 *   npm run test:e2e
 */
const DATA_FILE = `${process.env.TMPDIR ?? '/tmp'}/nazario-e2e-${Date.now()}.json`;

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure',
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'npx tsx apps/api/src/server.ts',
      env: { PORT: '8788', DATA_FILE, PAYMENT_PROVIDER: 'mock', LOGIN_RATE_LIMIT: '1000', ORDER_RATE_LIMIT: '1000' },
      url: 'http://localhost:8788/api/health',
      reuseExistingServer: false,
    },
    {
      command: 'npx vite --port 5174 --strictPort',
      cwd: 'apps/web',
      env: { API_TARGET: 'http://localhost:8788' },
      url: 'http://localhost:5174',
      reuseExistingServer: false,
    },
  ],
});
