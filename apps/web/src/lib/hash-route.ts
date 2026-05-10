import { useEffect, useState } from "react";

/** Hash-Route zur read-only Finanz-Vorbereitungsseite (ohne react-router). */
export const FINANCE_PREP_HASH = "#/finanz-vorbereitung";

/** Kanonischer Deep-Link zum Tab „Grundeinstellungen Mahnlauf“ (ohne `?tab=`-Duplikat). */
export const FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH = "#/finanz-grundeinstellungen";

export const LOGIN_HASH = "#/login";
export const PASSWORD_RESET_HASH = "#/password-reset";

/** Phase-2 Pilot: geführter Flow LV → Angebot → Rechnungsentwurf (`GeschaeftsprozessWizard`). */
export const GESCHAEFSPROZESS_HASH = "#/geschaeftsprozess";

/** Phase-2 Pilot: LV §9 Lesepfad + Sprung zur Shell für SoT-Aktionen. */
export const LV_BEARBEITEN_HASH = "#/lv-bearbeiten";

/** Integrations-Arbeitsbereich: Dokument-Shell und Diagnose-Panels. */
export const DOCUMENT_WORKSPACE_HASH = "#/dokument";

/** Domänen-Hub: Stammdaten (Einstieg bis geführte Projekt-/Kundenlisten existieren). */
export const STAMMDATEN_HASH = "#/stammdaten";

/** Query-Key: XRechnung-Kunde im Stammdaten-Hub (`#/stammdaten?customerId=`). */
export const STAMMDATEN_CUSTOMER_ID_QUERY = "customerId";

/** Hash für Stammdaten-Hub mit optionalem Kunden-Deep-Link (XRechnung `customerId`). */
export function stammdatenHashWithCustomerId(customerId: string | null | undefined): string {
  const id = customerId?.trim();
  if (!id) return STAMMDATEN_HASH;
  const q = new URLSearchParams({ [STAMMDATEN_CUSTOMER_ID_QUERY]: id });
  return `${STAMMDATEN_HASH}?${q}`;
}

/**
 * Setzt `location.hash` auf Stammdaten mit/ohne `customerId` und feuert `hashchange`
 * (analog zu Finanz-Tab-Kanonikalisierung).
 */
export function applyStammdatenCustomerIdToLocationHash(customerId: string | null | undefined): void {
  const next = stammdatenHashWithCustomerId(customerId ?? null);
  if (window.location.hash !== next) {
    const url = `${window.location.pathname}${window.location.search}${next}`;
    history.replaceState(null, "", url);
    window.dispatchEvent(new Event("hashchange"));
  }
}

/** Aktueller `customerId`-Parameter für den Stammdaten-Hub (nach Trim). */
export function readStammdatenCustomerIdFromHash(): string {
  return readHashQuery().get(STAMMDATEN_CUSTOMER_ID_QUERY)?.trim() ?? "";
}

/** Domänen-Hub: LV & Aufmaß (Sprünge zu Pilot-Screens und Shell). */
export const LV_AUFMASS_HUB_HASH = "#/lv-aufmass";

/** Domänen-Hub: Angebote & Nachträge (Wizard + Shell). */
export const ANGEBOTE_NACHTRAEGE_HUB_HASH = "#/angebote-nachtraege";

/** Mandanten-/Sitzungsbezogene Hinweise (Detail weiter auf Start). */
export const EINSTELLUNGEN_HASH = "#/einstellungen";

/** Hilfe und Repo-Verweise (ohne neue Geschäftslogik). */
export const HILFE_HASH = "#/hilfe";

/** Pilot: Messungsversionen merken und Detail lesen (kein Backend-Listen-Endpunkt). */
export const MEASUREMENT_PILOT_LIST_HASH = "#/aufmass-messungen";

/** Query-Key: Messungsversions-ID auf der Pilot-Liste (`#/aufmass-messungen?measurementVersionId=`). */
export const MEASUREMENT_PILOT_VERSION_QUERY = "measurementVersionId";

