import { useEffect, useState } from "react";

/** Hash-Route zur read-only Finanz-Vorbereitungsseite (ohne react-router). */
export const FINANCE_PREP_HASH = "#/finanz-vorbereitung";

/** Alias: öffnet Finanz-Vorbereitung direkt im Tab „Grundeinstellungen Mahnlauf“. */
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

/** Kanonische Hash-Form inkl. Tab-Query (Lesezeichen / Tab-Wechsel in der PWA). */
export function financePrepHashWithTab(tab: FinancePrepMainTab): string {
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
 * Kanonischer Lesezeichen-Pfad für Finanz-Vorbereitung inkl. Tab „Grundeinstellungen“:
 * `#/finanz-vorbereitung?tab=grundeinstellungen`. Alias `#/finanz-grundeinstellungen` wird
 * einmalig per replaceState umgestellt (kein doppelter Ladezustand in der PWA).
 */
export function normalizeFinancePrepHashToCanon(): void {
  const path = normalizeHash();
  if (path !== "/finanz-grundeinstellungen") return;
  const next = financePrepHashWithTab("grundeinstellungen");
  if (window.location.hash !== next) {
    const url = `${window.location.pathname}${window.location.search}${next}`;
    history.replaceState(null, "", url);
    window.dispatchEvent(new Event("hashchange"));
  }
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
