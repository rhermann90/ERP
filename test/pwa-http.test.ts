import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/api/app.js";
import { SEED_IDS } from "../src/composition/seed.js";
import { createSignedToken } from "../src/auth/token-auth.js";

describe("PWA HTTP basis (CORS, Security-Header, Health)", () => {
  let app: FastifyInstance;
  const pwaOrigin = "http://localhost:5173";
  const otherOrigin = "http://evil.example";

  beforeEach(async () => {
    app = await buildApp({ seedDemoData: true, corsOrigins: [pwaOrigin], repositoryMode: "memory" });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /health ist 200, ohne Auth, tenant-neutral", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
    expect(typeof res.headers["x-correlation-id"]).toBe("string");
    expect((res.headers["x-correlation-id"] as string).length).toBeGreaterThan(0);
    expect(res.headers["x-request-id"]).toBe(res.headers["x-correlation-id"]);
  });

  it("Security-Header auf geschützter Route", async () => {
    const token = createSignedToken({
      sub: "77777777-7777-4777-8777-777777777777",
      tenantId: SEED_IDS.tenantId,
      role: "ADMIN",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "GET",
      url: `/documents/${SEED_IDS.offerVersionId}/allowed-actions?entityType=OFFER_VERSION`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-tenant-id": SEED_IDS.tenantId,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("DENY");
  });

  it("CORS: erlaubte Origin spiegelt Access-Control-Allow-Origin", async () => {
    const token = createSignedToken({
      sub: "77777777-7777-4777-8777-777777777777",
      tenantId: SEED_IDS.tenantId,
      role: "ADMIN",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "GET",
      url: `/documents/${SEED_IDS.offerVersionId}/allowed-actions?entityType=OFFER_VERSION`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-tenant-id": SEED_IDS.tenantId,
        origin: pwaOrigin,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(pwaOrigin);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("CORS: nicht erlaubte Origin ohne ACAO", async () => {
    const token = createSignedToken({
      sub: "77777777-7777-4777-8777-777777777777",
      tenantId: SEED_IDS.tenantId,
      role: "ADMIN",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "GET",
      url: `/documents/${SEED_IDS.offerVersionId}/allowed-actions?entityType=OFFER_VERSION`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-tenant-id": SEED_IDS.tenantId,
        origin: otherOrigin,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("OPTIONS Preflight liefert 204 und CORS-Header bei erlaubter Origin", async () => {
    const res = await app.inject({
      method: "OPTIONS",
      url: "/measurements",
      headers: {
        origin: pwaOrigin,
        "access-control-request-method": "POST",
        "access-control-request-headers": "authorization,content-type,x-tenant-id",
      },
    });
    expect(res.statusCode).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(pwaOrigin);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
  });

  it("Fehler-Envelope bleibt Passthrough-kompatibel (Zod)", async () => {
    const token = createSignedToken({
      sub: "77777777-7777-4777-8777-777777777777",
      tenantId: SEED_IDS.tenantId,
      role: "ADMIN",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "POST",
      url: "/measurements",
      headers: {
        authorization: `Bearer ${token}`,
        "x-tenant-id": SEED_IDS.tenantId,
        origin: pwaOrigin,
        "content-type": "application/json",
      },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    const body = res.json() as Record<string, unknown>;
    expect(body.code).toBe("VALIDATION_FAILED");
    expect(typeof body.message).toBe("string");
    expect(typeof body.correlationId).toBe("string");
    expect(res.headers["x-correlation-id"]).toBe(body.correlationId);
    expect(res.headers["x-request-id"]).toBe(body.correlationId);
    expect(body.retryable).toBe(true);
    expect(body.blocking).toBe(false);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("abgelaufenes Token liefert 401 UNAUTHORIZED mit vollem Error-Envelope", async () => {
    const expiredToken = createSignedToken({
      sub: "77777777-7777-4777-8777-777777777777",
      tenantId: SEED_IDS.tenantId,
      role: "ADMIN",
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    const res = await app.inject({
      method: "GET",
      url: `/documents/${SEED_IDS.offerVersionId}/allowed-actions?entityType=OFFER_VERSION`,
      headers: {
        authorization: `Bearer ${expiredToken}`,
        "x-tenant-id": SEED_IDS.tenantId,
      },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json() as Record<string, unknown>;
    expect(body.code).toBe("UNAUTHORIZED");
    expect(typeof body.message).toBe("string");
    expect(typeof body.correlationId).toBe("string");
    expect(res.headers["x-correlation-id"]).toBe(body.correlationId);
    expect(res.headers["x-request-id"]).toBe(body.correlationId);
    expect(body.retryable).toBe(false);
    expect(body.blocking).toBe(true);
  });
});
