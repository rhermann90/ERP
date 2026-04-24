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
    const draft = res.json() as {
      invoiceId: string;
      lvNetCents: number;
      totalGrossCents: number;
      skontoBps: number;
    };
    expect(draft.invoiceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(draft.lvNetCents).toBe(125000);
    expect(draft.totalGrossCents).toBe(148750);
    expect(draft.skontoBps).toBe(0);
  });

  it("POST /invoices applies optional skontoBps (B2-1a) to net before VAT", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/invoices",
      headers: buildHeaders(),
      payload: {
        lvVersionId: SEED_IDS.lvVersionId,
        offerVersionId: SEED_IDS.offerVersionId,
        invoiceCurrencyCode: "EUR",
        skontoBps: 200,
        reason: "FIN-W3 draft with 2 percent skonto",
      },
    });
    expect(res.statusCode).toBe(201);
    const draft = res.json() as { lvNetCents: number; totalGrossCents: number; skontoBps: number };
    expect(draft.skontoBps).toBe(200);
    expect(draft.lvNetCents).toBe(122500);
    expect(draft.totalGrossCents).toBe(145775);
  });

  it("POST /invoices rejects skontoBps that wipes net (VALIDATION_FAILED)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/invoices",
      headers: buildHeaders(),
      payload: {
        lvVersionId: SEED_IDS.lvVersionId,
        offerVersionId: SEED_IDS.offerVersionId,
        invoiceCurrencyCode: "EUR",
        skontoBps: 10_000,
        reason: "FIN-W3 skonto 100 percent should fail validation",
      },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("VALIDATION_FAILED");
  });

  it("POST /invoices rejects skontoBps above 10000 (VALIDATION_FAILED)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/invoices",
      headers: buildHeaders(),
      payload: {
        lvVersionId: SEED_IDS.lvVersionId,
        offerVersionId: SEED_IDS.offerVersionId,
        invoiceCurrencyCode: "EUR",
        skontoBps: 10_001,
        reason: "FIN-W3 skonto bps out of range must fail",
      },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("VALIDATION_FAILED");
  });

  it("GET /invoices/:id returns 200 for seed invoice", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/invoices/${SEED_IDS.invoiceId}`,
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { invoiceId: string; status: string; skontoBps: number };
    expect(body.invoiceId).toBe(SEED_IDS.invoiceId);
    expect(body.status).toBe("GEBUCHT_VERSENDET");
    expect((body as { totalGrossCents?: number }).totalGrossCents).toBe(148750);
    expect(body.skontoBps).toBe(0);
  });

  it("POST /invoices/:id/book books seed draft then rejects second book (FIN-2)", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.draftInvoiceId}/book`,
      headers: buildHeaders(),
      payload: { reason: "FIN-2 book integration test" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      invoiceId: string;
      status: string;
      invoiceNumber: string;
      issueDate: string;
      totalGrossCents: number;
    };
    expect(body.invoiceId).toBe(SEED_IDS.draftInvoiceId);
    expect(body.status).toBe("GEBUCHT_VERSENDET");
    expect(body.invoiceNumber).toMatch(/^RE-20\d{2}-\d{4}$/u);
    expect(body.totalGrossCents).toBe(5950);

    const again = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.draftInvoiceId}/book`,
      headers: buildHeaders(),
      payload: { reason: "second book must fail" },
    });
    expect(again.statusCode).toBe(409);
    expect((again.json() as { code: string }).code).toBe("INVOICE_NOT_BOOKABLE");
  });

  it("POST /invoices/:id/book rejects VIEWER (403)", async () => {
    const token = createSignedToken({
      sub: "88888888-8888-4888-8888-888888888888",
      tenantId: SEED_IDS.tenantId,
      role: "VIEWER",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.draftInvoiceId}/book`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-tenant-id": SEED_IDS.tenantId,
      },
      payload: { reason: "viewer must not book invoice" },
    });
    expect(res.statusCode).toBe(403);
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

  it("POST /finance/payments/intake returns 404 when invoice unknown (header and body valid)", async () => {
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

  it("GET /invoices/:invoiceId/dunning-reminders returns empty list (FIN-4 read stub)", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders`,
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: unknown[] };
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("GET /finance/dunning-reminder-config returns MVP static stages (FIN-4 Slice 3)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-config",
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      data: { configSource: string; tenantId: string; stages: Array<{ stageOrdinal: number }> };
    };
    expect(body.data.configSource).toBe("MVP_STATIC_DEFAULTS");
    expect(body.data.tenantId).toBe(SEED_IDS.tenantId);
    expect(body.data.stages).toHaveLength(9);
    expect(body.data.stages[0]?.stageOrdinal).toBe(1);
    expect(body.data.stages[8]?.stageOrdinal).toBe(9);
  });

  it("GET /finance/dunning-reminder-config allows VIEWER (read-only)", async () => {
    const token = createSignedToken({
      sub: "88888888-8888-4888-8888-888888888888",
      tenantId: SEED_IDS.tenantId,
      role: "VIEWER",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-config",
      headers: { authorization: `Bearer ${token}`, "x-tenant-id": SEED_IDS.tenantId },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: { stages: unknown[] } };
    expect(body.data.stages).toHaveLength(9);
  });

  it("GET /finance/dunning-reminder-config rejects tenant header mismatch with 403", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-config",
      headers: {
        ...buildHeaders(),
        "x-tenant-id": randomUUID(),
      },
    });
    expect(res.statusCode).toBe(403);
    expect((res.json() as { code: string }).code).toBe("TENANT_SCOPE_VIOLATION");
  });

  it("GET /finance/dunning-reminder-templates returns MVP static defaults (M4 Slice 1)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-templates",
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      data: { templateSource: string; tenantId: string; stages: Array<{ stageOrdinal: number; channels: unknown[] }> };
    };
    expect(body.data.templateSource).toBe("MVP_STATIC_DEFAULTS");
    expect(body.data.tenantId).toBe(SEED_IDS.tenantId);
    expect(body.data.stages).toHaveLength(9);
    expect(body.data.stages[0]?.channels).toHaveLength(2);
  });

  it("GET /finance/dunning-reminder-templates allows VIEWER", async () => {
    const token = createSignedToken({
      sub: "88888888-8888-4888-8888-888888888888",
      tenantId: SEED_IDS.tenantId,
      role: "VIEWER",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-templates",
      headers: { authorization: `Bearer ${token}`, "x-tenant-id": SEED_IDS.tenantId },
    });
    expect(res.statusCode).toBe(200);
  });

  it("GET /finance/dunning-reminder-candidates returns booked seed invoices for stage 1 when asOf on deadline (M4 Slice 5b-0)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-candidates?stageOrdinal=1&asOfDate=2026-04-28",
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      data: {
        stageOrdinal: number;
        daysAfterDueForStage: number;
        asOfDate: string;
        candidates: Array<{ invoiceId: string; dueDate: string; openAmountCents: number }>;
      };
    };
    expect(body.data.stageOrdinal).toBe(1);
    expect(body.data.daysAfterDueForStage).toBe(14);
    expect(body.data.asOfDate).toBe("2026-04-28");
    const ids = body.data.candidates.map((c) => c.invoiceId).sort();
    expect(ids).toContain(SEED_IDS.invoiceId);
    expect(ids).toContain(SEED_IDS.inconsistentInvoiceId);
    for (const c of body.data.candidates) {
      expect(c.dueDate).toBe("2026-04-14");
      expect(c.openAmountCents).toBeGreaterThan(0);
    }
  });

  it("GET /finance/dunning-reminder-candidates stage 2 returns empty without prior stage-1 reminder (5b-0 escalation)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-candidates?stageOrdinal=2&asOfDate=2099-01-01",
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: { candidates: unknown[] } };
    expect(body.data.candidates).toHaveLength(0);
  });

  it("GET /finance/dunning-reminder-candidates allows VIEWER", async () => {
    const token = createSignedToken({
      sub: "88888888-8888-4888-8888-888888888888",
      tenantId: SEED_IDS.tenantId,
      role: "VIEWER",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-candidates?stageOrdinal=1&asOfDate=2026-04-28",
      headers: { authorization: `Bearer ${token}`, "x-tenant-id": SEED_IDS.tenantId },
    });
    expect(res.statusCode).toBe(200);
  });

  it("GET /finance/dunning-reminder-candidates returns 400 without stageOrdinal", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-candidates",
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("VALIDATION_FAILED");
  });

  it("GET /finance/dunning-reminder-candidates returns 400 for invalid asOfDate", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-candidates?stageOrdinal=1&asOfDate=not-a-date",
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("VALIDATION_FAILED");
  });

  it("POST /finance/dunning-reminder-run DRY_RUN matches candidates for stage 1 (M4 Slice 5b-1)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/finance/dunning-reminder-run",
      headers: buildHeaders(),
      payload: {
        stageOrdinal: 1,
        asOfDate: "2026-04-28",
        mode: "DRY_RUN",
        reason: "FIN-0 dunning run dry preview",
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      data: {
        mode: string;
        outcome: string;
        planned: Array<{ invoiceId: string }>;
      };
    };
    expect(body.data.mode).toBe("DRY_RUN");
    expect(body.data.outcome).toBe("PREVIEW");
    const ids = body.data.planned.map((p) => p.invoiceId).sort();
    expect(ids).toContain(SEED_IDS.invoiceId);
    expect(ids).toContain(SEED_IDS.inconsistentInvoiceId);
  });

  it("POST /finance/dunning-reminder-run EXECUTE records and replays with Idempotency-Key (M4 Slice 5b-1)", async () => {
    const idem = randomUUID();
    const basePayload = {
      stageOrdinal: 1,
      asOfDate: "2026-04-28",
      mode: "EXECUTE" as const,
      reason: "FIN-0 dunning batch execute test",
      invoiceIds: [SEED_IDS.invoiceId],
    };
    const first = await app.inject({
      method: "POST",
      url: "/finance/dunning-reminder-run",
      headers: { ...buildHeaders(), "Idempotency-Key": idem },
      payload: basePayload,
    });
    expect(first.statusCode).toBe(200);
    const firstBody = first.json() as {
      data: { outcome: string; executed: Array<{ invoiceId: string; dunningReminderId: string }> };
    };
    expect(firstBody.data.outcome).toBe("COMPLETED");
    expect(firstBody.data.executed).toHaveLength(1);
    expect(firstBody.data.executed[0].invoiceId).toBe(SEED_IDS.invoiceId);

    const second = await app.inject({
      method: "POST",
      url: "/finance/dunning-reminder-run",
      headers: { ...buildHeaders(), "Idempotency-Key": idem },
      payload: basePayload,
    });
    expect(second.statusCode).toBe(200);
    const secondBody = second.json() as { data: { outcome: string; executed: unknown[] } };
    expect(secondBody.data.outcome).toBe("REPLAY");
    expect(secondBody.data.executed).toEqual(firstBody.data.executed);
  });

  it("POST /finance/dunning-reminder-run EXECUTE returns DUNNING_RUN_IDEMPOTENCY_MISMATCH when key reused with different fingerprint", async () => {
    const idem = randomUUID();
    const first = await app.inject({
      method: "POST",
      url: "/finance/dunning-reminder-run",
      headers: { ...buildHeaders(), "Idempotency-Key": idem },
      payload: {
        stageOrdinal: 1,
        asOfDate: "2026-04-28",
        mode: "EXECUTE",
        reason: "First execute for idempotency mismatch test",
        invoiceIds: [SEED_IDS.invoiceId],
      },
    });
    expect(first.statusCode).toBe(200);
    const second = await app.inject({
      method: "POST",
      url: "/finance/dunning-reminder-run",
      headers: { ...buildHeaders(), "Idempotency-Key": idem },
      payload: {
        stageOrdinal: 2,
        asOfDate: "2026-04-28",
        mode: "EXECUTE",
        reason: "Second execute same key different stage",
        invoiceIds: [SEED_IDS.invoiceId],
      },
    });
    expect(second.statusCode).toBe(400);
    expect((second.json() as { code: string }).code).toBe("DUNNING_RUN_IDEMPOTENCY_MISMATCH");
  });

  it("POST /finance/dunning-reminder-run EXECUTE returns DUNNING_RUN_INVOICES_INVALID for unknown invoice id", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/finance/dunning-reminder-run",
      headers: { ...buildHeaders(), "Idempotency-Key": randomUUID() },
      payload: {
        stageOrdinal: 1,
        asOfDate: "2026-04-28",
        mode: "EXECUTE",
        reason: "Execute with invalid invoice id subset",
        invoiceIds: [randomUUID()],
      },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("DUNNING_RUN_INVOICES_INVALID");
  });

  it("POST /finance/dunning-reminder-run EXECUTE returns VALIDATION_FAILED without Idempotency-Key", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/finance/dunning-reminder-run",
      headers: buildHeaders(),
      payload: {
        stageOrdinal: 1,
        asOfDate: "2026-04-28",
        mode: "EXECUTE",
        reason: "Execute body without idempotency header",
      },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("VALIDATION_FAILED");
  });

  it("POST /finance/dunning-reminder-run DRY_RUN allows VIEWER", async () => {
    const token = createSignedToken({
      sub: "88888888-8888-4888-8888-888888888888",
      tenantId: SEED_IDS.tenantId,
      role: "VIEWER",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "POST",
      url: "/finance/dunning-reminder-run",
      headers: { authorization: `Bearer ${token}`, "x-tenant-id": SEED_IDS.tenantId },
      payload: {
        stageOrdinal: 1,
        asOfDate: "2026-04-28",
        mode: "DRY_RUN",
        reason: "Viewer dry run dunning batch",
      },
    });
    expect(res.statusCode).toBe(200);
  });

  it("POST /finance/dunning-reminder-run EXECUTE rejects VIEWER with 403", async () => {
    const token = createSignedToken({
      sub: "88888888-8888-4888-8888-888888888888",
      tenantId: SEED_IDS.tenantId,
      role: "VIEWER",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "POST",
      url: "/finance/dunning-reminder-run",
      headers: {
        authorization: `Bearer ${token}`,
        "x-tenant-id": SEED_IDS.tenantId,
        "Idempotency-Key": randomUUID(),
      },
      payload: {
        stageOrdinal: 1,
        asOfDate: "2026-04-28",
        mode: "EXECUTE",
        reason: "Viewer may not execute dunning batch",
        invoiceIds: [SEED_IDS.invoiceId],
      },
    });
    expect(res.statusCode).toBe(403);
    expect((res.json() as { code: string }).code).toBe("AUTH_ROLE_FORBIDDEN");
  });

  it("GET /finance/dunning-reminder-automation returns effective SEMI when not configured (memory)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-automation",
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const j = res.json() as { data: { automationSource: string; runMode: string } };
    expect(j.data.automationSource).toBe("NOT_CONFIGURED");
    expect(j.data.runMode).toBe("SEMI");
  });

  it("PATCH /finance/dunning-reminder-automation returns 503 in memory mode", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-reminder-automation",
      headers: buildHeaders(),
      payload: { reason: "Memory mode automation patch stub", runMode: "SEMI" },
    });
    expect(res.statusCode).toBe(503);
    expect((res.json() as { code: string }).code).toBe("DUNNING_AUTOMATION_NOT_PERSISTABLE");
  });

  it("PATCH /finance/dunning-reminder-templates/.../channels/EMAIL returns 503 in memory mode", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-reminder-templates/stages/1/channels/EMAIL",
      headers: buildHeaders(),
      payload: {
        body: "{{MahngebuehrEUR}} {{SkontoBetragEUR}} {{SkontofristDatum}}",
        reason: "FIN-0 stub PATCH Vorlage",
      },
    });
    expect(res.statusCode).toBe(503);
    expect((res.json() as { code: string }).code).toBe("DUNNING_TEMPLATE_NOT_PERSISTABLE");
  });

  it("PATCH /finance/dunning-reminder-templates rejects VIEWER with 403", async () => {
    const token = createSignedToken({
      sub: "88888888-8888-4888-8888-888888888888",
      tenantId: SEED_IDS.tenantId,
      role: "VIEWER",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-reminder-templates/stages/1/channels/EMAIL",
      headers: { authorization: `Bearer ${token}`, "x-tenant-id": SEED_IDS.tenantId },
      payload: {
        body: "{{MahngebuehrEUR}} {{SkontoBetragEUR}} {{SkontofristDatum}}",
        reason: "VIEWER darf Mahn-Vorlagen nicht schreiben",
      },
    });
    expect(res.statusCode).toBe(403);
    expect((res.json() as { code: string }).code).toBe("AUTH_ROLE_FORBIDDEN");
  });

  it("PATCH /finance/dunning-reminder-templates returns 400 when Pflichtplatzhalter fehlen", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-reminder-templates/stages/1/channels/EMAIL",
      headers: buildHeaders(),
      payload: {
        body: "Keine Platzhalter",
        reason: "FIN-0 stub PATCH ungueltige Vorlage",
      },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("DUNNING_TEMPLATE_PLACEHOLDERS_INVALID");
  });

  it("GET /finance/dunning-email-footer returns NOT_CONFIGURED in memory mode (M4 Slice 3)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-email-footer",
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      data: {
        footerSource: string;
        readyForEmailFooter: boolean;
        impressumComplianceTier: string;
        impressumGaps: string[];
      };
    };
    expect(body.data.footerSource).toBe("NOT_CONFIGURED");
    expect(body.data.readyForEmailFooter).toBe(false);
    expect(body.data.impressumComplianceTier).toBe("MINIMAL");
    expect(body.data.impressumGaps).toEqual(
      expect.arrayContaining(["LEGAL_REPRESENTATIVE_MISSING", "VAT_ID_MISSING"]),
    );
  });

  it("GET /finance/dunning-email-footer allows VIEWER (M4 Slice 3)", async () => {
    const token = createSignedToken({
      sub: "88888888-8888-4888-8888-888888888888",
      tenantId: SEED_IDS.tenantId,
      role: "VIEWER",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-email-footer",
      headers: { authorization: `Bearer ${token}`, "x-tenant-id": SEED_IDS.tenantId },
    });
    expect(res.statusCode).toBe(200);
  });

  it("PATCH /finance/dunning-email-footer returns 503 in memory mode", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-email-footer",
      headers: buildHeaders(),
      payload: {
        companyLegalName: "X",
        reason: "FIN-0 stub PATCH Footer",
      },
    });
    expect(res.statusCode).toBe(503);
    expect((res.json() as { code: string }).code).toBe("DUNNING_EMAIL_FOOTER_NOT_PERSISTABLE");
  });

  it("PATCH /finance/dunning-email-footer rejects VIEWER with 403", async () => {
    const token = createSignedToken({
      sub: "88888888-8888-4888-8888-888888888888",
      tenantId: SEED_IDS.tenantId,
      role: "VIEWER",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-email-footer",
      headers: { authorization: `Bearer ${token}`, "x-tenant-id": SEED_IDS.tenantId },
      payload: { companyLegalName: "Y", reason: "VIEWER darf Footer nicht schreiben" },
    });
    expect(res.statusCode).toBe(403);
    expect((res.json() as { code: string }).code).toBe("AUTH_ROLE_FORBIDDEN");
  });

  it("PATCH /finance/dunning-email-footer returns 400 when only reason (no fields)", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-email-footer",
      headers: buildHeaders(),
      payload: { reason: "ohne Stammdaten-Felder" },
    });
    expect(res.statusCode).toBe(400);
  });

  const nineDunningStages = () =>
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
      stageOrdinal: n,
      daysAfterDue: 10 + n,
      feeCents: 0,
      label: `Stub-Stufe ${n}`,
    }));

  it("PATCH /finance/dunning-reminder-config/stages/1 returns 503 in memory mode", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-reminder-config/stages/1",
      headers: buildHeaders(),
      payload: { label: "X", reason: "FIN-0 stub PATCH Mahnstufe" },
    });
    expect(res.statusCode).toBe(503);
    expect((res.json() as { code: string }).code).toBe("DUNNING_STAGE_CONFIG_NOT_PERSISTABLE");
  });

  it("DELETE /finance/dunning-reminder-config/stages/1 returns 503 in memory mode", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/finance/dunning-reminder-config/stages/1",
      headers: buildHeaders(),
      payload: { reason: "FIN-0 stub DELETE Mahnstufe" },
    });
    expect(res.statusCode).toBe(503);
    expect((res.json() as { code: string }).code).toBe("DUNNING_STAGE_CONFIG_NOT_PERSISTABLE");
  });

  it("PUT /finance/dunning-reminder-config returns 503 in memory mode (FIN-4 Schreibpfad)", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/finance/dunning-reminder-config",
      headers: buildHeaders(),
      payload: { stages: nineDunningStages(), reason: "FIN-0 stub PUT Mahnstufen" },
    });
    expect(res.statusCode).toBe(503);
    expect((res.json() as { code: string }).code).toBe("DUNNING_STAGE_CONFIG_NOT_PERSISTABLE");
  });

  it("PUT /finance/dunning-reminder-config rejects VIEWER with 403", async () => {
    const token = createSignedToken({
      sub: "88888888-8888-4888-8888-888888888888",
      tenantId: SEED_IDS.tenantId,
      role: "VIEWER",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "PUT",
      url: "/finance/dunning-reminder-config",
      headers: { authorization: `Bearer ${token}`, "x-tenant-id": SEED_IDS.tenantId },
      payload: { stages: nineDunningStages(), reason: "VIEWER darf Mahnstufen nicht setzen" },
    });
    expect(res.statusCode).toBe(403);
    expect((res.json() as { code: string }).code).toBe("AUTH_ROLE_FORBIDDEN");
  });

  it("PUT /finance/dunning-reminder-config rejects invalid stages with 400", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/finance/dunning-reminder-config",
      headers: buildHeaders(),
      payload: {
        stages: nineDunningStages().slice(0, 8),
        reason: "Zu wenige Stufen fuer Validierung",
      },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("VALIDATION_FAILED");
  });

  it("POST /invoices/:invoiceId/dunning-reminders rejects ENTWURF with DUNNING_INVOICE_NOT_ELIGIBLE", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.draftInvoiceId}/dunning-reminders`,
      headers: buildHeaders(),
      payload: { stageOrdinal: 1, reason: "FIN-4 stub test dunning not eligible" },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("DUNNING_INVOICE_NOT_ELIGIBLE");
  });

  it("POST /invoices/:invoiceId/dunning-reminders creates row for gebuchte Rechnung (FIN-4)", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders`,
      headers: buildHeaders(),
      payload: { stageOrdinal: 2, note: "Stub", reason: "FIN-4 stub test create dunning reminder" },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as { dunningReminderId: string; stageOrdinal: number; createdAt: string };
    expect(body.stageOrdinal).toBe(2);
    expect(body.dunningReminderId).toMatch(/^[0-9a-f-]{36}$/u);
  });

  it("POST /invoices/:invoiceId/dunning-reminders rejects VIEWER (403)", async () => {
    const token = createSignedToken({
      sub: "88888888-8888-4888-8888-888888888888",
      tenantId: SEED_IDS.tenantId,
      role: "VIEWER",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders`,
      headers: { authorization: `Bearer ${token}`, "x-tenant-id": SEED_IDS.tenantId },
      payload: { stageOrdinal: 1, reason: "FIN-4 stub test viewer forbidden" },
    });
    expect(res.statusCode).toBe(403);
    expect((res.json() as { code: string }).code).toBe("AUTH_ROLE_FORBIDDEN");
  });

  it("POST /invoices/:invoiceId/dunning-reminders returns 404 for unknown invoice", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${randomUUID()}/dunning-reminders`,
      headers: buildHeaders(),
      payload: { stageOrdinal: 1, reason: "FIN-4 stub test unknown invoice" },
    });
    expect(res.statusCode).toBe(404);
    expect((res.json() as { code: string }).code).toBe("DOCUMENT_NOT_FOUND");
  });

  it("POST /invoices/:invoiceId/dunning-reminders rejects tenant header mismatch with 403", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders`,
      headers: {
        ...buildHeaders(),
        "x-tenant-id": randomUUID(),
      },
      payload: { stageOrdinal: 1, reason: "FIN-4 stub test tenant mismatch" },
    });
    expect(res.statusCode).toBe(403);
    expect((res.json() as { code: string }).code).toBe("TENANT_SCOPE_VIOLATION");
  });

  it("POST /invoices/:invoiceId/dunning-reminders returns VALIDATION_FAILED for short reason", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders`,
      headers: buildHeaders(),
      payload: { stageOrdinal: 1, reason: "kurz" },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("VALIDATION_FAILED");
  });

  it("POST /invoices/:invoiceId/dunning-reminders returns VALIDATION_FAILED for invalid stageOrdinal", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders`,
      headers: buildHeaders(),
      payload: { stageOrdinal: 0, reason: "FIN-4 stub test invalid stage" },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("VALIDATION_FAILED");
  });

  it("POST /invoices/:invoiceId/dunning-reminders/email-preview returns 200 with plain text (M4 Slice 4)", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders/email-preview`,
      headers: buildHeaders(),
      payload: { stageOrdinal: 1, reason: "FIN-0 stub E-Mail-Vorschau Stufe 1" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: { fullPlainText: string; warnings: string[] } };
    expect(body.data.fullPlainText).toContain("---");
    expect(body.data.fullPlainText.length).toBeGreaterThan(20);
    expect(Array.isArray(body.data.warnings)).toBe(true);
  });

  it("POST /invoices/:invoiceId/dunning-reminders/send-email-stub returns 400 when footer not ready (M4 Slice 4)", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders/send-email-stub`,
      headers: buildHeaders(),
      payload: { stageOrdinal: 1, reason: "FIN-0 stub E-Mail-Versand-Stub ohne Footer" },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("DUNNING_EMAIL_FOOTER_NOT_READY");
  });

  it("POST /invoices/:invoiceId/dunning-reminders/email-preview allows VIEWER (M4 Slice 4)", async () => {
    const token = createSignedToken({
      sub: "88888888-8888-4888-8888-888888888888",
      tenantId: SEED_IDS.tenantId,
      role: "VIEWER",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders/email-preview`,
      headers: { authorization: `Bearer ${token}`, "x-tenant-id": SEED_IDS.tenantId },
      payload: { stageOrdinal: 2, reason: "VIEWER darf E-Mail-Vorschau lesen" },
    });
    expect(res.statusCode).toBe(200);
  });

  it("POST /invoices/:invoiceId/dunning-reminders/send-email-stub rejects VIEWER with 403 (M4 Slice 4)", async () => {
    const token = createSignedToken({
      sub: "88888888-8888-4888-8888-888888888888",
      tenantId: SEED_IDS.tenantId,
      role: "VIEWER",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders/send-email-stub`,
      headers: { authorization: `Bearer ${token}`, "x-tenant-id": SEED_IDS.tenantId },
      payload: { stageOrdinal: 1, reason: "VIEWER darf Versand-Stub nicht" },
    });
    expect(res.statusCode).toBe(403);
    expect((res.json() as { code: string }).code).toBe("AUTH_ROLE_FORBIDDEN");
  });

  it("POST /invoices/:invoiceId/dunning-reminders/send-email returns VALIDATION_FAILED without Idempotency-Key (M4 Slice 5a)", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders/send-email`,
      headers: buildHeaders(),
      payload: {
        stageOrdinal: 1,
        reason: "FIN-0 stub send-email ohne Idempotency-Key",
        toEmail: "kunde@example.com",
      },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("VALIDATION_FAILED");
  });

  it("POST /invoices/:invoiceId/dunning-reminders/send-email returns 400 footer not ready in memory (M4 Slice 5a)", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders/send-email`,
      headers: { ...buildHeaders(), "Idempotency-Key": randomUUID() },
      payload: {
        stageOrdinal: 1,
        reason: "FIN-0 stub send-email ohne Footer in memory",
        toEmail: "kunde@example.com",
      },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("DUNNING_EMAIL_FOOTER_NOT_READY");
  });

  it("POST /invoices/:invoiceId/dunning-reminders/send-email rejects VIEWER with 403 (M4 Slice 5a)", async () => {
    const token = createSignedToken({
      sub: "88888888-8888-4888-8888-888888888888",
      tenantId: SEED_IDS.tenantId,
      role: "VIEWER",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders/send-email`,
      headers: { authorization: `Bearer ${token}`, "x-tenant-id": SEED_IDS.tenantId, "Idempotency-Key": randomUUID() },
      payload: { stageOrdinal: 1, reason: "VIEWER darf produktiven E-Mail-Versand nicht", toEmail: "x@example.com" },
    });
    expect(res.statusCode).toBe(403);
    expect((res.json() as { code: string }).code).toBe("AUTH_ROLE_FORBIDDEN");
  });

  it("GET /invoices/:invoiceId/payment-intakes returns empty list before payments (FIN-3 read)", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/invoices/${SEED_IDS.invoiceId}/payment-intakes`,
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: unknown[] };
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("GET /invoices/:invoiceId/payment-intakes lists row after intake (no idempotency key in body)", async () => {
    const idem = randomUUID();
    const post = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers: { ...buildHeaders(), "Idempotency-Key": idem },
      payload: {
        invoiceId: SEED_IDS.invoiceId,
        amountCents: 2500,
        externalReference: "list-test-ref",
        reason: "FIN-3 GET payment-intakes list integration test",
      },
    });
    expect(post.statusCode).toBe(201);
    const list = await app.inject({
      method: "GET",
      url: `/invoices/${SEED_IDS.invoiceId}/payment-intakes`,
      headers: buildHeaders(),
    });
    expect(list.statusCode).toBe(200);
    const rows = list.json() as {
      data: Array<{ paymentIntakeId: string; amountCents: number; externalReference: string; createdAt: string }>;
    };
    expect(rows.data.length).toBeGreaterThanOrEqual(1);
    const last = rows.data[rows.data.length - 1];
    expect(last.amountCents).toBe(2500);
    expect(last.externalReference).toBe("list-test-ref");
    expect(last).not.toHaveProperty("idempotencyKey");
  });

  it("GET /invoices/:invoiceId/payment-intakes returns 404 for unknown invoice", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/invoices/${randomUUID()}/payment-intakes`,
      headers: buildHeaders(),
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

  it("POST /finance/payments/intake returns PAYMENT_INTAKE_IDEMPOTENCY_MISMATCH when key reused with different amount", async () => {
    const idem = randomUUID();
    const headers = { ...buildHeaders(), "Idempotency-Key": idem };
    const first = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers,
      payload: {
        invoiceId: SEED_IDS.invoiceId,
        amountCents: 3000,
        externalReference: "m1",
        reason: "FIN-3 idempotency mismatch first leg",
      },
    });
    expect(first.statusCode).toBe(201);
    const second = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers,
      payload: {
        invoiceId: SEED_IDS.invoiceId,
        amountCents: 4000,
        externalReference: "m2",
        reason: "FIN-3 idempotency mismatch second leg",
      },
    });
    expect(second.statusCode).toBe(400);
    expect((second.json() as { code: string }).code).toBe("PAYMENT_INTAKE_IDEMPOTENCY_MISMATCH");
  });

  it("POST /finance/payments/intake returns PAYMENT_EXCEEDS_OPEN_AMOUNT when overpaying", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers: { ...buildHeaders(), "Idempotency-Key": randomUUID() },
      payload: {
        invoiceId: SEED_IDS.invoiceId,
        amountCents: 148751,
        externalReference: "over",
        reason: "FIN-3 overpay integration test",
      },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("PAYMENT_EXCEEDS_OPEN_AMOUNT");
  });

  it("POST /finance/payments/intake returns PAYMENT_INVOICE_NOT_PAYABLE for draft invoice", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers: { ...buildHeaders(), "Idempotency-Key": randomUUID() },
      payload: {
        invoiceId: SEED_IDS.draftInvoiceId,
        amountCents: 100,
        externalReference: "draft-pay",
        reason: "FIN-3 draft invoice not payable test",
      },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { code: string }).code).toBe("PAYMENT_INVOICE_NOT_PAYABLE");
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
