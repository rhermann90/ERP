import { execSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { PrismaClient, createPrismaClient } from "../src/prisma-client.js";
import { buildApp } from "../src/api/app.js";
import { SEED_IDS } from "../src/composition/seed.js";
import { createSignedToken } from "../src/auth/token-auth.js";

const dbUrl = process.env.PERSISTENCE_DB_TEST_URL?.trim();

if (process.env.GITHUB_ACTIONS === "true" && !dbUrl) {
  throw new Error("PERSISTENCE_DB_TEST_URL must be set in GitHub Actions CI");
}


/** Prisma 5: P2003; Prisma 7 + pg adapter: DriverAdapterError with FK cause. */
function isForeignKeyViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  if ("code" in err && (err as { code?: string }).code === "P2003") return true;
  const e = err as { name?: string; cause?: { kind?: string } };
  return e.name === "DriverAdapterError" && e.cause?.kind === "ForeignKeyConstraintViolation";
}
function adminHeaders(tenantId: string = SEED_IDS.tenantId) {
  const userId = "77777777-7777-4777-8777-777777777777";
  const token = createSignedToken({
    sub: userId,
    tenantId,
    role: "ADMIN",
    exp: Math.floor(Date.now() / 1000) + 600,
  });
  return { authorization: `Bearer ${token}`, "x-tenant-id": tenantId };
}

function roleHeaders(
  role: "ADMIN" | "GESCHAEFTSFUEHRUNG" | "BUCHHALTUNG" | "VIEWER",
  tenantId: string = SEED_IDS.tenantId,
) {
  const userId = "77777777-7777-4777-8777-777777777777";
  const token = createSignedToken({
    sub: userId,
    tenantId,
    role,
    exp: Math.floor(Date.now() / 1000) + 600,
  });
  return { authorization: `Bearer ${token}`, "x-tenant-id": tenantId };
}

function buildNineDunningStages(labelPrefix: string) {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
    stageOrdinal: n,
    daysAfterDue: 20 + n,
    feeCents: n === 3 ? 500 : 0,
    label: `${labelPrefix} ${n}`,
  }));
}

const persistenceDbSuite = dbUrl ? describe.sequential : describe.skip;

