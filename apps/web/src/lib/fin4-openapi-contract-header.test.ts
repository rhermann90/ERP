import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ERP_OPENAPI_CONTRACT_VERSION_HEADER,
  isFin4OpenApiContractResponsePath,
  warnIfResponseContractVersionMismatch,
} from "./fin4-openapi-contract-header.js";

describe("isFin4OpenApiContractResponsePath", () => {
  it("matches FIN-4 contract paths", () => {
    expect(isFin4OpenApiContractResponsePath("/finance/dunning-reminder-config")).toBe(true);
    expect(isFin4OpenApiContractResponsePath("/finance/dunning-reminder-run")).toBe(true);
    expect(isFin4OpenApiContractResponsePath("/finance/dunning-reminder-run/send-emails")).toBe(true);
    expect(isFin4OpenApiContractResponsePath("/finance/dunning-email-footer")).toBe(true);
    expect(isFin4OpenApiContractResponsePath("/finance/dunning-email-footer?x=1")).toBe(true);
  });
  it("does not match invoice-scoped dunning routes", () => {
    expect(isFin4OpenApiContractResponsePath("/invoices/00000000-0000-4000-8000-000000000001/dunning-reminders")).toBe(
      false,
    );
  });
});

describe("warnIfResponseContractVersionMismatch", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_EXPECTED_OPENAPI_CONTRACT_VERSION", "9.9.9");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("warns when expected env differs from response header on FIN-4 path", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = new Response("{}", {
      status: 200,
      headers: { [ERP_OPENAPI_CONTRACT_VERSION_HEADER]: "1.0.0" },
    });
    warnIfResponseContractVersionMismatch("/finance/dunning-reminder-config", res);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("does not warn on non-FIN-4 paths", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = new Response("{}", {
      status: 200,
      headers: { [ERP_OPENAPI_CONTRACT_VERSION_HEADER]: "1.0.0" },
    });
    warnIfResponseContractVersionMismatch("/invoices/x", res);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
