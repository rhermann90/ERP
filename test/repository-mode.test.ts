import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertDatabaseUrlForPostgresMode,
  assertFailClosedProductionDatabase,
  resolveRepositoryMode,
} from "../src/config/repository-mode.js";

describe("repository-mode (ADR-0003 / Agent-1 fail-closed DB policy)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("resolveRepositoryMode forces memory in NODE_ENV=test", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DATABASE_URL", "postgresql://x");
    expect(resolveRepositoryMode()).toBe("memory");
  });

  it("resolveRepositoryMode selects postgres when ERP_DEPLOYMENT=integration", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ERP_DEPLOYMENT", "integration");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/erp");
    expect(resolveRepositoryMode()).toBe("postgres");
  });

  it("assertFailClosedProductionDatabase exits 1 when production without DATABASE_URL", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("ERP_DEPLOYMENT", "");
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    assertFailClosedProductionDatabase();
    expect(exit).toHaveBeenCalledWith(1);
    expect(err).toHaveBeenCalled();
  });

  it("assertFailClosedProductionDatabase exits 1 when ERP_DEPLOYMENT=integration without DATABASE_URL", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ERP_DEPLOYMENT", "integration");
    vi.stubEnv("DATABASE_URL", "");
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    assertFailClosedProductionDatabase();
    expect(exit).toHaveBeenCalledWith(1);
    expect(err).toHaveBeenCalled();
  });

  it("assertDatabaseUrlForPostgresMode throws without DATABASE_URL", () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(() => assertDatabaseUrlForPostgresMode("postgres")).toThrow(/DATABASE_URL/);
  });
});
