import { describe, expect, it } from "vitest";
import { decodeTokenPayload, roleForQuickNav } from "./token-payload.js";

/** Minimal v1-Token-Form (ohne Signaturprüfung — wie im UI nur Payload lesen). */
function makeUnsignedToken(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `v1.${b64}.unsigned`;
}

describe("decodeTokenPayload", () => {
  it("liest tenantId und Rolle aus Payload", () => {
    const token = makeUnsignedToken({
      sub: "77777777-7777-4777-8777-777777777777",
      tenantId: "11111111-1111-4111-8111-111111111111",
      role: "BUCHHALTUNG",
      exp: 9_999_999_999,
    });
    const p = decodeTokenPayload(token);
    expect(p.tenantId).toBe("11111111-1111-4111-8111-111111111111");
    expect(p.role).toBe("BUCHHALTUNG");
  });

  it("roleForQuickNav fällt auf VIEWER zurück", () => {
    expect(roleForQuickNav(null)).toBe("VIEWER");
  });

  it("mappt Legacy-Rolle VERTRIEB auf VERTRIEB_BAULEITUNG", () => {
    const token = makeUnsignedToken({
      sub: "77777777-7777-4777-8777-777777777777",
      tenantId: "11111111-1111-4111-8111-111111111111",
      role: "VERTRIEB",
      exp: 9_999_999_999,
    });
    expect(decodeTokenPayload(token).role).toBe("VERTRIEB_BAULEITUNG");
  });
});
