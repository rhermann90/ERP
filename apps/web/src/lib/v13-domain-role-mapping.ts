import type { ApiUserRole } from "./token-payload.js";

/**
 * Kurztexte zu v1.3 §11.1 für die eingeloggte API-Rolle (Hinweis in der PWA, keine Rechtevergabe).
 * @see docs/contracts/ui-role-mapping-v1-3.md
 */
export function v13DomainRolesForApiRole(role: ApiUserRole): readonly string[] {
  const m: Record<ApiUserRole, readonly string[]> = {
    ADMIN: ["Admin (v1.3 §11.1)", "technischer Vollzugriff"],
    BUCHHALTUNG: ["Buchhaltung", "FIN / Zahlung / Export (§8, §11)"],
    GESCHAEFTSFUEHRUNG: ["Geschäftsführung", "kritische Freigaben (§11.2)"],
    VERTRIEB_BAULEITUNG: [
      "Vertrieb / Bauleitung",
      "Disposition, Kalkulation, Nachträge & operative Ausführung (Angebots-/LV-/Aufmaß-Kern)",
    ],
    VIEWER: ["Bauleitung / Einsicht", "Disposition (Lesen)", "Viewer"],
  };
  return m[role];
}
