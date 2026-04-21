import type { UserRole } from "../domain/types.js";

const ROLE_SET = new Set<UserRole>([
  "ADMIN",
  "BUCHHALTUNG",
  "GESCHAEFTSFUEHRUNG",
  "VERTRIEB_BAULEITUNG",
  "VIEWER",
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export type PasswordLoginProfile = {
  emailNorm: string;
  tenantId: string;
  userId: string;
  role: UserRole;
  /** Nur für einmaliges Hashing beim ersten Login-Versuch; nicht loggen. */
  passwordPlain: string;
};

/**
 * Liefert Profil nur wenn `ERP_LOGIN_PASSWORD` gesetzt und stark genug ist (min. 12 Zeichen).
 * Ungültige UUIDs/Rollen → `null` (Passwort-Login deaktiviert) und Warnung auf stderr.
 */
export function getPasswordLoginProfile(): PasswordLoginProfile | null {
  const passwordPlain = process.env.ERP_LOGIN_PASSWORD?.trim();
  if (!passwordPlain) return null;
  if (passwordPlain.length < 12) {
    console.warn("[erp] ERP_LOGIN_PASSWORD is set but shorter than 12 characters; password login disabled.");
    return null;
  }

  const emailNorm = (process.env.ERP_LOGIN_EMAIL ?? "admin@localhost").trim().toLowerCase();
  const tenantId = (process.env.ERP_LOGIN_TENANT_ID ?? "11111111-1111-4111-8111-111111111111").trim();
  const userId = (process.env.ERP_LOGIN_USER_ID ?? "77777777-7777-4777-8777-777777777777").trim();
  const roleUpper = (process.env.ERP_LOGIN_ROLE ?? "ADMIN").trim().toUpperCase();
  const roleRaw = (roleUpper === "VERTRIEB" ? "VERTRIEB_BAULEITUNG" : roleUpper) as UserRole;

  if (!isUuid(tenantId)) {
    console.warn("[erp] ERP_LOGIN_TENANT_ID is not a valid UUID; password login disabled.");
    return null;
  }
  if (!isUuid(userId)) {
    console.warn("[erp] ERP_LOGIN_USER_ID is not a valid UUID; password login disabled.");
    return null;
  }
  if (!ROLE_SET.has(roleRaw)) {
    console.warn("[erp] ERP_LOGIN_ROLE is not a supported role; password login disabled.");
    return null;
  }

  return { emailNorm, tenantId, userId, role: roleRaw, passwordPlain };
}
