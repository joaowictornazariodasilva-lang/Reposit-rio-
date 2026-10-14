import { defineConfig, devices } from "@playwright/test";

/**
 * E2E: gera o build de produção e sobe com um banco PGlite novo (dados de
 * demonstração), depois dirige a interface em desktop (1440 px) e celular (390 px).
 *   npm run test:e2e
 */
const PORTA = 3200;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: "retain-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Fortaleza",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "celular", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `rm -rf .data/e2e && npm run build && npx next start -p ${PORTA}`,
    env: { PGLITE_DIR: ".data/e2e", DEMO_SEED: "true", COOKIE_INSECURE: "true" },
    url: `http://localhost:${PORTA}/api/health`,
    timeout: 300_000,
    reuseExistingServer: !!process.env.E2E_REUSAR,
  },
});
