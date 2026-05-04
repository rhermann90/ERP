/**
 * Backend-Fehler-Envelope (`docs/api-contract.yaml`, `docs/contracts/error-codes.json`,
 * `docs/contracts/decision-log-phase1-frontend.md`):
 * — Konform: Passthrough von `correlationId`, `retryable`, `blocking` aus dem JSON-Body.
 * — Fallback (nur bei fehlenden/nicht-konformen Feldern): `x-request-id` / Client-UUID,
 *   `retryable`/`blocking` aus der Code-Tabelle in `error-codes.json` (vgl. `frontendNormalizedEnvelope`).
 */
import errorCodes from "../../../../docs/contracts/error-codes.json";

export type ApiErrorEnvelope = {
  code: string;
  message: string;
  correlationId: string;
  retryable: boolean;
  blocking: boolean;
  details?: unknown;
};

export type ApiErrorInitOptions = {
  /** `response.headers.get("x-request-id")` — nur für Fallback, wenn Body kein `correlationId` liefert */
  requestIdFromHeader?: string | undefined;
};

type FlagRow = { retryable: boolean; blocking: boolean };

/** Wartung neuer Codes: `docs/contracts/error-codes.json` zuerst; siehe `apps/web/README.md` (MVP Finanz). */
function buildCodeTable(): Record<string, FlagRow> {
  const out: Record<string, FlagRow> = {};
  for (const cls of errorCodes.classes) {
    for (const row of cls.codes) {
      out[row.code] = { retryable: row.retryable, blocking: row.blocking };
    }
  }
  /** Backend `retryableDerivation` (nicht als eigene Zeilen in `classes` geführt) */
  out.AUTH_SESSION_EXPIRED = { retryable: true, blocking: false };
  out.EXPORT_CHANNEL_UNAVAILABLE = { retryable: true, blocking: false };
  return out;
}

const CODE_TABLE = buildCodeTable();

export class ApiError extends Error {
  readonly status: number;
  readonly envelope: ApiErrorEnvelope;

  constructor(status: number, raw: unknown, init?: ApiErrorInitOptions) {
    const env = normalizeEnvelope(raw, status, init);
    super(env.message);
    this.name = "ApiError";
    this.status = status;
    this.envelope = env;
  }
}

function newCorrelationId(requestIdFromHeader: string | undefined): string {
  const h = requestIdFromHeader?.trim();
  if (h) return h;
  return crypto.randomUUID();
}

function resolveRetryableBlocking(code: string, o: Record<string, unknown>): { retryable: boolean; blocking: boolean } {
  const tr = typeof o.retryable === "boolean";
  const tb = typeof o.blocking === "boolean";
  if (tr && tb) {
    return { retryable: o.retryable as boolean, blocking: o.blocking as boolean };
  }
  const row = CODE_TABLE[code];
  if (tr) {
    const retryable = o.retryable as boolean;
    const blocking = tb ? (o.blocking as boolean) : row ? row.blocking : !retryable;
    return { retryable, blocking };
  }
  if (tb) {
    const blocking = o.blocking as boolean;
    const retryable = row ? row.retryable : !blocking;
    return { retryable, blocking };
  }
  if (row) return { retryable: row.retryable, blocking: row.blocking };
  if (code === "VALIDATION_FAILED") return { retryable: true, blocking: false };
  return { retryable: false, blocking: true };
}

function normalizeEnvelope(raw: unknown, status: number, init?: ApiErrorInitOptions): ApiErrorEnvelope {
  const headerId = init?.requestIdFromHeader;

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      code: `HTTP_${status}`,
      message: typeof raw === "string" ? raw : "Unbekannter Fehler",
      correlationId: newCorrelationId(headerId),
      retryable: false,
      blocking: true,
    };
  }

  const o = raw as Record<string, unknown>;
  const code = typeof o.code === "string" ? o.code : `HTTP_${status}`;
  const message = typeof o.message === "string" ? o.message : JSON.stringify(raw);
  const details = o.details;

  const bodyCid = typeof o.correlationId === "string" ? o.correlationId.trim() : "";
  const correlationId = bodyCid !== "" ? bodyCid : newCorrelationId(headerId);

  const { retryable, blocking } = resolveRetryableBlocking(code, o);

  return { code, message, correlationId, retryable, blocking, details };
}

/**
 * Extrahiert ein API-Envelope aus `unknown` (z. B. Catch-Block), ohne `ApiError` zu werfen.
 */
export function extractStructuredError(raw: unknown, init?: ApiErrorInitOptions): ApiErrorEnvelope | null {
  if (raw instanceof ApiError) {
    return raw.envelope;
  }
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.status === "number" && "body" in r) {
    return normalizeEnvelope(r.body, r.status as number, init);
  }
  const nested = r.errors;
  if (Array.isArray(nested) && nested.length > 0 && nested[0] && typeof nested[0] === "object") {
    const first = nested[0] as Record<string, unknown>;
    const merged = { ...r, ...first };
    const st = typeof r.status === "number" ? (r.status as number) : 400;
    return normalizeEnvelope(merged, st, init);
  }
  if (typeof r.code === "string" && typeof r.message === "string") {
    const st = typeof r.status === "number" ? (r.status as number) : 400;
    return normalizeEnvelope(raw, st, init);
  }
  return null;
}
