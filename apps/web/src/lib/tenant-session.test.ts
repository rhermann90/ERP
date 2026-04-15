import { describe, expect, it } from "vitest";
import {
  clearDocumentScopedKeys,
  clearPersistedSession,
  loadPersistedSession,
  persistSession,
  storageKeyForTenant,
} from "./tenant-session.js";

describe("tenant-session security strategy", () => {
  it("is memory-first by default (no persisted token)", () => {
    sessionStorage.clear();
    localStorage.clear();
    const session = loadPersistedSession();
    expect(session.mode).toBe("memory");
    expect(session.token).toBe("");
    expect(localStorage.getItem("erp.web.token")).toBeNull();
  });

  it("persists only with explicit session opt-in", () => {
    sessionStorage.clear();
    persistSession("token-value", "tenant-a", "session");
    const session = loadPersistedSession();
    expect(session.mode).toBe("session");
    expect(session.token).toBe("token-value");
    expect(session.tenantId).toBe("tenant-a");
  });

  it("clears persisted session and tenant-scoped UI keys", () => {
    sessionStorage.clear();
    localStorage.clear();
    persistSession("token-value", "tenant-a", "session");
    localStorage.setItem(storageKeyForTenant("tenant-a", "docprefs"), "x");
    localStorage.setItem(storageKeyForTenant("tenant-b", "docprefs"), "y");

    clearPersistedSession();
    clearDocumentScopedKeys("tenant-a");

    expect(loadPersistedSession().token).toBe("");
    expect(localStorage.getItem(storageKeyForTenant("tenant-a", "docprefs"))).toBeNull();
    expect(localStorage.getItem(storageKeyForTenant("tenant-b", "docprefs"))).toBe("y");
  });
});
