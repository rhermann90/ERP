import type { FastifyInstance } from "fastify";
import { ERP_OPENAPI_INFO_VERSION } from "../domain/openapi-contract-version.js";

/** Kommagetrennte Origins, z. B. `https://app.example.com,http://localhost:5173`. Leer = kein CORS (same-origin / Server-zu-Server). */
export function parseCorsOriginsFromEnv(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function normalizeCorsOrigins(origins: string[]): Set<string> {
  return new Set(origins);
}

const CORS_METHODS = "GET,HEAD,POST,PATCH,OPTIONS";
const CORS_HEADERS = "Authorization, Content-Type, X-Tenant-Id, X-Request-Id, X-Correlation-Id";

function setCorsHeaders(reply: { header: (k: string, v: string) => void }, origin: string): void {
  reply.header("Access-Control-Allow-Origin", origin);
  reply.header("Access-Control-Allow-Credentials", "true");
}

function setSecurityHeaders(reply: { header: (k: string, v: string) => void }): void {
  reply.header("X-Content-Type-Options", "nosniff");
  reply.header("X-Frame-Options", "DENY");
  reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
  reply.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  /** Reine JSON-API: kein Laden fremder Ressourcen; PWA bleibt eigene Origin. */
  reply.header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  if (process.env.ERP_ENABLE_HSTS === "1") {
    reply.header("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }
}

/**
 * CORS nur für konfigurierte Origins; Preflight OPTIONS tenant-neutral.
 * Security-Header auf allen Antworten (inkl. Fehler-Envelope).
 */
export function registerPwaHttpHooks(app: FastifyInstance, corsAllowlist: Set<string>): void {
  app.addHook("onRequest", async (request, reply) => {
    if (request.method !== "OPTIONS") return;
    if (corsAllowlist.size === 0) return;
    const origin = request.headers.origin;
    if (typeof origin === "string" && corsAllowlist.has(origin)) {
      setCorsHeaders(reply, origin);
      reply.header("Access-Control-Allow-Methods", CORS_METHODS);
      reply.header("Access-Control-Allow-Headers", CORS_HEADERS);
      reply.header("Access-Control-Max-Age", "86400");
    }
    return reply.status(204).send();
  });

  app.addHook("onSend", async (request, reply, payload) => {
    const id = request.id;
    reply.header("x-correlation-id", id);
    /** Gleiche ID wie `correlationId` im Error-Envelope; Fallback für Clients laut `error-codes.json` (`x-request-id`). */
    reply.header("x-request-id", id);
    const rawUrl = request.raw.url ?? "";
    const pathOnly = rawUrl.split("?")[0] ?? "";
    if (
      pathOnly.startsWith("/finance/dunning-reminder") ||
      pathOnly.startsWith("/finance/dunning-email-footer")
    ) {
      reply.header("x-erp-openapi-contract-version", ERP_OPENAPI_INFO_VERSION);
    }
    const origin = request.headers.origin;
    if (typeof origin === "string" && corsAllowlist.has(origin)) {
      setCorsHeaders(reply, origin);
      reply.header(
        "Access-Control-Expose-Headers",
        "x-correlation-id, x-request-id, x-erp-openapi-contract-version",
      );
    }
    setSecurityHeaders(reply);
    return payload;
  });
}

type FastifyLoggerOpts = false | {
  level: string;
  serializers: {
    req: (req: {
      method: string;
      url: string;
      headers: Record<string, unknown>;
    }) => { method: string; url: string; headers: Record<string, string | string[] | undefined> };
  };
};

function sanitizeHeaders(
  headers: Record<string, unknown>,
): Record<string, string | string[] | undefined> {
  const out: Record<string, string | string[] | undefined> = {};
  const drop = new Set(["authorization", "cookie", "set-cookie"]);
  for (const [k, v] of Object.entries(headers)) {
    if (drop.has(k.toLowerCase())) continue;
    if (typeof v === "string" || Array.isArray(v)) out[k] = v;
  }
  return out;
}

/** Keine Bearer-/Cookie-Werte in strukturierten Request-Logs. */
export function buildFastifyLoggerOptions(): FastifyLoggerOpts {
  return {
    level: process.env.LOG_LEVEL ?? "info",
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          headers: sanitizeHeaders(req.headers as Record<string, unknown>),
        };
      },
    },
  };
}
