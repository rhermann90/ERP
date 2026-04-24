import type { ApiError } from "../../lib/api-error.js";

export type FinNotice = { kind: "api"; error: ApiError } | { kind: "text"; text: string };
