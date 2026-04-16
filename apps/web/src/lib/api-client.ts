import { ApiError } from "./api-error.js";

export type AllowedActionsResponse = {
  documentId: string;
  entityType: string;
  allowedActions: string[];
};

export type ApiClient = {
  requestJson<T>(method: string, path: string, body?: unknown): Promise<T>;
  getAllowedActions(documentId: string, entityType: string): Promise<AllowedActionsResponse>;
  getMeasurementVersion(measurementVersionId: string): Promise<unknown>;
  getSupplementVersion(supplementVersionId: string): Promise<unknown>;
  /** FIN-0 Stub: GET /invoices/{invoiceId} (OpenAPI `finInvoiceGet`) — Lesepfad, tenant-isoliert. */
  getInvoice(invoiceId: string): Promise<unknown>;
};

export function createApiClient(options: {
  baseUrl: string;
  getToken: () => string | undefined;
  getTenantId: () => string | undefined;
}): ApiClient {
  const root = options.baseUrl.replace(/\/$/, "");

  async function requestJson<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = options.getToken();
    const tenant = options.getTenantId();
    if (!token?.trim() || !tenant?.trim()) {
      throw new Error("Sitzung unvollständig: Bearer-Token und X-Tenant-Id erforderlich.");
    }
    const res = await fetch(`${root}${path.startsWith("/") ? path : `/${path}`}`, {
      method,
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        "X-Tenant-Id": tenant.trim(),
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      parsed = undefined;
    }
    if (!res.ok) {
      throw new ApiError(res.status, parsed ?? text, {
        requestIdFromHeader: res.headers.get("x-request-id") ?? undefined,
      });
    }
    return parsed as T;
  }

  return {
    requestJson,
    getAllowedActions(documentId, entityType) {
      const q = new URLSearchParams({ entityType });
      return requestJson<AllowedActionsResponse>(
        "GET",
        `/documents/${encodeURIComponent(documentId)}/allowed-actions?${q}`,
      );
    },
    getMeasurementVersion(measurementVersionId) {
      return requestJson("GET", `/measurements/${encodeURIComponent(measurementVersionId)}`);
    },
    getSupplementVersion(supplementVersionId) {
      return requestJson("GET", `/supplements/${encodeURIComponent(supplementVersionId)}`);
    },
    getInvoice(invoiceId) {
      return requestJson("GET", `/invoices/${encodeURIComponent(invoiceId)}`);
    },
  };
}
