import { ApiError } from "./api-error.js";
import { warnIfResponseContractVersionMismatch } from "./fin4-openapi-contract-header.js";
import type {
  DunningReminderBatchEmailResponse,
  DunningReminderCandidatesReadResponse,
  DunningReminderRunResponse,
  OpenReceivablesReadResponse,
} from "./finance-dunning-api-types.js";

/** Unset oder nur Whitespace → Backend-Default Port 3000 (kein relativer Aufruf auf den Vite-Dev-Server). */
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

/** Antwort `GET /offer-versions/:offerVersionId`. */
export type OfferVersionDetail = {
  id: string;
  tenantId: string;
  offerId: string;
  versionNumber: number;
  status: string;
  lvVersionId: string;
  systemText: string;
  editingText: string;
  createdAt: string;
  createdBy: string;
  releasedAt?: string;
};

/** Antwort `GET /supplements/:supplementVersionId` (Lesepfad, Basis-Angebotsversion für Traceability). */
export type SupplementVersionRead = {
  id: string;
  tenantId: string;
  status: string;
  baseOfferVersionId: string;
  supplementOfferId: string;
};

/** Antwort `GET /lv/versions/:lvVersionId` (Phase 2 LV Lesepfad, Systembeschreibung Abschnitt 9). */
export type LvVersionSnapshot = {
  catalog: {
    id: string;
    name: string;
    projectId?: string;
    currentVersionId: string;
    isCurrentVersion: boolean;
  } | null;
  version: {
    id: string;
    tenantId: string;
    lvCatalogId: string;
    versionNumber: number;
    status: string;
    headerSystemText: string;
    headerEditingText: string;
    createdAt: string;
    createdBy: string;
  };
  structureNodes: Array<{
    id: string;
    tenantId: string;
    lvVersionId: string;
    parentNodeId: string | null;
    kind: string;
    sortOrdinal: string;
    systemText: string;
    editingText: string;
  }>;
  positions: Array<{
    id: string;
    tenantId: string;
    lvVersionId: string;
    parentNodeId: string;
    sortOrdinal: string;
    quantity: number;
    unit: string;
    unitPriceCents: number;
    kind: string;
    systemText: string;
    editingText: string;
    stammPositionsRef?: string;
  }>;
};


/** Antwort `GET /measurements/:measurementVersionId` (Aufmassversion inkl. Positionen und Traceability-Kopf). */
export type MeasurementVersionDetail = {
  measurementId: string;
  projectId: string;
  customerId: string;
  lvVersionId: string;
  /** ISO-8601 — Erstellung des Aufmass-Aggregats */
  measurementCreatedAt: string;
  version: {
    id: string;
    tenantId: string;
    measurementId: string;
    versionNumber: number;
    status: string;
    createdAt: string;
    createdBy: string;
  };
  positions: Array<{
    id: string;
    tenantId: string;
    measurementVersionId: string;
    lvPositionId: string;
    quantity: number;
    unit: string;
    note?: string;
  }>;
};

/** Antwort `GET /projects/:projectId/measurements` (Pilot-Liste Messungen je Projekt). */
export type MeasurementListItem = {
  measurementId: string;
  projectId: string;
  customerId: string;
  lvVersionId: string;
  currentMeasurementVersionId: string;
  createdAt: string;
  currentVersion: {
    id: string;
    versionNumber: number;
    status: string;
    createdAt: string;
  };
};

export type MeasurementListResponse = {
  data: MeasurementListItem[];
};

/** Antwort `GET /projects/:projectId/offers` (Pilot-Liste Angebote je Projekt). */
export type OfferListItem = {
  offerId: string;
  projectId: string;
  customerId: string;
  currentOfferVersionId: string;
  createdAt: string;
  currentVersion: {
    id: string;
    versionNumber: number;
    status: string;
    lvVersionId: string;
    createdAt: string;
  };
};

export type OfferListResponse = {
  data: OfferListItem[];
};

/** Antwort `GET /projects/:projectId/supplements` (Pilot-Liste Nachträge je Projekt). */
export type SupplementListItem = {
  supplementOfferId: string;
  offerId: string;
  projectId: string;
  baseOfferVersionId: string;
  currentSupplementVersionId: string;
  createdAt: string;
  currentVersion: {
    id: string;
    versionNumber: number;
    status: string;
    lvVersionId: string;
    createdAt: string;
  };
};

export type SupplementListResponse = {
  data: SupplementListItem[];
};

/** Antwort `GET /lv/versions/:lvVersionId/structure` (§9-Projektion ohne Katalog/Versionskopf). */
export type LvHierarchySnapshot = {
  lvVersionId: string;
  structureNodes: LvVersionSnapshot["structureNodes"];
  positions: LvVersionSnapshot["positions"];
};

/** FIN-5 §8.16 — effektives Regime auf der Rechnung (Server-Snapshot). */
export type InvoiceTaxRegimeApi =
  | "STANDARD_VAT_19"
  | "REVERSE_CHARGE"
  | "SMALL_BUSINESS_19"
  | "CONSTRUCTION_13B";

/** §8.6 Slice 2b — Rechnungsart (Server persistiert, Default REGULAR). */
export type InvoiceBillingKindApi = "REGULAR" | "SCHLUSSRECHNUNG" | "FOLGERECHNUNG" | "GUTSCHRIFT";

/** Antwortanteil `POST /invoices/:id/book` nach Ausgleich SETTLED bei früherer Schlussrechnung (§8.6 Slice 2b). */
export type SchlussrechnungMitigationResponse =
  | { applies: false }
  | {
      applies: true;
      settledDifferenceNetSumCents: number;
      suggestedNextBillingKind: "FOLGERECHNUNG" | "GUTSCHRIFT";
    };