persistenceDbSuite("Persistence Inkrement 2 (Postgres; in CI ohne SKIP)", () => {
  /** Gesetzt in `beforeAll`; Suite läuft nur mit `PERSISTENCE_DB_TEST_URL`. */
  let app!: FastifyInstance;
  let prisma!: PrismaClient;

  beforeAll(async () => {
    process.env.DATABASE_URL = dbUrl!;
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: dbUrl! },
    });
    const cleanup = createPrismaClient(dbUrl!);
    await cleanup.$executeRawUnsafe(
      `TRUNCATE TABLE dunning_reminder_run_intents, dunning_reminders, dunning_email_sends, dunning_tenant_automation, dunning_tenant_stage_config, dunning_tenant_stage_templates, dunning_tenant_email_footer, payment_intakes, invoices, project_invoice_tax_overrides, tenant_invoice_tax_profiles, payment_terms_versions, payment_terms_heads, supplement_versions, supplement_offers, measurement_positions, measurement_versions, measurements, lv_positions, lv_structure_nodes, lv_versions, lv_catalogs, audit_events, offer_versions, offers, password_reset_challenges, users RESTART IDENTITY CASCADE`,
    );
    await cleanup.$disconnect();

    app = await buildApp({ repositoryMode: "postgres", seedDemoData: true });
    await app.ready();
    const ready = await app.inject({ method: "GET", url: "/ready" });
    expect(ready.statusCode).toBe(200);
    expect(ready.json()).toEqual({ status: "ready", checks: { database: "ok" } });
    prisma = createPrismaClient(dbUrl!);
  });

  afterAll(async () => {
    if (app) await app.close();
    if (prisma) await prisma.$disconnect();
  });

  it("Offer.current_version_id referenziert offer_versions (Prisma-Include)", async () => {
    const row = await prisma.offer.findUnique({
      where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: SEED_IDS.offerId } },
      include: { currentVersion: true },
    });
    expect(row?.currentVersionId).toBe(SEED_IDS.offerVersionId);
    expect(row?.currentVersion?.id).toBe(SEED_IDS.offerVersionId);
  });

  it("POST /auth/login: Multi-User-Seed (Admin und Viewer) mit Mandanten-Scope", async () => {
    const admin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        tenantId: SEED_IDS.tenantId,
        email: "admin@localhost",
        password: "dev-seed-admin-12",
      },
    });
    expect(admin.statusCode).toBe(200);
    const viewer = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        tenantId: SEED_IDS.tenantId,
        email: "viewer@localhost",
        password: "dev-seed-viewer-12",
      },
    });
    expect(viewer.statusCode).toBe(200);
    const ja = admin.json() as { userId: string; role: string };
    const jv = viewer.json() as { userId: string; role: string };
    expect(ja.role).toBe("ADMIN");
    expect(jv.role).toBe("VIEWER");
    expect(ja.userId).not.toBe(jv.userId);
  });

  it("Benutzerverwaltung: ADMIN legt zusätzlichen Benutzer per POST /users an", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        tenantId: SEED_IDS.tenantId,
        email: "admin@localhost",
        password: "dev-seed-admin-12",
      },
    });
    expect(login.statusCode).toBe(200);
    const { accessToken } = login.json() as { accessToken: string };
    const email = `buchhaltung-${randomUUID().slice(0, 8)}@example.com`;
    const create = await app.inject({
      method: "POST",
      url: "/users",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-tenant-id": SEED_IDS.tenantId,
      },
      payload: {
        email,
        password: "neu-passwort-12",
        role: "BUCHHALTUNG",
        reason: "Integrationstest Benutzerverwaltung",
      },
    });
    expect(create.statusCode).toBe(201);
    const list = await app.inject({
      method: "GET",
      url: "/users",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-tenant-id": SEED_IDS.tenantId,
      },
    });
    expect(list.statusCode).toBe(200);
    const body = list.json() as {
      data: { email: string }[];
      page: number;
      pageSize: number;
      total: number;
    };
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(20);
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.data.some((u) => u.email === email)).toBe(true);
  });

  it("Benutzerverwaltung: GET /users liefert paginierte Felder (pageSize=1, zweite Seite)", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        tenantId: SEED_IDS.tenantId,
        email: "admin@localhost",
        password: "dev-seed-admin-12",
      },
    });
    expect(login.statusCode).toBe(200);
    const { accessToken } = login.json() as { accessToken: string };
    const headers = {
      authorization: `Bearer ${accessToken}`,
      "x-tenant-id": SEED_IDS.tenantId,
    };
    const first = await app.inject({ method: "GET", url: "/users?pageSize=1&page=1", headers });
    expect(first.statusCode).toBe(200);
    const j1 = first.json() as { data: { email: string }[]; page: number; pageSize: number; total: number };
    expect(j1.page).toBe(1);
    expect(j1.pageSize).toBe(1);
    expect(j1.data).toHaveLength(1);
    expect(j1.total).toBeGreaterThanOrEqual(2);

    const second = await app.inject({ method: "GET", url: "/users?pageSize=1&page=2", headers });
    expect(second.statusCode).toBe(200);
    const j2 = second.json() as { data: { email: string }[]; page: number; pageSize: number; total: number };
    expect(j2.page).toBe(2);
    expect(j2.pageSize).toBe(1);
    expect(j2.data).toHaveLength(1);
    expect(j2.total).toBe(j1.total);
    expect(j2.data[0].email).not.toBe(j1.data[0].email);
  });

  it("Benutzerverwaltung: ADMIN ändert Benutzer-E-Mail per PATCH", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        tenantId: SEED_IDS.tenantId,
        email: "admin@localhost",
        password: "dev-seed-admin-12",
      },
    });
    expect(login.statusCode).toBe(200);
    const { accessToken } = login.json() as { accessToken: string };
    const emailA = `patch-a-${randomUUID().slice(0, 8)}@example.com`;
    const emailB = `patch-b-${randomUUID().slice(0, 8)}@example.com`;
    const create = await app.inject({
      method: "POST",
      url: "/users",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-tenant-id": SEED_IDS.tenantId,
      },
      payload: {
        email: emailA,
        password: "neu-passwort-12",
        role: "BUCHHALTUNG",
        reason: "Integrationstest E-Mail-PATCH",
      },
    });
    expect(create.statusCode).toBe(201);
    const userId = (create.json() as { id: string }).id;
    const patch = await app.inject({
      method: "PATCH",
      url: `/users/${encodeURIComponent(userId)}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-tenant-id": SEED_IDS.tenantId,
      },
      payload: {
        email: emailB,
        reason: "Integrationstest E-Mail geändert",
      },
    });
    expect(patch.statusCode).toBe(200);
    const list = await app.inject({
      method: "GET",
      url: "/users",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-tenant-id": SEED_IDS.tenantId,
      },
    });
    expect(list.statusCode).toBe(200);
    const users = (list.json() as { data: { id: string; email: string }[] }).data;
    const row = users.find((u) => u.id === userId);
    expect(row?.email).toBe(emailB);
  });

  it("Passwort-Reset: Anfrage legt Challenge an; Confirm setzt neues Passwort", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        tenantId: SEED_IDS.tenantId,
        email: "admin@localhost",
        password: "dev-seed-admin-12",
      },
    });
    expect(login.statusCode).toBe(200);
    const { accessToken } = login.json() as { accessToken: string };
    const email = `reset-user-${randomUUID().slice(0, 8)}@example.com`;
    const create = await app.inject({
      method: "POST",
      url: "/users",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-tenant-id": SEED_IDS.tenantId,
      },
      payload: {
        email,
        password: "initial-pass-12",
        role: "VERTRIEB_BAULEITUNG",
        reason: "Integrationstest Passwort-Reset",
      },
    });
    expect(create.statusCode).toBe(201);
    const userId = (create.json() as { id: string }).id;

    const beforeReq = await prisma.passwordResetChallenge.count({
      where: { tenantId: SEED_IDS.tenantId, userId },
    });
    const resetReq = await app.inject({
      method: "POST",
      url: "/auth/request-password-reset",
      payload: { tenantId: SEED_IDS.tenantId, email },
    });
    expect(resetReq.statusCode).toBe(200);
    const afterReq = await prisma.passwordResetChallenge.count({
      where: { tenantId: SEED_IDS.tenantId, userId },
    });
    expect(afterReq).toBe(beforeReq + 1);

    const rawToken = "integration-reset-token-32chars!!";
    const tokenDigest = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetChallenge.deleteMany({ where: { tenantId: SEED_IDS.tenantId, userId } });
    await prisma.passwordResetChallenge.create({
      data: {
        id: randomUUID(),
        tenantId: SEED_IDS.tenantId,
        userId,
        tokenDigest,
        expiresAt,
      },
    });

    const confirm = await app.inject({
      method: "POST",
      url: "/auth/confirm-password-reset",
      payload: { token: rawToken, password: "confirmed-pass-12" },
    });
    expect(confirm.statusCode).toBe(200);

    const oldLogin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { tenantId: SEED_IDS.tenantId, email, password: "initial-pass-12" },
    });
    expect(oldLogin.statusCode).toBe(401);

    const newLogin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { tenantId: SEED_IDS.tenantId, email, password: "confirmed-pass-12" },
    });
    expect(newLogin.statusCode).toBe(200);
  });

  it("Seed: LV §9 + Aufmass sind in Postgres tenant-isoliert persistiert (Gate G1/G2)", async () => {
    const cat = await prisma.lvCatalog.findUnique({
      where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: SEED_IDS.lvCatalogId } },
      include: { currentVersion: { include: { positions: true, structureNodes: true } } },
    });
    expect(cat?.currentVersionId).toBe(SEED_IDS.lvVersionId);
    expect(cat?.currentVersion?.positions.some((p) => p.id === SEED_IDS.lvPositionSeedA)).toBe(true);
    const m = await prisma.measurement.findUnique({
      where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: SEED_IDS.measurementId } },
      include: { currentVersion: { include: { positions: true } } },
    });
    expect(m?.lvVersionId).toBe(SEED_IDS.lvVersionId);
    expect(m?.currentVersion?.positions.length).toBeGreaterThanOrEqual(1);
  });

  it("offer_versions.lv_version_id referenziert persistierte lv_versions (Gate G5)", async () => {
    const ov = await prisma.offerVersion.findUnique({
      where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: SEED_IDS.offerVersionId } },
      include: { lvVersion: true },
    });
    expect(ov?.lvVersionId).toBe(SEED_IDS.lvVersionId);
    expect(ov?.lvVersion?.id).toBe(SEED_IDS.lvVersionId);
  });

  it("rejects cross-tenant lv_structure_node insert (composite FK zu lv_versions; Gate G1 Tenant-Leck)", async () => {
    /** Kein zusätzliches Katalog-/Versions-Setup: Seed-`lvVersionId` gehört zu `SEED_IDS.tenantId`. Ein Knoten mit anderem `tenant_id` + dieser `lvVersionId` verletzt die FK `(tenant_id, lv_version_id)` → `lv_versions`. */
    const foreignTenant = randomUUID();
    await expect(
      prisma.lvStructureNode.create({
        data: {
          tenantId: foreignTenant,
          id: randomUUID(),
          lvVersionId: SEED_IDS.lvVersionId,
          parentNodeId: null,
          kind: "BEREICH",
          sortOrdinal: "1",
          systemText: "sys",
          editingText: "ed",
        },
      }),
    ).rejects.toSatisfy(isForeignKeyViolation);
  });

  it("rejects cross-tenant supplement_version insert (composite FK zu supplement_offers; Gate G1)", async () => {
    const foreignTenant = randomUUID();
    const soId = randomUUID();
    await prisma.supplementOffer.create({
      data: {
        tenantId: SEED_IDS.tenantId,
        id: soId,
        offerId: SEED_IDS.offerId,
        baseOfferVersionId: SEED_IDS.offerVersionId,
        createdAt: new Date(),
        createdBy: SEED_IDS.seedAdminUserId,
      },
    });
    await expect(
      prisma.supplementVersion.create({
        data: {
          tenantId: foreignTenant,
          id: randomUUID(),
          supplementOfferId: soId,
          versionNumber: 1,
          status: "ENTWURF",
          lvVersionId: SEED_IDS.lvVersionId,
          systemText: "s",
          editingText: "e",
          createdAt: new Date(),
          createdBy: SEED_IDS.seedAdminUserId,
        },
      }),
    ).rejects.toSatisfy(isForeignKeyViolation);
    await prisma.supplementOffer.delete({
      where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: soId } },
    });
  });

  it("Traceability: Rechnungs-Export nach Postgres-Seed fail-closed grün (Gate G3)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/exports",
      headers: adminHeaders(),
      payload: {
        entityType: "INVOICE",
        entityId: SEED_IDS.invoiceId,
        format: "XRECHNUNG",
      },
    });
    expect(res.statusCode).toBe(201);
  });

  it("FIN-1 M1: zwei Zahlungsbedingungs-Versionen; Rechnung bleibt auf alter Version (Postgres); Buchung ändert PT-Referenz nicht", async () => {
    // Demo-Seed (`seedDemoData`) legt für dasselbe Projekt bereits PT v1 an — neue POSTs sind v2/v3.
    const seedPtV1Id = SEED_IDS.paymentTermsVersionId;

    const pt1 = await app.inject({
      method: "POST",
      url: "/finance/payment-terms/versions",
      headers: adminHeaders(),
      payload: {
        projectId: SEED_IDS.projectId,
        customerId: SEED_IDS.customerId,
        termsLabel: "30 Tage netto M1a",
        reason: "Persistenz FIN-1 M1 erste Zahlungsbedingungsversion",
      },
    });
    expect(pt1.statusCode).toBe(201);
    const pt1Body = pt1.json() as {
      paymentTermsVersionId: string;
      paymentTermsHeadId: string;
      versionNumber: number;
    };
    expect(pt1Body.versionNumber).toBe(2);
    const invoicePinsToPtId = pt1Body.paymentTermsVersionId;
    const headId = pt1Body.paymentTermsHeadId;

    const inv = await app.inject({
      method: "POST",
      url: "/invoices",
      headers: adminHeaders(),
      payload: {
        lvVersionId: SEED_IDS.lvVersionId,
        offerVersionId: SEED_IDS.offerVersionId,
        invoiceCurrencyCode: "EUR",
        paymentTermsVersionId: invoicePinsToPtId,
        reason: "Persistenz FIN-1 M1 Rechnungsentwurf mit gewählter PT-Version",
      },
    });
    expect(inv.statusCode).toBe(201);
    const invoiceId = (inv.json() as { invoiceId: string }).invoiceId;

    const pt2 = await app.inject({
      method: "POST",
      url: "/finance/payment-terms/versions",
      headers: adminHeaders(),
      payload: {
        projectId: SEED_IDS.projectId,
        customerId: SEED_IDS.customerId,
        termsLabel: "60 Tage netto M1b",
        reason: "Persistenz FIN-1 M1 zweite Zahlungsbedingungsversion gleiches Projekt",
      },
    });
    expect(pt2.statusCode).toBe(201);
    const newestPtId = (pt2.json() as { paymentTermsVersionId: string }).paymentTermsVersionId;
    expect((pt2.json() as { versionNumber: number }).versionNumber).toBe(3);
    expect(newestPtId).not.toBe(invoicePinsToPtId);

    const versions = await prisma.paymentTermsVersion.findMany({
      where: { tenantId: SEED_IDS.tenantId, headId },
      orderBy: { versionNumber: "asc" },
    });
    expect(versions).toHaveLength(3);
    expect(versions[0]?.id).toBe(seedPtV1Id);
    expect(versions[1]?.id).toBe(invoicePinsToPtId);
    expect(versions[2]?.id).toBe(newestPtId);

    const row = await prisma.invoice.findUnique({
      where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: invoiceId } },
    });
    expect(row?.paymentTermsVersionId).toBe(invoicePinsToPtId);
    expect(row?.status).toBe("ENTWURF");
    expect(row?.lvNetCents).toBe(125000);
    expect(row?.totalGrossCents).toBe(148750);

    const getRes = await app.inject({
      method: "GET",
      url: `/invoices/${invoiceId}`,
      headers: adminHeaders(),
    });
    expect(getRes.statusCode).toBe(200);
    expect((getRes.json() as { paymentTermsVersionId?: string }).paymentTermsVersionId).toBe(invoicePinsToPtId);

    const book = await app.inject({
      method: "POST",
      url: `/invoices/${invoiceId}/book`,
      headers: adminHeaders(),
      payload: { reason: "Persistenz FIN-1 M1 Buchung fixiert gewählte Zahlungsbedingungs-Version" },
    });
    expect(book.statusCode).toBe(200);
    const afterBook = await prisma.invoice.findUnique({
      where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: invoiceId } },
    });
    expect(afterBook?.status).toBe("GEBUCHT_VERSENDET");
    expect(afterBook?.paymentTermsVersionId).toBe(invoicePinsToPtId);
  });

  it("POST /invoices/{draftId}/book: Entwurf gebucht, Zeile in Postgres inkl. Rechnungsnummer", async () => {
    const book = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.draftInvoiceId}/book`,
      headers: adminHeaders(),
      payload: { reason: "Persistenztest Buchung Seed-Entwurf" },
    });
    expect(book.statusCode).toBe(200);
    const b = book.json() as {
      status: string;
      invoiceNumber: string;
      issueDate: string;
      totalGrossCents: number;
    };
    expect(b.status).toBe("GEBUCHT_VERSENDET");
    const row = await prisma.invoice.findUnique({
      where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: SEED_IDS.draftInvoiceId } },
    });
    expect(row?.status).toBe("GEBUCHT_VERSENDET");
    expect(row?.invoiceNumber).toBe(b.invoiceNumber);
    expect(row?.issueDate).toBe(b.issueDate);
    expect(row?.totalGrossCents).toBe(b.totalGrossCents);
    expect(row?.skontoBps).toBe(0);
  });

  it("PATCH /finance/invoice-tax-profile: persistiert Mandanten-Default (FIN-5)", async () => {
    const patch = await app.inject({
      method: "PATCH",
      url: "/finance/invoice-tax-profile",
      headers: adminHeaders(),
      payload: {
        defaultInvoiceTaxRegime: "SMALL_BUSINESS_19",
        reason: "Persistenztest FIN-5 Mandantensteuer Kleinunternehmer",
      },
    });
    expect(patch.statusCode).toBe(200);
    const dbRow = await prisma.tenantInvoiceTaxProfile.findUnique({
      where: { tenantId: SEED_IDS.tenantId },
    });
    expect(dbRow?.defaultInvoiceTaxRegime).toBe("SMALL_BUSINESS_19");
    const get = await app.inject({
      method: "GET",
      url: "/finance/invoice-tax-profile",
      headers: adminHeaders(),
    });
    expect(get.statusCode).toBe(200);
    expect((get.json() as { defaultInvoiceTaxRegime: string }).defaultInvoiceTaxRegime).toBe("SMALL_BUSINESS_19");
    const reset = await app.inject({
      method: "PATCH",
      url: "/finance/invoice-tax-profile",
      headers: adminHeaders(),
      payload: {
        defaultInvoiceTaxRegime: "STANDARD_VAT_19",
        reason: "Persistenztest FIN-5 Mandantenprofil zurueck auf Standard-USt",
      },
    });
    expect(reset.statusCode).toBe(200);
  });

  it("GET /invoices/{draftId}/payment-intakes: nach POST intake aus Postgres ohne Idempotency-Key im JSON", async () => {
    const idem = randomUUID();
    const post = await app.inject({
      method: "POST",
      url: "/finance/payments/intake",
      headers: { ...adminHeaders(), "Idempotency-Key": idem },
      payload: {
        invoiceId: SEED_IDS.draftInvoiceId,
        amountCents: 100,
        externalReference: "persistence-read-intakes",
        reason: "Persistenztest Zahlung GET payment-intakes",
      },
    });
    expect(post.statusCode).toBe(201);
    const list = await app.inject({
      method: "GET",
      url: `/invoices/${SEED_IDS.draftInvoiceId}/payment-intakes`,
      headers: adminHeaders(),
    });
    expect(list.statusCode).toBe(200);
    const body = list.json() as {
      data: Array<{ paymentIntakeId: string; amountCents: number; externalReference: string; createdAt: string }>;
    };
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    const row = body.data.find((r) => r.externalReference === "persistence-read-intakes");
    expect(row).toBeDefined();
    expect(row!.amountCents).toBe(100);
    expect(row).not.toHaveProperty("idempotencyKey");
    const dbRows = await prisma.paymentIntake.findMany({
      where: { tenantId: SEED_IDS.tenantId, invoiceId: SEED_IDS.draftInvoiceId },
    });
    expect(dbRows.some((r) => r.externalReference === "persistence-read-intakes")).toBe(true);
    expect(body.data.length).toBe(dbRows.length);
  });

  it("GET /invoices/{invoiceId}/dunning-reminders: leere Liste aus Postgres (TRUNCATE enthält dunning_reminders)", async () => {
    const list = await app.inject({
      method: "GET",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders`,
      headers: adminHeaders(),
    });
    expect(list.statusCode).toBe(200);
    const body = list.json() as { data: unknown[] };
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toEqual([]);
    const dbCount = await prisma.dunningReminder.count({
      where: { tenantId: SEED_IDS.tenantId, invoiceId: SEED_IDS.invoiceId },
    });
    expect(dbCount).toBe(0);
    expect(body.data.length).toBe(dbCount);
  });

  it("GET /finance/dunning-reminder-config: MVP_STATIC nach TRUNCATE (keine Mandanten-Konfig-Zeilen)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-config",
      headers: adminHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: { configSource: string; stages: { label: string }[] } };
    expect(body.data.configSource).toBe("MVP_STATIC_DEFAULTS");
    expect(body.data.stages[0]!.label).toMatch(/MVP-Default/);
  });

  it("GET /finance/dunning-reminder-templates: MVP_STATIC ohne Mandanten-Vorlagen-Zeilen", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-templates",
      headers: adminHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: { templateSource: string; stages: { stageOrdinal: number }[] } };
    expect(body.data.templateSource).toBe("MVP_STATIC_DEFAULTS");
    expect(body.data.stages).toHaveLength(9);
  });

  it("PUT /finance/dunning-reminder-config: persistiert 9 Stufen, GET liefert TENANT_DATABASE, Audit", async () => {
    const put = await app.inject({
      method: "PUT",
      url: "/finance/dunning-reminder-config",
      headers: adminHeaders(),
      payload: {
        stages: buildNineDunningStages("API-Put-Stufe"),
        reason: "Persistenztest Mahnstufen-Konfiguration ersetzen",
      },
    });
    expect(put.statusCode).toBe(200);
    const putBody = put.json() as {
      data: { configSource: string; stages: { label: string; feeCents: number }[] };
    };
    expect(putBody.data.configSource).toBe("TENANT_DATABASE");
    expect(putBody.data.stages[2]!.label).toBe("API-Put-Stufe 3");
    expect(putBody.data.stages[2]!.feeCents).toBe(500);

    const get = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-config",
      headers: adminHeaders(),
    });
    expect(get.statusCode).toBe(200);
    expect((get.json() as { data: { configSource: string } }).data.configSource).toBe("TENANT_DATABASE");

    const ev = await prisma.auditEvent.findFirst({
      where: {
        tenantId: SEED_IDS.tenantId,
        entityType: "DUNNING_TENANT_STAGE_CONFIG",
        action: "DUNNING_STAGES_REPLACED",
      },
      orderBy: { timestamp: "desc" },
    });
    expect(ev).toBeTruthy();
    expect(ev!.entityId).toBe(SEED_IDS.tenantId);

    const patch = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-reminder-config/stages/1",
      headers: adminHeaders(),
      payload: { label: "Nach-PATCH-Stufe-1", reason: "Persistenztest PATCH Mahnstufe 1" },
    });
    expect(patch.statusCode).toBe(200);
    const patchBody = patch.json() as { data: { stages: { label: string }[] } };
    expect(patchBody.data.stages[0]!.label).toBe("Nach-PATCH-Stufe-1");

    const evPatch = await prisma.auditEvent.findFirst({
      where: { tenantId: SEED_IDS.tenantId, action: "DUNNING_STAGE_PATCHED" },
      orderBy: { timestamp: "desc" },
    });
    expect(evPatch).toBeTruthy();

    await prisma.dunningTenantStageConfig.deleteMany({ where: { tenantId: SEED_IDS.tenantId } });
  });

  /** Erzwingt fehlgeschlagenen `audit_events`-Insert; Prisma-Transaktion muss Konfig-Schreiben zurückrollen. */
  const AUDIT_TX_ROLLBACK_CHK = "erp_persist_audit_tx_rollback_chk";
  const AUDIT_TX_ROLLBACK_REASON = "Persistenztest PUT rollt bei Audit-Fehler zurück";

  it("PUT /finance/dunning-reminder-config: fehlgeschlagener Audit-Insert rollt Stufen-Zeilen zurück", async () => {
    await prisma.dunningTenantStageConfig.deleteMany({ where: { tenantId: SEED_IDS.tenantId } });
    await prisma.$executeRawUnsafe(
      `ALTER TABLE audit_events DROP CONSTRAINT IF EXISTS ${AUDIT_TX_ROLLBACK_CHK}`,
    );
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE audit_events ADD CONSTRAINT ${AUDIT_TX_ROLLBACK_CHK} CHECK (false) NOT VALID`,
      );

      const put = await app.inject({
        method: "PUT",
        url: "/finance/dunning-reminder-config",
        headers: adminHeaders(),
        payload: {
          stages: buildNineDunningStages("Audit-Rollback-Stufe"),
          reason: AUDIT_TX_ROLLBACK_REASON,
        },
      });
      expect(put.statusCode).toBe(500);
      expect((put.json() as { code: string }).code).toBe("AUDIT_PERSIST_FAILED");

      const stageCount = await prisma.dunningTenantStageConfig.count({
        where: { tenantId: SEED_IDS.tenantId },
      });
      expect(stageCount).toBe(0);

      const auditForThisAttempt = await prisma.auditEvent.findFirst({
        where: { tenantId: SEED_IDS.tenantId, reason: AUDIT_TX_ROLLBACK_REASON },
      });
      expect(auditForThisAttempt).toBeNull();
    } finally {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE audit_events DROP CONSTRAINT IF EXISTS ${AUDIT_TX_ROLLBACK_CHK}`,
      );
    }

    const putOk = await app.inject({
      method: "PUT",
      url: "/finance/dunning-reminder-config",
      headers: adminHeaders(),
      payload: {
        stages: buildNineDunningStages("Nach-Constraint-Drop"),
        reason: "Persistenztest PUT nach Entfernen der Test-Constraint",
      },
    });
    expect(putOk.statusCode).toBe(200);
    expect((putOk.json() as { data: { configSource: string } }).data.configSource).toBe("TENANT_DATABASE");
    await prisma.dunningTenantStageConfig.deleteMany({ where: { tenantId: SEED_IDS.tenantId } });
  });

  it("PATCH /finance/dunning-reminder-config/stages/2: 404 ohne persistierte Zeile", async () => {
    await prisma.dunningTenantStageConfig.deleteMany({ where: { tenantId: SEED_IDS.tenantId } });
    const res = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-reminder-config/stages/2",
      headers: adminHeaders(),
      payload: { label: "Ohne-Zeile", reason: "Persistenztest PATCH ohne Konfig-Zeile" },
    });
    expect(res.statusCode).toBe(404);
    expect((res.json() as { code: string }).code).toBe("DUNNING_STAGE_CONFIG_ROW_NOT_FOUND");
  });

  it("DELETE /finance/dunning-reminder-config/stages/1: soft-delete, GET fällt auf MVP zurück", async () => {
    await app.inject({
      method: "PUT",
      url: "/finance/dunning-reminder-config",
      headers: adminHeaders(),
      payload: {
        stages: buildNineDunningStages("Del-Test-Stufe"),
        reason: "Persistenztest vor DELETE Mahnstufen",
      },
    });
    const del = await app.inject({
      method: "DELETE",
      url: "/finance/dunning-reminder-config/stages/1",
      headers: adminHeaders(),
      payload: { reason: "Persistenztest Soft-Delete Stufe 1" },
    });
    expect(del.statusCode).toBe(200);
    expect((del.json() as { data: { configSource: string } }).data.configSource).toBe("MVP_STATIC_DEFAULTS");

    const ev = await prisma.auditEvent.findFirst({
      where: { tenantId: SEED_IDS.tenantId, action: "DUNNING_STAGE_SOFT_DELETED" },
      orderBy: { timestamp: "desc" },
    });
    expect(ev).toBeTruthy();

    const row = await prisma.dunningTenantStageConfig.findUnique({
      where: {
        tenantId_stageOrdinal: { tenantId: SEED_IDS.tenantId, stageOrdinal: 1 },
      },
    });
    expect(row?.deletedAt).toBeTruthy();

    await prisma.dunningTenantStageConfig.deleteMany({ where: { tenantId: SEED_IDS.tenantId } });
  });

  it("PATCH soft-gelöschte Stufe: 404", async () => {
    await app.inject({
      method: "PUT",
      url: "/finance/dunning-reminder-config",
      headers: adminHeaders(),
      payload: {
        stages: buildNineDunningStages("Tomb-PATCH"),
        reason: "Persistenztest vor Tombstone-PATCH",
      },
    });
    await app.inject({
      method: "DELETE",
      url: "/finance/dunning-reminder-config/stages/3",
      headers: adminHeaders(),
      payload: { reason: "Persistenztest Stufe 3 soft loeschen fuer PATCH 404" },
    });
    const patch = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-reminder-config/stages/3",
      headers: adminHeaders(),
      payload: { label: "Soll nicht gehen", reason: "Persistenztest PATCH auf Tombstone" },
    });
    expect(patch.statusCode).toBe(404);
    expect((patch.json() as { code: string }).code).toBe("DUNNING_STAGE_CONFIG_ROW_NOT_FOUND");
    await prisma.dunningTenantStageConfig.deleteMany({ where: { tenantId: SEED_IDS.tenantId } });
  });

  it("PUT /finance/dunning-reminder-config: VIEWER erhält 403", async () => {
    const put = await app.inject({
      method: "PUT",
      url: "/finance/dunning-reminder-config",
      headers: roleHeaders("VIEWER"),
      payload: {
        stages: buildNineDunningStages("X"),
        reason: "Persistenztest VIEWER darf nicht schreiben",
      },
    });
    expect(put.statusCode).toBe(403);
    expect((put.json() as { code: string }).code).toBe("AUTH_ROLE_FORBIDDEN");
  });

  it("GET /finance/dunning-reminder-config: TENANT_DATABASE bei 9 Postgres-Zeilen", async () => {
    await prisma.dunningTenantStageConfig.createMany({
      data: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
        tenantId: SEED_IDS.tenantId,
        stageOrdinal: n,
        daysAfterDue: 11 * n,
        feeCents: 0,
        label: `Persistenz-Stufe ${n}`,
      })),
    });
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-config",
      headers: adminHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      data: { configSource: string; stages: { stageOrdinal: number; label: string; daysAfterDue: number }[] };
    };
    expect(body.data.configSource).toBe("TENANT_DATABASE");
    expect(body.data.stages).toHaveLength(9);
    expect(body.data.stages[0]!.label).toBe("Persistenz-Stufe 1");
    expect(body.data.stages[0]!.daysAfterDue).toBe(11);
    await prisma.dunningTenantStageConfig.deleteMany({ where: { tenantId: SEED_IDS.tenantId } });
  });

  it("GET /finance/dunning-reminder-templates: TENANT_DATABASE bei 18 Postgres-Zeilen", async () => {
    const rows: Array<{
      tenantId: string;
      stageOrdinal: number;
      channel: string;
      templateType: string;
      body: string;
    }> = [];
    for (let n = 1; n <= 9; n += 1) {
      const templateType = n <= 3 ? "REMINDER" : n <= 6 ? "DEMAND_NOTE" : "DUNNING";
      for (const channel of ["EMAIL", "PRINT"] as const) {
        rows.push({
          tenantId: SEED_IDS.tenantId,
          stageOrdinal: n,
          channel,
          templateType,
          body: `Persistenz-Vorlage Stufe ${n} ${channel} {{MahngebuehrEUR}}`,
        });
      }
    }
    await prisma.dunningTenantStageTemplate.createMany({ data: rows });
    const res = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-templates",
      headers: adminHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      data: { templateSource: string; stages: Array<{ stageOrdinal: number; channels: Array<{ channel: string }> }> };
    };
    expect(body.data.templateSource).toBe("TENANT_DATABASE");
    expect(body.data.stages).toHaveLength(9);
    expect(body.data.stages[0]!.channels).toHaveLength(2);
    await prisma.dunningTenantStageTemplate.deleteMany({ where: { tenantId: SEED_IDS.tenantId } });
  });

  it("PATCH /finance/dunning-reminder-templates/.../channels: 400 bei fehlenden Platzhaltern, 200 + Audit bei gueltigem Body", async () => {
    const rows: Array<{
      tenantId: string;
      stageOrdinal: number;
      channel: string;
      templateType: string;
      body: string;
    }> = [];
    for (let n = 1; n <= 9; n += 1) {
      const templateType = n <= 3 ? "REMINDER" : n <= 6 ? "DEMAND_NOTE" : "DUNNING";
      const bodyBase =
        templateType === "DUNNING"
          ? `Stufe ${n} {{MahngebuehrEUR}}`
          : `Stufe ${n} {{MahngebuehrEUR}} {{SkontoBetragEUR}} {{SkontofristDatum}}`;
      for (const channel of ["EMAIL", "PRINT"] as const) {
        rows.push({
          tenantId: SEED_IDS.tenantId,
          stageOrdinal: n,
          channel,
          templateType,
          body: `${bodyBase} ${channel}`,
        });
      }
    }
    await prisma.dunningTenantStageTemplate.createMany({ data: rows });

    const bad = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-reminder-templates/stages/1/channels/EMAIL",
      headers: adminHeaders(),
      payload: { body: "Ohne Platzhalter", reason: "Persistenztest ungueltige Mahn-Vorlage" },
    });
    expect(bad.statusCode).toBe(400);
    expect((bad.json() as { code: string }).code).toBe("DUNNING_TEMPLATE_PLACEHOLDERS_INVALID");

    const okBody = "Neu {{MahngebuehrEUR}} {{SkontoBetragEUR}} {{SkontofristDatum}} PATCH";
    const ok = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-reminder-templates/stages/1/channels/EMAIL",
      headers: adminHeaders(),
      payload: { body: okBody, reason: "Persistenztest PATCH Mahn-Vorlage gueltig" },
    });
    expect(ok.statusCode).toBe(200);
    const updated = await prisma.dunningTenantStageTemplate.findFirst({
      where: { tenantId: SEED_IDS.tenantId, stageOrdinal: 1, channel: "EMAIL", deletedAt: null },
    });
    expect(updated?.body).toBe(okBody);

    const audit = await prisma.auditEvent.findFirst({
      where: { tenantId: SEED_IDS.tenantId, action: "DUNNING_TEMPLATE_BODY_PATCHED" },
      orderBy: { timestamp: "desc" },
    });
    expect(audit).toBeTruthy();

    await prisma.dunningTenantStageTemplate.deleteMany({ where: { tenantId: SEED_IDS.tenantId } });
  });

  it("GET|PATCH /finance/dunning-email-footer: NOT_CONFIGURED, dann TENANT_DATABASE + ready + Audit", async () => {
    const get0 = await app.inject({
      method: "GET",
      url: "/finance/dunning-email-footer",
      headers: adminHeaders(),
    });
    expect(get0.statusCode).toBe(200);
    const b0 = get0.json() as {
      data: {
        footerSource: string;
        readyForEmailFooter: boolean;
        impressumComplianceTier: string;
        impressumGaps: string[];
      };
    };
    expect(b0.data.footerSource).toBe("NOT_CONFIGURED");
    expect(b0.data.readyForEmailFooter).toBe(false);
    expect(b0.data.impressumComplianceTier).toBe("MINIMAL");
    expect(b0.data.impressumGaps.length).toBeGreaterThan(0);

    const patch1 = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-email-footer",
      headers: adminHeaders(),
      payload: {
        companyLegalName: "Persistenz Demo GmbH",
        streetLine: "Testweg 2",
        postalCode: "10115",
        city: "Berlin",
        countryCode: "de",
        publicEmail: "kontakt@example.com",
        publicPhone: "+49 30 123456",
        reason: "Persistenztest Footer Stammdaten Teil 1",
      },
    });
    expect(patch1.statusCode).toBe(200);
    const b1 = patch1.json() as {
      data: {
        footerSource: string;
        readyForEmailFooter: boolean;
        countryCode: string;
        impressumComplianceTier: string;
        impressumGaps: string[];
      };
    };
    expect(b1.data.footerSource).toBe("TENANT_DATABASE");
    expect(b1.data.countryCode).toBe("DE");
    expect(b1.data.readyForEmailFooter).toBe(true);
    expect(b1.data.impressumComplianceTier).toBe("MINIMAL");
    expect(b1.data.impressumGaps).toEqual(
      expect.arrayContaining(["LEGAL_REPRESENTATIVE_MISSING", "VAT_ID_MISSING"]),
    );

    const patch2 = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-email-footer",
      headers: adminHeaders(),
      payload: {
        legalRepresentative: "Erika Mustermann (Geschäftsführung)",
        vatId: "DE123456789",
        reason: "Persistenztest Footer Impressum Heuristik vervollständigen",
      },
    });
    expect(patch2.statusCode).toBe(200);
    const b2 = patch2.json() as { data: { impressumComplianceTier: string; impressumGaps: string[] } };
    expect(b2.data.impressumComplianceTier).toBe("EXTENDED");
    expect(b2.data.impressumGaps).toEqual([]);

    const audit = await prisma.auditEvent.findFirst({
      where: { tenantId: SEED_IDS.tenantId, action: "DUNNING_EMAIL_FOOTER_PATCHED" },
      orderBy: { timestamp: "desc" },
    });
    expect(audit).toBeTruthy();

    await prisma.dunningTenantEmailFooter.deleteMany({ where: { tenantId: SEED_IDS.tenantId } });
  });

  it("POST /invoices/{invoiceId}/dunning-reminders/email-preview + send-email-stub (M4 Slice 4)", async () => {
    const patchFooter = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-email-footer",
      headers: adminHeaders(),
      payload: {
        companyLegalName: "Preview GmbH",
        streetLine: "Weg 9",
        postalCode: "10115",
        city: "Berlin",
        countryCode: "DE",
        publicEmail: "kontakt@preview.example",
        publicPhone: "+49 30 999",
        legalRepresentative: "Vorstand Vorschau",
        vatId: "DE123456789",
        reason: "Persistenztest Footer für E-Mail-Preview",
      },
    });
    expect(patchFooter.statusCode).toBe(200);

    const pv = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders/email-preview`,
      headers: adminHeaders(),
      payload: { stageOrdinal: 1, reason: "Persistenztest E-Mail-Vorschau Stufe 1" },
    });
    expect(pv.statusCode).toBe(200);
    const pvBody = pv.json() as { data: { readyForEmailFooter: boolean; fullPlainText: string } };
    expect(pvBody.data.readyForEmailFooter).toBe(true);
    expect(pvBody.data.fullPlainText).toContain("Preview GmbH");

    const stub = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders/send-email-stub`,
      headers: adminHeaders(),
      payload: { stageOrdinal: 1, reason: "Persistenztest E-Mail-Versand-Stub" },
    });
    expect(stub.statusCode).toBe(200);
    const stubBody = stub.json() as { data: { outcome: string; auditEventId: string } };
    expect(stubBody.data.outcome).toBe("NOT_SENT_NO_SMTP");

    const audit = await prisma.auditEvent.findFirst({
      where: { tenantId: SEED_IDS.tenantId, action: "DUNNING_EMAIL_SEND_STUB" },
      orderBy: { timestamp: "desc" },
    });
    expect(audit).toBeTruthy();

    await prisma.dunningTenantEmailFooter.deleteMany({ where: { tenantId: SEED_IDS.tenantId } });
  });

  it("POST …/dunning-reminders/send-email returns 503 when SMTP not configured (M4 Slice 5a)", async () => {
    const patchFooter = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-email-footer",
      headers: adminHeaders(),
      payload: {
        companyLegalName: "SMTP Gate GmbH",
        streetLine: "Weg 11",
        postalCode: "10115",
        city: "Berlin",
        countryCode: "DE",
        publicEmail: "kontakt@smtp-gate.example",
        publicPhone: "+49 30 1",
        legalRepresentative: "GF Test",
        vatId: "DE123456789",
        reason: "Persistenztest Footer fuer SMTP-Gate",
      },
    });
    expect(patchFooter.statusCode).toBe(200);

    const idem = randomUUID();
    const res = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders/send-email`,
      headers: { ...adminHeaders(), "Idempotency-Key": idem },
      payload: {
        stageOrdinal: 1,
        reason: "Persistenztest Mahn-E-Mail ohne SMTP-Transport",
        toEmail: "kunde@example.com",
      },
    });
    expect(res.statusCode).toBe(503);
    expect((res.json() as { code: string }).code).toBe("DUNNING_EMAIL_SMTP_NOT_CONFIGURED");

    await prisma.dunningTenantEmailFooter.deleteMany({ where: { tenantId: SEED_IDS.tenantId } });
  });

  it("POST /invoices/{invoiceId}/dunning-reminders: persistiert und GET listet Zeile", async () => {
    const post = await app.inject({
      method: "POST",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders`,
      headers: adminHeaders(),
      payload: { stageOrdinal: 1, reason: "Persistenztest Mahn-Ereignis anlegen" },
    });
    expect(post.statusCode).toBe(201);
    const created = post.json() as { dunningReminderId: string; stageOrdinal: number; createdAt: string };
    expect(created.stageOrdinal).toBe(1);
    expect(created.dunningReminderId).toMatch(/^[0-9a-f-]{36}$/u);

    const list = await app.inject({
      method: "GET",
      url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders`,
      headers: adminHeaders(),
    });
    expect(list.statusCode).toBe(200);
    const body = list.json() as { data: Array<{ dunningReminderId: string; stageOrdinal: number }> };
    expect(body.data.some((r) => r.dunningReminderId === created.dunningReminderId)).toBe(true);

    const row = await prisma.dunningReminder.findFirst({
      where: { tenantId: SEED_IDS.tenantId, id: created.dunningReminderId },
    });
    expect(row).toBeTruthy();
    expect(row!.invoiceId).toBe(SEED_IDS.invoiceId);
  });

  it("POST /finance/dunning-reminder-run EXECUTE: speichert dunning_reminder_run_intents und Replay (M4 Slice 5b-1)", async () => {
    const idem = randomUUID();
    const asOf = "2026-04-28";
    const payload = {
      stageOrdinal: 1,
      asOfDate: asOf,
      mode: "EXECUTE" as const,
      reason: "Persistenztest Mahnlauf-EXECUTE Idempotenz",
      invoiceIds: [SEED_IDS.inconsistentInvoiceId],
    };
    const first = await app.inject({
      method: "POST",
      url: "/finance/dunning-reminder-run",
      headers: { ...adminHeaders(), "Idempotency-Key": idem },
      payload,
    });
    expect(first.statusCode).toBe(200);
    const firstBody = first.json() as { data: { outcome: string; executed: Array<{ invoiceId: string }> } };
    expect(firstBody.data.outcome).toBe("COMPLETED");
    expect(firstBody.data.executed).toHaveLength(1);
    expect(firstBody.data.executed[0].invoiceId).toBe(SEED_IDS.inconsistentInvoiceId);

    const intent = await prisma.dunningReminderRunIntent.findUnique({
      where: {
        tenantId_idempotencyKey: { tenantId: SEED_IDS.tenantId, idempotencyKey: idem },
      },
    });
    expect(intent).toBeTruthy();
    expect(intent!.fingerprint).toMatch(/^[a-f0-9]{64}$/u);
    expect((JSON.parse(intent!.responseJson) as { data: { outcome: string } }).data.outcome).toBe("COMPLETED");

    const second = await app.inject({
      method: "POST",
      url: "/finance/dunning-reminder-run",
      headers: { ...adminHeaders(), "Idempotency-Key": idem },
      payload,
    });
    expect(second.statusCode).toBe(200);
    expect((second.json() as { data: { outcome: string } }).data.outcome).toBe("REPLAY");

    const count = await prisma.dunningReminderRunIntent.count({
      where: { tenantId: SEED_IDS.tenantId, idempotencyKey: idem },
    });
    expect(count).toBe(1);
  });

  it("GET|PATCH /finance/dunning-reminder-automation persists in Postgres", async () => {
    const get0 = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-automation",
      headers: adminHeaders(),
    });
    expect(get0.statusCode).toBe(200);
    expect((get0.json() as { data: { automationSource: string } }).data.automationSource).toBe("NOT_CONFIGURED");

    const patch = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-reminder-automation",
      headers: adminHeaders(),
      payload: {
        reason: "Persistenztest Automation SEMI",
        runMode: "SEMI",
        ianaTimezone: "Europe/Berlin",
        federalStateCode: "BY",
        paymentTermDayKind: "BUSINESS",
        preferredDunningChannel: "PRINT",
      },
    });
    expect(patch.statusCode).toBe(200);
    const p = patch.json() as {
      data: {
        runMode: string;
        jobHourUtc: null;
        ianaTimezone: string;
        federalStateCode: string | null;
        paymentTermDayKind: string;
        preferredDunningChannel: string;
      };
    };
    expect(p.data.runMode).toBe("SEMI");
    expect(p.data.jobHourUtc).toBeNull();
    expect(p.data.ianaTimezone).toBe("Europe/Berlin");
    expect(p.data.federalStateCode).toBe("BY");
    expect(p.data.paymentTermDayKind).toBe("BUSINESS");
    expect(p.data.preferredDunningChannel).toBe("PRINT");

    const row = await prisma.dunningTenantAutomation.findUnique({ where: { tenantId: SEED_IDS.tenantId } });
    expect(row?.runMode).toBe("SEMI");
    expect(row?.jobHourUtc).toBeNull();
    expect(row?.ianaTimezone).toBe("Europe/Berlin");
    expect(row?.federalStateCode).toBe("BY");
    expect(row?.paymentTermDayKind).toBe("BUSINESS");
    expect(row?.preferredDunningChannel).toBe("PRINT");
  });

  it("POST /finance/dunning-reminder-run: 409 DUNNING_REMINDER_RUN_DISABLED when automation runMode OFF (1b)", async () => {
    const patchOff = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-reminder-automation",
      headers: adminHeaders(),
      payload: {
        reason: "Persistenztest Mahnlauf OFF fuer API-1b",
        runMode: "OFF",
        ianaTimezone: "Europe/Berlin",
        federalStateCode: null,
        paymentTermDayKind: "CALENDAR",
        preferredDunningChannel: "EMAIL",
      },
    });
    expect(patchOff.statusCode).toBe(200);
    expect((patchOff.json() as { data: { runMode: string } }).data.runMode).toBe("OFF");

    const dry = await app.inject({
      method: "POST",
      url: "/finance/dunning-reminder-run",
      headers: adminHeaders(),
      payload: {
        stageOrdinal: 1,
        asOfDate: "2026-04-28",
        mode: "DRY_RUN",
        reason: "DRY_RUN bei OFF muss 409 liefern",
      },
    });
    expect(dry.statusCode).toBe(409);
    expect((dry.json() as { code: string }).code).toBe("DUNNING_REMINDER_RUN_DISABLED");

    const idem = randomUUID();
    const exec = await app.inject({
      method: "POST",
      url: "/finance/dunning-reminder-run",
      headers: { ...adminHeaders(), "Idempotency-Key": idem },
      payload: {
        stageOrdinal: 1,
        asOfDate: "2026-04-28",
        mode: "EXECUTE",
        reason: "EXECUTE bei OFF muss 409 liefern",
        invoiceIds: [SEED_IDS.inconsistentInvoiceId],
      },
    });
    expect(exec.statusCode).toBe(409);
    expect((exec.json() as { code: string }).code).toBe("DUNNING_REMINDER_RUN_DISABLED");

    const batchDry = await app.inject({
      method: "POST",
      url: "/finance/dunning-reminder-run/send-emails",
      headers: adminHeaders(),
      payload: {
        stageOrdinal: 1,
        asOfDate: "2026-04-28",
        mode: "DRY_RUN",
        reason: "Batch-E-Mail DRY_RUN bei OFF muss 409 liefern",
        items: [{ invoiceId: SEED_IDS.inconsistentInvoiceId, toEmail: "ops@example.com" }],
      },
    });
    expect(batchDry.statusCode).toBe(409);
    expect((batchDry.json() as { code: string }).code).toBe("DUNNING_REMINDER_RUN_DISABLED");

    const cand = await app.inject({
      method: "GET",
      url: "/finance/dunning-reminder-candidates?stageOrdinal=1&asOfDate=2026-04-28",
      headers: adminHeaders(),
    });
    expect(cand.statusCode).toBe(200);

    const restore = await app.inject({
      method: "PATCH",
      url: "/finance/dunning-reminder-automation",
      headers: adminHeaders(),
      payload: {
        reason: "Persistenztest Mahnlauf zurueck SEMI nach API-1b",
        runMode: "SEMI",
        ianaTimezone: "Europe/Berlin",
        federalStateCode: null,
        paymentTermDayKind: "CALENDAR",
        preferredDunningChannel: "EMAIL",
      },
    });
    expect(restore.statusCode).toBe(200);
    expect((restore.json() as { data: { runMode: string } }).data.runMode).toBe("SEMI");
  });

  it("Audit: Schreibpfad Postgres + GET liefert nur minimierte Felder", async () => {
    await app.inject({
      method: "POST",
      url: "/offers/status",
      headers: adminHeaders(),
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "IN_FREIGABE",
        reason: "Persistenztest Angebotsstatus",
      },
    });
    const row = await prisma.auditEvent.findFirst({
      where: { tenantId: SEED_IDS.tenantId, action: "STATUS_CHANGED" },
      orderBy: { timestamp: "desc" },
    });
    expect(row).toBeTruthy();
    const res = await app.inject({
      method: "GET",
      url: "/audit-events?page=1&pageSize=20",
      headers: adminHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const entry = (res.json() as { data: Record<string, unknown>[] }).data.find((x) => x.id === row!.id);
    expect(entry).toBeDefined();
    expect(entry).not.toHaveProperty("beforeState");
    expect(entry).not.toHaveProperty("reason");
  });

  it("GET /audit-events liest nur eigenen Tenant aus DB", async () => {
    const foreignTenant = "99999999-9999-4999-8999-999999999999";
    const foreignId = randomUUID();
    await prisma.auditEvent.create({
      data: {
        id: foreignId,
        tenantId: foreignTenant,
        entityType: "OFFER_VERSION",
        entityId: SEED_IDS.offerVersionId,
        action: "STATUS_CHANGED",
        timestamp: new Date(),
        actorUserId: "88888888-8888-4888-8888-888888888888",
      },
    });
    const res = await app.inject({
      method: "GET",
      url: "/audit-events?page=1&pageSize=100",
      headers: adminHeaders(SEED_IDS.tenantId),
    });
    expect(
      (res.json() as { data: { id: string }[] }).data.some((x) => x.id === foreignId),
    ).toBe(false);
  });

  it("CI Postgres job: PERSISTENCE_DB_TEST_URL is set when running under GitHub Actions", () => {
    if (process.env.GITHUB_ACTIONS === "true") {
      expect(dbUrl).toMatch(/^postgresql:\/\//);
    }
  });

  it("applies migrations including LV, Aufmass, audit_events, Supplement-Tabellen und offer_versions.lv_version_id", async () => {
    const rows = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename IN (
        'audit_events','lv_catalogs','lv_positions','lv_structure_nodes','lv_versions',
        'measurement_positions','measurement_versions','measurements','offers','offer_versions',
        'supplement_offers','supplement_versions')
      ORDER BY tablename`;
    expect(rows.map((r) => r.tablename)).toEqual([
      "audit_events",
      "lv_catalogs",
      "lv_positions",
      "lv_structure_nodes",
      "lv_versions",
      "measurement_positions",
      "measurement_versions",
      "measurements",
      "offer_versions",
      "offers",
      "supplement_offers",
      "supplement_versions",
    ]);
    const cons = await prisma.$queryRaw<{ conname: string }[]>`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'offers'::regclass AND contype = 'f' AND conname = 'offers_current_version_fkey'`;
    expect(cons.length).toBe(1);
    const lvFk = await prisma.$queryRaw<{ conname: string }[]>`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'offer_versions'::regclass AND contype = 'f' AND conname = 'offer_versions_tenant_lv_version_id_fkey'`;
    expect(lvFk.length).toBe(1);
  });

  it("rejects cross-tenant offer_version insert (composite FK tenant_id, offer_id)", async () => {
    const tenantA = randomUUID();
    const tenantB = randomUUID();
    const offerId = randomUUID();
    const versionId = randomUUID();
    const catB = randomUUID();
    const lvB = randomUUID();
    const actor = randomUUID();
    const now = new Date();
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET CONSTRAINTS ALL DEFERRED");
        await tx.lvCatalog.create({
          data: {
            tenantId: tenantB,
            id: catB,
            name: "cross-tenant-fk",
            currentVersionId: lvB,
            createdAt: now,
            createdBy: actor,
          },
        });
        await tx.lvVersion.create({
          data: {
            tenantId: tenantB,
            id: lvB,
            lvCatalogId: catB,
            versionNumber: 1,
            status: "ENTWURF",
            headerSystemText: "h",
            headerEditingText: "h2",
            createdAt: now,
            createdBy: actor,
          },
        });
        await tx.offer.create({
          data: {
            tenantId: tenantA,
            id: offerId,
            projectId: randomUUID(),
            customerId: randomUUID(),
            currentVersionId: versionId,
            createdAt: now,
            createdBy: actor,
          },
        });
        await tx.offerVersion.create({
          data: {
            tenantId: tenantB,
            id: versionId,
            offerId,
            versionNumber: 1,
            status: "ENTWURF",
            lvVersionId: lvB,
            systemText: "sys",
            editingText: "edit",
            createdAt: now,
            createdBy: actor,
          },
        });
      }),
    ).rejects.toSatisfy(isForeignKeyViolation);
  });

  it("rejects offer when current_version_id has no matching offer_version at commit (offers_current_version_fkey)", async () => {
    const tenantId = randomUUID();
    const offerId = randomUUID();
    const bogusVersionId = randomUUID();
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET CONSTRAINTS ALL DEFERRED");
        await tx.offer.create({
          data: {
            tenantId,
            id: offerId,
            projectId: randomUUID(),
            customerId: randomUUID(),
            currentVersionId: bogusVersionId,
            createdAt: new Date(),
            createdBy: randomUUID(),
          },
        });
      }),
    ).rejects.toSatisfy(isForeignKeyViolation);
  });

  it("allows deferred insert: offer row before offer_version when current_version_id matches (same transaction)", async () => {
    const tenantId = randomUUID();
    const offerId = randomUUID();
    const versionId = randomUUID();
    const catId = randomUUID();
    const lvVid = randomUUID();
    const actor = randomUUID();
    const now = new Date();
    const rollbackTag = "ROLLBACK_DEFERRED_INSERT_TEST";
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET CONSTRAINTS ALL DEFERRED");
        await tx.lvCatalog.create({
          data: {
            tenantId,
            id: catId,
            name: "defer-offer-fk",
            currentVersionId: lvVid,
            createdAt: now,
            createdBy: actor,
          },
        });
        await tx.lvVersion.create({
          data: {
            tenantId,
            id: lvVid,
            lvCatalogId: catId,
            versionNumber: 1,
            status: "ENTWURF",
            headerSystemText: "h",
            headerEditingText: "h2",
            createdAt: now,
            createdBy: actor,
          },
        });
        await tx.offer.create({
          data: {
            tenantId,
            id: offerId,
            projectId: randomUUID(),
            customerId: randomUUID(),
            currentVersionId: versionId,
            createdAt: now,
            createdBy: actor,
          },
        });
        await tx.offerVersion.create({
          data: {
            tenantId,
            id: versionId,
            offerId,
            versionNumber: 1,
            status: "ENTWURF",
            lvVersionId: lvVid,
            systemText: "sys",
            editingText: "edit",
            createdAt: now,
            createdBy: actor,
          },
        });
        const o = await tx.offer.findUnique({ where: { tenantId_id: { tenantId, id: offerId } } });
        expect(o?.currentVersionId).toBe(versionId);
        throw new Error(rollbackTag);
      }),
    ).rejects.toThrow(rollbackTag);
    const leaked = await prisma.offer.findUnique({ where: { tenantId_id: { tenantId, id: offerId } } });
    expect(leaked).toBeNull();
  });

  it("persisted audit_event survives PrismaClient disconnect and new connection (restart simulation)", async () => {
    const id = randomUUID();
    const tenantId = randomUUID();
    const entityId = randomUUID();
    const actorId = randomUUID();
    const ts = new Date();
    await prisma.auditEvent.create({
      data: {
        id,
        tenantId,
        entityType: "OFFER_VERSION",
        entityId,
        action: "PERSISTENCE_QA_PROBE",
        timestamp: ts,
        actorUserId: actorId,
        reason: "increment-2 reconnect smoke",
      },
    });
    await prisma.$disconnect();

    const prisma2 = createPrismaClient(dbUrl!);
    const row = await prisma2.auditEvent.findUnique({ where: { id } });
    expect(row).not.toBeNull();
    expect(row?.action).toBe("PERSISTENCE_QA_PROBE");
    expect(row?.tenantId).toBe(tenantId);
    await prisma2.auditEvent.delete({ where: { id } });
    await prisma2.$disconnect();

    prisma = createPrismaClient(dbUrl!);
  });

  it("API: Supplement anlegen + Statuswechsel persistieren (supplement_offers / supplement_versions)", async () => {
    const ladder = [
      { next: "IN_FREIGABE" as const, useGf: false as const },
      { next: "FREIGEGEBEN" as const, useGf: false as const },
      { next: "VERSENDET" as const, useGf: false as const },
      { next: "ANGENOMMEN" as const, useGf: true as const },
    ];

    for (const { next, useGf } of ladder) {
      const ovRow = await prisma.offerVersion.findUnique({
        where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: SEED_IDS.offerVersionId } },
      });
      expect(ovRow).not.toBeNull();
      if (ovRow!.status === "ANGENOMMEN") break;
      if (ovRow!.status === next) continue;

      const headers = useGf ? roleHeaders("GESCHAEFTSFUEHRUNG") : adminHeaders();
      const r = await app.inject({
        method: "POST",
        url: "/offers/status",
        headers,
        payload: {
          offerVersionId: SEED_IDS.offerVersionId,
          nextStatus: next,
          reason: "Persistenz-Supplement-API bis ANGENOMMEN",
        },
      });
      expect(r.statusCode).toBe(200);
    }

    const create = await app.inject({
      method: "POST",
      url: `/offers/${SEED_IDS.offerId}/supplements`,
      headers: roleHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        baseOfferVersionId: SEED_IDS.offerVersionId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Persistenz-Integration Nachtrag API",
        reason: "API integration test supplement Postgres",
      },
    });
    expect(create.statusCode).toBe(201);
    const body = create.json() as {
      id: string;
      supplementOfferId: string;
      tenantId: string;
      status: string;
      lvVersionId: string;
      editingText: string;
    };
    expect(body.status).toBe("ENTWURF");

    const soRow = await prisma.supplementOffer.findUnique({
      where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: body.supplementOfferId } },
    });
    expect(soRow).not.toBeNull();
    expect(soRow!.offerId).toBe(SEED_IDS.offerId);
    expect(soRow!.baseOfferVersionId).toBe(SEED_IDS.offerVersionId);

    const svRow = await prisma.supplementVersion.findUnique({
      where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: body.id } },
      include: { supplementOffer: true, lvVersion: true },
    });
    expect(svRow).not.toBeNull();
    expect(svRow!.supplementOfferId).toBe(body.supplementOfferId);
    expect(svRow!.lvVersionId).toBe(SEED_IDS.lvVersionId);
    expect(svRow!.lvVersion?.id).toBe(SEED_IDS.lvVersionId);
    expect(svRow!.editingText).toBe("Persistenz-Integration Nachtrag API");

    const trans = await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: adminHeaders(),
      payload: {
        supplementVersionId: body.id,
        nextStatus: "IN_FREIGABE",
        reason: "Persistenz-API Nachtrag Statuswechsel",
      },
    });
    expect(trans.statusCode).toBe(200);

    const svAfter = await prisma.supplementVersion.findUnique({
      where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: body.id } },
    });
    expect(svAfter?.status).toBe("IN_FREIGABE");
  });

  describe("M4 Slice 5a: POST …/dunning-reminders/send-email (mock SMTP)", () => {
    let appSmtp!: FastifyInstance;
    const captured: Array<{ to: string; subject: string }> = [];

    beforeAll(async () => {
      appSmtp = await buildApp({
        repositoryMode: "postgres",
        seedDemoData: true,
        mailTransport: {
          isConfigured: () => true,
          send: async (input) => {
            captured.push({ to: input.to, subject: input.subject });
            return { messageId: "persistenz-test-smtp-1" };
          },
        },
      });
      await appSmtp.ready();
    });

    afterAll(async () => {
      await appSmtp.close();
    });

    async function patchFooterReady(): Promise<void> {
      const patchFooter = await appSmtp.inject({
        method: "PATCH",
        url: "/finance/dunning-email-footer",
        headers: adminHeaders(),
        payload: {
          companyLegalName: "Mock SMTP GmbH",
          streetLine: "Weg 21",
          postalCode: "10115",
          city: "Berlin",
          countryCode: "DE",
          publicEmail: "kontakt@mock-smtp.example",
          publicPhone: "+49 30 2",
          legalRepresentative: "GF Mock",
          vatId: "DE987654321",
          reason: "Persistenztest Footer Mock-SMTP Mahn-Mail",
        },
      });
      expect(patchFooter.statusCode).toBe(200);
    }

    it("200 SENT, audit, DB row, mock transport called once", async () => {
      captured.length = 0;
      await patchFooterReady();
      const idem = randomUUID();
      const res = await appSmtp.inject({
        method: "POST",
        url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders/send-email`,
        headers: { ...adminHeaders(), "Idempotency-Key": idem },
        payload: {
          stageOrdinal: 1,
          reason: "Persistenztest Mahn-E-Mail SMTP mock",
          toEmail: "empfaenger@example.com",
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { data: { outcome: string; smtpMessageId?: string; recipientEmail: string } };
      expect(body.data.outcome).toBe("SENT");
      expect(body.data.recipientEmail).toBe("empfaenger@example.com");
      expect(body.data.smtpMessageId).toBe("persistenz-test-smtp-1");
      expect(captured.length).toBe(1);
      expect(captured[0].to).toBe("empfaenger@example.com");

      const audit = await prisma.auditEvent.findFirst({
        where: { tenantId: SEED_IDS.tenantId, action: "DUNNING_EMAIL_SENT" },
        orderBy: { timestamp: "desc" },
      });
      expect(audit).toBeTruthy();

      const row = await prisma.dunningEmailSend.findFirst({
        where: { tenantId: SEED_IDS.tenantId, idempotencyKey: idem },
      });
      expect(row).toBeTruthy();
      expect(row!.recipientEmail).toBe("empfaenger@example.com");

      await prisma.dunningEmailSend.deleteMany({ where: { tenantId: SEED_IDS.tenantId, idempotencyKey: idem } });
      await prisma.dunningTenantEmailFooter.deleteMany({ where: { tenantId: SEED_IDS.tenantId } });
    });

    it("REPLAY on same Idempotency-Key without second SMTP call", async () => {
      captured.length = 0;
      await patchFooterReady();
      const idem = randomUUID();
      const headers = { ...adminHeaders(), "Idempotency-Key": idem };
      const payload = {
        stageOrdinal: 1,
        reason: "Persistenztest Mahn-E-Mail Idempotenz A",
        toEmail: "same@example.com",
      };
      const first = await appSmtp.inject({
        method: "POST",
        url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders/send-email`,
        headers,
        payload,
      });
      expect(first.statusCode).toBe(200);
      expect(captured.length).toBe(1);
      const second = await appSmtp.inject({
        method: "POST",
        url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders/send-email`,
        headers,
        payload,
      });
      expect(second.statusCode).toBe(200);
      expect((second.json() as { data: { outcome: string } }).data.outcome).toBe("REPLAY");
      expect(captured.length).toBe(1);

      await prisma.dunningEmailSend.deleteMany({ where: { tenantId: SEED_IDS.tenantId, idempotencyKey: idem } });
      await prisma.dunningTenantEmailFooter.deleteMany({ where: { tenantId: SEED_IDS.tenantId } });
    });

    it("400 DUNNING_EMAIL_IDEMPOTENCY_MISMATCH when reusing key with different toEmail", async () => {
      captured.length = 0;
      await patchFooterReady();
      const idem = randomUUID();
      const headers = { ...adminHeaders(), "Idempotency-Key": idem };
      const first = await appSmtp.inject({
        method: "POST",
        url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders/send-email`,
        headers,
        payload: {
          stageOrdinal: 1,
          reason: "Persistenztest Idempotenz mismatch first",
          toEmail: "a@example.com",
        },
      });
      expect(first.statusCode).toBe(200);
      const second = await appSmtp.inject({
        method: "POST",
        url: `/invoices/${SEED_IDS.invoiceId}/dunning-reminders/send-email`,
        headers,
        payload: {
          stageOrdinal: 1,
          reason: "Persistenztest Idempotenz mismatch second",
          toEmail: "b@example.com",
        },
      });
      expect(second.statusCode).toBe(400);
      expect((second.json() as { code: string }).code).toBe("DUNNING_EMAIL_IDEMPOTENCY_MISMATCH");

      await prisma.dunningEmailSend.deleteMany({ where: { tenantId: SEED_IDS.tenantId, idempotencyKey: idem } });
      await prisma.dunningTenantEmailFooter.deleteMany({ where: { tenantId: SEED_IDS.tenantId } });
    });
  });

  it("Hydration-Smoke: zweiter Start ohne Seed lädt Nachtrag aus Postgres (GET /supplements/:id)", async () => {
    const probe = await prisma.supplementVersion.findFirst({
      where: {
        tenantId: SEED_IDS.tenantId,
        editingText: "Persistenz-Integration Nachtrag API",
      },
    });
    expect(probe).not.toBeNull();

    await app.close();
    process.env.DATABASE_URL = dbUrl!;
    app = await buildApp({ repositoryMode: "postgres", seedDemoData: false });
    await app.ready();
    const ready2 = await app.inject({ method: "GET", url: "/ready" });
    expect(ready2.statusCode).toBe(200);
    expect(ready2.json()).toEqual({ status: "ready", checks: { database: "ok" } });

    const res = await app.inject({
      method: "GET",
      url: `/supplements/${probe!.id}`,
      headers: adminHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const json = res.json() as {
      id: string;
      status: string;
      supplementOfferId: string;
      baseOfferVersionId: string;
      tenantId: string;
    };
    expect(json.id).toBe(probe!.id);
    expect(json.status).toBe("IN_FREIGABE");
    expect(json.supplementOfferId).toBe(probe!.supplementOfferId);
    expect(json.baseOfferVersionId).toBe(SEED_IDS.offerVersionId);
    expect(json.tenantId).toBe(SEED_IDS.tenantId);
  });
});
