import { describe, expect, it, vi } from "vitest";
import { ApiError } from "./api-error.js";

describe("ApiError envelope passthrough", () => {
  it("keeps correlationId/retryable/blocking from backend response", () => {
    const error = new ApiError(409, {
      code: "STATUS_TRANSITION_FORBIDDEN",
      message: "not allowed",
      correlationId: "corr-123",
      retryable: false,
      blocking: true,
      details: { field: "status" },
    });

    expect(error.envelope.correlationId).toBe("corr-123");
    expect(error.envelope.retryable).toBe(false);
    expect(error.envelope.blocking).toBe(true);
    expect(error.envelope.details).toEqual({ field: "status" });
  });

  it("fills correlationId from x-request-id when body omits it (error-codes fallbackTemporary)", () => {
    const error = new ApiError(
      403,
      { code: "TENANT_SCOPE_VIOLATION", message: "scope", retryable: false, blocking: true },
      { requestIdFromHeader: "gw-trace-abc" },
    );
    expect(error.envelope.correlationId).toBe("gw-trace-abc");
  });

  it("fills correlationId with UUID when body and header omit it", () => {
    const uuid = "00000000-0000-4000-8000-000000000001";
    const spy = vi.spyOn(crypto, "randomUUID").mockReturnValue(uuid);
    try {
      const error = new ApiError(500, { code: "LV_COPY_FAILED", message: "fail", retryable: false, blocking: true });
      expect(error.envelope.correlationId).toBe(uuid);
    } finally {
      spy.mockRestore();
    }
  });

  it("fills retryable/blocking from error-codes.json when body omits flags", () => {
    const error = new ApiError(409, {
      code: "STATUS_TRANSITION_FORBIDDEN",
      message: "conflict",
      correlationId: "c1",
    });
    expect(error.envelope.retryable).toBe(false);
    expect(error.envelope.blocking).toBe(true);
  });

  it("maps backend-only retryable codes per backendEnvelope.retryableDerivation", () => {
    const e1 = new ApiError(401, {
      code: "AUTH_SESSION_EXPIRED",
      message: "expired",
      correlationId: "x",
      retryable: true,
      blocking: false,
    });
    expect(e1.envelope.retryable).toBe(true);
    expect(e1.envelope.blocking).toBe(false);

    const e2 = new ApiError(503, {
      code: "EXPORT_CHANNEL_UNAVAILABLE",
      message: "down",
      correlationId: "y",
    });
    expect(e2.envelope.retryable).toBe(true);
    expect(e2.envelope.blocking).toBe(false);
  });
});
