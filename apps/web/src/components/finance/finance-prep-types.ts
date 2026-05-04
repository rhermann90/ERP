import type { ApiError } from "../../lib/api-error.js";

/** Optional `sourceStep` ordnet die Meldung einem Finanz-Vorbereitungs-Schritt zu (Panel `step={n}`). */
export type FinNotice =
  | { kind: "api"; error: ApiError; sourceStep?: number }
  | { kind: "text"; text: string; sourceStep?: number };