/** Hash für Pilot-Liste mit optionalem Deep-Link auf eine Messungsversions-ID. */
export function measurementPilotListHashWithVersionId(versionId: string | null | undefined): string {
  const id = versionId?.trim();
  if (!id) return MEASUREMENT_PILOT_LIST_HASH;
  const q = new URLSearchParams({ [MEASUREMENT_PILOT_VERSION_QUERY]: id });
  return `${MEASUREMENT_PILOT_LIST_HASH}?${q}`;
}

/** Liest `measurementVersionId` nur auf Route `/aufmass-messungen` (keine Kreuzwirkung auf andere Screens). */
export function readMeasurementPilotVersionIdFromHash(): string {
  if (normalizeHash() !== "/aufmass-messungen") return "";
  return readHashQuery().get(MEASUREMENT_PILOT_VERSION_QUERY)?.trim() ?? "";
}

/**
 * Setzt `location.hash` auf die Pilot-Liste mit/ohne `measurementVersionId` und feuert `hashchange`
 * (analog zu Stammdaten-`customerId`).
 */
export function applyMeasurementPilotVersionToLocationHash(versionId: string | null | undefined): void {
  const next = measurementPilotListHashWithVersionId(versionId ?? null);
  if (window.location.hash !== next) {
    const url = `${window.location.pathname}${window.location.search}${next}`;
    history.replaceState(null, "", url);
    window.dispatchEvent(new Event("hashchange"));
  }
}

/** Pilot: Angebots-/Nachtrags-SoT ohne vollen Dokument-Shell-Kontext. */
export const OFFER_WORKSPACE_HASH = "#/angebote-arbeitsflaeche";

/** Query-Keys: Deep-Link zur Arbeitsfläche (`#/angebote-arbeitsflaeche?offerVersionId=&supplementVersionId=`). */
export const OFFER_WORKSPACE_OFFER_VERSION_QUERY = "offerVersionId";
export const OFFER_WORKSPACE_SUPPLEMENT_VERSION_QUERY = "supplementVersionId";

export function offerWorkspaceHashWithVersionIds(
  offerVersionId: string | null | undefined,
  supplementVersionId: string | null | undefined,
): string {
  const o = offerVersionId?.trim();
  const s = supplementVersionId?.trim();
  const q = new URLSearchParams();
  if (o) q.set(OFFER_WORKSPACE_OFFER_VERSION_QUERY, o);
  if (s) q.set(OFFER_WORKSPACE_SUPPLEMENT_VERSION_QUERY, s);
  const qs = q.toString();
  return qs ? `${OFFER_WORKSPACE_HASH}?${qs}` : OFFER_WORKSPACE_HASH;
}

/** Liest Query nur auf Route `/angebote-arbeitsflaeche`. */
export function readOfferWorkspaceVersionIdsFromHash(): { offerVersionId: string; supplementVersionId: string } {
  if (normalizeHash() !== "/angebote-arbeitsflaeche") return { offerVersionId: "", supplementVersionId: "" };
  const qq = readHashQuery();
  return {
    offerVersionId: qq.get(OFFER_WORKSPACE_OFFER_VERSION_QUERY)?.trim() ?? "",
    supplementVersionId: qq.get(OFFER_WORKSPACE_SUPPLEMENT_VERSION_QUERY)?.trim() ?? "",
  };
}

/** Betrieb: Mahnkandidaten als Arbeitsliste (FIN-4 Lesepfad). */
export const FINANCE_WORKLIST_HASH = "#/finanz-arbeitsliste";

/** Query `tab` auf `#/finanz-arbeitsliste`: `offen` (Standard) | `mahn`. */
export const FINANCE_WORKLIST_TAB_QUERY = "tab";

export type FinanceWorklistPanel = "offen" | "mahn";

export function readFinanceWorklistPanelFromHash(path: string, query: URLSearchParams): FinanceWorklistPanel {
  if (path !== "/finanz-arbeitsliste") return "offen";
  const raw = query.get(FINANCE_WORKLIST_TAB_QUERY)?.trim().toLowerCase() ?? "";
  return raw === "mahn" ? "mahn" : "offen";
}

export function financeWorklistHashWithPanel(panel: FinanceWorklistPanel): string {
  if (panel === "mahn") {
    return `${FINANCE_WORKLIST_HASH}?${FINANCE_WORKLIST_TAB_QUERY}=mahn`;
  }
  return FINANCE_WORKLIST_HASH;
}

