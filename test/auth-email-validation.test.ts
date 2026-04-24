import { describe, expect, it } from "vitest";
import { authEmailInputSchema, loginRequestSchema } from "../src/validation/schemas.js";

describe("authEmailInputSchema", () => {
  it("accepts admin@localhost (Zod email rejects bare localhost domain)", () => {
    expect(authEmailInputSchema.parse("Admin@localhost")).toBe("admin@localhost");
  });

  it("accepts normal RFC-style addresses", () => {
    expect(authEmailInputSchema.parse(" User@Example.COM ")).toBe("user@example.com");
  });

  it("rejects obvious garbage", () => {
    expect(() => authEmailInputSchema.parse("not-an-email")).toThrow();
  });

  it("loginRequestSchema parses seed admin login", () => {
    const row = loginRequestSchema.parse({
      tenantId: "11111111-1111-4111-8111-111111111111",
      email: "admin@localhost",
      password: "dev-seed-admin-12",
    });
    expect(row.email).toBe("admin@localhost");
  });
});
