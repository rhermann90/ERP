import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveListenHost, resolveListenPort } from "../src/config/http-listen.js";

describe("http-listen (Phase A3/A6)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolveListenHost defaults to 0.0.0.0", () => {
    delete process.env.ERP_HTTP_HOST;
    expect(resolveListenHost()).toBe("0.0.0.0");
  });

  it("resolveListenHost trims ERP_HTTP_HOST", () => {
    vi.stubEnv("ERP_HTTP_HOST", "  127.0.0.1  ");
    expect(resolveListenHost()).toBe("127.0.0.1");
  });

  it("resolveListenPort uses ERP_HTTP_PORT", () => {
    vi.stubEnv("ERP_HTTP_PORT", "3001");
    delete process.env.PORT;
    expect(resolveListenPort()).toBe(3001);
  });

  it("resolveListenPort throws on invalid port", () => {
    vi.stubEnv("ERP_HTTP_PORT", "99999");
    expect(() => resolveListenPort()).toThrow(/65535/);
  });
});
