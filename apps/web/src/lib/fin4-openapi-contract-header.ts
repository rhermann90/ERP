/** Synchron zu Backend `src/http/pwa-http-layer.ts` und `docs/api-contract.yaml` `info.version`. */
export const ERP_OPENAPI_CONTRACT_VERSION_HEADER = "x-erp-openapi-contract-version";

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/** True für Pfade, auf denen das Backend den Contract-Version-Header setzt (FIN-4). */
export function isFin4OpenApiContractResponsePath(path: string): boolean {
  const p = normalizePath(path);
  if (p === "/finance/dunning-email-footer" || p.startsWith("/finance/dunning-email-footer?")) {
    return true;
  }
  if (p.startsWith("/finance/invoice-tax-profile")) {
    return true;
  }
  return p.startsWith("/finance/dunning-reminder");
}

export function readExpectedOpenApiInfoVersionFromEnv(): string | undefined {
  const raw = import.meta.env.VITE_EXPECTED_OPENAPI_CONTRACT_VERSION;
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Wenn `VITE_EXPECTED_OPENAPI_CONTRACT_VERSION` gesetzt ist und die Antwort vom Header abweicht
 * (oder der Header fehlt), nur `console.warn` — kein Throw (Produktiv-UI).
 */
export function warnIfResponseContractVersionMismatch(path: string, res: Response): void {
  if (!isFin4OpenApiContractResponsePath(path)) return;
  const expected = readExpectedOpenApiInfoVersionFromEnv();
  if (!expected) return;
  const actual = res.headers.get(ERP_OPENAPI_CONTRACT_VERSION_HEADER)?.trim();
  if (!actual) {
    console.warn(
      `[ERP] ${ERP_OPENAPI_CONTRACT_VERSION_HEADER} fehlt auf FIN-4-Antwort; gebundelte PWA erwartet ${expected}.`,
      { path },
    );
    return;
  }
  if (actual !== expected) {
    console.warn(
      `[ERP] OpenAPI-Contract-Version weicht ab: PWA-Build erwartet ${expected}, Server sendet ${actual} (${ERP_OPENAPI_CONTRACT_VERSION_HEADER}).`,
      { path },
    );
  }
}
