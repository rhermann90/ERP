import { describe, expect, it, vi } from "vitest";
import { ApiError, extractStructuredError } from "./api-error.js";

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

describe("extractStructuredError", () => {
  it("returns envelope from ApiError instance", () => {
    const ae = new ApiError(404, {
      code: "DOCUMENT_NOT_FOUND",
      message: "gone",
      correlationId: "c",
      retryable: false,
      blocking: true,
    });
    expect(extractStructuredError(ae)).toEqual(ae.envelope);
  });

  it("unwraps first nested errors[] entry", () => {
    const env = extractStructuredError({
      status: 422,
      errors: [{ code: "VALIDATION_FAILED", message: "bad", correlationId: "n1", retryable: true, blocking: false }],
    });
    expect(env?.code).toBe("VALIDATION_FAILED");
    expect(env?.correlationId).toBe("n1");
  });

  it("reads body + status shape", () => {
    const env = extractStructuredError({
      status: 403,
      body: { code: "AUTH_ROLE_FORBIDDEN", message: "no", correlationId: "b1", retryable: false, blocking: true },
    });
    expect(env?.code).toBe("AUTH_ROLE_FORBIDDEN");
  });

  it("returns null for non-objects", () => {
    expect(extractStructuredError("x")).toBeNull();
    expect(extractStructuredError(null)).toBeNull();
    expect(extractStructuredError(undefined)).toBeNull();
  });

  it("maps plain { code, message } without status to default 400", () => {
    const env = extractStructuredError({ code: "VALIDATION_FAILED", message: "fail", correlationId: "c2", retryable: true, blocking: false });
    expect(env?.code).toBe("VALIDATION_FAILED");
    expect(env?.message).toBe("fail");
  });

  it("returns null when errors[] is empty (no merge)", () => {
    expect(
      extractStructuredError({
        status: 422,
        errors: [],
      }),
    ).toBeNull();
  });

  it("passes requestIdFromHeader through body+status shape", () => {
    const env = extractStructuredError(
      {
        status: 503,
        body: { code: "EXPORT_CHANNEL_UNAVAILABLE", message: "down" },
      },
      { requestIdFromHeader: "gw-req-99" },
    );
    expect(env?.correlationId).toBe("gw-req-99");
    expect(env?.code).toBe("EXPORT_CHANNEL_UNAVAILABLE");
  });
});