export function applyFinanceWorklistPanelToLocationHash(panel: FinanceWorklistPanel): void {
  const next = financeWorklistHashWithPanel(panel);
  if (window.location.hash !== next) {
    const url = `${window.location.pathname}${window.location.search}${next}`;
    history.replaceState(null, "", url);
    window.dispatchEvent(new Event("hashchange"));
  }
}

/** Mandanten-Benutzer (nur Rolle ADMIN, Postgres). */
export const ADMIN_USERS_HASH = "#/admin/users";

const FINANCE_PREP_MAIN_TABS = ["rechnung", "grundeinstellungen", "mahnwesen", "fortgeschritten"] as const;

/** Haupt-Tabs innerhalb der Finanz-Vorbereitung (synchron mit UI). */
export type FinancePrepMainTab = (typeof FINANCE_PREP_MAIN_TABS)[number];

function normalizeHash(): string {
  const raw = window.location.hash.replace(/^#/, "");
  const pathOnly = raw.split("?")[0] ?? "";
  if (pathOnly === "" || pathOnly === "/") return "/";
  return pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
}

/** Query-String der aktuellen Hash-URL (z. B. `token` bei Passwort-Reset). */
export function readHashQuery(): URLSearchParams {
  const raw = window.location.hash.replace(/^#/, "");
  const qs = raw.includes("?") ? raw.slice(raw.indexOf("?") + 1) : "";
  return new URLSearchParams(qs);
}

export function isFinancePrepHashPath(path: string): boolean {
  return path === "/finanz-vorbereitung" || path === "/finanz-grundeinstellungen";
}

/**
 * Initialer Haupt-Tab aus Hash-Pfad und Query `tab`.
 * Ungültige `tab`-Werte → `rechnung`.
 */
export function resolveFinancePrepInitialMainTab(path: string, query: URLSearchParams): FinancePrepMainTab {
  if (path === "/finanz-grundeinstellungen") return "grundeinstellungen";
  const raw = query.get("tab")?.trim().toLowerCase() ?? "";
  if (raw && (FINANCE_PREP_MAIN_TABS as readonly string[]).includes(raw)) {
    return raw as FinancePrepMainTab;
  }
  return "rechnung";
}

/** Kanonische Hash-Form (Lesezeichen / Tab-Wechsel). Tab „Grundeinstellungen“ = dedizierter Pfad. */
export function financePrepHashWithTab(tab: FinancePrepMainTab): string {
  if (tab === "grundeinstellungen") return FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH;
  return `#/finanz-vorbereitung?tab=${tab}`;
}

/** Aktualisiert `location.hash` per replaceState und feuert `hashchange` (useHashRoute). */
export function applyFinancePrepTabToLocationHash(tab: FinancePrepMainTab): void {
  const next = financePrepHashWithTab(tab);
  if (window.location.hash !== next) {
    const url = `${window.location.pathname}${window.location.search}${next}`;
    history.replaceState(null, "", url);
    window.dispatchEvent(new Event("hashchange"));
  }
}

/**
 * Ein kanonischer Eintrag für „Grundeinstellungen Mahnlauf“: `#/finanz-grundeinstellungen`.
 * Lesezeichen `#/finanz-vorbereitung?tab=grundeinstellungen` wird einmalig per replaceState
 * dorthin vereinheitlicht (kein paralleles `?tab=` für dieselbe Ansicht).
 */
export function normalizeFinancePrepHashToCanon(): void {
  const path = normalizeHash();
  const q = readHashQuery();
  if (path === "/finanz-vorbereitung" && q.get("tab")?.trim().toLowerCase() === "grundeinstellungen") {
    const next = FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH;
    if (window.location.hash !== next) {
      const url = `${window.location.pathname}${window.location.search}${next}`;
      history.replaceState(null, "", url);
      window.dispatchEvent(new Event("hashchange"));
    }
    return;
  }
  if (path === "/finanz-grundeinstellungen") return;
}

export function useHashRoute(): string {
  const [, setHashBump] = useState(0);
  useEffect(() => {
    const on = () => setHashBump((n) => n + 1);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return normalizeHash();
}
