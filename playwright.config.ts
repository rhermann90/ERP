import { defineConfig, devices } from "@playwright/test";

/**
 * Dedizierte Ports — vermeidet Konflikt mit lokalem `npm run dev` (3000) / `dev:web` (5173).
 * Wiederverwendung nur mit `PW_TEST_REUSE_SERVERS=1`, wenn dieselben Ports bereits die E2E-Instanzen sind.
 */
const reuse = process.env.CI ? false : process.env.PW_TEST_REUSE_SERVERS === "1";

const E2E_API_PORT = "13000";
const E2E_WEB_PORT = "15173";
const e2eWebOrigin = `http://127.0.0.1:${E2E_WEB_PORT}`;

/** CI / lokale Parität: API mit Prisma + `migrate deploy` (siehe Job `e2e-smoke` in `.github/workflows/ci.yml`). */
const e2ePostgres = process.env.E2E_USE_POSTGRES === "1";

function buildApiWebServerEnv(): NodeJS.ProcessEnv {
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (e2ePostgres && !dbUrl) {
    throw new Error("E2E_USE_POSTGRES=1 setzt voraus, dass DATABASE_URL gesetzt ist (Postgres für den API-WebServer).");
  }

  const base: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "development",
    /** Viele parallele Shell-/Finanz-Requests von 127.0.0.1 — globales Fastify-Limit sonst 429. */
    ERP_HTTP_GLOBAL_RATE_LIMIT_MAX: "50000",
    ERP_HTTP_PORT: E2E_API_PORT,
    /** Browser-Origin der Vite-PWA im E2E (127.0.0.1 ≠ localhost für CORS). */
    CORS_ORIGINS: `${e2eWebOrigin},http://localhost:${E2E_WEB_PORT}`,
    ERP_ALLOW_INSECURE_DEV_AUTH: "1",
    ERP_LOGIN_EMAIL: "e2e-ops@example.com",
    ERP_LOGIN_PASSWORD: "e2e-correct-horse-battery-staple",
    ERP_LOGIN_TENANT_ID: "11111111-1111-4111-8111-111111111111",
    ERP_LOGIN_USER_ID: "77777777-7777-4777-8777-777777777777",
    ERP_LOGIN_ROLE: "ADMIN",
  };

  if (e2ePostgres) {
    const { ERP_REPOSITORY: _drop, ...rest } = base;
    return {
      ...rest,
      DATABASE_URL: dbUrl,
      /**
       * Postgres-Login: `performPasswordLogin` nutzt die DB (`users`), nicht den reinen Env-Bootstrap.
       * Seed (`seed-auth-prisma`) muss dieselbe E-Mail/Passwort-Kombination wie die E2E-Formularwerte erzeugen.
       */
      ERP_SEED_ADMIN_EMAIL: "e2e-ops@example.com",
      ERP_SEED_ADMIN_PASSWORD: "e2e-correct-horse-battery-staple",
    };
  }

  return {
    ...base,
    ERP_REPOSITORY: "memory",
    DATABASE_URL: "",
  };
}

/**
 * Rauchtest: API und Vite-PWA parallel starten.
 * - Standard: In-Memory-API (`ERP_REPOSITORY=memory`, leeres `DATABASE_URL`).
 * - `E2E_USE_POSTGRES=1`: echte Postgres-Persistenz (wie Produktionspfad); vorher `prisma migrate deploy` ausführen.
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
    /** PWA `generateSW` sonst cacht API-GETs mandantenübergreifend — E2E-Reihenfolge würde Flakes erzeugen. */
    serviceWorkers: "block",
  },
  webServer: [
    {
      command: "npm run dev",
      cwd: ".",
      url: `http://127.0.0.1:${E2E_API_PORT}/health`,
      reuseExistingServer: reuse,
      timeout: 120_000,
      env: buildApiWebServerEnv(),
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
