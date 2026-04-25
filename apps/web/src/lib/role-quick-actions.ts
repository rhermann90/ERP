import type { EntityType } from "./action-executor.js";
import { DEMO_SEED_IDS } from "./demo-seed-ids.js";
import type { ApiUserRole } from "./token-payload.js";

/**
 * Top-5-Schnellzugriffe je API-Rolle (Backend `UserRole`).
 * Fachliche Rollen v1.3 §11.1 → API-Rolle: siehe `docs/contracts/ui-role-mapping-v1-3.md` und `v13DomainRolesForApiRole`.
 */
export type QuickPreset =
  | { kind: "finance"; id: string; label: string; subtitle: string }
  | {
      kind: "document";
      id: string;
      label: string;
      subtitle: string;
      entityType: EntityType;
      documentId: string;
    };

const S = DEMO_SEED_IDS;

const finance: QuickPreset = {
  kind: "finance",
  id: "finance-prep",
  label: "Finanz-Vorbereitung",
  subtitle: "Hash #/finanz-vorbereitung — Tabs Rechnung, Mahnwesen, Fortgeschritten",
};

const doc = (
  id: string,
  label: string,
  subtitle: string,
  entityType: EntityType,
  documentId: string,
): QuickPreset => ({ kind: "document", id, label, subtitle, entityType, documentId });

const offer = doc("doc-offer", "Angebotsversion", "Seed-Angebot — Status & Freigaben", "OFFER_VERSION", S.offerVersionId);
const lv = doc("doc-lv", "LV-Version", "Leistungsverzeichnis (Seed)", "LV_VERSION", S.lvVersionId);
const mass = doc("doc-ms", "Aufmaß-Version", "Mengen & Positionen (Seed)", "MEASUREMENT_VERSION", S.measurementVersionId);
const invoice = doc("doc-inv", "Rechnung", "Rechnungskopf / Export-Kontext (Seed)", "INVOICE", S.invoiceId);
const lvNode = doc("doc-lv-node", "LV-Strukturknoten", "Bereich im Seed-LV (Struktur)", "LV_STRUCTURE_NODE", S.lvBereichId);

const PRESETS: Record<ApiUserRole, QuickPreset[]> = {
  ADMIN: [finance, invoice, offer, mass, lv],
  BUCHHALTUNG: [invoice, finance, offer, mass, lv],
  VERTRIEB_BAULEITUNG: [offer, mass, lv, finance, invoice],
  GESCHAEFTSFUEHRUNG: [offer, finance, invoice, mass, lvNode],
  VIEWER: [offer, lv, mass, invoice, finance],
};

export function quickPresetsForRole(role: ApiUserRole): QuickPreset[] {
  return PRESETS[role];
}
