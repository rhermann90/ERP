import { describe, expect, it } from "vitest";
import { v13DomainRolesForApiRole } from "./v13-domain-role-mapping.js";

describe("v13DomainRolesForApiRole", () => {
  it("liefert für jede API-Rolle mindestens zwei Hinweiszeilen", () => {
    for (const r of ["ADMIN", "BUCHHALTUNG", "GESCHAEFTSFUEHRUNG", "VERTRIEB_BAULEITUNG", "VIEWER"] as const) {
      const h = v13DomainRolesForApiRole(r);
      expect(h.length).toBeGreaterThanOrEqual(2);
    }
  });
});
