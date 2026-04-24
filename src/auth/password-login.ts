import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { DomainError } from "../errors/domain-error.js";
import type { UserRole } from "../domain/types.js";
import { createSignedToken } from "./token-auth.js";
import { getPasswordLoginProfile } from "./password-login-config.js";

const BCRYPT_COST = 12;
const TOKEN_TTL_SECONDS = 12 * 60 * 60;

/** bcrypt-Vergleichspfad auch ohne Treffer in der DB (Timing). */
const BCRYPT_TIMING_DUMMY = "$2a$12$zwXbNa9BhzOcCB5Ff3uvzeN0e5Q3XRyODJBz48ij3QvPWCtl5iWv.";

const ROLE_SET = new Set<UserRole>(["ADMIN", "BUCHHALTUNG", "GESCHAEFTSFUEHRUNG", "VERTRIEB_BAULEITUNG", "VIEWER"]);

let cachedPasswordHash: string | null = null;

/** Vitest: Env-Passwort-Hash zwischen Tests zurücksetzen. */
export function resetPasswordLoginRuntimeStateForTests(): void {
  cachedPasswordHash = null;
}

function ensurePasswordHash(plain: string): string {
  if (!cachedPasswordHash) {
    cachedPasswordHash = bcrypt.hashSync(plain, BCRYPT_COST);
  }
  return cachedPasswordHash;
}

function loginDbRoleAllowed(raw: string): boolean {
  const normalized = raw === "VERTRIEB" ? "VERTRIEB_BAULEITUNG" : raw;
  return ROLE_SET.has(normalized as UserRole);
}

function toUserRoleFromDb(raw: string): UserRole {
  return (raw === "VERTRIEB" ? "VERTRIEB_BAULEITUNG" : raw) as UserRole;
}

export type PasswordLoginResult = {
  token: string;
  expiresIn: number;
  tenantId: string;
  userId: string;
  role: UserRole;
};

async function loginViaDatabase(
  prisma: PrismaClient,
  tenantId: string,
  emailNorm: string,
  password: string,
): Promise<PasswordLoginResult | null> {
  const user = await prisma.user.findUnique({
    where: { tenantId_emailNorm: { tenantId, emailNorm } },
  });
  const row = user?.active ? user : null;
  const hash = row ? row.passwordHash : BCRYPT_TIMING_DUMMY;
  const passwordMatches = bcrypt.compareSync(password, hash);
  if (!row || !passwordMatches || !loginDbRoleAllowed(row.role)) {
    return null;
  }
  const role = toUserRoleFromDb(row.role);
  const now = Math.floor(Date.now() / 1000);
  const exp = now + TOKEN_TTL_SECONDS;
  const token = createSignedToken({
    sub: row.id,
    tenantId: row.tenantId,
    role,
    exp,
  });
  return {
    token,
    expiresIn: exp - now,
    tenantId: row.tenantId,
    userId: row.id,
    role,
  };
}

function loginViaEnvBootstrap(tenantId: string, emailNorm: string, password: string): PasswordLoginResult | null {
  const profile = getPasswordLoginProfile();
  if (!profile) return null;
  if (tenantId !== profile.tenantId) return null;
  const hash = ensurePasswordHash(profile.passwordPlain);
  const ok = emailNorm === profile.emailNorm && bcrypt.compareSync(password, hash);
  if (!ok) return null;
  const now = Math.floor(Date.now() / 1000);
  const exp = now + TOKEN_TTL_SECONDS;
  const token = createSignedToken({
    sub: profile.userId,
    tenantId: profile.tenantId,
    role: profile.role,
    exp,
  });
  return {
    token,
    expiresIn: exp - now,
    tenantId: profile.tenantId,
    userId: profile.userId,
    role: profile.role,
  };
}

/**
 * Postgres: Benutzer aus Tabelle `users` (Mandant + E-Mail). In-Memory-Backend: optional `ERP_LOGIN_*`.
 */
export async function performPasswordLogin(
  prisma: PrismaClient | null,
  tenantId: string,
  emailNorm: string,
  password: string,
): Promise<PasswordLoginResult> {
  if (prisma) {
    const fromDb = await loginViaDatabase(prisma, tenantId, emailNorm, password);
    if (fromDb) return fromDb;
    throw new DomainError("UNAUTHORIZED", "Anmeldung fehlgeschlagen.", 401);
  }

  const fromEnv = loginViaEnvBootstrap(tenantId, emailNorm, password);
  if (fromEnv) return fromEnv;

  if (!getPasswordLoginProfile()) {
    throw new DomainError("UNAUTHORIZED", "Passwort-Anmeldung auf diesem Server nicht aktiviert.", 401);
  }
  throw new DomainError("UNAUTHORIZED", "Anmeldung fehlgeschlagen.", 401);
}
