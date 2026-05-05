import type { InvoiceTaxRegime } from "./invoice-tax-regime.js";
export type UUID = string;
export type TenantId = string;
export type UserId = string;
export type UserRole = "ADMIN" | "BUCHHALTUNG" | "GESCHAEFTSFUEHRUNG" | "VERTRIEB_BAULEITUNG" | "VIEWER";

export type OfferStatus =
  | "ENTWURF"
  | "IN_FREIGABE"
  | "FREIGEGEBEN"
  | "VERSENDET"
  | "ANGENOMMEN"
  | "ABGELEHNT"
  | "ARCHIVIERT";

export interface OfferVersion {
  id: UUID;
  tenantId: TenantId;
  offerId: UUID;
  versionNumber: number;
  status: OfferStatus;
  lvVersionId: UUID;
  systemText: string;
  editingText: string;
  createdAt: Date;
  createdBy: UserId;
  releasedAt?: Date;
}

export interface Offer {
  id: UUID;
  tenantId: TenantId;
  projectId: UUID;
  customerId: UUID;
  currentVersionId: UUID;
  createdAt: Date;
  createdBy: UserId;
}

export interface SupplementOffer {
  id: UUID;
  tenantId: TenantId;
  offerId: UUID;
  baseOfferVersionId: UUID;
  createdAt: Date;
  createdBy: UserId;
}

export interface SupplementVersion {
  id: UUID;
  tenantId: TenantId;
  supplementOfferId: UUID;
  versionNumber: number;
  status: SupplementStatus;
  lvVersionId: UUID;
  systemText: string;
  editingText: string;
  createdAt: Date;
  createdBy: UserId;
}

/** FIN-1 (8.5): ein Kopf pro Projekt, append-only Versionszeilen. */
export interface PaymentTermsHead {
  id: UUID;
  tenantId: TenantId;
  projectId: UUID;
  customerId: UUID;
  createdAt: Date;
  createdBy: UserId;
}

export interface PaymentTermsVersion {
  id: UUID;
  tenantId: TenantId;
  headId: UUID;
  versionNumber: number;
  termsLabel: string;
  createdAt: Date;
  createdBy: UserId;
}

export type SupplementStatus =
  | "ENTWURF"
  | "IN_FREIGABE"
  | "FREIGEGEBEN"
  | "VERSENDET"
  | "BEAUFTRAGT"
  | "ABGELEHNT"
  | "ARCHIVIERT";

/** §5.4 Aufmass */
export type MeasurementStatus = "ENTWURF" | "GEPRUEFT" | "FREIGEGEBEN" | "ABGERECHNET" | "ARCHIVIERT";

export interface Measurement {
  id: UUID;
  tenantId: TenantId;
  projectId: UUID;
  customerId: UUID;
  lvVersionId: UUID;
  currentVersionId: UUID;
  createdAt: Date;
  createdBy: UserId;
}

export interface MeasurementVersion {
  id: UUID;
  tenantId: TenantId;
  measurementId: UUID;
  versionNumber: number;
  status: MeasurementStatus;
  createdAt: Date;
  createdBy: UserId;
}

/** Aufmassposition: referenziert LV-Position und Mengenkontext (§5.4); ohne vollständiges LV-Modell (Increment 1). */
export interface MeasurementPosition {
  id: UUID;
  tenantId: TenantId;
  measurementVersionId: UUID;
  lvPositionId: UUID;
  quantity: number;
  unit: string;
  note?: string;
}

/** §9 LV — Kopf (Katalog) */
export interface LvCatalog {
  id: UUID;
  tenantId: TenantId;
  projectId?: UUID;
  name: string;
  currentVersionId: UUID;
  createdAt: Date;
  createdBy: UserId;
}

export type LvVersionStatus = "ENTWURF" | "FREIGEGEBEN" | "ARCHIVIERT";

