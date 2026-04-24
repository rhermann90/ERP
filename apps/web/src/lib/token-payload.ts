export type ApiUserRole = "ADMIN" | "BUCHHALTUNG" | "GESCHAEFTSFUEHRUNG" | "VERTRIEB_BAULEITUNG" | "VIEWER";

const ROLES: readonly ApiUserRole[] = ["ADMIN", "BUCHHALTUNG", "GESCHAEFTSFUEHRUNG", "VERTRIEB_BAULEITUNG", "VIEWER"];

function isApiUserRole(v: unknown): v is ApiUserRole {
  if (typeof v !== "string") return false;
  const normalized = v === "VERTRIEB" ? "VERTRIEB_BAULEITUNG" : v;
  return (ROLES as readonly string[]).includes(normalized);
}

function roleFromTokenJson(v: unknown): ApiUserRole | null {
  if (typeof v !== "string") return null;
  const normalized = v === "VERTRIEB" ? "VERTRIEB_BAULEITUNG" : v;
  return isApiUserRole(normalized) ? normalized : null;
}

/** Dekodiert v1-Bearer-Payload (nur Client-seitig für UI; keine Signaturprüfung). */
export function decodeTokenPayload(token: string): { tenantId: string | null; role: ApiUserRole | null } {
  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return { tenantId: null, role: null };
  try {
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    const json = JSON.parse(atob(b64)) as { tenantId?: unknown; role?: unknown };
    const tenantId = typeof json.tenantId === "string" ? json.tenantId : null;
    const role = roleFromTokenJson(json.role);
    return { tenantId, role };
  } catch {
    return { tenantId: null, role: null };
  }
}

export function roleForQuickNav(role: ApiUserRole | null): ApiUserRole {
  return role ?? "VIEWER";
}
