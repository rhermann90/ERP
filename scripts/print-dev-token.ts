/**
 * Druckt ein signiertes Bearer-Token für lokale PWA-/API-Tests.
 * Muss zum gleichen AUTH_TOKEN_SECRET passen wie das Backend (siehe repo .env.example).
 */
import { createSignedToken, getAuthTokenSecret } from "../src/auth/token-auth.js";

try {
  getAuthTokenSecret();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const tenantId = process.argv[2] ?? "11111111-1111-4111-8111-111111111111";
const roleArg = process.argv[3] ?? "VERTRIEB_BAULEITUNG";
const role = roleArg as "ADMIN" | "VERTRIEB_BAULEITUNG" | "GESCHAEFTSFUEHRUNG" | "BUCHHALTUNG" | "VIEWER";

const token = createSignedToken({
  sub: "77777777-7777-4777-8777-777777777777",
  tenantId,
  role,
  exp: Math.floor(Date.now() / 1000) + 86400 * 7,
});

console.log(token);
