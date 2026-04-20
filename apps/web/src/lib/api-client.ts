import { ApiError } from "./api-error.js";

/** Vite: leere `VITE_API_BASE_URL=""` bleibt leer → relative URLs auf :5173. Default wie Backend-Port 3000. */
export const DEFAULT_API_BASE_URL = "http://localhost:3000";

export function resolveApiBaseUrl(baseUrl: string | undefined): string {
  const t = baseUrl?.trim();
  return t && t.length > 0 ? t : DEFAULT_API_BASE_URL;
}

function correlationFromResponse(res: Response): string | undefined {
  return res.headers.get("x-correlation-id") ?? res.headers.get("x-request-id") ?? undefined;
}

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  tenantId: string;
  userId: string;
  role: string;
};

export type LoginCredentials = { tenantId: string; email: string; password: string };

export async function loginWithPassword(baseUrl: string, credentials: LoginCredentials): Promise<LoginResponse> {
  const root = resolveApiBaseUrl(baseUrl).replace(/\/$/, "");
  const res = await fetch(`${root}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenantId: credentials.tenantId.trim(),
      email: credentials.email.trim(),
      password: credentials.password,
    }),
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = undefined;
  }
  if (!res.ok) {
    throw new ApiError(res.status, parsed ?? text, { requestIdFromHeader: correlationFromResponse(res) });
  }
  return parsed as LoginResponse;
}

export async function requestPasswordReset(
  baseUrl: string,
  body: { tenantId: string; email: string },
): Promise<{ ok: true; message: string }> {
  const root = resolveApiBaseUrl(baseUrl).replace(/\/$/, "");
  const res = await fetch(`${root}/auth/request-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId: body.tenantId.trim(), email: body.email.trim() }),
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = undefined;
  }
  if (!res.ok) {
    throw new ApiError(res.status, parsed ?? text, { requestIdFromHeader: correlationFromResponse(res) });
  }
  return parsed as { ok: true; message: string };
}

export async function confirmPasswordReset(
  baseUrl: string,
  body: { token: string; password: string },
): Promise<void> {
  const root = resolveApiBaseUrl(baseUrl).replace(/\/$/, "");
  const res = await fetch(`${root}/auth/confirm-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: body.token, password: body.password }),
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = undefined;
  }
  if (!res.ok) {
    throw new ApiError(res.status, parsed ?? text, { requestIdFromHeader: correlationFromResponse(res) });
  }
}

export type AllowedActionsResponse = {
  documentId: string;
  entityType: string;
  allowedActions: string[];
};

/** Antwort `GET /invoices/:invoiceId` (FIN-2 + 8.4 MVP). */
export type InvoiceOverview = {
  invoiceId: string;
  projectId: string;
  customerId: string;
  measurementId: string;
  lvVersionId: string;
  offerId: string;
  offerVersionId?: string;
  status: string;
  invoiceNumber?: string;
  issueDate?: string;
  lvNetCents?: number;
  vatRateBps?: number;
  vatCents?: number;
  totalGrossCents?: number;
  totalPaidCents?: number;
  paymentTermsVersionId?: string;
};

export type CreateInvoiceDraftResponse = {
  invoiceId: string;
  lvNetCents: number;
  vatRateBps: number;
  vatCents: number;
  totalGrossCents: number;
};

export type ApiClient = {
  requestJson<T>(method: string, path: string, body?: unknown): Promise<T>;
  getAllowedActions(documentId: string, entityType: string): Promise<AllowedActionsResponse>;
  getMeasurementVersion(measurementVersionId: string): Promise<unknown>;
  getSupplementVersion(supplementVersionId: string): Promise<unknown>;
  getPaymentTermsByProject(projectId: string): Promise<unknown>;
  createInvoiceDraft(body: {
    lvVersionId: string;
    offerVersionId: string;
    invoiceCurrencyCode: "EUR";
    paymentTermsVersionId?: string;
    reason: string;
  }): Promise<CreateInvoiceDraftResponse>;
  getInvoice(invoiceId: string): Promise<InvoiceOverview>;
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
        requestIdFromHeader: correlationFromResponse(res),
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
    getPaymentTermsByProject(projectId) {
      const q = new URLSearchParams({ projectId });
      return requestJson("GET", `/finance/payment-terms?${q}`);
    },
    createInvoiceDraft(body) {
      return requestJson<CreateInvoiceDraftResponse>("POST", "/invoices", body);
    },
    getInvoice(invoiceId) {
      return requestJson<InvoiceOverview>("GET", `/invoices/${encodeURIComponent(invoiceId)}`);
    },
  };
}
