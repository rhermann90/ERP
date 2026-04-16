import { useEffect, useState } from "react";

/** Hash-Route zur read-only Finanz-Vorbereitungsseite (ohne react-router). */
export const FINANCE_PREP_HASH = "#/finanz-vorbereitung";

function normalizeHash(): string {
  const raw = window.location.hash.replace(/^#/, "");
  if (raw === "" || raw === "/") return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
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
