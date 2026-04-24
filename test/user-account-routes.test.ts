import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/api/app.js";
import { createSignedToken } from "../src/auth/token-auth.js";
import { SEED_IDS } from "../src/composition/seed.js";

describe("User account routes (memory / no Postgres)", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({ seedDemoData: false, repositoryMode: "memory" });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /users returns 503 when persistence is not Postgres", async () => {
    const token = createSignedToken({
      sub: SEED_IDS.seedAdminUserId,
      tenantId: SEED_IDS.tenantId,
      role: "ADMIN",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "GET",
      url: "/users",
      headers: {
        authorization: `Bearer ${token}`,
        "x-tenant-id": SEED_IDS.tenantId,
      },
    });
    expect(res.statusCode).toBe(503);
    const body = res.json() as { code: string };
    expect(body.code).toBe("USER_MANAGEMENT_REQUIRES_DB");
  });
});
