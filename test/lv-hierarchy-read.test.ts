import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildApp } from "../src/api/app.js";
import { SEED_IDS } from "../src/composition/seed.js";
import { createSignedToken } from "../src/auth/token-auth.js";
import { isBereichRootNode } from "../src/domain/lv-structure-node.js";
import { assertSystemTextUnchanged } from "../src/domain/lv-position-v2.js";
import type { LvPosition } from "../src/domain/types.js";

describe("LV §9 Hierarchie-Lesepfade (structure / single position)", () => {
  let app: FastifyInstance;
  const userId = SEED_IDS.seedAdminUserId;
  const buildHeaders = (
    role: "ADMIN" | "VIEWER" = "ADMIN",
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

  beforeEach(async () => {
    app = await buildApp({ seedDemoData: true, repositoryMode: "memory" });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /lv/versions/:id/structure matches nodes/positions of full snapshot", async () => {
    const full = await app.inject({
      method: "GET",
      url: `/lv/versions/${SEED_IDS.lvVersionId}`,
      headers: buildHeaders(),
    });
    const hier = await app.inject({
      method: "GET",
      url: `/lv/versions/${SEED_IDS.lvVersionId}/structure`,
      headers: buildHeaders(),
    });
    expect(full.statusCode).toBe(200);
    expect(hier.statusCode).toBe(200);
    const f = full.json() as { structureNodes: unknown[]; positions: unknown[] };
    const h = hier.json() as { lvVersionId: string; structureNodes: unknown[]; positions: unknown[] };
    expect(h.lvVersionId).toBe(SEED_IDS.lvVersionId);
    expect(h.structureNodes).toEqual(f.structureNodes);
    expect(h.positions).toEqual(f.positions);
    expect(h.positions.length).toBeGreaterThanOrEqual(3);
  });

  it("GET /lv/versions/:id/positions/:pid returns single position (editingText)", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/lv/versions/${SEED_IDS.lvVersionId}/positions/${SEED_IDS.lvPositionSeedB}`,
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { id: string; kind: string; lvVersionId: string; editingText: string };
    expect(body.id).toBe(SEED_IDS.lvPositionSeedB);
    expect(body.kind).toBe("ALTERNATIV");
    expect(body.lvVersionId).toBe(SEED_IDS.lvVersionId);
    expect(body.editingText).toContain("Alternativ");
  });

  it("VIEWER may read structure", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/lv/versions/${SEED_IDS.lvVersionId}/structure`,
      headers: buildHeaders("VIEWER"),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { lvVersionId: string; positions: { id: string }[] };
    expect(body.lvVersionId).toBe(SEED_IDS.lvVersionId);
    expect(body.positions.length).toBeGreaterThanOrEqual(1);
  });

  it("GET position returns 404 when LV version missing", async () => {
    const fakeVersion = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0999";
    const res404 = await app.inject({
      method: "GET",
      url: `/lv/versions/${fakeVersion}/positions/${SEED_IDS.lvPositionSeedA}`,
      headers: buildHeaders(),
    });
    expect(res404.statusCode).toBe(404);
    expect(res404.json().code).toBe("LV_VERSION_NOT_FOUND");
  });

  it("GET position returns 404 when position id unknown for version", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/lv/versions/${SEED_IDS.lvVersionId}/positions/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0998`,
      headers: buildHeaders(),
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe("LV_POSITION_NOT_FOUND");
  });

  it("LV_STRUCTURE_NODE root helper", () => {
    expect(isBereichRootNode({ kind: "BEREICH", parentNodeId: null })).toBe(true);
    expect(isBereichRootNode({ kind: "TITEL", parentNodeId: SEED_IDS.lvBereichId })).toBe(false);
  });

  it("assertSystemTextUnchanged throws on system text drift", () => {
    const before = { systemText: "A" } as LvPosition;
    const after = { systemText: "B" } as LvPosition;
    expect(() => assertSystemTextUnchanged(before, after)).toThrow(/immutable/);
  });

  it("GET structure is tenant-isolated (404)", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/lv/versions/${SEED_IDS.lvVersionId}/structure`,
      headers: buildHeaders("ADMIN", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe("LV_VERSION_NOT_FOUND");
  });
});