export interface LvVersion {
  id: UUID;
  tenantId: TenantId;
  lvCatalogId: UUID;
  versionNumber: number;
  status: LvVersionStatus;
  /** Katalog-Kopf — Systemtext §9 (nach Anlage unveränderlich) */
  headerSystemText: string;
  headerEditingText: string;
  createdAt: Date;
  createdBy: UserId;
}

export type LvStructureKind = "BEREICH" | "TITEL" | "UNTERTITEL";

export interface LvStructureNode {
  id: UUID;
  tenantId: TenantId;
  lvVersionId: UUID;
  parentNodeId: UUID | null;
  kind: LvStructureKind;
  sortOrdinal: string;
  systemText: string;
  editingText: string;
}

export type LvPositionKind = "NORMAL" | "ALTERNATIV" | "EVENTUAL";

export interface LvPosition {
  id: UUID;
  tenantId: TenantId;
  lvVersionId: UUID;
  /** Elternknoten muss UNTERTITEL sein (§9) */
  parentNodeId: UUID;
  sortOrdinal: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
  kind: LvPositionKind;
  systemText: string;
  editingText: string;
  stammPositionsRef?: UUID;
}

export interface TraceabilityLink {
  tenantId: TenantId;
  invoiceId: UUID;
  measurementId: UUID;
  lvId: UUID;
  offerId: UUID;
  projectId: UUID;
  customerId: UUID;
  supplementOfferId?: UUID;
  supplementVersionId?: UUID;
}

export type InvoiceStatus =
  | "ENTWURF"
  | "GEPRUEFT"
  | "FREIGEGEBEN"
  | "GEBUCHT_VERSENDET"
  | "BEZAHLT"
  | "TEILBEZAHLT"
  | "STORNIERT";

export interface Invoice {
  id: UUID;
  tenantId: TenantId;
  projectId: UUID;
  customerId: UUID;
  measurementId: UUID;
  lvId: UUID;
  offerId: UUID;
  /** Snapshot der Angebotsversion bei Entwurf (FIN-2). */
  offerVersionId?: UUID;
  status: InvoiceStatus;
  immutableFromStatus: "GEBUCHT_VERSENDET";
  invoiceNumber?: string;
  issueDate?: string;
  /** 8.4(1) LV-Nettosumme (Cent), bei Entwurf mit Kalkulation gesetzt. */
  lvNetCents?: number;
  /** 8.4(7) USt-Anteil (Cent). */
  vatCents?: number;
  totalGrossCents?: number;
  supplementOfferId?: UUID;
  supplementVersionId?: UUID;
  /** FIN-1: gebundene Konditionsversion fuer neue Rechnungen. */
  paymentTermsVersionId?: UUID;
  /** 8.4(2) B2-1a: Skonto in Basispunkten (0–10_000), auf LV-Netto nach Schritt 1; Default 0. */
  skontoBps?: number;
  /** FIN-5 / 8.16: effektives Regime zum Zeitpunkt der Entwurfskalkulation (Snapshot). */
  invoiceTaxRegime?: InvoiceTaxRegime;
  /** Ausgewiesener USt-Satz in Basispunkten (0 bei Sonderregimen ohne ausgewiesene USt). */
  vatRateBpsEffective?: number;
  /** Optionaler Begründungscode (z. B. Projekt-Override). */
  taxReasonCode?: string;
}

/** FIN-5: Mandanten-Default für Rechnungs-Steuerregime. */
export interface TenantInvoiceTaxProfile {
  tenantId: TenantId;
  defaultInvoiceTaxRegime: InvoiceTaxRegime;
  construction13bConfig?: Record<string, unknown>;
}

/** FIN-5: Projekt-Override (schlägt Mandanten-Default). */
export interface ProjectInvoiceTaxOverride {
  tenantId: TenantId;
  projectId: UUID;
  invoiceTaxRegime: InvoiceTaxRegime;
  taxReasonCode?: string;
  construction13bConfig?: Record<string, unknown>;
}

