import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildApp } from "../src/api/app.js";
import { SEED_IDS } from "../src/composition/seed.js";
import { createSignedToken } from "../src/auth/token-auth.js";

/** Tests aligned with docs/ERP-Systembeschreibung.md (Angebot: Anpassung vor Annahme, nach ANGENOMMEN nur Nachtrag). */
describe("ERP domain slice (Teil I Domäne)", () => {
  let app: FastifyInstance;
  const userId = "77777777-7777-4777-8777-777777777777";
  const buildHeaders = (
    role: "ADMIN" | "BUCHHALTUNG" | "GESCHAEFTSFUEHRUNG" | "VERTRIEB_BAULEITUNG" | "VIEWER" = "ADMIN",
    tenantId: string = SEED_IDS.tenantId,
  ) => {
    const token = createSignedToken({
      sub: userId,
      tenantId,
      role,
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    return {
      authorization: `Bearer ${token}`,
      "x-tenant-id": tenantId,
    };
  };
  const headers = {
    ...buildHeaders("ADMIN"),
  };

  beforeEach(async () => {
    app = await buildApp({ seedDemoData: true, repositoryMode: "memory" });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  const moveOfferToAccepted = async () => {
    for (const nextStatus of ["IN_FREIGABE", "FREIGEGEBEN", "VERSENDET"] as const) {
      await app.inject({
        method: "POST",
        url: "/offers/status",
        headers,
        payload: {
          offerVersionId: SEED_IDS.offerVersionId,
          nextStatus,
          reason: `Lifecycle step ${nextStatus}`,
        },
      });
    }
    await app.inject({
      method: "POST",
      url: "/offers/status",
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "ANGENOMMEN",
        reason: "Annahme vor Nachtrag",
      },
    });
  };

  const createEntwurfLvCatalog = async () => {
    const res = await app.inject({
      method: "POST",
      url: "/lv/catalogs",
      headers: buildHeaders("ADMIN"),
      payload: {
        name: "Test-LV-Katalog",
        headerSystemText: "Kopf-Sys",
        headerEditingText: "Kopf-Ed",
        reason: "Test-Fixture LV §9",
      },
    });
    expect(res.statusCode).toBe(201);
    return res.json() as { lvCatalogId: string; lvVersionId: string; samplePositionId: string };
  };

  const createAcceptedSupplement = async (lvVersionId: string = SEED_IDS.lvVersionId) => {
    await moveOfferToAccepted();
    const created = await app.inject({
      method: "POST",
      url: `/offers/${SEED_IDS.offerId}/supplements`,
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        baseOfferVersionId: SEED_IDS.offerVersionId,
        lvVersionId,
        editingText: "Supplement for test",
        reason: "Prepare supplement state machine",
      },
    });
    expect(created.statusCode).toBe(201);
    return created.json().id as string;
  };

  it("creates a new offer version (positive)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/offers/version",
      headers,
      payload: {
        offerId: "22222222-2222-4222-8222-222222222222",
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Neue Bearbeitung",
        reason: "Fachliche Korrektur",
      },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.versionNumber).toBe(2);
  });

  it("GET /offer-versions/:id returns seed offer version detail", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/offer-versions/${SEED_IDS.offerVersionId}`,
      headers,
    });
    expect(res.statusCode).toBe(200);
    const j = res.json() as { id: string; offerId: string; status: string; systemText: string; editingText: string };
    expect(j.id).toBe(SEED_IDS.offerVersionId);
    expect(j.offerId).toBe(SEED_IDS.offerId);
    expect(j.status).toBe("ENTWURF");
    expect(j.systemText.length).toBeGreaterThan(0);
    expect(j.editingText.length).toBeGreaterThan(0);
  });

  it("GET /offer-versions/:id returns 404 for unknown version", async () => {
    const unknownId = "33333333-3333-4333-8333-333333333399";
    const res = await app.inject({
      method: "GET",
      url: `/offer-versions/${unknownId}`,
      headers,
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe("OFFER_VERSION_NOT_FOUND");
  });

  it("blocks invalid status transition (negative)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/offers/status",
      headers,
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "VERSENDET",
        reason: "Direktversand",
      },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json().code).toBe("STATUS_TRANSITION_FORBIDDEN");
  });

  it("enforces tenant isolation (negative)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/offers/status",
      headers: {
        ...buildHeaders("ADMIN"),
        "x-tenant-id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      },
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "IN_FREIGABE",
        reason: "Freigabe anstoßen",
      },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("TENANT_SCOPE_VIOLATION");
    expect(response.json().correlationId).toBeTypeOf("string");
    expect(response.json().blocking).toBe(true);
  });

  it("fails export if legal readiness missing for offer (negative)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/exports",
      headers,
      payload: {
        entityType: "OFFER_VERSION",
        entityId: SEED_IDS.offerVersionId,
        format: "XRECHNUNG",
      },
    });
    expect(response.statusCode).toBe(422);
    expect(response.json().code).toBe("EXPORT_PREFLIGHT_FAILED");
    expect(response.json().details.validationErrors).toContain("DOCUMENT_NOT_LEGALLY_RELEASED");
  });

  it("fails invoice export when traceability is broken (negative)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/exports",
      headers,
      payload: {
        entityType: "INVOICE",
        entityId: "88888888-8888-4888-8888-888888888888",
        format: "XRECHNUNG",
      },
    });
    expect(response.statusCode).toBe(422);
    expect(response.json().code).toBe("TRACEABILITY_LINK_MISSING");
  });

  it("fails invoice export when traceability fields are inconsistent (negative)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/exports",
      headers,
      payload: {
        entityType: "INVOICE",
        entityId: SEED_IDS.inconsistentInvoiceId,
        format: "XRECHNUNG",
      },
    });
    expect(response.statusCode).toBe(422);
    expect(response.json().code).toBe("TRACEABILITY_FIELD_MISMATCH");
  });

  it("writes audit events for critical actions", async () => {
    await app.inject({
      method: "POST",
      url: "/offers/status",
      headers,
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "IN_FREIGABE",
        reason: "Start Freigabeprozess",
      },
    });
    const response = await app.inject({
      method: "GET",
      url: "/audit-events",
      headers: buildHeaders("ADMIN"),
    });
    expect(response.statusCode).toBe(200);
    const events = response.json().data;
    expect(events.length).toBeGreaterThan(0);
    expect(events.some((event: { action: string }) => event.action === "STATUS_CHANGED")).toBe(true);
    expect(events[0].beforeState).toBeUndefined();
  });

  it("enforces role isolation on audit endpoint (negative)", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/audit-events",
      headers: buildHeaders("VIEWER"),
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("FORBIDDEN_AUDIT_READ");
  });

  it("rejects tenant scope mismatch against token (negative)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/offers/status",
      headers: {
        ...buildHeaders("ADMIN"),
        "x-tenant-id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      },
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "IN_FREIGABE",
        reason: "Start Freigabeprozess",
      },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("TENANT_SCOPE_VIOLATION");
  });

  it("rejects invalid token signature (negative)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/offers/status",
      headers: {
        authorization: "Bearer v1.invalid.invalid",
        "x-tenant-id": SEED_IDS.tenantId,
      },
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "IN_FREIGABE",
        reason: "Start Freigabeprozess",
      },
    });
    expect(response.statusCode).toBe(401);
  });

  it("forbids offer version creation without required role (negative authz)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/offers/version",
      headers: buildHeaders("VIEWER"),
      payload: {
        offerId: SEED_IDS.offerId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Neue Bearbeitung",
        reason: "Fachliche Korrektur",
      },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("AUTH_ROLE_FORBIDDEN");
  });

  it("forbids invoice export without required role (negative authz)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/exports",
      headers: buildHeaders("VERTRIEB_BAULEITUNG"),
      payload: {
        entityType: "INVOICE",
        entityId: SEED_IDS.invoiceId,
        format: "XRECHNUNG",
      },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("AUTH_ROLE_FORBIDDEN");
  });

  it("blocks status transition for unauthorized role (negative authz)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/offers/status",
      headers: buildHeaders("VIEWER"),
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "IN_FREIGABE",
        reason: "Nicht erlaubt",
      },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("AUTH_ROLE_FORBIDDEN");
  });

  it("blocks invoice export for unauthorized role (negative authz)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/exports",
      headers: buildHeaders("VIEWER"),
      payload: {
        entityType: "INVOICE",
        entityId: SEED_IDS.invoiceId,
        format: "XRECHNUNG",
      },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("AUTH_ROLE_FORBIDDEN");
  });

  it("returns backend source-of-truth allowed actions per role", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/documents/${SEED_IDS.offerVersionId}/allowed-actions?entityType=OFFER_VERSION`,
      headers: buildHeaders("VERTRIEB_BAULEITUNG"),
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.allowedActions).toContain("OFFER_SET_IN_FREIGABE");
    expect(body.allowedActions).toContain("OFFER_CREATE_VERSION");
  });

  it("P0 invoice export SoT EXPORT_INVOICE matches POST /exports for BUCHHALTUNG", async () => {
    const sot = await app.inject({
      method: "GET",
      url: `/documents/${SEED_IDS.invoiceId}/allowed-actions?entityType=INVOICE`,
      headers: buildHeaders("BUCHHALTUNG"),
    });
    expect(sot.statusCode).toBe(200);
    expect(sot.json().allowedActions).toContain("EXPORT_INVOICE");
    expect(sot.json().allowedActions).not.toContain("EXPORT_INVOICE_XRECHNUNG");
    const exp = await app.inject({
      method: "POST",
      url: "/exports",
      headers: buildHeaders("BUCHHALTUNG"),
      payload: { entityType: "INVOICE", entityId: SEED_IDS.invoiceId, format: "XRECHNUNG" },
    });
    expect(exp.statusCode).toBe(201);
  });

  it("P0 invoice export ohne SoT-Aktion: VIEWER erhält kein EXPORT_INVOICE; POST /exports 403", async () => {
    const sot = await app.inject({
      method: "GET",
      url: `/documents/${SEED_IDS.invoiceId}/allowed-actions?entityType=INVOICE`,
      headers: buildHeaders("VIEWER"),
    });
    expect(sot.statusCode).toBe(200);
    expect(sot.json().allowedActions).not.toContain("EXPORT_INVOICE");
    const exp = await app.inject({
      method: "POST",
      url: "/exports",
      headers: buildHeaders("VIEWER"),
      payload: { entityType: "INVOICE", entityId: SEED_IDS.invoiceId, format: "XRECHNUNG" },
    });
    expect(exp.statusCode).toBe(403);
    expect(exp.json().code).toBe("AUTH_ROLE_FORBIDDEN");
  });

  it("allows creating a new version after offer was sent before acceptance (v1.2)", async () => {
    await app.inject({
      method: "POST",
      url: "/offers/status",
      headers,
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "IN_FREIGABE",
        reason: "Freigabeprozess",
      },
    });
    await app.inject({
      method: "POST",
      url: "/offers/status",
      headers,
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "FREIGEGEBEN",
        reason: "Freigabe erteilt",
      },
    });
    await app.inject({
      method: "POST",
      url: "/offers/status",
      headers,
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "VERSENDET",
        reason: "Dokument versendet",
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/offers/version",
      headers,
      payload: {
        offerId: SEED_IDS.offerId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Nach Versand editieren",
        reason: "Aenderung",
      },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().versionNumber).toBe(2);
  });

  it("blocks POST /offers/version when current version is ANGENOMMEN (v1.2, FOLLOWUP_DOCUMENT_REQUIRED)", async () => {
    for (const nextStatus of ["IN_FREIGABE", "FREIGEGEBEN", "VERSENDET", "ANGENOMMEN"] as const) {
      await app.inject({
        method: "POST",
        url: "/offers/status",
        headers,
        payload: {
          offerVersionId: SEED_IDS.offerVersionId,
          nextStatus,
          reason: `Lifecycle step ${nextStatus}`,
        },
      });
    }
    const blocked = await app.inject({
      method: "POST",
      url: "/offers/version",
      headers,
      payload: {
        offerId: SEED_IDS.offerId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Nach Annahme nicht erlaubt",
        reason: "Muss Nachtrag sein",
      },
    });
    expect(blocked.statusCode).toBe(409);
    expect(blocked.json().code).toBe("FOLLOWUP_DOCUMENT_REQUIRED");

    const allowed = await app.inject({
      method: "GET",
      url: `/documents/${SEED_IDS.offerVersionId}/allowed-actions?entityType=OFFER_VERSION`,
      headers: buildHeaders("VERTRIEB_BAULEITUNG"),
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json().allowedActions).not.toContain("OFFER_CREATE_VERSION");
  });

  it("blocks POST /offers/version when current version is ABGELEHNT (v1.2, SoT + API)", async () => {
    for (const nextStatus of ["IN_FREIGABE", "FREIGEGEBEN", "VERSENDET", "ABGELEHNT"] as const) {
      await app.inject({
        method: "POST",
        url: "/offers/status",
        headers,
        payload: {
          offerVersionId: SEED_IDS.offerVersionId,
          nextStatus,
          reason: `Lifecycle step ${nextStatus}`,
        },
      });
    }
    const blocked = await app.inject({
      method: "POST",
      url: "/offers/version",
      headers,
      payload: {
        offerId: SEED_IDS.offerId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Nach Ablehnung nicht erlaubt",
        reason: "Endstatus ABGELEHNT",
      },
    });
    expect(blocked.statusCode).toBe(409);
    expect(blocked.json().code).toBe("FOLLOWUP_DOCUMENT_REQUIRED");
    expect(blocked.json().correlationId).toBeTypeOf("string");
    expect(blocked.json().blocking).toBe(true);

    const allowed = await app.inject({
      method: "GET",
      url: `/documents/${SEED_IDS.offerVersionId}/allowed-actions?entityType=OFFER_VERSION`,
      headers: buildHeaders("VERTRIEB_BAULEITUNG"),
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json().allowedActions).not.toContain("OFFER_CREATE_VERSION");
  });

  it("blocks POST /offers/version when current version is ARCHIVIERT (v1.2, SoT + API)", async () => {
    await app.inject({
      method: "POST",
      url: "/offers/status",
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "ARCHIVIERT",
        reason: "Direkt archiviert aus Entwurf",
      },
    });
    const blocked = await app.inject({
      method: "POST",
      url: "/offers/version",
      headers,
      payload: {
        offerId: SEED_IDS.offerId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Nach Archivierung nicht erlaubt",
        reason: "Endstatus ARCHIVIERT",
      },
    });
    expect(blocked.statusCode).toBe(409);
    expect(blocked.json().code).toBe("FOLLOWUP_DOCUMENT_REQUIRED");
    expect(blocked.json().correlationId).toBeTypeOf("string");
    expect(blocked.json().blocking).toBe(true);

    const allowed = await app.inject({
      method: "GET",
      url: `/documents/${SEED_IDS.offerVersionId}/allowed-actions?entityType=OFFER_VERSION`,
      headers: buildHeaders("VERTRIEB_BAULEITUNG"),
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json().allowedActions).not.toContain("OFFER_CREATE_VERSION");
  });

  it("allows GESCHAEFTSFUEHRUNG to set ANGENOMMEN from VERSENDET", async () => {
    for (const nextStatus of ["IN_FREIGABE", "FREIGEGEBEN", "VERSENDET"] as const) {
      await app.inject({
        method: "POST",
        url: "/offers/status",
        headers,
        payload: {
          offerVersionId: SEED_IDS.offerVersionId,
          nextStatus,
          reason: `Lifecycle step ${nextStatus}`,
        },
      });
    }
    const accepted = await app.inject({
      method: "POST",
      url: "/offers/status",
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "ANGENOMMEN",
        reason: "Verbindliche Annahme durch Geschaeftsfuehrung",
      },
    });
    expect(accepted.statusCode).toBe(200);
    expect(accepted.json().status).toBe("ANGENOMMEN");
  });

  it("P0: SoT lists OFFER_CREATE_SUPPLEMENT after ANGENOMMEN for ADMIN, VERTRIEB_BAULEITUNG, GESCHAEFTSFUEHRUNG", async () => {
    for (const nextStatus of ["IN_FREIGABE", "FREIGEGEBEN", "VERSENDET"] as const) {
      await app.inject({
        method: "POST",
        url: "/offers/status",
        headers,
        payload: {
          offerVersionId: SEED_IDS.offerVersionId,
          nextStatus,
          reason: `Lifecycle step ${nextStatus}`,
        },
      });
    }
    await app.inject({
      method: "POST",
      url: "/offers/status",
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "ANGENOMMEN",
        reason: "Annahme fuer SoT Nachtrag",
      },
    });
    for (const role of ["ADMIN", "VERTRIEB_BAULEITUNG", "GESCHAEFTSFUEHRUNG"] as const) {
      const r = await app.inject({
        method: "GET",
        url: `/documents/${SEED_IDS.offerVersionId}/allowed-actions?entityType=OFFER_VERSION`,
        headers: buildHeaders(role),
      });
      expect(r.statusCode).toBe(200);
      expect(r.json().allowedActions).toContain("OFFER_CREATE_SUPPLEMENT");
      expect(r.json().allowedActions).not.toContain("OFFER_CREATE_VERSION");

      const post = await app.inject({
        method: "POST",
        url: `/offers/${SEED_IDS.offerId}/supplements`,
        headers: buildHeaders(role),
        payload: {
          baseOfferVersionId: SEED_IDS.offerVersionId,
          lvVersionId: SEED_IDS.lvVersionId,
          editingText: `Nachtrag durch ${role}`,
          reason: "API-Konsistenz SoT vs POST",
        },
      });
      expect(post.statusCode).toBe(201);
      expect(post.json().status).toBe("ENTWURF");
    }
  });

  it("P0: SoT omits OFFER_CREATE_SUPPLEMENT for VIEWER and BUCHHALTUNG after ANGENOMMEN; POST supplements forbidden", async () => {
    for (const nextStatus of ["IN_FREIGABE", "FREIGEGEBEN", "VERSENDET"] as const) {
      await app.inject({
        method: "POST",
        url: "/offers/status",
        headers,
        payload: {
          offerVersionId: SEED_IDS.offerVersionId,
          nextStatus,
          reason: `Lifecycle step ${nextStatus}`,
        },
      });
    }
    await app.inject({
      method: "POST",
      url: "/offers/status",
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "ANGENOMMEN",
        reason: "Annahme fuer Negativtest Rollen",
      },
    });
    for (const role of ["VIEWER", "BUCHHALTUNG"] as const) {
      const r = await app.inject({
        method: "GET",
        url: `/documents/${SEED_IDS.offerVersionId}/allowed-actions?entityType=OFFER_VERSION`,
        headers: buildHeaders(role),
      });
      expect(r.statusCode).toBe(200);
      expect(r.json().allowedActions).not.toContain("OFFER_CREATE_SUPPLEMENT");
    }
    const forbiddenPostViewer = await app.inject({
      method: "POST",
      url: `/offers/${SEED_IDS.offerId}/supplements`,
      headers: buildHeaders("VIEWER"),
      payload: {
        baseOfferVersionId: SEED_IDS.offerVersionId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Unbefugt",
        reason: "Keine Berechtigung",
      },
    });
    expect(forbiddenPostViewer.statusCode).toBe(403);
    expect(forbiddenPostViewer.json().code).toBe("AUTH_ROLE_FORBIDDEN");
    expect(forbiddenPostViewer.json().correlationId).toBeTypeOf("string");
    expect(forbiddenPostViewer.json().blocking).toBe(true);

    const forbiddenPostAccounting = await app.inject({
      method: "POST",
      url: `/offers/${SEED_IDS.offerId}/supplements`,
      headers: buildHeaders("BUCHHALTUNG"),
      payload: {
        baseOfferVersionId: SEED_IDS.offerVersionId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Unbefugt",
        reason: "Keine Berechtigung",
      },
    });
    expect(forbiddenPostAccounting.statusCode).toBe(403);
    expect(forbiddenPostAccounting.json().code).toBe("AUTH_ROLE_FORBIDDEN");
    expect(forbiddenPostAccounting.json().correlationId).toBeTypeOf("string");
    expect(forbiddenPostAccounting.json().blocking).toBe(true);
  });

  it("creates supplement offer from accepted base version (minimal API)", async () => {
    for (const nextStatus of ["IN_FREIGABE", "FREIGEGEBEN", "VERSENDET"] as const) {
      await app.inject({
        method: "POST",
        url: "/offers/status",
        headers,
        payload: {
          offerVersionId: SEED_IDS.offerVersionId,
          nextStatus,
          reason: `Lifecycle step ${nextStatus}`,
        },
      });
    }
    await app.inject({
      method: "POST",
      url: "/offers/status",
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "ANGENOMMEN",
        reason: "Annahme vor Nachtrag",
      },
    });

    const supplement = await app.inject({
      method: "POST",
      url: `/offers/${SEED_IDS.offerId}/supplements`,
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        baseOfferVersionId: SEED_IDS.offerVersionId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Nachtragsleistung",
        reason: "Korrektur nach Annahme",
      },
    });
    expect(supplement.statusCode).toBe(201);
    expect(supplement.json().status).toBe("ENTWURF");
  });

  it("blocks supplement creation when base offer is not accepted", async () => {
    const supplement = await app.inject({
      method: "POST",
      url: `/offers/${SEED_IDS.offerId}/supplements`,
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        baseOfferVersionId: SEED_IDS.offerVersionId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Nicht erlaubt",
        reason: "Basis noch nicht angenommen",
      },
    });
    expect(supplement.statusCode).toBe(409);
    expect(supplement.json().code).toBe("SUPPLEMENT_BASE_NOT_ACCEPTED");
  });

  it("P0-N-01 tenant isolation on supplement status transition", async () => {
    await moveOfferToAccepted();
    const created = await app.inject({
      method: "POST",
      url: `/offers/${SEED_IDS.offerId}/supplements`,
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        baseOfferVersionId: SEED_IDS.offerVersionId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Tenant-isolation Test",
        reason: "Create draft supplement",
      },
    });
    const tenantB = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const transition = await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("ADMIN", tenantB),
      payload: {
        supplementVersionId: created.json().id,
        nextStatus: "IN_FREIGABE",
        reason: "Cross tenant should fail",
      },
    });
    expect(transition.statusCode).toBe(404);
    expect(transition.json().code).toBe("SUPPLEMENT_NOT_FOUND");
  });

  it("P0-N-02..N-05 supplement lifecycle transitions and audit path", async () => {
    await moveOfferToAccepted();
    const created = await app.inject({
      method: "POST",
      url: `/offers/${SEED_IDS.offerId}/supplements`,
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        baseOfferVersionId: SEED_IDS.offerVersionId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Lifecycle",
        reason: "Nachtrag aufsetzen",
      },
    });
    const supplementVersionId = created.json().id;

    const inFreigabe = await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("ADMIN"),
      payload: { supplementVersionId, nextStatus: "IN_FREIGABE", reason: "P0 transition" },
    });
    expect(inFreigabe.statusCode).toBe(200);

    const freigegeben = await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: { supplementVersionId, nextStatus: "FREIGEGEBEN", reason: "P0 transition" },
    });
    expect(freigegeben.statusCode).toBe(200);

    const versendet = await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("VERTRIEB_BAULEITUNG"),
      payload: { supplementVersionId, nextStatus: "VERSENDET", reason: "P0 transition" },
    });
    expect(versendet.statusCode).toBe(200);

    const beauftragt = await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: { supplementVersionId, nextStatus: "BEAUFTRAGT", reason: "P0 transition" },
    });
    expect(beauftragt.statusCode).toBe(200);
    expect(beauftragt.json().status).toBe("BEAUFTRAGT");
  });

  it("P0-N-02..N-04 audit assertions for critical supplement transitions", async () => {
    const supplementVersionId = await createAcceptedSupplement();
    const transitions = [
      { nextStatus: "IN_FREIGABE", role: "ADMIN" as const },
      { nextStatus: "FREIGEGEBEN", role: "GESCHAEFTSFUEHRUNG" as const },
      { nextStatus: "VERSENDET", role: "VERTRIEB_BAULEITUNG" as const },
    ];
    for (const t of transitions) {
      const r = await app.inject({
        method: "POST",
        url: "/supplements/status",
        headers: buildHeaders(t.role),
        payload: { supplementVersionId, nextStatus: t.nextStatus, reason: `Audit proof ${t.nextStatus}` },
      });
      expect(r.statusCode).toBe(200);
      expect(r.json().status).toBe(t.nextStatus);
    }
    const audit = await app.inject({
      method: "GET",
      url: "/audit-events",
      headers: buildHeaders("ADMIN"),
    });
    expect(audit.statusCode).toBe(200);
    const events = audit.json().data as Array<{ entityId: string; action: string }>;
    const statusEvents = events.filter((event) => event.entityId === supplementVersionId && event.action === "STATUS_CHANGED");
    expect(statusEvents.length).toBeGreaterThanOrEqual(3);
  });

  it("P0-N-05 explicit ABGELEHNT branch with status and audit evidence", async () => {
    const supplementVersionId = await createAcceptedSupplement();
    for (const step of ["IN_FREIGABE", "FREIGEGEBEN", "VERSENDET"] as const) {
      const role = step === "FREIGEGEBEN" ? "GESCHAEFTSFUEHRUNG" : "ADMIN";
      await app.inject({
        method: "POST",
        url: "/supplements/status",
        headers: buildHeaders(role),
        payload: { supplementVersionId, nextStatus: step, reason: `Step ${step}` },
      });
    }
    const rejected = await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: { supplementVersionId, nextStatus: "ABGELEHNT", reason: "Explicit rejected branch" },
    });
    expect(rejected.statusCode).toBe(200);
    expect(rejected.json().status).toBe("ABGELEHNT");

    const audit = await app.inject({
      method: "GET",
      url: "/audit-events",
      headers: buildHeaders("ADMIN"),
    });
    const events = audit.json().data as Array<{ entityId: string; action: string }>;
    expect(events.some((event) => event.entityId === supplementVersionId && event.action === "STATUS_CHANGED")).toBe(true);
  });

  it("P0-N-06 fail-closed billing impact before BEAUFTRAGT", async () => {
    await moveOfferToAccepted();
    const created = await app.inject({
      method: "POST",
      url: `/offers/${SEED_IDS.offerId}/supplements`,
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        baseOfferVersionId: SEED_IDS.offerVersionId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "No billing yet",
        reason: "Lifecycle gate",
      },
    });
    const response = await app.inject({
      method: "POST",
      url: `/supplements/${created.json().id}/billing-impact`,
      headers: buildHeaders("BUCHHALTUNG"),
      payload: { invoiceId: SEED_IDS.invoiceId, reason: "Should be blocked before beauftragt" },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json().code).toBe("SUPPLEMENT_BILLING_EFFECT_FORBIDDEN");
  });

  it("P0-N-07/N-09 apply billing impact after BEAUFTRAGT and keep export traceability green", async () => {
    await moveOfferToAccepted();
    const created = await app.inject({
      method: "POST",
      url: `/offers/${SEED_IDS.offerId}/supplements`,
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        baseOfferVersionId: SEED_IDS.offerVersionId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Billing impact",
        reason: "Will be commissioned",
      },
    });
    const supplementVersionId = created.json().id;
    for (const step of ["IN_FREIGABE", "FREIGEGEBEN", "VERSENDET", "BEAUFTRAGT"] as const) {
      await app.inject({
        method: "POST",
        url: "/supplements/status",
        headers: step === "FREIGEGEBEN" || step === "BEAUFTRAGT" ? buildHeaders("GESCHAEFTSFUEHRUNG") : buildHeaders("ADMIN"),
        payload: { supplementVersionId, nextStatus: step, reason: `Step ${step}` },
      });
    }
    const impact = await app.inject({
      method: "POST",
      url: `/supplements/${supplementVersionId}/billing-impact`,
      headers: buildHeaders("BUCHHALTUNG"),
      payload: { invoiceId: SEED_IDS.invoiceId, reason: "Now allowed" },
    });
    expect(impact.statusCode).toBe(200);

    const exportInvoice = await app.inject({
      method: "POST",
      url: "/exports",
      headers: buildHeaders("BUCHHALTUNG"),
      payload: { entityType: "INVOICE", entityId: SEED_IDS.invoiceId, format: "XRECHNUNG" },
    });
    expect(exportInvoice.statusCode).toBe(201);
    expect(exportInvoice.json().status).toBe("SUCCEEDED");
  });

  it("P0-N-09 supplement-specific fail-closed traceability break after impact", async () => {
    const supplementVersionId = await createAcceptedSupplement();
    for (const step of ["IN_FREIGABE", "FREIGEGEBEN", "VERSENDET", "BEAUFTRAGT"] as const) {
      const role = step === "FREIGEGEBEN" || step === "BEAUFTRAGT" ? "GESCHAEFTSFUEHRUNG" : "ADMIN";
      await app.inject({
        method: "POST",
        url: "/supplements/status",
        headers: buildHeaders(role),
        payload: { supplementVersionId, nextStatus: step, reason: `Step ${step}` },
      });
    }
    const applyImpact = await app.inject({
      method: "POST",
      url: `/supplements/${supplementVersionId}/billing-impact`,
      headers: buildHeaders("BUCHHALTUNG"),
      payload: { invoiceId: SEED_IDS.invoiceId, reason: "Apply before break" },
    });
    expect(applyImpact.statusCode).toBe(200);

    // Break supplement-specific export precondition: invoice references a supplement that is no longer BEAUFTRAGT.
    await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: { supplementVersionId, nextStatus: "ARCHIVIERT", reason: "Force traceability break" },
    });

    const exportBroken = await app.inject({
      method: "POST",
      url: "/exports",
      headers: buildHeaders("BUCHHALTUNG"),
      payload: { entityType: "INVOICE", entityId: SEED_IDS.invoiceId, format: "XRECHNUNG" },
    });
    expect(exportBroken.statusCode).toBe(409);
    expect(exportBroken.json().code).toBe("SUPPLEMENT_BILLING_EFFECT_FORBIDDEN");
  });

  it("P0-N-08 baseOfferVersionId remains immutable after BEAUFTRAGT flow", async () => {
    await moveOfferToAccepted();
    const created = await app.inject({
      method: "POST",
      url: `/offers/${SEED_IDS.offerId}/supplements`,
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        baseOfferVersionId: SEED_IDS.offerVersionId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Immutability",
        reason: "Base must remain fixed",
      },
    });
    const supplementVersionId = created.json().id;
    for (const step of ["IN_FREIGABE", "FREIGEGEBEN", "VERSENDET", "BEAUFTRAGT"] as const) {
      await app.inject({
        method: "POST",
        url: "/supplements/status",
        headers: step === "FREIGEGEBEN" || step === "BEAUFTRAGT" ? buildHeaders("GESCHAEFTSFUEHRUNG") : buildHeaders("ADMIN"),
        payload: { supplementVersionId, nextStatus: step, reason: `Step ${step}` },
      });
    }
    await app.inject({
      method: "POST",
      url: `/supplements/${supplementVersionId}/billing-impact`,
      headers: buildHeaders("BUCHHALTUNG"),
      payload: { invoiceId: SEED_IDS.invoiceId, reason: "Apply effect" },
    });
    const detail = await app.inject({
      method: "GET",
      url: `/supplements/${supplementVersionId}`,
      headers: buildHeaders("ADMIN"),
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().baseOfferVersionId).toBe(SEED_IDS.offerVersionId);
  });

  it("P0-N-10 SoT for SUPPLEMENT_VERSION matches executable endpoints", async () => {
    await moveOfferToAccepted();
    const created = await app.inject({
      method: "POST",
      url: `/offers/${SEED_IDS.offerId}/supplements`,
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        baseOfferVersionId: SEED_IDS.offerVersionId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "SoT check",
        reason: "Action matrix parity",
      },
    });
    const supplementVersionId = created.json().id;
    const allowed = await app.inject({
      method: "GET",
      url: `/documents/${supplementVersionId}/allowed-actions?entityType=SUPPLEMENT_VERSION`,
      headers: buildHeaders("ADMIN"),
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json().allowedActions).toContain("SUPPLEMENT_SET_IN_FREIGABE");
    expect(allowed.json().allowedActions).toContain("SUPPLEMENT_SET_ARCHIVIERT");
    expect(allowed.json().allowedActions).not.toContain("SUPPLEMENT_SET_BEAUFTRAGT");

    const allowedVertrieb = await app.inject({
      method: "GET",
      url: `/documents/${supplementVersionId}/allowed-actions?entityType=SUPPLEMENT_VERSION`,
      headers: buildHeaders("VERTRIEB_BAULEITUNG"),
    });
    expect(allowedVertrieb.statusCode).toBe(200);
    expect(allowedVertrieb.json().allowedActions).toContain("SUPPLEMENT_SET_IN_FREIGABE");
    expect(allowedVertrieb.json().allowedActions).not.toContain("SUPPLEMENT_SET_ARCHIVIERT");

    const archiveFromDraft = await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("ADMIN"),
      payload: { supplementVersionId, nextStatus: "ARCHIVIERT", reason: "SoT parity ENTWURF" },
    });
    expect(archiveFromDraft.statusCode).toBe(200);
  });

  it("P0-N-10 status-based SoT vs executable API for IN_FREIGABE/FREIGEGEBEN/VERSENDET/BEAUFTRAGT/ABGELEHNT", async () => {
    const supplementVersionId = await createAcceptedSupplement();
    const checkActions = async (expectedStatus: string, expectedAllowed: string[], blockedAttempt: string) => {
      const allowed = await app.inject({
        method: "GET",
        url: `/documents/${supplementVersionId}/allowed-actions?entityType=SUPPLEMENT_VERSION`,
        headers: buildHeaders("ADMIN"),
      });
      expect(allowed.statusCode).toBe(200);
      for (const action of expectedAllowed) {
        expect(allowed.json().allowedActions).toContain(action);
      }
      expect(allowed.json().allowedActions).not.toContain(blockedAttempt);
      expect(allowed.json().allowedActions.length).toBeGreaterThan(0);
      const blocked = await app.inject({
        method: "POST",
        url: "/supplements/status",
        headers: buildHeaders("ADMIN"),
        payload: { supplementVersionId, nextStatus: blockedAttempt.replace("SUPPLEMENT_SET_", ""), reason: "SoT negative" },
      });
      expect(blocked.statusCode).toBe(409);
      expect(blocked.json().code).toBe("SUPPLEMENT_STATUS_TRANSITION_FORBIDDEN");
    };

    await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("ADMIN"),
      payload: { supplementVersionId, nextStatus: "IN_FREIGABE", reason: "to IN_FREIGABE" },
    });
    await checkActions("IN_FREIGABE", ["SUPPLEMENT_SET_FREIGEGEBEN"], "SUPPLEMENT_SET_BEAUFTRAGT");

    await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: { supplementVersionId, nextStatus: "FREIGEGEBEN", reason: "to FREIGEGEBEN" },
    });
    await checkActions("FREIGEGEBEN", ["SUPPLEMENT_SET_VERSENDET"], "SUPPLEMENT_SET_BEAUFTRAGT");

    await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("VERTRIEB_BAULEITUNG"),
      payload: { supplementVersionId, nextStatus: "VERSENDET", reason: "to VERSENDET" },
    });
    await checkActions("VERSENDET", ["SUPPLEMENT_SET_BEAUFTRAGT", "SUPPLEMENT_SET_ABGELEHNT"], "SUPPLEMENT_SET_IN_FREIGABE");

    await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: { supplementVersionId, nextStatus: "BEAUFTRAGT", reason: "to BEAUFTRAGT" },
    });
    await checkActions("BEAUFTRAGT", ["SUPPLEMENT_SET_ARCHIVIERT", "SUPPLEMENT_APPLY_BILLING_IMPACT"], "SUPPLEMENT_SET_ABGELEHNT");

    await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: { supplementVersionId, nextStatus: "ARCHIVIERT", reason: "to ARCHIVIERT for reset" },
    });

    const supplementVersionIdRejected = await createAcceptedSupplement();
    for (const step of ["IN_FREIGABE", "FREIGEGEBEN", "VERSENDET"] as const) {
      const role = step === "FREIGEGEBEN" ? "GESCHAEFTSFUEHRUNG" : "ADMIN";
      await app.inject({
        method: "POST",
        url: "/supplements/status",
        headers: buildHeaders(role),
        payload: { supplementVersionId: supplementVersionIdRejected, nextStatus: step, reason: `to ${step}` },
      });
    }
    await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: { supplementVersionId: supplementVersionIdRejected, nextStatus: "ABGELEHNT", reason: "to ABGELEHNT" },
    });
    const allowedRejected = await app.inject({
      method: "GET",
      url: `/documents/${supplementVersionIdRejected}/allowed-actions?entityType=SUPPLEMENT_VERSION`,
      headers: buildHeaders("ADMIN"),
    });
    expect(allowedRejected.statusCode).toBe(200);
    expect(allowedRejected.json().allowedActions).toContain("SUPPLEMENT_SET_ARCHIVIERT");
    expect(allowedRejected.json().allowedActions).not.toContain("SUPPLEMENT_SET_BEAUFTRAGT");
    const blockedRejected = await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("ADMIN"),
      payload: { supplementVersionId: supplementVersionIdRejected, nextStatus: "BEAUFTRAGT", reason: "should fail from ABGELEHNT" },
    });
    expect(blockedRejected.statusCode).toBe(409);
    expect(blockedRejected.json().code).toBe("SUPPLEMENT_STATUS_TRANSITION_FORBIDDEN");
  });

  it("fail-closed export for supplement draft and success after FREIGEGEBEN", async () => {
    await moveOfferToAccepted();
    const created = await app.inject({
      method: "POST",
      url: `/offers/${SEED_IDS.offerId}/supplements`,
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: {
        baseOfferVersionId: SEED_IDS.offerVersionId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Export gate",
        reason: "Check fail-closed",
      },
    });
    const supplementVersionId = created.json().id;
    const blockedExport = await app.inject({
      method: "POST",
      url: "/exports",
      headers: buildHeaders("VERTRIEB_BAULEITUNG"),
      payload: { entityType: "SUPPLEMENT_VERSION", entityId: supplementVersionId, format: "GAEB" },
    });
    expect(blockedExport.statusCode).toBe(422);
    expect(blockedExport.json().code).toBe("EXPORT_PREFLIGHT_FAILED");

    await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("ADMIN"),
      payload: { supplementVersionId, nextStatus: "IN_FREIGABE", reason: "for release" },
    });
    await app.inject({
      method: "POST",
      url: "/supplements/status",
      headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
      payload: { supplementVersionId, nextStatus: "FREIGEGEBEN", reason: "for release" },
    });
    const releasedExport = await app.inject({
      method: "POST",
      url: "/exports",
      headers: buildHeaders("VERTRIEB_BAULEITUNG"),
      payload: { entityType: "SUPPLEMENT_VERSION", entityId: supplementVersionId, format: "GAEB" },
    });
    expect(releasedExport.statusCode).toBe(201);
    expect(releasedExport.json().status).toBe("SUCCEEDED");
  });

  it("exposes OFFER_CREATE_VERSION on allowed-actions while IN_FREIGABE (SoT matches POST /offers/version)", async () => {
    await app.inject({
      method: "POST",
      url: "/offers/status",
      headers,
      payload: {
        offerVersionId: SEED_IDS.offerVersionId,
        nextStatus: "IN_FREIGABE",
        reason: "Freigabe starten",
      },
    });
    const allowed = await app.inject({
      method: "GET",
      url: `/documents/${SEED_IDS.offerVersionId}/allowed-actions?entityType=OFFER_VERSION`,
      headers: buildHeaders("VERTRIEB_BAULEITUNG"),
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json().allowedActions).toContain("OFFER_CREATE_VERSION");

    const create = await app.inject({
      method: "POST",
      url: "/offers/version",
      headers: buildHeaders("VERTRIEB_BAULEITUNG"),
      payload: {
        offerId: SEED_IDS.offerId,
        lvVersionId: SEED_IDS.lvVersionId,
        editingText: "Version aus Freigabe heraus",
        reason: "Nicht-destruktive Anpassung",
      },
    });
    expect(create.statusCode).toBe(201);
  });

  it("blocks invoice export for draft invoices (negative preflight)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/exports",
      headers,
      payload: {
        entityType: "INVOICE",
        entityId: SEED_IDS.draftInvoiceId,
        format: "XRECHNUNG",
      },
    });
    expect(response.statusCode).toBe(422);
    expect(response.json().code).toBe("EXPORT_PREFLIGHT_FAILED");
    expect(response.json().details.validationErrors).toContain("INVOICE_STATUS_NOT_EXPORTABLE");
    expect(response.json().details.validationErrors).toContain("INVOICE_REQUIRED_FIELDS_MISSING");
  });

  it("enforces format policy matrix (negative)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/exports",
      headers,
      payload: {
        entityType: "INVOICE",
        entityId: SEED_IDS.invoiceId,
        format: "GAEB",
      },
    });
    expect(response.statusCode).toBe(422);
    expect(response.json().details.validationErrors).toContain("FORMAT_NOT_ALLOWED_FOR_ENTITY");
  });

  it("allows invoice export for immutable legal status (positive)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/exports",
      headers,
      payload: {
        entityType: "INVOICE",
        entityId: SEED_IDS.invoiceId,
        format: "XRECHNUNG",
      },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().status).toBe("SUCCEEDED");
  });

  describe("Phase 2 Inc1 — Aufmass §5.4", () => {
    const samplePosition = (lvPositionId: string) => [
      { lvPositionId, quantity: 10, unit: "m", note: "P0 Aufmass" },
    ];

    it("P2-M-01 full lifecycle with audit on status changes", async () => {
      const { lvVersionId, samplePositionId: posId } = await createEntwurfLvCatalog();
      const projectId = randomUUID();
      const customerId = randomUUID();
      const created = await app.inject({
        method: "POST",
        url: "/measurements",
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: {
          projectId,
          customerId,
          lvVersionId,
          positions: samplePosition(posId),
          reason: "P2-M-01 Neuanlage Aufmass",
        },
      });
      expect(created.statusCode).toBe(201);
      const { measurementVersionId } = created.json() as { measurementVersionId: string };

      const auditAfterCreate = await app.inject({
        method: "GET",
        url: "/audit-events?page=1&pageSize=50",
        headers: buildHeaders("ADMIN"),
      });
      expect(auditAfterCreate.statusCode).toBe(200);
      const events = auditAfterCreate.json().data as { entityId: string; action: string }[];
      expect(events.some((e) => e.entityId === measurementVersionId && e.action === "VERSION_CREATED")).toBe(true);

      for (const [role, next] of [
        ["VERTRIEB_BAULEITUNG", "GEPRUEFT"],
        ["GESCHAEFTSFUEHRUNG", "FREIGEGEBEN"],
        ["BUCHHALTUNG", "ABGERECHNET"],
        ["GESCHAEFTSFUEHRUNG", "ARCHIVIERT"],
      ] as const) {
        const tr = await app.inject({
          method: "POST",
          url: "/measurements/status",
          headers: buildHeaders(role),
          payload: {
            measurementVersionId,
            nextStatus: next,
            reason: `P2-M-01 transition to ${next}`,
          },
        });
        expect(tr.statusCode).toBe(200);
      }

      const auditAfterFlow = await app.inject({
        method: "GET",
        url: "/audit-events?page=1&pageSize=100",
        headers: buildHeaders("ADMIN"),
      });
      const ev2 = auditAfterFlow.json().data as { entityId: string; action: string }[];
      const statusAudits = ev2.filter((e) => e.entityId === measurementVersionId && e.action === "STATUS_CHANGED");
      expect(statusAudits.length).toBeGreaterThanOrEqual(4);
    });

    it("P2-M-02 tenant isolation on measurement read", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/measurements/${SEED_IDS.measurementVersionId}`,
        headers: buildHeaders("ADMIN", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().code).toBe("MEASUREMENT_NOT_FOUND");
    });

    it("P2-M-03 position edit forbidden after FREIGEGEBEN (§5.4)", async () => {
      const { lvVersionId, samplePositionId: posId } = await createEntwurfLvCatalog();
      const projectId = randomUUID();
      const customerId = randomUUID();
      const created = await app.inject({
        method: "POST",
        url: "/measurements",
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: {
          projectId,
          customerId,
          lvVersionId,
          positions: samplePosition(posId),
          reason: "P2-M-03 setup",
        },
      });
      const { measurementVersionId } = created.json() as { measurementVersionId: string };
      await app.inject({
        method: "POST",
        url: "/measurements/status",
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: {
          measurementVersionId,
          nextStatus: "GEPRUEFT",
          reason: "P2-M-03 geprueft",
        },
      });
      await app.inject({
        method: "POST",
        url: "/measurements/status",
        headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
        payload: {
          measurementVersionId,
          nextStatus: "FREIGEGEBEN",
          reason: "P2-M-03 freigegeben",
        },
      });
      const blocked = await app.inject({
        method: "POST",
        url: `/measurements/${measurementVersionId}/positions`,
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: {
          positions: [{ lvPositionId: posId, quantity: 99, unit: "m" }],
          reason: "P2-M-03 must fail",
        },
      });
      expect(blocked.statusCode).toBe(409);
      expect(blocked.json().code).toBe("MEASUREMENT_POSITION_EDIT_FORBIDDEN");
    });

    it("P2-M-04 MEASUREMENT_CREATE_VERSION forbidden from ENTWURF", async () => {
      const { lvVersionId, samplePositionId } = await createEntwurfLvCatalog();
      const projectId = randomUUID();
      const customerId = randomUUID();
      const created = await app.inject({
        method: "POST",
        url: "/measurements",
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: {
          projectId,
          customerId,
          lvVersionId,
          positions: samplePosition(samplePositionId),
          reason: "P2-M-04 setup",
        },
      });
      const { measurementId } = created.json() as { measurementId: string };
      const ver = await app.inject({
        method: "POST",
        url: "/measurements/version",
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: { measurementId, reason: "P2-M-04 must be forbidden" },
      });
      expect(ver.statusCode).toBe(409);
      expect(ver.json().code).toBe("MEASUREMENT_NEW_VERSION_FORBIDDEN");
    });

    it("P2-M-05 SoT parity: BUCHHALTUNG cannot POST positions when SoT omits MEASUREMENT_UPDATE_POSITIONS", async () => {
      const sot = await app.inject({
        method: "GET",
        url: `/documents/${SEED_IDS.measurementVersionId}/allowed-actions?entityType=MEASUREMENT_VERSION`,
        headers: buildHeaders("BUCHHALTUNG"),
      });
      expect(sot.statusCode).toBe(200);
      expect(sot.json().allowedActions).not.toContain("MEASUREMENT_UPDATE_POSITIONS");

      const { lvVersionId, samplePositionId } = await createEntwurfLvCatalog();
      const projectId = randomUUID();
      const customerId = randomUUID();
      const created = await app.inject({
        method: "POST",
        url: "/measurements",
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: {
          projectId,
          customerId,
          lvVersionId,
          positions: samplePosition(samplePositionId),
          reason: "P2-M-05 create",
        },
      });
      const { measurementVersionId } = created.json() as { measurementVersionId: string };
      const post = await app.inject({
        method: "POST",
        url: `/measurements/${measurementVersionId}/positions`,
        headers: buildHeaders("BUCHHALTUNG"),
        payload: {
          positions: [{ lvPositionId: samplePositionId, quantity: 5, unit: "m", note: "x" }],
          reason: "P2-M-05 must be403",
        },
      });
      expect(post.statusCode).toBe(403);
    });

    it("P2-M-06 non-current version: empty SoT and status transition blocked", async () => {
      const { lvVersionId, samplePositionId: posId } = await createEntwurfLvCatalog();
      const projectId = randomUUID();
      const customerId = randomUUID();
      const created = await app.inject({
        method: "POST",
        url: "/measurements",
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: {
          projectId,
          customerId,
          lvVersionId,
          positions: samplePosition(posId),
          reason: "P2-M-06 setup",
        },
      });
      const { measurementId, measurementVersionId: v1 } = created.json() as {
        measurementId: string;
        measurementVersionId: string;
      };
      for (const [role, next] of [
        ["VERTRIEB_BAULEITUNG", "GEPRUEFT"],
        ["GESCHAEFTSFUEHRUNG", "FREIGEGEBEN"],
      ] as const) {
        await app.inject({
          method: "POST",
          url: "/measurements/status",
          headers: buildHeaders(role),
          payload: { measurementVersionId: v1, nextStatus: next, reason: `P2-M-06 ${next}` },
        });
      }
      const v2res = await app.inject({
        method: "POST",
        url: "/measurements/version",
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: { measurementId, reason: "P2-M-06 neue Version" },
      });
      expect(v2res.statusCode).toBe(201);
      const sotV1 = await app.inject({
        method: "GET",
        url: `/documents/${v1}/allowed-actions?entityType=MEASUREMENT_VERSION`,
        headers: buildHeaders("ADMIN"),
      });
      expect(sotV1.json().allowedActions).toEqual([]);

      const trOld = await app.inject({
        method: "POST",
        url: "/measurements/status",
        headers: buildHeaders("BUCHHALTUNG"),
        payload: {
          measurementVersionId: v1,
          nextStatus: "ABGERECHNET",
          reason: "P2-M-06 invalid on old version",
        },
      });
      expect(trOld.statusCode).toBe(409);
      expect(trOld.json().code).toBe("MEASUREMENT_VERSION_NOT_CURRENT");
    });

    it("P2-M-07 invoice traceability fails when measurement LV mismatch", async () => {
      const { InMemoryRepositories } = await import("../src/repositories/in-memory-repositories.js");
      const { TraceabilityService } = await import("../src/services/traceability-service.js");
      const { seedDemoData } = await import("../src/composition/seed.js");
      const repos = new InMemoryRepositories();
      seedDemoData(repos);
      const m = repos.measurements.get(SEED_IDS.measurementId)!;
      repos.measurements.set(m.id, { ...m, lvVersionId: randomUUID() });
      const trace = new TraceabilityService(repos);
      expect(() => trace.assertInvoiceTraceability(SEED_IDS.tenantId, SEED_IDS.invoiceId)).toThrowError(
        /TRACEABILITY_FIELD_MISMATCH|Aufmass/,
      );
    });
  });

  describe("Phase 2 Inc2 — LV §9", () => {
    it("P2-LV-01 tenant isolation on PATCH LV position", async () => {
      const { samplePositionId } = await createEntwurfLvCatalog();
      const res = await app.inject({
        method: "PATCH",
        url: `/lv/positions/${samplePositionId}`,
        headers: buildHeaders("ADMIN", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
        payload: { editingText: "X", reason: "Cross-tenant must fail" },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().code).toBe("LV_POSITION_NOT_FOUND");
    });

    it("P2-LV-02 systemText unchanged when updating Bearbeitungstext on position (§9)", async () => {
      const { samplePositionId } = await createEntwurfLvCatalog();
      const before = await app.inject({
        method: "PATCH",
        url: `/lv/positions/${samplePositionId}`,
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: { editingText: "Kundenfreundlich", reason: "Nur Bearbeitungstext" },
      });
      expect(before.statusCode).toBe(200);
      expect(before.json().systemText).toBe("Positions-Systemtext");
      expect(before.json().editingText).toBe("Kundenfreundlich");
    });

    it("P2-LV-02b rejects systemText in PATCH body (§9 immutability)", async () => {
      const { samplePositionId } = await createEntwurfLvCatalog();
      const res = await app.inject({
        method: "PATCH",
        url: `/lv/positions/${samplePositionId}`,
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: {
          editingText: "Ok",
          systemText: "Illegal",
          reason: "Must not mutate system text via API",
        },
      });
      expect(res.statusCode).toBe(409);
      expect(res.json().code).toBe("LV_SYSTEM_TEXT_IMMUTABLE");
    });

    it("P2-LV-02c rejects unknown keys on position PATCH (D7 strict)", async () => {
      const { samplePositionId } = await createEntwurfLvCatalog();
      const res = await app.inject({
        method: "PATCH",
        url: `/lv/positions/${samplePositionId}`,
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: {
          editingText: "Ok",
          reason: "Strict body shape",
          typoField: true,
        },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().code).toBe("VALIDATION_FAILED");
    });

    it("P2-LV-02d rejects unknown keys on node editing PATCH (D7 strict)", async () => {
      const { samplePositionId } = await createEntwurfLvCatalog();
      const posProbe = await app.inject({
        method: "PATCH",
        url: `/lv/positions/${samplePositionId}`,
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: { editingText: "Probe", reason: "Resolve parent node id" },
      });
      expect(posProbe.statusCode).toBe(200);
      const nodeId = posProbe.json().parentNodeId as string;
      const res = await app.inject({
        method: "PATCH",
        url: `/lv/nodes/${nodeId}/editing-text`,
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: {
          editingText: "Knoten-Ed",
          reason: "Strict body shape",
          unexpected: 1,
        },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().code).toBe("VALIDATION_FAILED");
    });

    it("P2-LV-02e rejects systemText on node PATCH before schema (409, not 400)", async () => {
      const { samplePositionId } = await createEntwurfLvCatalog();
      const posProbe = await app.inject({
        method: "PATCH",
        url: `/lv/positions/${samplePositionId}`,
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: { editingText: "Probe2", reason: "Resolve parent node id" },
      });
      const nodeId = posProbe.json().parentNodeId as string;
      const res = await app.inject({
        method: "PATCH",
        url: `/lv/nodes/${nodeId}/editing-text`,
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: {
          editingText: "X",
          systemText: "No",
          reason: "Immutable system text",
        },
      });
      expect(res.statusCode).toBe(409);
      expect(res.json().code).toBe("LV_SYSTEM_TEXT_IMMUTABLE");
    });

    it("P2-LV-02f systemText wins over unknown keys on position PATCH (assert before parse)", async () => {
      const { samplePositionId } = await createEntwurfLvCatalog();
      const res = await app.inject({
        method: "PATCH",
        url: `/lv/positions/${samplePositionId}`,
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: {
          editingText: "Ok",
          systemText: "Illegal",
          reason: "Order of checks",
          extraKey: "ignored by strict if409 first",
        },
      });
      expect(res.statusCode).toBe(409);
      expect(res.json().code).toBe("LV_SYSTEM_TEXT_IMMUTABLE");
    });

    it("P2-LV-03 SoT vs API: VIEWER cannot transition LV version", async () => {
      const { lvVersionId } = await createEntwurfLvCatalog();
      const sot = await app.inject({
        method: "GET",
        url: `/documents/${lvVersionId}/allowed-actions?entityType=LV_VERSION`,
        headers: buildHeaders("VIEWER"),
      });
      expect(sot.statusCode).toBe(200);
      expect(sot.json().allowedActions).not.toContain("LV_SET_FREIGEGEBEN");
      const post = await app.inject({
        method: "POST",
        url: `/lv/versions/${lvVersionId}/status`,
        headers: buildHeaders("VIEWER"),
        payload: { nextStatus: "FREIGEGEBEN", reason: "Unbefugt" },
      });
      expect(post.statusCode).toBe(403);
    });

    it("P2-LV-04 structure edit forbidden when LV version FREIGEGEBEN (seed)", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/lv/versions/${SEED_IDS.lvVersionId}/nodes`,
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
        payload: {
          parentNodeId: null,
          kind: "BEREICH",
          sortOrdinal: "9",
          systemText: "Extra",
          editingText: "Extra-Ed",
          reason: "Must fail on released LV",
        },
      });
      expect(res.statusCode).toBe(409);
      expect(res.json().code).toBe("LV_STRUCTURE_LOCKED");
    });

    it("P2-LV-05 LV_CREATE_NEXT_VERSION: old version loses SoT; new ENTWURF has actions", async () => {
      const { lvCatalogId, lvVersionId: v1 } = await createEntwurfLvCatalog();
      await app.inject({
        method: "POST",
        url: `/lv/versions/${v1}/status`,
        headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
        payload: { nextStatus: "FREIGEGEBEN", reason: "Freigabe fuer Versionierung" },
      });
      const v2res = await app.inject({
        method: "POST",
        url: `/lv/catalogs/${lvCatalogId}/version`,
        headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
        payload: { reason: "Korrektur-LV gem §9" },
      });
      expect(v2res.statusCode).toBe(201);
      const v2 = v2res.json().lvVersionId as string;
      const sotOld = await app.inject({
        method: "GET",
        url: `/documents/${v1}/allowed-actions?entityType=LV_VERSION`,
        headers: buildHeaders("ADMIN"),
      });
      expect(sotOld.json().allowedActions).toEqual([]);
      const sotNew = await app.inject({
        method: "GET",
        url: `/documents/${v2}/allowed-actions?entityType=LV_VERSION`,
        headers: buildHeaders("VERTRIEB_BAULEITUNG"),
      });
      expect(sotNew.json().allowedActions).toContain("LV_ADD_POSITION");
    });

    it("P2-LV-06 LV_POSITION SoT omits LV_UPDATE_POSITION for BUCHHALTUNG; PATCH forbidden", async () => {
      const { samplePositionId } = await createEntwurfLvCatalog();
      const sot = await app.inject({
        method: "GET",
        url: `/documents/${samplePositionId}/allowed-actions?entityType=LV_POSITION`,
        headers: buildHeaders("BUCHHALTUNG"),
      });
      expect(sot.statusCode).toBe(200);
      expect(sot.json().allowedActions).not.toContain("LV_UPDATE_POSITION");
      const patch = await app.inject({
        method: "PATCH",
        url: `/lv/positions/${samplePositionId}`,
        headers: buildHeaders("BUCHHALTUNG"),
        payload: { quantity: 3, reason: "Should be forbidden" },
      });
      expect(patch.statusCode).toBe(403);
    });
  });
});