/** Antwortanteil `POST /invoices/:id/book` — ADR-0024 automatischer Folge-ENTWURF (Plus). */
export type SchlussrechnungFollowUpDraftResponse = {
  created: boolean;
  invoiceId: string | null;
  billingKind: "FOLGERECHNUNG" | "GUTSCHRIFT" | null;
  skippedReason:
    | "MITIGATION_NOT_APPLICABLE"
    | "GUTSCHRIFT_REQUIRES_MANUAL_DRAFT"
    | "FOLLOW_UP_DRAFT_ALREADY_EXISTS"
    | null;
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
  /** 8.4(2) B2-1a: Skonto in Basispunkten (Server liefert 0 wenn nicht am Entwurf gesetzt). */
  skontoBps: number;
  /** §8.6 Slice 2b */
  billingKind: InvoiceBillingKindApi;
  /** FIN-5: persistierter / effektiver Steuerregime-Code (§8.16). */
  invoiceTaxRegime: InvoiceTaxRegimeApi;
  taxReasonCode?: string;
  /** §8.10 Pflicht-Hinweise bei Sonderregime; optional/leer bei Standard. */
  mandatoryTaxNoticeLines?: string[];
  /** DOM-8-6 Slice 2: diesem Beleg zugeordnete Differenzzeilen (Server; kein Client-Delta). */
  allocatedDifferenceBookings: DifferenceBookingReadRow[];
};

/** Antwort `GET /projects/:projectId/difference-bookings` (§5.4/§8.6 Lesepfad). */
export type DifferenceBookingReadRow = {
  id: string;
  projectId: string;
  measurementId: string;
  predecessorMeasurementVersionId: string | null;
  subsequentMeasurementVersionId: string | null;
  predecessorPaymentTermsVersionId: string | null;
  subsequentPaymentTermsVersionId: string | null;
  kind: string;
  amountNetCents: number;
  status: string;
  referenceInvoiceId?: string | null;
  allocatedInvoiceId?: string | null;
  allocatedAt?: string | null;
  settledAt?: string | null;
  createdAt: string;
  createdBy: string;
};

export type DifferenceBookingListResponse = {
  data: DifferenceBookingReadRow[];
};

/** Antwort `GET /projects/:projectId/difference-bookings/summary` (OPEN vs. Zuordnung zu Entwürfen). */
export type DifferenceBookingAllocatedDraftGroup = {
  draftInvoiceId: string;
  invoiceStatus: string;
  rows: DifferenceBookingReadRow[];
};

export type DifferenceBookingProjectSummaryResponse = {
  open: DifferenceBookingReadRow[];
  allocatedByDraft: DifferenceBookingAllocatedDraftGroup[];
};

export type CreateInvoiceDraftResponse = {
  invoiceId: string;
  lvNetCents: number;
  vatRateBps: number;
  vatCents: number;
  totalGrossCents: number;
  skontoBps: number;
  invoiceTaxRegime: InvoiceTaxRegimeApi;
  mandatoryTaxNoticeLines: string[];
  billingKind: InvoiceBillingKindApi;
};

/** Antwort `POST /invoices/:invoiceId/book` (FIN-2 + Slice 2b Mitigation + Slice 2c Follow-Up). */
export type BookInvoiceResponse = {
  invoiceId: string;
  status: string;
  invoiceNumber: string;
  issueDate: string;
  totalGrossCents: number;
  schlussrechnungMitigation: SchlussrechnungMitigationResponse;
  schlussrechnungFollowUpDraft: SchlussrechnungFollowUpDraftResponse;
};

/** Antwort `POST /offers` (Angebots-Stamm + erste Version ENTWURF). */
export type CreateOfferResponse = {
  offerId: string;
  offerVersionId: string;
};

/** Antwort `GET /tenant/pwa-display-settings` (Mandanten-Expertenmodus). */
export type TenantPwaDisplaySettingsRead = {
  settingsSource: "NOT_CONFIGURED" | "TENANT_DATABASE";
  tenantId: string;
  pwaExpertModeEnabled: boolean;
};

/** Antwort `GET /finance/invoice-tax-profile` (FIN-5). */
export type TenantInvoiceTaxProfileRead = {
  tenantId: string;
  defaultInvoiceTaxRegime: InvoiceTaxRegimeApi;
  construction13bConfig?: Record<string, unknown>;
};

/** Antwort `GET /finance/invoice-tax-profile/projects/:projectId`. */
export type ProjectInvoiceTaxOverrideRead = {
  projectId: string;
  invoiceTaxRegime: InvoiceTaxRegimeApi | null;
  taxReasonCode?: string;
  construction13bConfig?: Record<string, unknown>;
};

/** XRechnung UBL Party (Seller/Buyer), siehe OpenAPI `EInvoicePartySnapshot`. */
export type EInvoicePartySnapshot = {
  legalName: string;
  streetName: string;
  cityName: string;
  postalZone: string;
  countryCode: string;
  vatId?: string;
  companyId?: string;
  companyIdSchemeId?: string;
  email?: string;
};

/** Antwort `GET /finance/e-invoice-parties/tenant`. */
export type TenantEInvoicePartyReadResponse = {
  configured: boolean;
  party: EInvoicePartySnapshot | null;
};

/** Zeile in `GET /finance/e-invoice-parties/customers`. */
export type CustomerEInvoicePartyListRow = EInvoicePartySnapshot & { customerId: string };

/** Antwort `GET /finance/e-invoice-parties/customers`. */
export type CustomerEInvoicePartyListResponse = {
  customers: CustomerEInvoicePartyListRow[];
};

/** Antwort `GET /finance/e-invoice-parties/customers/:customerId`. */
export type CustomerEInvoicePartyReadResponse = {
  configured: boolean;
  customerId: string;
  party: EInvoicePartySnapshot | null;
};

/** Zeile in `GET /finance/payment-terms` (FIN-1, OpenAPI `PaymentTermsListResponse.versions`). */
export type PaymentTermsVersionRow = {
  paymentTermsVersionId: string;
  versionNumber: number;
  termsLabel: string;
  createdAt: string;
  createdBy: string;
};

/** Antwort `GET /finance/payment-terms?projectId=` (FIN-1). */
export type PaymentTermsListResponse = {
  paymentTermsHeadId: string;
  projectId: string;
  customerId: string;
  createdAt: string;
  createdBy: string;
  versions: PaymentTermsVersionRow[];
};

/** Antwort `POST /finance/payments/intake` (FIN-3). */
export type PaymentIntakeRecordResponse = {
  replay?: boolean;
  paymentIntakeId: string;
  invoiceId: string;
  amountCents: number;
  totalPaidCentsAfter: number;
  invoiceOpenCentsAfter: number;
  invoiceStatus: string;
};

