import { useEffect, useState } from "react";

/** Hash-Route zur read-only Finanz-Vorbereitungsseite (ohne react-router). */
export const FINANCE_PREP_HASH = "#/finanz-vorbereitung";
export const LOGIN_HASH = "#/login";
export const PASSWORD_RESET_HASH = "#/password-reset";

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

export function useHashRoute(): string {
  const [path, setPath] = useState(normalizeHash);
  useEffect(() => {
    const on = () => setPath(normalizeHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return path;
}
