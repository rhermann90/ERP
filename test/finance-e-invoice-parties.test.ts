import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/api/app.js";
import { SEED_IDS } from "../src/composition/seed.js";
import { createSignedToken } from "../src/auth/token-auth.js";

describe("FIN-5 XRechnung — /finance/e-invoice-parties", () => {
  let app: FastifyInstance;
  const userId = SEED_IDS.seedAdminUserId;

  const headers = (role: "ADMIN" | "VIEWER" | "BUCHHALTUNG" = "ADMIN") => ({
    authorization: `Bearer ${createSignedToken({
      sub: userId,
      tenantId: SEED_IDS.tenantId,
      role,
      exp: Math.floor(Date.now() / 1000) + 600,
    })}`,
    "x-tenant-id": SEED_IDS.tenantId,
  });

  beforeEach(async () => {
    app = await buildApp({ seedDemoData: true, repositoryMode: "memory" });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /finance/e-invoice-parties/tenant liefert Seed-Seller (ADMIN)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/finance/e-invoice-parties/tenant",
      headers: headers(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { configured: boolean; party: { legalName: string } | null };
    expect(body.configured).toBe(true);
    expect(body.party?.legalName).toContain("Seed-Unternehmen");
  });

  it("setzt x-erp-openapi-contract-version auf GET tenant", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/finance/e-invoice-parties/tenant",
      headers: headers(),
    });
    expect(res.headers["x-erp-openapi-contract-version"]).toBeDefined();
  });

  it("PUT aktualisiert Seller und GET spiegelt Änderung", async () => {
    const put = await app.inject({
      method: "PUT",
      url: "/finance/e-invoice-parties/tenant",
      headers: headers("BUCHHALTUNG"),
      payload: {
        legalName: "API Test GmbH",
        streetName: "API-Str. 9",
        cityName: "Köln",
        postalZone: "50667",
        countryCode: "de",
        vatId: "DE123123123",
        email: "finanz@api-test.example",
        reason: "Unit test seller update",
      },
    });
    expect(put.statusCode).toBe(200);
    const putBody = put.json() as { party: { legalName: string } };
    expect(putBody.party.legalName).toBe("API Test GmbH");

    const get = await app.inject({
      method: "GET",
      url: "/finance/e-invoice-parties/tenant",
      headers: headers(),
    });
    const getBody = get.json() as { party: { legalName: string } | null };
    expect(getBody.party?.legalName).toBe("API Test GmbH");
  });

  it("GET /customers listet Seed-Kundenzeile", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/finance/e-invoice-parties/customers",
      headers: headers("VIEWER"),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { customers: Array<{ customerId: string; legalName: string }> };
    expect(body.customers.some((c) => c.customerId === SEED_IDS.customerId)).toBe(true);
  });

  it("VIEWER erhält 403 auf PUT tenant", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/finance/e-invoice-parties/tenant",
      headers: headers("VIEWER"),
      payload: {
        legalName: "X",
        streetName: "Y",
        cityName: "Z",
        postalZone: "00000",
        countryCode: "DE",
        reason: "Should be forbidden for viewer",
      },
    });
    expect(res.statusCode).toBe(403);
  });
});
