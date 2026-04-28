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
  subtitle:
    "Tabs: #/finanz-vorbereitung?tab=… — Tab Grundeinstellungen kanonisch #/finanz-grundeinstellungen (ohne ?tab=-Duplikat)",
};

/** Direkt Tab „Grundeinstellungen Mahnlauf“ (Automation, Kandidaten, Mahnlauf). */
const financeGrundeinstellungen: QuickPreset = {
  kind: "finance",
  id: "finance-grundeinstellungen",
  label: "Mahn-Grundeinstellungen",
  subtitle: "Deep-Link #/finanz-grundeinstellungen (Mahn-Grundeinstellungen)",
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
  ADMIN: [finance, financeGrundeinstellungen, invoice, offer, mass],
  BUCHHALTUNG: [invoice, finance, financeGrundeinstellungen, offer, mass],
  VERTRIEB_BAULEITUNG: [offer, mass, lv, financeGrundeinstellungen, invoice],
  GESCHAEFTSFUEHRUNG: [offer, finance, financeGrundeinstellungen, invoice, lvNode],
  VIEWER: [offer, lv, mass, invoice, financeGrundeinstellungen],
};

export function quickPresetsForRole(role: ApiUserRole): QuickPreset[] {
  return PRESETS[role];
}
