import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/api/app.js";
import { resetPasswordLoginRuntimeStateForTests } from "../src/auth/password-login.js";

describe("password reset routes (memory / no DB)", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.stubEnv("ERP_LOGIN_EMAIL", "ops@example.com");
    vi.stubEnv("ERP_LOGIN_PASSWORD", "correct-horse-battery-staple");
    vi.stubEnv("ERP_LOGIN_TENANT_ID", "11111111-1111-4111-8111-111111111111");
    vi.stubEnv("ERP_LOGIN_USER_ID", "77777777-7777-4777-8777-777777777777");
    vi.stubEnv("ERP_LOGIN_ROLE", "ADMIN");
    resetPasswordLoginRuntimeStateForTests();
    app = await buildApp({ seedDemoData: false, repositoryMode: "memory" });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    vi.unstubAllEnvs();
    resetPasswordLoginRuntimeStateForTests();
  });

  it("POST /auth/request-password-reset returns 503 without Postgres", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/request-password-reset",
      payload: {
        tenantId: "11111111-1111-4111-8111-111111111111",
        email: "ops@example.com",
      },
    });
    expect(res.statusCode).toBe(503);
    expect((res.json() as { code: string }).code).toBe("USER_MANAGEMENT_REQUIRES_DB");
  });

  it("POST /auth/confirm-password-reset returns 503 without Postgres", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/confirm-password-reset",
      payload: {
        token: "a".repeat(32),
        password: "new-password-12",
      },
    });
    expect(res.statusCode).toBe(503);
    expect((res.json() as { code: string }).code).toBe("USER_MANAGEMENT_REQUIRES_DB");
  });
});
