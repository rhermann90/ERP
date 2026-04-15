export type UUID = string;
export type TenantId = string;
export type UserId = string;
export type UserRole = "ADMIN" | "BUCHHALTUNG" | "GESCHAEFTSFUEHRUNG" | "VERTRIEB" | "VIEWER";

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
  status: InvoiceStatus;
  immutableFromStatus: "GEBUCHT_VERSENDET";
  invoiceNumber?: string;
  issueDate?: string;
  totalGrossCents?: number;
  supplementOfferId?: UUID;
  supplementVersionId?: UUID;
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
    | "INVOICE";
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
    | "EXPORT_SUCCEEDED";
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
}
