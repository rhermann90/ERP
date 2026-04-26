import { describe, expect, it } from "vitest";
import { quickPresetsForRole } from "./role-quick-actions.js";
describe("quickPresetsForRole", () => {
  it.each(["ADMIN", "BUCHHALTUNG", "GESCHAEFTSFUEHRUNG", "VERTRIEB_BAULEITUNG", "VIEWER"] as const)(
    "liefert genau 5 Einträge für %s",
    (role) => {
      const p = quickPresetsForRole(role);
      expect(p).toHaveLength(5);
      const ids = new Set(p.map((x) => x.id));
      expect(ids.size).toBe(5);
    },
  );

  it("bietet Mahn-Grundeinstellungen für alle API-Rollen (Quick-Nav)", () => {
    for (const role of ["ADMIN", "BUCHHALTUNG", "GESCHAEFTSFUEHRUNG", "VERTRIEB_BAULEITUNG", "VIEWER"] as const) {
      const ids = quickPresetsForRole(role).map((x) => x.id);
      expect(ids).toContain("finance-grundeinstellungen");
    }
  });

});
