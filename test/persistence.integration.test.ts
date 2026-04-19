import { execSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { buildApp } from "../src/api/app.js";
import { SEED_IDS } from "../src/composition/seed.js";
import { createSignedToken } from "../src/auth/token-auth.js";

const dbUrl = process.env.PERSISTENCE_DB_TEST_URL?.trim();

if (process.env.GITHUB_ACTIONS === "true" && !dbUrl) {
  throw new Error("PERSISTENCE_DB_TEST_URL must be set in GitHub Actions CI");
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
  role: "ADMIN" | "GESCHAEFTSFUEHRUNG",
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
    const cleanup = new PrismaClient({ datasourceUrl: dbUrl });
    await cleanup.$executeRawUnsafe(
      `TRUNCATE TABLE supplement_versions, supplement_offers, measurement_positions, measurement_versions, measurements, lv_positions, lv_structure_nodes, lv_versions, lv_catalogs, audit_events, offer_versions, offers, password_reset_challenges, users RESTART IDENTITY CASCADE`,
    );
    await cleanup.$disconnect();

    app = await buildApp({ repositoryMode: "postgres", seedDemoData: true });
    await app.ready();
    prisma = new PrismaClient({ datasourceUrl: dbUrl });
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
    const users = (list.json() as { users: { email: string }[] }).users;
    expect(users.some((u) => u.email === email)).toBe(true);
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
    const users = (list.json() as { users: { id: string; email: string }[] }).users;
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
        role: "VERTRIEB",
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
    ).rejects.toMatchObject({ code: "P2003" });
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
    ).rejects.toMatchObject({ code: "P2003" });
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
    ).rejects.toMatchObject({ code: "P2003" });
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
    ).rejects.toMatchObject({ code: "P2003" });
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

    const prisma2 = new PrismaClient({ datasourceUrl: dbUrl! });
    const row = await prisma2.auditEvent.findUnique({ where: { id } });
    expect(row).not.toBeNull();
    expect(row?.action).toBe("PERSISTENCE_QA_PROBE");
    expect(row?.tenantId).toBe(tenantId);
    await prisma2.auditEvent.delete({ where: { id } });
    await prisma2.$disconnect();

    prisma = new PrismaClient({ datasourceUrl: dbUrl! });
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
});
