import { createHmac, timingSafeEqual } from "node:crypto";
import { DomainError } from "../errors/domain-error.js";
import { UserRole } from "../domain/types.js";

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: UserRole;
}

interface TokenPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
  exp: number;
}

/** Nur für Vitest (`NODE_ENV=test`), niemals für Laufzeit-Server. */
const VITEST_AUTH_TOKEN_SECRET = "vitest-auth-token-secret-min-32-chars-aaaaaaaa";

/** Nur wenn `ERP_ALLOW_INSECURE_DEV_AUTH=1` und nicht production — niemals für Deployments. */
const INSECURE_DEV_AUTH_TOKEN_SECRET = "erp-insecure-dev-auth-only-not-for-production-use";

/**
 * Signier-Geheimnis für Bearer-Tokens. Liest bei jedem Aufruf aus der Umgebung (kein Cache).
 *
 * - `AUTH_TOKEN_SECRET`: Pflicht für `npm run dev` / Produktion, außer siehe unten.
 * - `NODE_ENV=test` (Vitest): fester Test-Fallback, damit Tests kein Secret brauchen.
 * - `ERP_ALLOW_INSECURE_DEV_AUTH=1` und `NODE_ENV !== production`: unsicherer Demo-Modus mit Warnung auf stderr.
 *
 * Produktion (`NODE_ENV=production`): Secret mindestens 32 Zeichen.
 */
export function getAuthTokenSecret(): string {
  const fromEnv = process.env.AUTH_TOKEN_SECRET?.trim();
  if (fromEnv && fromEnv.length > 0) {
    if (process.env.NODE_ENV === "production" && fromEnv.length < 32) {
      throw new Error("AUTH_TOKEN_SECRET must be at least 32 characters when NODE_ENV=production.");
    }
    return fromEnv;
  }

  if (process.env.NODE_ENV === "test") {
    return VITEST_AUTH_TOKEN_SECRET;
  }

  if (process.env.ERP_ALLOW_INSECURE_DEV_AUTH === "1" && process.env.NODE_ENV !== "production") {
    console.warn(
      "[erp] ERP_ALLOW_INSECURE_DEV_AUTH=1: insecure built-in signing secret — never use in production.",
    );
    return INSECURE_DEV_AUTH_TOKEN_SECRET;
  }

  throw new Error(
    "AUTH_TOKEN_SECRET is not set. Set a strong secret (see repo .env.example) or for local demo-only " +
      "use ERP_ALLOW_INSECURE_DEV_AUTH=1 (never in production).",
  );
}

export function assertAuthTokenSecretConfiguredAtStartup(): void {
  try {
    getAuthTokenSecret();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[erp] Refusing to start: %s", msg);
    process.exit(1);
  }
}

function signPayload(payloadBase64Url: string): Buffer {
  return createHmac("sha256", getAuthTokenSecret()).update(payloadBase64Url).digest();
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function createSignedToken(payload: TokenPayload): string {
  const payloadBase64Url = toBase64Url(JSON.stringify(payload));
  const signatureBase64Url = signPayload(payloadBase64Url).toString("base64url");
  return `v1.${payloadBase64Url}.${signatureBase64Url}`;
}

export function verifyBearerToken(authorizationHeader: string): AuthContext {
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new DomainError("UNAUTHORIZED", "Authorization Bearer Token fehlt", 401);
  }
  const [version, payloadBase64Url, signatureBase64Url] = token.split(".");
  if (version !== "v1" || !payloadBase64Url || !signatureBase64Url) {
    throw new DomainError("UNAUTHORIZED", "Token-Format ungültig", 401);
  }
  const expectedSignature = signPayload(payloadBase64Url);
  const receivedSignature = Buffer.from(signatureBase64Url, "base64url");
  if (expectedSignature.length !== receivedSignature.length) {
    throw new DomainError("UNAUTHORIZED", "Token-Signatur ungültig", 401);
  }
  if (!timingSafeEqual(expectedSignature, receivedSignature)) {
    throw new DomainError("UNAUTHORIZED", "Token-Signatur ungültig", 401);
  }
  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadBase64Url, "base64url").toString("utf8")) as TokenPayload;
  } catch {
    throw new DomainError("UNAUTHORIZED", "Token-Payload ungültig", 401);
  }
  if (!payload.sub || !payload.tenantId || !payload.role || !payload.exp) {
    throw new DomainError("UNAUTHORIZED", "Token-Claims unvollständig", 401);
  }
  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new DomainError("UNAUTHORIZED", "Token abgelaufen", 401);
  }
  return { userId: payload.sub, tenantId: payload.tenantId, role: payload.role };
}