/** Zeile `GET /invoices/:invoiceId/payment-intakes` (ohne Idempotency-Key). */
export type PaymentIntakeReadRow = {
  paymentIntakeId: string;
  amountCents: number;
  externalReference: string;
  createdAt: string;
};

/** Zeile `GET /invoices/:invoiceId/dunning-reminders` (FIN-4 Lesepfad, gebuchte Mahn-Ereignisse). */
export type DunningReminderReadRow = {
  dunningReminderId: string;
  stageOrdinal: number;
  note?: string;
  createdAt: string;
};

/** Antwort `POST /invoices/:invoiceId/dunning-reminders` (FIN-4 Schreibpfad). */
export type CreateDunningReminderResponse = {
  dunningReminderId: string;
  stageOrdinal: number;
  createdAt: string;
};

/** Zeile in `GET /finance/dunning-reminder-config` (FIN-4 Slice 3, MVP-Defaults). */
export type DunningStageConfigReadRow = {
  stageOrdinal: number;
  daysAfterDue: number;
  feeCents: number;
  label: string;
};

/** Antwort `GET /finance/dunning-reminder-config` (MVP-Fallback oder Mandanten-DB). */
export type DunningReminderConfigReadResponse = {
  data: {
    configSource: "MVP_STATIC_DEFAULTS" | "TENANT_DATABASE";
    tenantId: string;
    stages: DunningStageConfigReadRow[];
  };
};

/** Kanal-Zeile in `GET /finance/dunning-reminder-templates` (M4 Slice 1). */
export type DunningTemplateChannelRow = {
  channel: "EMAIL" | "PRINT";
  templateType: "REMINDER" | "DEMAND_NOTE" | "DUNNING";
  body: string;
};

export type DunningStageTemplatesReadRow = {
  stageOrdinal: number;
  channels: DunningTemplateChannelRow[];
};

/** Antwort `GET /finance/dunning-reminder-templates` (MVP oder Mandanten-DB). */
export type DunningReminderTemplatesReadResponse = {
  data: {
    templateSource: "MVP_STATIC_DEFAULTS" | "TENANT_DATABASE";
    tenantId: string;
    stages: DunningStageTemplatesReadRow[];
  };
};

/** Antwort `POST …/dunning-reminders/email-preview` (M4 Slice 4). */
export type DunningReminderEmailPreviewResponse = {
  data: {
    stageOrdinal: number;
    templateBodyRaw: string;
    templateBodyWithPlaceholders: string;
    footerPlainText: string;
    fullPlainText: string;
    readyForEmailFooter: boolean;
    missingMandatoryFields: string[];
    impressumComplianceTier: string;
    impressumGaps: string[];
    warnings: string[];
  };
};

/** Antwort `POST …/dunning-reminders/send-email-stub` (M4 Slice 4, kein SMTP). */
export type DunningReminderEmailSendStubResponse = {
  data: {
    outcome: "NOT_SENT_NO_SMTP";
    stageOrdinal: number;
    auditEventId: string;
    message: string;
  };
};

/** Antwort `POST …/dunning-reminders/send-email` (M4 Slice 5a, SMTP + Idempotency-Key). */
export type DunningReminderEmailSendResponse = {
  data: {
    outcome: "SENT" | "REPLAY";
    stageOrdinal: number;
    auditEventId: string;
    smtpMessageId?: string;
    recipientEmail: string;
    message: string;
  };
};

/** Antwort `GET|PATCH /finance/dunning-email-footer` (M4 Slice 3). */
/** `GET|PATCH /finance/dunning-reminder-automation` */
export type DunningTenantAutomationReadResponse = {
  data: {
    automationSource: "NOT_CONFIGURED" | "TENANT_DATABASE";
    tenantId: string;
    runMode: "OFF" | "SEMI";
    jobHourUtc: number | null;
    ianaTimezone: string;
    federalStateCode: string | null;
    paymentTermDayKind: "CALENDAR" | "BUSINESS";
    preferredDunningChannel: "EMAIL" | "PRINT";
  };
};

export type DunningEmailFooterReadResponse = {
  data: {
    footerSource: "NOT_CONFIGURED" | "TENANT_DATABASE";
    tenantId: string;
    companyLegalName: string;
    streetLine: string;
    postalCode: string;
    city: string;
    countryCode: string;
    publicEmail: string;
    publicPhone: string;
    legalRepresentative: string;
    registerCourt: string;
    registerNumber: string;
    vatId: string;
    signatureLine: string;
    readyForEmailFooter: boolean;
    missingMandatoryFields: string[];
    /** Heuristik — nicht gleichbedeutend mit rechtlicher Vollständigkeit des Impressums. */
    impressumComplianceTier: "MINIMAL" | "EXTENDED";
    /** Stabile Codes, z. B. REGISTER_PAIR_INCOMPLETE; siehe API-Beschreibung. */
    impressumGaps: string[];
  };
};

/** DSGVO-minimierte Zeile aus `GET /audit-events`. */
export type AuditEventRow = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  /** ISO-8601 vom Server (JSON-serialisiertes Datum). */
  timestamp: string;
  actorUserId: string;
};

export type AuditEventsListResponse = {
  data: AuditEventRow[];
  page: number;
  pageSize: number;
  total: number;
};

export type TenantUserRole =
  | "ADMIN"
  | "BUCHHALTUNG"
  | "GESCHAEFTSFUEHRUNG"
  | "VERTRIEB_BAULEITUNG"
  | "VIEWER";

/** Eintrag `GET /users` (paginiert). */
export type TenantUserRow = {
  id: string;
  email: string;
  role: TenantUserRole;
  active: boolean;
  createdAt: string;
};

