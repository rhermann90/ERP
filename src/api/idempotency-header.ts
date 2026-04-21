import { z } from "zod";

function headerValueInsensitive(
  headers: Record<string, string | string[] | undefined>,
  canonicalName: string,
): string | undefined {
  const want = canonicalName.toLowerCase();
  for (const [key, val] of Object.entries(headers)) {
    if (key.toLowerCase() === want) {
      return Array.isArray(val) ? val[0] : val;
    }
  }
  return undefined;
}

/** OpenAPI-Parameter `Idempotency-Key` (case-insensitive wie HTTP). */
export function parseIdempotencyKeyHeader(headers: Record<string, string | string[] | undefined>): string {
  const raw = headerValueInsensitive(headers, "Idempotency-Key");
  const trimmed = typeof raw === "string" ? raw.trim() : raw;
  return z.string().uuid().parse(trimmed);
}
