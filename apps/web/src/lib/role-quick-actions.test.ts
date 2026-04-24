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
});