export type TenantUserListResponse = {
  data: TenantUserRow[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateTenantUserRequest = {
  email: string;
  password: string;
  role: TenantUserRole;
  reason: string;
};

export type PatchTenantUserRequest = {
  reason: string;
  role?: TenantUserRole;
  active?: boolean;
  password?: string;
  email?: string;
};


export type CrmConstructionSiteRow = {
  tenantId: string;
  id: string;
  label: string;
  versionNumber: number;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  createdAt: string;
  createdBy: string;
};

export type CrmProjectRow = {
  tenantId: string;
  id: string;
  primaryCustomerId: string;
  constructionSiteId: string;
  status: string;
  versionNumber: number;
  label: string | null;
  createdAt: string;
  createdBy: string;
};

export type CrmProjectContactRow = {
  tenantId: string;
  id: string;
  projectId: string;
  customerId: string | null;
  role: string;
  displayName: string;
  versionNumber: number;
  email: string | null;
  phone: string | null;
  createdAt: string;
  createdBy: string;
};

export type CrmCustomerRow = {
  tenantId: string;
  id: string;
  legalName: string;
  versionNumber: number;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  createdAt: string;
  createdBy: string;
};

export type ApiClient = {
  requestJson<T>(method: string, path: string, body?: unknown): Promise<T>;
  getAllowedActions(documentId: string, entityType: string): Promise<AllowedActionsResponse>;
  getOfferVersion(offerVersionId: string): Promise<OfferVersionDetail>;
  getLvVersionSnapshot(lvVersionId: string): Promise<LvVersionSnapshot>;
  getLvVersionStructure(lvVersionId: string): Promise<LvHierarchySnapshot>;
  getMeasurementVersion(measurementVersionId: string): Promise<MeasurementVersionDetail>;
  listProjectMeasurements(projectId: string): Promise<MeasurementListResponse>;
  listProjectOffers(projectId: string): Promise<OfferListResponse>;
  listProjectSupplements(projectId: string): Promise<SupplementListResponse>;
  getSupplementVersion(supplementVersionId: string): Promise<SupplementVersionRead>;
  getPaymentTermsByProject(projectId: string): Promise<PaymentTermsListResponse>;
  createInvoiceDraft(body: {
    lvVersionId: string;
    offerVersionId: string;
    invoiceCurrencyCode: "EUR";
    measurementId?: string;
    paymentTermsVersionId?: string;
    skontoBps?: number;
    billingKind?: InvoiceBillingKindApi;
    mitigationFollowUpSourceInvoiceId?: string;
    reason: string;
  }): Promise<CreateInvoiceDraftResponse>;
  createOffer(body: {
    projectId: string;
    customerId: string;
    lvVersionId: string;
    systemText: string;
    editingText: string;
    reason: string;
  }): Promise<CreateOfferResponse>;
  getInvoice(invoiceId: string): Promise<InvoiceOverview>;
  bookInvoice(invoiceId: string, body: { reason: string; issueDate?: string }): Promise<BookInvoiceResponse>;
  allocateDifferenceBookingsToInvoiceDraft(
    invoiceId: string,
    body: { differenceBookingIds: string[]; reason: string },
  ): Promise<void>;
  deallocateDifferenceBookingsFromInvoiceDraft(
    invoiceId: string,
    body: { differenceBookingIds: string[]; reason: string },
  ): Promise<void>;
  listProjectDifferenceBookings(projectId: string): Promise<DifferenceBookingListResponse>;
  getProjectDifferenceBookingsSummary(projectId: string): Promise<DifferenceBookingProjectSummaryResponse>;
  listInvoiceDifferenceBookingsByReference(invoiceId: string): Promise<DifferenceBookingListResponse>;
  createPaymentTermsDifferenceBooking(
    projectId: string,
    body: {
      measurementId: string;
      referenceInvoiceId: string;
      predecessorPaymentTermsVersionId: string;
      subsequentPaymentTermsVersionId: string;
      amountNetCents: number;
      reason: string;
    },
  ): Promise<void>;
  listInvoicePaymentIntakes(invoiceId: string): Promise<{ data: PaymentIntakeReadRow[] }>;
  listInvoiceDunningReminders(invoiceId: string): Promise<{ data: DunningReminderReadRow[] }>;
  getDunningReminderConfig(): Promise<DunningReminderConfigReadResponse>;
  getDunningReminderTemplates(): Promise<DunningReminderTemplatesReadResponse>;
  getDunningEmailFooter(): Promise<DunningEmailFooterReadResponse>;
  patchDunningEmailFooter(body: Record<string, unknown> & { reason: string }): Promise<DunningEmailFooterReadResponse>;
  patchDunningReminderTemplateBody(
    stageOrdinal: number,
    channel: "EMAIL" | "PRINT",
    body: { body: string; reason: string },
  ): Promise<DunningReminderTemplatesReadResponse>;
  replaceDunningReminderConfig(body: {
    stages: DunningStageConfigReadRow[];
    reason: string;
  }): Promise<DunningReminderConfigReadResponse>;
  patchDunningReminderStage(
    stageOrdinal: number,
    body: { daysAfterDue?: number; feeCents?: number; label?: string; reason: string },
  ): Promise<DunningReminderConfigReadResponse>;
  deleteDunningReminderStage(stageOrdinal: number, body: { reason: string }): Promise<DunningReminderConfigReadResponse>;
  recordPaymentIntake(
    body: { invoiceId: string; amountCents: number; externalReference: string; reason: string },
    idempotencyKey: string,
  ): Promise<PaymentIntakeRecordResponse>;
  createInvoiceDunningReminder(
    invoiceId: string,
    body: { stageOrdinal: number; note?: string; reason: string },
  ): Promise<CreateDunningReminderResponse>;
  previewDunningReminderEmail(
    invoiceId: string,
    body: { stageOrdinal: number; reason: string },
  ): Promise<DunningReminderEmailPreviewResponse>;
  sendDunningReminderEmailStub(
    invoiceId: string,
    body: { stageOrdinal: number; reason: string },
  ): Promise<DunningReminderEmailSendStubResponse>;
  sendDunningReminderEmail(
    invoiceId: string,
    idempotencyKey: string,
    body: { stageOrdinal: number; reason: string; toEmail: string },
  ): Promise<DunningReminderEmailSendResponse>;
  getDunningReminderAutomation(): Promise<DunningTenantAutomationReadResponse>;
  patchDunningReminderAutomation(body: {
    reason: string;
    runMode: "OFF" | "SEMI";
    ianaTimezone?: string;
    federalStateCode?: string | null;
    paymentTermDayKind?: "CALENDAR" | "BUSINESS";
    preferredDunningChannel?: "EMAIL" | "PRINT";
  }): Promise<DunningTenantAutomationReadResponse>;
  getDunningReminderCandidates(params: { stageOrdinal: number; asOfDate?: string }): Promise<DunningReminderCandidatesReadResponse>;
  getOpenReceivables(params?: { projectId?: string; customerId?: string }): Promise<OpenReceivablesReadResponse>;
  postDunningReminderRunDryRun(body: {
    stageOrdinal: number;
    reason: string;
    asOfDate?: string;
    invoiceIds?: string[];
    note?: string;
  }): Promise<DunningReminderRunResponse>;
  postDunningReminderRunExecute(
    body: {
      stageOrdinal: number;
      reason: string;
      asOfDate?: string;
      invoiceIds?: string[];
      note?: string;
    },
    idempotencyKey: string,
  ): Promise<DunningReminderRunResponse>;
  postDunningReminderBatchSendEmails(body: {
    stageOrdinal: number;
    reason: string;
    mode: "DRY_RUN" | "EXECUTE";
    asOfDate?: string;
    confirmBatchSend?: true;
    items: Array<{ invoiceId: string; toEmail: string; idempotencyKey?: string }>;
  }): Promise<DunningReminderBatchEmailResponse>;
  getTenantPwaDisplaySettings(): Promise<{ data: TenantPwaDisplaySettingsRead }>;
  patchTenantPwaDisplaySettings(body: {
    pwaExpertModeEnabled: boolean;
    reason: string;
  }): Promise<{ data: TenantPwaDisplaySettingsRead }>;
  getTenantInvoiceTaxProfile(): Promise<TenantInvoiceTaxProfileRead>;
  patchTenantInvoiceTaxProfile(body: {
    defaultInvoiceTaxRegime: InvoiceTaxRegimeApi;
    construction13bConfig?: Record<string, unknown>;
    reason: string;
  }): Promise<{ tenantId: string; defaultInvoiceTaxRegime: InvoiceTaxRegimeApi }>;
  getProjectInvoiceTaxOverride(projectId: string): Promise<ProjectInvoiceTaxOverrideRead>;
  putProjectInvoiceTaxOverride(
    projectId: string,
    body: {
      invoiceTaxRegime: InvoiceTaxRegimeApi;
      taxReasonCode?: string;
      construction13bConfig?: Record<string, unknown>;
      reason: string;
    },
  ): Promise<{ projectId: string; invoiceTaxRegime: InvoiceTaxRegimeApi }>;
  deleteProjectInvoiceTaxOverride(projectId: string, body: { reason: string }): Promise<void>;
  getTenantEInvoiceParty(): Promise<TenantEInvoicePartyReadResponse>;
  listCustomerEInvoiceParties(): Promise<CustomerEInvoicePartyListResponse>;
  getCustomerEInvoiceParty(customerId: string): Promise<CustomerEInvoicePartyReadResponse>;
  listCrmConstructionSites(): Promise<{ data: CrmConstructionSiteRow[] }>;
  getCrmConstructionSite(id: string): Promise<CrmConstructionSiteRow>;
  postCrmConstructionSite(body: {
    label: string;
    reason: string;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    countryCode?: string | null;
  }): Promise<CrmConstructionSiteRow>;
  patchCrmConstructionSite(
    id: string,
    body: {
      reason: string;
      versionNumber: number;
      label?: string;
      street?: string | null;
      postalCode?: string | null;
      city?: string | null;
      countryCode?: string | null;
    },
  ): Promise<CrmConstructionSiteRow>;
  listCrmProjects(): Promise<{ data: CrmProjectRow[] }>;
  getCrmProject(projectId: string): Promise<CrmProjectRow>;
  postCrmProject(body: {
    id: string;
    primaryCustomerId: string;
    constructionSiteId: string;
    reason: string;
    status?: string;
    label?: string | null;
  }): Promise<CrmProjectRow>;
  listCrmProjectContacts(projectId: string): Promise<{ data: CrmProjectContactRow[] }>;
  getCrmProjectContact(id: string): Promise<CrmProjectContactRow>;
  postCrmProjectContact(body: {
    projectId: string;
    reason: string;
    customerId?: string | null;
    role: string;
    displayName: string;
    email?: string | null;
    phone?: string | null;
  }): Promise<CrmProjectContactRow>;
  patchCrmProjectContact(
    id: string,
    body: {
      reason: string;
      versionNumber: number;
      customerId?: string | null;
      role?: string;
      displayName?: string;
      email?: string | null;
      phone?: string | null;
    },
  ): Promise<CrmProjectContactRow>;
  listCrmCustomers(): Promise<{ data: CrmCustomerRow[] }>;
  getCrmCustomer(id: string): Promise<CrmCustomerRow>;
  postCrmCustomer(body: {
    legalName: string;
    reason: string;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    countryCode?: string | null;
  }): Promise<CrmCustomerRow>;
  patchCrmCustomer(
    id: string,
    body: {
      reason: string;
      versionNumber: number;
      legalName?: string;
      street?: string | null;
      postalCode?: string | null;
      city?: string | null;
      countryCode?: string | null;
    },
  ): Promise<CrmCustomerRow>;
  patchCrmProject(
    projectId: string,
    body: {
      reason: string;
      versionNumber: number;
      label?: string | null;
      primaryCustomerId?: string;
      constructionSiteId?: string;
      status?: string;
    },
  ): Promise<CrmProjectRow>;
  getAuditEvents(page?: number, pageSize?: number): Promise<AuditEventsListResponse>;
  listTenantUsers(params?: { page?: number; pageSize?: number }): Promise<TenantUserListResponse>;
  createTenantUser(body: CreateTenantUserRequest): Promise<TenantUserRow>;
  patchTenantUser(userId: string, body: PatchTenantUserRequest): Promise<TenantUserRow>;
};

export function createApiClient(options: {
  baseUrl: string;
  getToken: () => string | undefined;
  getTenantId: () => string | undefined;
}): ApiClient {
  const root = options.baseUrl.replace(/\/$/, "");

  function assertUuidKey(key: string, label: string): void {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
      throw new Error(`${label} muss UUID sein (OpenAPI / Backend).`);
    }
  }

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
    warnIfResponseContractVersionMismatch(path, res);
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
    getOfferVersion(offerVersionId) {
      return requestJson<OfferVersionDetail>(
        "GET",
        `/offer-versions/${encodeURIComponent(offerVersionId)}`,
      );
    },
    getLvVersionSnapshot(lvVersionId) {
      assertUuidKey(lvVersionId.trim(), "lvVersionId");
      return requestJson<LvVersionSnapshot>("GET", `/lv/versions/${encodeURIComponent(lvVersionId.trim())}`);
    },
    getLvVersionStructure(lvVersionId) {
      assertUuidKey(lvVersionId.trim(), "lvVersionId");
      return requestJson<LvHierarchySnapshot>(
        "GET",
        `/lv/versions/${encodeURIComponent(lvVersionId.trim())}/structure`,
      );
    },
    getMeasurementVersion(measurementVersionId) {
      return requestJson<MeasurementVersionDetail>(
        "GET",
        `/measurements/${encodeURIComponent(measurementVersionId)}`,
      );
    },
    getSupplementVersion(supplementVersionId) {
      assertUuidKey(supplementVersionId.trim(), "supplementVersionId");
      return requestJson<SupplementVersionRead>(
        "GET",
        `/supplements/${encodeURIComponent(supplementVersionId.trim())}`,
      );
    },
    getPaymentTermsByProject(projectId) {
      const q = new URLSearchParams({ projectId });
      return requestJson<PaymentTermsListResponse>("GET", `/finance/payment-terms?${q}`);
    },
    createInvoiceDraft(body) {
      return requestJson<CreateInvoiceDraftResponse>("POST", "/invoices", body);
    },
    createOffer(body) {
      return requestJson<CreateOfferResponse>("POST", "/offers", body);
    },
    getInvoice(invoiceId) {
      return requestJson<InvoiceOverview>("GET", `/invoices/${encodeURIComponent(invoiceId)}`).then(
        (inv): InvoiceOverview => ({
          ...inv,
          allocatedDifferenceBookings: Array.isArray(inv.allocatedDifferenceBookings)
            ? inv.allocatedDifferenceBookings
            : [],
        }),
      );
    },
    bookInvoice(invoiceId, body) {
      const id = invoiceId.trim();
      assertUuidKey(id, "invoiceId");
      return requestJson<BookInvoiceResponse>("POST", `/invoices/${encodeURIComponent(id)}/book`, body).then((r) => ({
        ...r,
        schlussrechnungFollowUpDraft:
          r.schlussrechnungFollowUpDraft ??
          ({
            created: false,
            invoiceId: null,
            billingKind: null,
            skippedReason: "MITIGATION_NOT_APPLICABLE",
          } satisfies SchlussrechnungFollowUpDraftResponse),
      }));
    },
    allocateDifferenceBookingsToInvoiceDraft(invoiceId, body) {
      const id = invoiceId.trim();
      assertUuidKey(id, "invoiceId");
      return requestJson<void>(
        "POST",
        `/invoices/${encodeURIComponent(id)}/difference-bookings/allocate`,
        body,
      );
    },
    deallocateDifferenceBookingsFromInvoiceDraft(invoiceId, body) {
      const id = invoiceId.trim();
      assertUuidKey(id, "invoiceId");
      return requestJson<void>(
        "POST",
        `/invoices/${encodeURIComponent(id)}/difference-bookings/deallocate`,
        body,
      );
    },
    listProjectMeasurements(projectId) {
      const id = projectId.trim();
      assertUuidKey(id, "projectId");
      return requestJson<MeasurementListResponse>(
        "GET",
        `/projects/${encodeURIComponent(id)}/measurements`,
      );
    },

    listProjectOffers(projectId) {
      const id = projectId.trim();
      assertUuidKey(id, "projectId");
      return requestJson<OfferListResponse>("GET", `/projects/${encodeURIComponent(id)}/offers`);
    },

    listProjectSupplements(projectId) {
      const id = projectId.trim();
      assertUuidKey(id, "projectId");
      return requestJson<SupplementListResponse>("GET", `/projects/${encodeURIComponent(id)}/supplements`);
    },

    listProjectDifferenceBookings(projectId) {
      const id = projectId.trim();
      assertUuidKey(id, "projectId");
      return requestJson<DifferenceBookingListResponse>(
        "GET",
        `/projects/${encodeURIComponent(id)}/difference-bookings`,
      );
    },
    getProjectDifferenceBookingsSummary(projectId) {
      const id = projectId.trim();
      assertUuidKey(id, "projectId");
      return requestJson<DifferenceBookingProjectSummaryResponse>(
        "GET",
        `/projects/${encodeURIComponent(id)}/difference-bookings/summary`,
      );
    },
    listInvoiceDifferenceBookingsByReference(invoiceId) {
      const id = invoiceId.trim();
      assertUuidKey(id, "invoiceId");
      return requestJson<DifferenceBookingListResponse>(
        "GET",
        `/invoices/${encodeURIComponent(id)}/difference-bookings`,
      );
    },
    async createPaymentTermsDifferenceBooking(projectId, body) {
      const id = projectId.trim();
      assertUuidKey(id, "projectId");
      await requestJson<unknown>(
        "POST",
        `/projects/${encodeURIComponent(id)}/difference-bookings/from-payment-terms`,
        body,
      );
    },
    listInvoicePaymentIntakes(invoiceId) {
      return requestJson<{ data: PaymentIntakeReadRow[] }>(
        "GET",
        `/invoices/${encodeURIComponent(invoiceId)}/payment-intakes`,
      );
    },
    listInvoiceDunningReminders(invoiceId) {
      return requestJson<{ data: DunningReminderReadRow[] }>(
        "GET",
        `/invoices/${encodeURIComponent(invoiceId)}/dunning-reminders`,
      );
    },
    getDunningReminderConfig() {
      return requestJson<DunningReminderConfigReadResponse>("GET", "/finance/dunning-reminder-config");
    },
    getDunningReminderTemplates() {
      return requestJson<DunningReminderTemplatesReadResponse>("GET", "/finance/dunning-reminder-templates");
    },
    getDunningEmailFooter() {
      return requestJson<DunningEmailFooterReadResponse>("GET", "/finance/dunning-email-footer");
    },
    patchDunningEmailFooter(body) {
      return requestJson<DunningEmailFooterReadResponse>("PATCH", "/finance/dunning-email-footer", body);
    },
    patchDunningReminderTemplateBody(stageOrdinal, channel, body) {
      return requestJson<DunningReminderTemplatesReadResponse>(
        "PATCH",
        `/finance/dunning-reminder-templates/stages/${encodeURIComponent(String(stageOrdinal))}/channels/${encodeURIComponent(channel)}`,
        body,
      );
    },
    replaceDunningReminderConfig(body) {
      return requestJson<DunningReminderConfigReadResponse>("PUT", "/finance/dunning-reminder-config", body);
    },
    patchDunningReminderStage(stageOrdinal, body) {
      return requestJson<DunningReminderConfigReadResponse>(
        "PATCH",
        `/finance/dunning-reminder-config/stages/${encodeURIComponent(String(stageOrdinal))}`,
        body,
      );
    },
    deleteDunningReminderStage(stageOrdinal, body) {
      return requestJson<DunningReminderConfigReadResponse>(
        "DELETE",
        `/finance/dunning-reminder-config/stages/${encodeURIComponent(String(stageOrdinal))}`,
        body,
      );
    },
    createInvoiceDunningReminder(invoiceId, body) {
      return requestJson<CreateDunningReminderResponse>(
        "POST",
        `/invoices/${encodeURIComponent(invoiceId)}/dunning-reminders`,
        body,
      );
    },
    previewDunningReminderEmail(invoiceId, body) {
      return requestJson<DunningReminderEmailPreviewResponse>(
        "POST",
        `/invoices/${encodeURIComponent(invoiceId)}/dunning-reminders/email-preview`,
        body,
      );
    },
    sendDunningReminderEmailStub(invoiceId, body) {
      return requestJson<DunningReminderEmailSendStubResponse>(
        "POST",
        `/invoices/${encodeURIComponent(invoiceId)}/dunning-reminders/send-email-stub`,
        body,
      );
    },
    getDunningReminderAutomation() {
      return requestJson<DunningTenantAutomationReadResponse>("GET", "/finance/dunning-reminder-automation");
    },
    patchDunningReminderAutomation(body) {
      return requestJson<DunningTenantAutomationReadResponse>("PATCH", "/finance/dunning-reminder-automation", body);
    },
    getDunningReminderCandidates(params) {
      const q = new URLSearchParams();
      q.set("stageOrdinal", String(params.stageOrdinal));
      if (params.asOfDate?.trim()) {
        q.set("asOfDate", params.asOfDate.trim());
      }
      return requestJson<DunningReminderCandidatesReadResponse>(
        "GET",
        `/finance/dunning-reminder-candidates?${q}`,
      );
    },
    getOpenReceivables(params) {
      const q = new URLSearchParams();
      const pid = params?.projectId?.trim();
      const cid = params?.customerId?.trim();
      if (pid) q.set("projectId", pid);
      if (cid) q.set("customerId", cid);
      const suffix = q.size > 0 ? `?${q}` : "";
      return requestJson<OpenReceivablesReadResponse>("GET", `/finance/open-receivables${suffix}`);
    },
    postDunningReminderRunDryRun(body) {
      return requestJson<DunningReminderRunResponse>("POST", "/finance/dunning-reminder-run", {
        ...body,
        mode: "DRY_RUN",
      });
    },
    async postDunningReminderRunExecute(body, idempotencyKey) {
      const token = options.getToken();
      const tenant = options.getTenantId();
      if (!token?.trim() || !tenant?.trim()) {
        throw new Error("Sitzung unvollständig: Bearer-Token und X-Tenant-Id erforderlich.");
      }
      const key = idempotencyKey.trim();
      assertUuidKey(key, "Idempotency-Key");
      const res = await fetch(`${root}/finance/dunning-reminder-run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          "X-Tenant-Id": tenant.trim(),
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify({ ...body, mode: "EXECUTE" }),
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
      warnIfResponseContractVersionMismatch("/finance/dunning-reminder-run", res);
      return parsed as DunningReminderRunResponse;
    },
    postDunningReminderBatchSendEmails(body) {
      return requestJson<DunningReminderBatchEmailResponse>("POST", "/finance/dunning-reminder-run/send-emails", body);
    },
    async sendDunningReminderEmail(invoiceId, idempotencyKey, body) {
      const token = options.getToken();
      const tenant = options.getTenantId();
      if (!token?.trim() || !tenant?.trim()) {
        throw new Error("Sitzung unvollständig: Bearer-Token und X-Tenant-Id erforderlich.");
      }
      const key = idempotencyKey.trim();
      assertUuidKey(key, "Idempotency-Key");
      const res = await fetch(
        `${root}/invoices/${encodeURIComponent(invoiceId)}/dunning-reminders/send-email`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            "X-Tenant-Id": tenant.trim(),
            "Content-Type": "application/json",
            "Idempotency-Key": key,
          },
          body: JSON.stringify(body),
        },
      );
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
      return parsed as DunningReminderEmailSendResponse;
    },
    async recordPaymentIntake(body, idempotencyKey) {
      const token = options.getToken();
      const tenant = options.getTenantId();
      if (!token?.trim() || !tenant?.trim()) {
        throw new Error("Sitzung unvollständig: Bearer-Token und X-Tenant-Id erforderlich.");
      }
      const key = idempotencyKey.trim();
      assertUuidKey(key, "Idempotency-Key");
      const res = await fetch(`${root}/finance/payments/intake`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          "X-Tenant-Id": tenant.trim(),
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify(body),
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
      return parsed as PaymentIntakeRecordResponse;
    },
    getTenantPwaDisplaySettings() {
      return requestJson<{ data: TenantPwaDisplaySettingsRead }>("GET", "/tenant/pwa-display-settings");
    },
    patchTenantPwaDisplaySettings(body) {
      return requestJson<{ data: TenantPwaDisplaySettingsRead }>("PATCH", "/tenant/pwa-display-settings", body);
    },
    getTenantInvoiceTaxProfile() {
      return requestJson<TenantInvoiceTaxProfileRead>("GET", "/finance/invoice-tax-profile");
    },
    patchTenantInvoiceTaxProfile(body) {
      return requestJson<{ tenantId: string; defaultInvoiceTaxRegime: InvoiceTaxRegimeApi }>(
        "PATCH",
        "/finance/invoice-tax-profile",
        body,
      );
    },
    getProjectInvoiceTaxOverride(projectId) {
      const id = projectId.trim();
      assertUuidKey(id, "projectId");
      return requestJson<ProjectInvoiceTaxOverrideRead>(
        "GET",
        `/finance/invoice-tax-profile/projects/${encodeURIComponent(id)}`,
      );
    },
    putProjectInvoiceTaxOverride(projectId, body) {
      const id = projectId.trim();
      assertUuidKey(id, "projectId");
      return requestJson<{ projectId: string; invoiceTaxRegime: InvoiceTaxRegimeApi }>(
        "PUT",
        `/finance/invoice-tax-profile/projects/${encodeURIComponent(id)}`,
        body,
      );
    },
    async deleteProjectInvoiceTaxOverride(projectId, body) {
      const id = projectId.trim();
      assertUuidKey(id, "projectId");
      await requestJson<void>(
        "DELETE",
        `/finance/invoice-tax-profile/projects/${encodeURIComponent(id)}`,
        body,
      );
    },
    getTenantEInvoiceParty() {
      return requestJson<TenantEInvoicePartyReadResponse>("GET", "/finance/e-invoice-parties/tenant");
    },
    listCustomerEInvoiceParties() {
      return requestJson<CustomerEInvoicePartyListResponse>("GET", "/finance/e-invoice-parties/customers");
    },
    getCustomerEInvoiceParty(customerId) {
      const id = customerId.trim();
      assertUuidKey(id, "customerId");
      return requestJson<CustomerEInvoicePartyReadResponse>(
        "GET",
        `/finance/e-invoice-parties/customers/${encodeURIComponent(id)}`,
      );
    },
    listCrmConstructionSites() {
      return requestJson<{ data: CrmConstructionSiteRow[] }>("GET", "/crm/construction-sites");
    },
    getCrmConstructionSite(constructionSiteId) {
      const id = constructionSiteId.trim();
      assertUuidKey(id, "constructionSiteId");
      return requestJson<CrmConstructionSiteRow>("GET", `/crm/construction-sites/${encodeURIComponent(id)}`);
    },
    postCrmConstructionSite(body) {
      return requestJson<CrmConstructionSiteRow>("POST", "/crm/construction-sites", body);
    },
    patchCrmConstructionSite(constructionSiteId, body) {
      const id = constructionSiteId.trim();
      assertUuidKey(id, "constructionSiteId");
      return requestJson<CrmConstructionSiteRow>("PATCH", `/crm/construction-sites/${encodeURIComponent(id)}`, body);
    },
    listCrmProjects() {
      return requestJson<{ data: CrmProjectRow[] }>("GET", "/crm/projects");
    },
    getCrmProject(projectId) {
      const id = projectId.trim();
      assertUuidKey(id, "projectId");
      return requestJson<CrmProjectRow>("GET", `/crm/projects/${encodeURIComponent(id)}`);
    },
    postCrmProject(body) {
      return requestJson<CrmProjectRow>("POST", "/crm/projects", body);
    },
    listCrmProjectContacts(projectId) {
      const id = projectId.trim();
      assertUuidKey(id, "projectId");
      return requestJson<{ data: CrmProjectContactRow[] }>(
        "GET",
        `/crm/projects/${encodeURIComponent(id)}/contacts`,
      );
    },
    getCrmProjectContact(contactId) {
      const id = contactId.trim();
      assertUuidKey(id, "contactId");
      return requestJson<CrmProjectContactRow>("GET", `/crm/project-contacts/${encodeURIComponent(id)}`);
    },
    postCrmProjectContact(body) {
      return requestJson<CrmProjectContactRow>("POST", "/crm/project-contacts", body);
    },
    patchCrmProjectContact(contactId, body) {
      const id = contactId.trim();
      assertUuidKey(id, "contactId");
      return requestJson<CrmProjectContactRow>("PATCH", `/crm/project-contacts/${encodeURIComponent(id)}`, body);
    },
    listCrmCustomers() {
      return requestJson<{ data: CrmCustomerRow[] }>("GET", "/crm/customers");
    },
    getCrmCustomer(customerId) {
      const id = customerId.trim();
      assertUuidKey(id, "customerId");
      return requestJson<CrmCustomerRow>("GET", `/crm/customers/${encodeURIComponent(id)}`);
    },
    postCrmCustomer(body) {
      return requestJson<CrmCustomerRow>("POST", "/crm/customers", body);
    },
    patchCrmCustomer(customerId, body) {
      const id = customerId.trim();
      assertUuidKey(id, "customerId");
      return requestJson<CrmCustomerRow>("PATCH", `/crm/customers/${encodeURIComponent(id)}`, body);
    },
    patchCrmProject(projectId, body) {
      const id = projectId.trim();
      assertUuidKey(id, "projectId");
      return requestJson<CrmProjectRow>("PATCH", `/crm/projects/${encodeURIComponent(id)}`, body);
    },
    getAuditEvents(page = 1, pageSize = 15) {
      const q = new URLSearchParams({
        page: String(Math.max(1, page)),
        pageSize: String(Math.min(100, Math.max(1, pageSize))),
      });
      return requestJson<AuditEventsListResponse>("GET", `/audit-events?${q}`);
    },
    listTenantUsers(params) {
      const q = new URLSearchParams();
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? 25;
      q.set("page", String(Math.max(1, page)));
      q.set("pageSize", String(Math.min(100, Math.max(1, pageSize))));
      return requestJson<TenantUserListResponse>("GET", `/users?${q}`);
    },
    createTenantUser(body) {
      return requestJson<TenantUserRow>("POST", "/users", body);
    },
    patchTenantUser(userId, body) {
      const id = userId.trim();
      assertUuidKey(id, "userId");
      return requestJson<TenantUserRow>("PATCH", `/users/${encodeURIComponent(id)}`, body);
    },
  };
}
