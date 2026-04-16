import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildApp } from "../src/api/app.js";
import { SEED_IDS } from "../src/composition/seed.js";
import { createSignedToken } from "../src/auth/token-auth.js";

describe("FIN-0 finance HTTP stubs (fail-closed)", () => {
  let app: FastifyInstance;

  const buildHeaders = (tenantId: string = SEED_IDS.tenantId) => {
    const token = createSignedToken({
      sub: "77777777-7777-4777-8777-777777777777",
      tenantId,
      role: "ADMIN",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    return {
      authorization: `Bearer ${token}`,
      "x-tenant-id": tenantId,
    };
  };

  beforeEach(async () => {
    app = await buildApp({ seedDemoData: true, repositoryMode: "memory" });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("POST /finance/payment-terms/versions returns 422 TRACEABILITY_LINK_MISSING when body valid", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/finance/payment-terms/versions",
      headers: buildHeaders(),
      payload: {
        projectId: randomUUID(),
        customerId: randomUUID(),
        termsLabel: "14 Tage netto",
        reason: "FIN-0 stub test",
      },
    });
    expect(res.statusCode).toBe(422);
    const body = res.json() as { code: string; retryable: boolean; blocking: boolean };
    expect(body.code).toBe("TRACEABILITY_LINK_MISSING");
    expect(body.retryable).toBe(false);
    expect(body.blocking).toBe(true);
  });

  it("POST /invoices returns 422 TRACEABILITY_LINK_MISSING when body valid", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/invoices",
      headers: buildHeaders(),
      payload: {
        lvVersionId: SEED_IDS.lvVersionId,
        offerVersionId: SEED_IDS.offerVersionId,
        invoiceCurrencyCode: "EUR",
        reason: "FIN-0 stub test invoice",
      },
    });
    expect(res.statusCode).toBe(422);
    expect((res.json() as { code: string }).code).toBe("TRACEABILITY_LINK_MISSING");
  });

  it("GET /invoices/:id returns 404 DOCUMENT_NOT_FOUND", async () => {
    const id = randomUUID();
    const res = await app.inject({
      method: "GET",
      url: `/invoices/${id}`,
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(404);
    expect((res.json() as { code: string }).code).toBe("DOCUMENT_NOT_FOUND");
  });

  it("POST /finance/payments/intake requires Idempotency-Key UUID", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers: buildHeaders(),
      payload: {
        invoiceId: randomUUID(),
        amountCents: 100,
        externalReference: "ext-1",
        reason: "FIN-0 stub test payment",
      },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("VALIDATION_FAILED");
  });

  it("POST /finance/payments/intake returns 422 when header and body valid", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers: {
        ...buildHeaders(),
        "idempotency-key": randomUUID(),
      },
      payload: {
        invoiceId: randomUUID(),
        amountCents: 100,
        externalReference: "ext-1",
        reason: "FIN-0 stub test payment",
      },
    });
    expect(res.statusCode).toBe(422);
    expect((res.json() as { code: string }).code).toBe("TRACEABILITY_LINK_MISSING");
  });

  it("rejects tenant header mismatch with 403", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/invoices",
      headers: {
        ...buildHeaders(),
        "x-tenant-id": randomUUID(),
      },
      payload: {
        lvVersionId: SEED_IDS.lvVersionId,
        offerVersionId: SEED_IDS.offerVersionId,
        invoiceCurrencyCode: "EUR",
        reason: "wrong tenant header",
      },
    });
    expect(res.statusCode).toBe(403);
    expect((res.json() as { code: string }).code).toBe("TENANT_SCOPE_VIOLATION");
  });
});
