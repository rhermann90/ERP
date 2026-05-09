import type { ApiUserRole } from "./token-payload.js";

/** Schlüssel für globale Hash-Navigation (`AppPrimaryNav`). */
export type PrimaryNavKey =
  | "start"
  | "stammdaten"
  | "lv_aufmass"
  | "angebote"
  | "finanz_prep"
  | "finanz_grund"
  | "document"
  | "settings"
  | "hilfe"
  | "login"
  | "password_reset";

/**
 * Nur **Anzeige** im Menü (JWT-Rolle / Session). Enforcement bleibt serverseitig.
 * @see docs/contracts/ui-role-mapping-v1-3.md
 */
export function isPrimaryNavLinkVisible(
  key: PrimaryNavKey,
  opts: { hasSession: boolean; role: ApiUserRole | null },
): boolean {
  if (key === "start" || key === "hilfe" || key === "login" || key === "password_reset") return true;
  if (key === "settings") {
    return (
      opts.hasSession &&
      opts.role != null &&
      (opts.role === "ADMIN" || opts.role === "GESCHAEFTSFUEHRUNG" || opts.role === "BUCHHALTUNG")
    );
  }
  return opts.hasSession;
}
