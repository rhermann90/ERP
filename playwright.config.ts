import { defineConfig, devices } from "@playwright/test";

const reuse = !process.env.CI;

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
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm run dev",
      cwd: ".",
      url: "http://127.0.0.1:3000/health",
      reuseExistingServer: reuse,
      timeout: 120_000,
      env: {
        ...process.env,
        NODE_ENV: "development",
        ERP_HTTP_PORT: "3000",
        /** Browser-Origin der Vite-PWA im E2E (127.0.0.1 ≠ localhost für CORS). */
        CORS_ORIGINS: "http://127.0.0.1:5173,http://localhost:5173",
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
      command: "npm run dev -w apps/web -- --host 127.0.0.1 --port 5173 --strictPort",
      cwd: ".",
      url: "http://127.0.0.1:5173/",
      reuseExistingServer: reuse,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_DEFAULT_TENANT_ID: "11111111-1111-4111-8111-111111111111",
        VITE_API_BASE_URL: "http://127.0.0.1:3000",
      },
    },
  ],
});
