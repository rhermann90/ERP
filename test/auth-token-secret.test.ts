import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertAuthTokenSecretConfiguredAtStartup,
  createSignedToken,
  getAuthTokenSecret,
} from "../src/auth/token-auth.js";

describe("AUTH_TOKEN_SECRET bootstrap (SEC-01 / PWA-SEC-P0-001)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("uses vitest fallback when NODE_ENV=test and secret unset", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("AUTH_TOKEN_SECRET", "");
    vi.stubEnv("ERP_ALLOW_INSECURE_DEV_AUTH", "");
    expect(getAuthTokenSecret().length).toBeGreaterThanOrEqual(32);
    const token = createSignedToken({
      sub: "77777777-7777-4777-8777-777777777777",
      tenantId: "11111111-1111-4111-8111-111111111111",
      role: "ADMIN",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    expect(token.startsWith("v1.")).toBe(true);
  });

  it("refuses non-test runtime without secret and without insecure opt-in", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_TOKEN_SECRET", "");
    vi.stubEnv("ERP_ALLOW_INSECURE_DEV_AUTH", "");
    expect(() => getAuthTokenSecret()).toThrow(/AUTH_TOKEN_SECRET/);
  });

  it("allows insecure demo mode only with explicit ERP_ALLOW_INSECURE_DEV_AUTH=1", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_TOKEN_SECRET", "");
    vi.stubEnv("ERP_ALLOW_INSECURE_DEV_AUTH", "1");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const s = getAuthTokenSecret();
    expect(s).toContain("insecure");
    expect(warn).toHaveBeenCalled();
  });

  it("rejects short secret when NODE_ENV=production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_TOKEN_SECRET", "tooshort");
    expect(() => getAuthTokenSecret()).toThrow(/32/);
  });

  it("startup assert exits 1 when secret missing in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_TOKEN_SECRET", "");
    vi.stubEnv("ERP_ALLOW_INSECURE_DEV_AUTH", "");
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    assertAuthTokenSecretConfiguredAtStartup();
    expect(exit).toHaveBeenCalledWith(1);
    expect(err).toHaveBeenCalled();
  });
});
