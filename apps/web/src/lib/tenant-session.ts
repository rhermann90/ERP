const SS_TOKEN = "erp.web.session.token";
const SS_TENANT = "erp.web.session.tenantId";

/** Speicherung strikt tenant-keyed: verhindert Cross-Tenant-Leak aus localStorage. */
export function storageKeyForTenant(tenantId: string, suffix: string): string {
  return `erp.t:${tenantId}:${suffix}`;
}

export type SessionStorageMode = "memory" | "session";

export function loadPersistedSession(): { token: string; tenantId: string; mode: SessionStorageMode } {
  const token = sessionStorage.getItem(SS_TOKEN) ?? "";
  const tenantId = sessionStorage.getItem(SS_TENANT) ?? "";
  if (!token || !tenantId) {
    return { token: "", tenantId: "", mode: "memory" };
  }
  return { token, tenantId, mode: "session" };
}

/**
 * Security-by-default: memory-first.
 * Persistenz nur explizit im sessionStorage (Tab-Lebensdauer), niemals localStorage.
 */
export function persistSession(token: string, tenantId: string, mode: SessionStorageMode): void {
  if (mode !== "session") {
    clearPersistedSession();
    return;
  }
  // Tab-lokal: Bearer nur in sessionStorage (kein localStorage); siehe Modulbeschreibung oben.
  sessionStorage.setItem(SS_TOKEN, token);
  sessionStorage.setItem(SS_TENANT, tenantId);
}

export function clearPersistedSession(): void {
  sessionStorage.removeItem(SS_TOKEN);
  sessionStorage.removeItem(SS_TENANT);
}

export function clearDocumentScopedKeys(tenantId: string): void {
  const prefix = `erp.t:${tenantId}:`;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(prefix)) toRemove.push(k);
  }
  for (const k of toRemove) localStorage.removeItem(k);
}
