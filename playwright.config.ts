import { defineConfig, devices } from "@playwright/test";

/**
 * Dedizierte Ports — vermeidet Konflikt mit lokalem `npm run dev` (3000) / `dev:web` (5173).
 * Wiederverwendung nur mit `PW_TEST_REUSE_SERVERS=1`, wenn dieselben Ports bereits die E2E-Instanzen sind.
 */
const reuse = process.env.CI ? false : process.env.PW_TEST_REUSE_SERVERS === "1";

const E2E_API_PORT = "13000";
const E2E_WEB_PORT = "15173";
const e2eWebOrigin = `http://127.0.0.1:${E2E_WEB_PORT}`;

/**
 * Rauchtest: API (Memory + Env-Login) und Vite-PWA parallel starten.
 * In CI: Job-`DATABASE_URL` wird für den API-Webserver-Prozess geleert (Memory erzwingen).
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: e2eWebOrigin,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm run dev",
      cwd: ".",
      url: `http://127.0.0.1:${E2E_API_PORT}/health`,
      reuseExistingServer: reuse,
      timeout: 120_000,
      env: {
        ...process.env,
        NODE_ENV: "development",
        ERP_HTTP_PORT: E2E_API_PORT,
        /** Browser-Origin der Vite-PWA im E2E (127.0.0.1 ≠ localhost für CORS). */
        CORS_ORIGINS: `${e2eWebOrigin},http://localhost:${E2E_WEB_PORT}`,
        ERP_ALLOW_INSECURE_DEV_AUTH: "1",
        ERP_REPOSITORY: "memory",
        DATABASE_URL: "",
        ERP_LOGIN_EMAIL: "e2e-ops@example.com",
        ERP_LOGIN_PASSWORD: "e2e-correct-horse-battery-staple",
        ERP_LOGIN_TENANT_ID: "11111111-1111-4111-8111-111111111111",
        ERP_LOGIN_USER_ID: "77777777-7777-4777-8777-777777777777",
        ERP_LOGIN_ROLE: "ADMIN",
      },
    },
    {
      command: `npm run dev -w apps/web -- --host 127.0.0.1 --port ${E2E_WEB_PORT} --strictPort`,
      cwd: ".",
      url: `${e2eWebOrigin}/`,
      reuseExistingServer: reuse,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_DEFAULT_TENANT_ID: "11111111-1111-4111-8111-111111111111",
        VITE_API_BASE_URL: `http://127.0.0.1:${E2E_API_PORT}`,
      },
    },
  ],
});
