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

/** Pilot: Angebots-/Nachtrags-SoT ohne vollen Dokument-Shell-Kontext. */
export const OFFER_WORKSPACE_HASH = "#/angebote-arbeitsflaeche";

/** Betrieb: Mahnkandidaten als Arbeitsliste (FIN-4 Lesepfad). */
export const FINANCE_WORKLIST_HASH = "#/finanz-arbeitsliste";

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
  const [path, setPath] = useState(normalizeHash);
  useEffect(() => {
    const on = () => setPath(normalizeHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return path;
}
