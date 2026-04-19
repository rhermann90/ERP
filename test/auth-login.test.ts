import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/api/app.js";
import { resetPasswordLoginRuntimeStateForTests } from "../src/auth/password-login.js";

describe("POST /auth/login", () => {
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

  it("returns signed bearer token for valid credentials", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        tenantId: "11111111-1111-4111-8111-111111111111",
        email: "OPS@example.com ",
        password: "correct-horse-battery-staple",
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      accessToken: string;
      tokenType: string;
      expiresIn: number;
      tenantId: string;
      userId: string;
      role: string;
    };
    expect(body.tokenType).toBe("Bearer");
    expect(body.accessToken.startsWith("v1.")).toBe(true);
    expect(body.tenantId).toBe("11111111-1111-4111-8111-111111111111");
    expect(body.userId).toBe("77777777-7777-4777-8777-777777777777");
    expect(body.role).toBe("ADMIN");
    expect(body.expiresIn).toBeGreaterThan(60);
  });

  it("returns 401 for wrong password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        tenantId: "11111111-1111-4111-8111-111111111111",
        email: "ops@example.com",
        password: "wrong-password-here",
      },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json() as { code: string };
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 when password login is not configured", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("ERP_LOGIN_EMAIL", "ops@example.com");
    vi.stubEnv("ERP_LOGIN_PASSWORD", "");
    resetPasswordLoginRuntimeStateForTests();
    await app.close();
    app = await buildApp({ seedDemoData: false, repositoryMode: "memory" });
    await app.ready();

    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        tenantId: "11111111-1111-4111-8111-111111111111",
        email: "ops@example.com",
        password: "correct-horse-battery-staple",
      },
    });
    expect(res.statusCode).toBe(401);
  });
});