/** FIN-3: gebuchter Zahlungseingang (Idempotenz über tenant + idempotency_key). */
export interface PaymentIntake {
  id: UUID;
  tenantId: TenantId;
  invoiceId: UUID;
  idempotencyKey: UUID;
  amountCents: number;
  externalReference: string;
  createdAt: Date;
}

/** FIN-4 Mahnwesen: protokolliertes Mahn-Ereignis je Rechnung (Konfiguration siehe ADR-0009). */
export interface DunningReminder {
  id: UUID;
  tenantId: TenantId;
  invoiceId: UUID;
  stageOrdinal: number;
  note?: string;
  createdAt: Date;
}

/** FIN-4 M4 Slice 5a: Idempotenz-Speicher fuer versendete Mahn-E-Mails. */
export interface DunningEmailSend {
  id: UUID;
  tenantId: TenantId;
  invoiceId: UUID;
  idempotencyKey: UUID;
  stageOrdinal: number;
  recipientEmail: string;
  auditEventId: UUID;
  smtpMessageId?: string;
  createdAt: Date;
}

export interface AuditEvent {
  id: UUID;
  tenantId: TenantId;
  entityType:
    | "OFFER_VERSION"
    | "SUPPLEMENT_VERSION"
    | "MEASUREMENT_VERSION"
    | "LV_VERSION"
    | "LV_STRUCTURE_NODE"
    | "LV_POSITION"
    | "EXPORT_RUN"
    | "INVOICE"
    | "PAYMENT_TERMS_VERSION"
    | "DUNNING_TENANT_STAGE_CONFIG"
    | "TENANT_INVOICE_TAX_PROFILE"
    | "PROJECT_INVOICE_TAX_OVERRIDE"
    | "USER";
  entityId: UUID;
  action:
    | "STATUS_CHANGED"
    | "VERSION_CREATED"
    | "POSITIONS_UPDATED"
    | "BUSINESS_TEXT_UPDATED"
    | "LV_NODE_CREATED"
    | "LV_POSITION_CREATED"
    | "EXPORT_STARTED"
    | "EXPORT_FAILED"
    | "EXPORT_SUCCEEDED"
    | "USER_CREATED"
    | "USER_UPDATED"
    | "DUNNING_STAGES_REPLACED"
    | "DUNNING_STAGE_PATCHED"
    | "DUNNING_STAGE_SOFT_DELETED"
    | "DUNNING_TEMPLATE_BODY_PATCHED"
    | "DUNNING_EMAIL_FOOTER_PATCHED"
    | "DUNNING_EMAIL_SEND_STUB"
    | "DUNNING_EMAIL_SENT"
    | "DUNNING_TENANT_AUTOMATION_PATCHED"
    | "TENANT_INVOICE_TAX_PROFILE_PATCHED"
    | "PROJECT_INVOICE_TAX_OVERRIDE_UPSERTED"
    | "PROJECT_INVOICE_TAX_OVERRIDE_DELETED";
  timestamp: Date;
  actorUserId: UserId;
  reason?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
}

export interface AuditEventView {
  id: UUID;
  entityType: AuditEvent["entityType"];
  entityId: UUID;
  action: AuditEvent["action"];
  timestamp: Date;
  actorUserId: UserId;
}

export type ExportFormat = "XRECHNUNG" | "GAEB";

export interface ExportRun {
  id: UUID;
  tenantId: TenantId;
  entityType: "OFFER_VERSION" | "SUPPLEMENT_VERSION" | "INVOICE";
  entityId: UUID;
  format: ExportFormat;
  status: "PENDING" | "FAILED" | "SUCCEEDED";
  validationErrors: string[];
  createdAt: Date;
  createdBy: UserId;
  /** FIN-5 Paket C: UBL 2.1 XRechnung-XML nur bei `SUCCEEDED` + `INVOICE` + `XRECHNUNG`. */
  xrechnungXml?: string;
}
