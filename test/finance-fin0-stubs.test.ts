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

  it("POST /finance/payment-terms/versions creates version (FIN-1)", async () => {
    const projectId = randomUUID();
    const customerId = randomUUID();
    const res = await app.inject({
      method: "POST",
      url: "/finance/payment-terms/versions",
      headers: buildHeaders(),
      payload: {
        projectId,
        customerId,
        termsLabel: "14 Tage netto",
        reason: "FIN-1 integration test",
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as {
      paymentTermsVersionId: string;
      paymentTermsHeadId: string;
      versionNumber: number;
      projectId: string;
    };
    expect(body.versionNumber).toBe(1);
    expect(body.projectId).toBe(projectId);
    expect(body.paymentTermsVersionId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("GET /finance/payment-terms returns 404 without head for random project", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/finance/payment-terms?projectId=${randomUUID()}`,
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(404);
    expect((res.json() as { code: string }).code).toBe("DOCUMENT_NOT_FOUND");
  });

  it("POST /finance/payment-terms/versions increments versionNumber for same project", async () => {
    const projectId = randomUUID();
    const customerId = randomUUID();
    const headers = buildHeaders();
    const first = await app.inject({
      method: "POST",
      url: "/finance/payment-terms/versions",
      headers,
      payload: {
        projectId,
        customerId,
        termsLabel: "30 Tage netto",
        reason: "first version test",
      },
    });
    expect(first.statusCode).toBe(201);
    expect((first.json() as { versionNumber: number }).versionNumber).toBe(1);
    const second = await app.inject({
      method: "POST",
      url: "/finance/payment-terms/versions",
      headers,
      payload: {
        projectId,
        customerId,
        termsLabel: "60 Tage netto",
        reason: "second version test",
      },
    });
    expect(second.statusCode).toBe(201);
    expect((second.json() as { versionNumber: number }).versionNumber).toBe(2);
  });

  it("POST /invoices creates draft when traceability satisfied (FIN-2)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/invoices",
      headers: buildHeaders(),
      payload: {
        lvVersionId: SEED_IDS.lvVersionId,
        offerVersionId: SEED_IDS.offerVersionId,
        invoiceCurrencyCode: "EUR",
        reason: "FIN-2 draft integration test",
      },
    });
    expect(res.statusCode).toBe(201);
    const draft = res.json() as { invoiceId: string; lvNetCents: number; totalGrossCents: number };
    expect(draft.invoiceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(draft.lvNetCents).toBe(125000);
    expect(draft.totalGrossCents).toBe(148750);
  });

  it("GET /invoices/:id returns 200 for seed invoice", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/invoices/${SEED_IDS.invoiceId}`,
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { invoiceId: string; status: string };
    expect(body.invoiceId).toBe(SEED_IDS.invoiceId);
    expect(body.status).toBe("GEBUCHT_VERSENDET");
    expect((body as { totalGrossCents?: number }).totalGrossCents).toBe(148750);
  });

  it("GET /invoices/:id returns 404 for unknown id", async () => {
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

  it("POST /finance/payments/intake rejects non-UUID Idempotency-Key with 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers: {
        ...buildHeaders(),
        "Idempotency-Key": "not-a-uuid",
      },
      payload: {
        invoiceId: randomUUID(),
        amountCents: 100,
        externalReference: "ext-1",
        reason: "FIN-0 stub test payment idem",
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
    expect(res.statusCode).toBe(404);
    expect((res.json() as { code: string }).code).toBe("DOCUMENT_NOT_FOUND");
  });

  it("POST /finance/payments/intake accepts Idempotency-Key header name case-insensitive (UPPERCASE)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers: {
        ...buildHeaders(),
        "IDEMPOTENCY-KEY": randomUUID(),
      },
      payload: {
        invoiceId: randomUUID(),
        amountCents: 100,
        externalReference: "ext-1",
        reason: "FIN-0 stub test payment idem upper",
      },
    });
    expect(res.statusCode).toBe(404);
    expect((res.json() as { code: string }).code).toBe("DOCUMENT_NOT_FOUND");
  });

  it("POST /finance/payments/intake trims Idempotency-Key value before UUID parse", async () => {
    const idem = randomUUID();
    const res = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers: {
        ...buildHeaders(),
        "Idempotency-Key": `  ${idem}  `,
      },
      payload: {
        invoiceId: randomUUID(),
        amountCents: 100,
        externalReference: "ext-1",
        reason: "FIN-0 stub test payment idem trim",
      },
    });
    expect(res.statusCode).toBe(404);
    expect((res.json() as { code: string }).code).toBe("DOCUMENT_NOT_FOUND");
  });

  it("POST /finance/payments/intake records full payment for seed invoice (FIN-3)", async () => {
    const idem = randomUUID();
    const res = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers: { ...buildHeaders(), "Idempotency-Key": idem },
      payload: {
        invoiceId: SEED_IDS.invoiceId,
        amountCents: 148750,
        externalReference: "bank-ref-full",
        reason: "FIN-3 full payment integration test",
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as { invoiceOpenCentsAfter: number; invoiceStatus: string };
    expect(body.invoiceOpenCentsAfter).toBe(0);
    expect(body.invoiceStatus).toBe("BEZAHLT");
  });

  it("POST /finance/payments/intake is idempotent (200 replay)", async () => {
    const idem = randomUUID();
    const headers = { ...buildHeaders(), "Idempotency-Key": idem };
    const payload = {
      invoiceId: SEED_IDS.invoiceId,
      amountCents: 5000,
      externalReference: "idem-ext",
      reason: "FIN-3 idempotent replay integration test",
    };
    const first = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers,
      payload,
    });
    expect(first.statusCode).toBe(201);
    const second = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers,
      payload,
    });
    expect(second.statusCode).toBe(200);
    expect(second.json()).toEqual(first.json());
  });

  it("POST /finance/payments/intake accepts Idempotency-Key header name case-insensitive (UPPERCASE)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers: {
        ...buildHeaders(),
        "IDEMPOTENCY-KEY": randomUUID(),
      },
      payload: {
        invoiceId: randomUUID(),
        amountCents: 100,
        externalReference: "ext-1",
        reason: "FIN-0 stub test payment idem upper",
      },
    });
    expect(res.statusCode).toBe(422);
    expect((res.json() as { code: string }).code).toBe("TRACEABILITY_LINK_MISSING");
  });

  it("POST /finance/payments/intake trims Idempotency-Key value before UUID parse", async () => {
    const idem = randomUUID();
    const res = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers: {
        ...buildHeaders(),
        "Idempotency-Key": `  ${idem}  `,
      },
      payload: {
        invoiceId: randomUUID(),
        amountCents: 100,
        externalReference: "ext-1",
        reason: "FIN-0 stub test payment idem trim",
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

  it("POST /finance/payments/intake rejects tenant header mismatch with 403", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers: {
        ...buildHeaders(),
        "x-tenant-id": randomUUID(),
        "Idempotency-Key": randomUUID(),
      },
      payload: {
        invoiceId: randomUUID(),
        amountCents: 100,
        externalReference: "ext-1",
        reason: "wrong tenant on payment intake",
      },
    });
    expect(res.statusCode).toBe(403);
    expect((res.json() as { code: string }).code).toBe("TENANT_SCOPE_VIOLATION");
  });

  it("GET /invoices/:id rejects invalid Bearer with 401 UNAUTHORIZED", async () => {
    const id = randomUUID();
    const res = await app.inject({
      method: "GET",
      url: `/invoices/${id}`,
      headers: {
        authorization: "Bearer v1.invalid-token-part.signature",
        "x-tenant-id": SEED_IDS.tenantId,
      },
    });
    expect(res.statusCode).toBe(401);
    expect((res.json() as { code: string }).code).toBe("UNAUTHORIZED");
  });

  it("GET /invoices/:id rejects tenant header mismatch with 403", async () => {
    const id = randomUUID();
    const res = await app.inject({
      method: "GET",
      url: `/invoices/${id}`,
      headers: {
        ...buildHeaders(),
        "x-tenant-id": randomUUID(),
      },
    });
    expect(res.statusCode).toBe(403);
    expect((res.json() as { code: string }).code).toBe("TENANT_SCOPE_VIOLATION");
  });

  it("POST /invoices returns 400 VALIDATION_FAILED when reason too short", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/invoices",
      headers: buildHeaders(),
      payload: {
        lvVersionId: SEED_IDS.lvVersionId,
        offerVersionId: SEED_IDS.offerVersionId,
        invoiceCurrencyCode: "EUR",
        reason: "kurz",
      },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("VALIDATION_FAILED");
  });

  it("rejects invalid Bearer with 401 UNAUTHORIZED (POST /finance/payment-terms/versions)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/finance/payment-terms/versions",
      headers: {
        authorization: "Bearer v1.invalid-token-part.signature",
        "x-tenant-id": SEED_IDS.tenantId,
      },
      payload: {
        projectId: randomUUID(),
        customerId: randomUUID(),
        termsLabel: "14 Tage netto",
        reason: "FIN-0 stub auth test",
      },
    });
    expect(res.statusCode).toBe(401);
    expect((res.json() as { code: string }).code).toBe("UNAUTHORIZED");
  });
});
