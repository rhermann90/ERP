import { useEffect, useState } from "react";

/** Hash-Route zur read-only Finanz-Vorbereitungsseite (ohne react-router). */
export const FINANCE_PREP_HASH = "#/finanz-vorbereitung";

/** Kanonischer Deep-Link zum Tab „Grundeinstellungen Mahnlauf“ (ohne `?tab=`-Duplikat). */
export const FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH = "#/finanz-grundeinstellungen";

export const LOGIN_HASH = "#/login";
export const PASSWORD_RESET_HASH = "#/password-reset";

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
