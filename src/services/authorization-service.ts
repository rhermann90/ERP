import {
  assertOfferCreateVersionAllowedForStatus,
  statusAllowsOfferCreateVersion,
} from "../domain/offer-create-version-policy.js";
import {
  assertLvCreateVersionAllowedForStatus,
  statusAllowsLvCreateVersion,
} from "../domain/lv-create-version-policy.js";
import {
  assertMeasurementCreateVersionAllowedForStatus,
  statusAllowsMeasurementCreateVersion,
} from "../domain/measurement-create-version-policy.js";
import { DomainError } from "../errors/domain-error.js";
import { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import {
  InvoiceStatus,
  LvVersionStatus,
  MeasurementStatus,
  OfferStatus,
  SupplementStatus,
  UserRole,
} from "../domain/types.js";

const OFFER_STATUS_ACTION_BY_ROLE: Record<UserRole, string[]> = {
  ADMIN: [
    "OFFER_SET_IN_FREIGABE",
    "OFFER_SET_FREIGEGEBEN",
    "OFFER_SET_VERSENDET",
    "OFFER_SET_ANGENOMMEN",
    "OFFER_SET_ABGELEHNT",
    "OFFER_CREATE_VERSION",
    "OFFER_CREATE_SUPPLEMENT",
  ],
  GESCHAEFTSFUEHRUNG: [
    "OFFER_SET_FREIGEGEBEN",
    "OFFER_SET_ARCHIVIERT",
    "OFFER_SET_ANGENOMMEN",
    "OFFER_SET_ABGELEHNT",
    "OFFER_CREATE_SUPPLEMENT",
  ],
  VERTRIEB_BAULEITUNG: [
    "OFFER_SET_IN_FREIGABE",
    "OFFER_SET_VERSENDET",
    "OFFER_SET_ANGENOMMEN",
    "OFFER_SET_ABGELEHNT",
    "OFFER_CREATE_VERSION",
    "OFFER_CREATE_SUPPLEMENT",
  ],
  BUCHHALTUNG: [],
  VIEWER: [],
};

const SUPPLEMENT_ACTION_BY_ROLE: Record<UserRole, string[]> = {
  ADMIN: [
    "SUPPLEMENT_SET_IN_FREIGABE",
    "SUPPLEMENT_SET_FREIGEGEBEN",
    "SUPPLEMENT_SET_VERSENDET",
    "SUPPLEMENT_SET_BEAUFTRAGT",
    "SUPPLEMENT_SET_ABGELEHNT",
    "SUPPLEMENT_SET_ARCHIVIERT",
    "SUPPLEMENT_APPLY_BILLING_IMPACT",
    "OFFER_CREATE_SUPPLEMENT",
  ],
  VERTRIEB_BAULEITUNG: [
    "SUPPLEMENT_SET_IN_FREIGABE",
    "SUPPLEMENT_SET_VERSENDET",
    "SUPPLEMENT_SET_BEAUFTRAGT",
    "SUPPLEMENT_SET_ABGELEHNT",
    "OFFER_CREATE_SUPPLEMENT",
  ],
  GESCHAEFTSFUEHRUNG: [
    "SUPPLEMENT_SET_FREIGEGEBEN",
    "SUPPLEMENT_SET_BEAUFTRAGT",
    "SUPPLEMENT_SET_ABGELEHNT",
    "SUPPLEMENT_SET_ARCHIVIERT",
    "OFFER_CREATE_SUPPLEMENT",
  ],
  BUCHHALTUNG: ["SUPPLEMENT_APPLY_BILLING_IMPACT"],
  VIEWER: [],
};

const EXPORT_ACTIONS_BY_ROLE: Record<UserRole, string[]> = {
  ADMIN: ["EXPORT_INVOICE", "EXPORT_OFFER_VERSION", "EXPORT_SUPPLEMENT_VERSION"],
  BUCHHALTUNG: ["EXPORT_INVOICE"],
  VERTRIEB_BAULEITUNG: ["EXPORT_OFFER_VERSION", "EXPORT_SUPPLEMENT_VERSION"],
  GESCHAEFTSFUEHRUNG: ["EXPORT_INVOICE", "EXPORT_OFFER_VERSION", "EXPORT_SUPPLEMENT_VERSION"],
  VIEWER: [],
};

/** FIN-3: Zahlungseingang — gleiche Rollen wie `assertCanRecordPaymentIntake`. */
const PAYMENT_INTAKE_ROLES = new Set<UserRole>(["ADMIN", "GESCHAEFTSFUEHRUNG", "BUCHHALTUNG"]);

/** FIN-4 Schreibpfad: Mahn-Ereignis protokollieren — gleiche Rollen wie Zahlungseingang. */
const DUNNING_REMINDER_ROLES = PAYMENT_INTAKE_ROLES;

/** FIN-2 Buchung SoT — gleiche Rollen wie `assertCanBookInvoice`. */
const BOOK_INVOICE_ROLES = new Set<UserRole>(["ADMIN", "GESCHAEFTSFUEHRUNG", "BUCHHALTUNG"]);

const MEASUREMENT_ACTION_BY_ROLE: Record<UserRole, string[]> = {
  ADMIN: [
    "MEASUREMENT_CREATE",
    "MEASUREMENT_UPDATE_POSITIONS",
    "MEASUREMENT_SET_GEPRUEFT",
    "MEASUREMENT_SET_FREIGEGEBEN",
    "MEASUREMENT_SET_ABGERECHNET",
    "MEASUREMENT_SET_ARCHIVIERT",
    "MEASUREMENT_CREATE_VERSION",
  ],
  VERTRIEB_BAULEITUNG: [
    "MEASUREMENT_CREATE",
    "MEASUREMENT_UPDATE_POSITIONS",
    "MEASUREMENT_SET_GEPRUEFT",
    "MEASUREMENT_CREATE_VERSION",
  ],
  GESCHAEFTSFUEHRUNG: ["MEASUREMENT_SET_FREIGEGEBEN", "MEASUREMENT_SET_ARCHIVIERT", "MEASUREMENT_CREATE_VERSION"],
  BUCHHALTUNG: ["MEASUREMENT_SET_ABGERECHNET"],
  VIEWER: [],
};

const LV_ACTION_BY_ROLE: Record<UserRole, string[]> = {
  ADMIN: [
    "LV_CATALOG_CREATE",
    "LV_SET_FREIGEGEBEN",
    "LV_SET_ARCHIVIERT",
    "LV_CREATE_NEXT_VERSION",
    "LV_ADD_STRUCTURE_NODE",
    "LV_ADD_POSITION",
    "LV_UPDATE_NODE_EDITING_TEXT",
    "LV_UPDATE_POSITION",
  ],
  VERTRIEB_BAULEITUNG: [
    "LV_CATALOG_CREATE",
    "LV_ADD_STRUCTURE_NODE",
    "LV_ADD_POSITION",
    "LV_UPDATE_NODE_EDITING_TEXT",
    "LV_UPDATE_POSITION",
  ],
  GESCHAEFTSFUEHRUNG: ["LV_SET_FREIGEGEBEN", "LV_SET_ARCHIVIERT", "LV_CREATE_NEXT_VERSION"],
  BUCHHALTUNG: [],
  VIEWER: [],
};

export class AuthorizationService {
  constructor(private readonly repos: InMemoryRepositories) {}

  public assertCanCreateOfferVersion(role: UserRole): void {
    if (!new Set<UserRole>(["ADMIN", "VERTRIEB_BAULEITUNG"]).has(role)) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Angebotsversion", 403);
    }
  }

  /** Gleiche SoT wie `GET .../allowed-actions` → `OFFER_CREATE_SUPPLEMENT` (nur wenn Status + Matrix es erlauben). */
  public assertCanCreateSupplement(role: UserRole): void {
    if (!SUPPLEMENT_ACTION_BY_ROLE[role].includes("OFFER_CREATE_SUPPLEMENT")) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Nachtragsangebot", 403);
    }
  }

  public assertCanTransitionSupplementStatus(role: UserRole, nextStatus: SupplementStatus): void {
    const action = `SUPPLEMENT_SET_${nextStatus}`;
    if (!SUPPLEMENT_ACTION_BY_ROLE[role].includes(action)) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Nachtrags-Statuswechsel", 403);
    }
  }


  public assertCanManagePaymentTerms(role: UserRole): void {
    if (!new Set<UserRole>(["ADMIN", "GESCHAEFTSFUEHRUNG", "BUCHHALTUNG"]).has(role)) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Zahlungsbedingungen", 403);
    }
  }

  public assertCanReadPaymentTerms(role: UserRole): void {
    if (!new Set<UserRole>(["ADMIN", "GESCHAEFTSFUEHRUNG", "BUCHHALTUNG", "VERTRIEB_BAULEITUNG", "VIEWER"]).has(role)) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung zum Lesen der Zahlungsbedingungen", 403);
    }
  }

  public assertCanCreateInvoiceDraft(role: UserRole): void {
    if (!new Set<UserRole>(["ADMIN", "GESCHAEFTSFUEHRUNG", "BUCHHALTUNG"]).has(role)) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Rechnungsentwurf", 403);
    }
  }

  public assertCanBookInvoice(role: UserRole): void {
    if (!new Set<UserRole>(["ADMIN", "GESCHAEFTSFUEHRUNG", "BUCHHALTUNG"]).has(role)) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung zum Buchen der Rechnung", 403);
    }
  }

  public assertCanReadInvoice(role: UserRole): void {
    if (!new Set<UserRole>(["ADMIN", "GESCHAEFTSFUEHRUNG", "BUCHHALTUNG", "VERTRIEB_BAULEITUNG", "VIEWER"]).has(role)) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Rechnung", 403);
    }
  }

  /** LV §9 Lesepfad — gleiche Mandanten-Rollen wie Rechnung lesen (Traceability / Shell). */
  public assertCanReadLvVersion(role: UserRole): void {
    this.assertCanReadInvoice(role);
  }

  /** FIN-3: Zahlungseingang buchen. */
  public assertCanRecordPaymentIntake(role: UserRole): void {
    if (!PAYMENT_INTAKE_ROLES.has(role)) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Zahlungseingang", 403);
    }
  }

  /** FIN-4: Mahn-Ereignis (Lesepfad-Eintrag) anlegen. */
  public assertCanRecordDunningReminder(role: UserRole): void {
    if (!DUNNING_REMINDER_ROLES.has(role)) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Mahn-Ereignis", 403);
    }
  }

  /** FIN-4: Mandanten-Mahnstufen in Postgres ersetzen — gleiche Rollen wie Zahlungseingang. */
  public assertCanManageDunningTenantStageConfig(role: UserRole): void {
    if (!PAYMENT_INTAKE_ROLES.has(role)) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Mahnstufen-Konfiguration", 403);
    }
  }

  public assertCanApplySupplementBillingImpact(role: UserRole): void {
    if (!SUPPLEMENT_ACTION_BY_ROLE[role].includes("SUPPLEMENT_APPLY_BILLING_IMPACT")) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Abrechnungswirkung", 403);
    }
  }

  /**
   * Gleiche Regel wie GET /documents/{id}/allowed-actions für OFFER_CREATE_VERSION:
   * Policy aus offer-create-version-policy (v1.2) + Rollenrecht.
   */
  public assertOfferCreateVersionForOffer(tenantId: string, role: UserRole, offerId: string): void {
    this.assertCanCreateOfferVersion(role);
    const offer = this.repos.getOfferByTenant(tenantId, offerId);
    if (!offer) {
      throw new DomainError("OFFER_NOT_FOUND", "Angebot nicht gefunden", 404);
    }
    const version = this.repos.getOfferVersionByTenant(tenantId, offer.currentVersionId);
    if (!version) {
      throw new DomainError("OFFER_VERSION_NOT_FOUND", "Aktuelle Angebotsversion nicht gefunden", 404);
    }
    assertOfferCreateVersionAllowedForStatus(version.status);
  }

  public assertCanTransitionOfferStatus(role: UserRole, nextStatus: OfferStatus): void {
    const action = `OFFER_SET_${nextStatus}`;
    if (!OFFER_STATUS_ACTION_BY_ROLE[role].includes(action)) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Statuswechsel", 403);
    }
  }

  public assertCanCreateMeasurement(role: UserRole): void {
    if (!MEASUREMENT_ACTION_BY_ROLE[role].includes("MEASUREMENT_CREATE")) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Aufmass-Anlage", 403);
    }
  }

  public assertCanTransitionMeasurementStatus(role: UserRole, nextStatus: MeasurementStatus): void {
    const action = `MEASUREMENT_SET_${nextStatus}`;
    if (!MEASUREMENT_ACTION_BY_ROLE[role].includes(action)) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Aufmass-Statuswechsel", 403);
    }
  }

  public assertCanUpdateMeasurementPositions(role: UserRole): void {
    if (!MEASUREMENT_ACTION_BY_ROLE[role].includes("MEASUREMENT_UPDATE_POSITIONS")) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Aufmasspositionen", 403);
    }
  }

  /** SoT wie GET /documents/.../allowed-actions (entityType MEASUREMENT_VERSION, aktuelle Version). */
  public assertMeasurementCreateVersionForMeasurement(tenantId: string, role: UserRole, measurementId: string): void {
    if (!MEASUREMENT_ACTION_BY_ROLE[role].includes("MEASUREMENT_CREATE_VERSION")) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer neue Aufmassversion", 403);
    }
    const measurement = this.repos.getMeasurementByTenant(tenantId, measurementId);
    if (!measurement) {
      throw new DomainError("MEASUREMENT_NOT_FOUND", "Aufmass nicht gefunden", 404);
    }
    const version = this.repos.getMeasurementVersionByTenant(tenantId, measurement.currentVersionId);
    if (!version) {
      throw new DomainError("MEASUREMENT_NOT_FOUND", "Aktuelle Aufmassversion nicht gefunden", 404);
    }
    assertMeasurementCreateVersionAllowedForStatus(version.status);
  }

  public assertCanManageTenantUsers(role: UserRole): void {
    if (role !== "ADMIN") {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Nur Administratoren dürfen Benutzerkonten verwalten.", 403);
    }
  }

  public assertCanCreateLvCatalog(role: UserRole): void {
    if (!LV_ACTION_BY_ROLE[role].includes("LV_CATALOG_CREATE")) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer LV-Katalog", 403);
    }
  }

  public assertCanTransitionLvVersion(role: UserRole, nextStatus: LvVersionStatus): void {
    const action = nextStatus === "FREIGEGEBEN" ? "LV_SET_FREIGEGEBEN" : "LV_SET_ARCHIVIERT";
    if (!LV_ACTION_BY_ROLE[role].includes(action)) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer LV-Statuswechsel", 403);
    }
  }

  public assertLvCreateNextVersionForCatalog(tenantId: string, role: UserRole, lvCatalogId: string): void {
    if (!LV_ACTION_BY_ROLE[role].includes("LV_CREATE_NEXT_VERSION")) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer neue LV-Version", 403);
    }
    const catalog = this.repos.getLvCatalogByTenant(tenantId, lvCatalogId);
    if (!catalog) {
      throw new DomainError("LV_CATALOG_NOT_FOUND", "LV-Katalog nicht gefunden", 404);
    }
    const current = this.repos.getLvVersionByTenant(tenantId, catalog.currentVersionId);
    if (!current) {
      throw new DomainError("LV_VERSION_NOT_FOUND", "Aktuelle LV-Version nicht gefunden", 404);
    }
    assertLvCreateVersionAllowedForStatus(current.status);
  }

  public assertCanAddLvStructureNode(role: UserRole): void {
    if (!LV_ACTION_BY_ROLE[role].includes("LV_ADD_STRUCTURE_NODE")) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer LV-Strukturknoten", 403);
    }
  }

  public assertCanAddLvPosition(role: UserRole): void {
    if (!LV_ACTION_BY_ROLE[role].includes("LV_ADD_POSITION")) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer LV-Position", 403);
    }
  }

  public assertCanUpdateLvNodeEditing(role: UserRole): void {
    if (!LV_ACTION_BY_ROLE[role].includes("LV_UPDATE_NODE_EDITING_TEXT")) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Knoten-Bearbeitungstext", 403);
    }
  }

  public assertCanUpdateLvPosition(role: UserRole): void {
    if (!LV_ACTION_BY_ROLE[role].includes("LV_UPDATE_POSITION")) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Positionsaenderung", 403);
    }
  }

  public assertCanExport(
    role: UserRole,
    entityType: "OFFER_VERSION" | "SUPPLEMENT_VERSION" | "INVOICE",
    _format: "XRECHNUNG" | "GAEB",
  ): void {
    const action =
      entityType === "INVOICE"
        ? "EXPORT_INVOICE"
        : entityType === "SUPPLEMENT_VERSION"
          ? "EXPORT_SUPPLEMENT_VERSION"
          : "EXPORT_OFFER_VERSION";
    if (!EXPORT_ACTIONS_BY_ROLE[role].includes(action)) {
      throw new DomainError("AUTH_ROLE_FORBIDDEN", "Keine Berechtigung fuer Export", 403);
    }
  }

  public getAllowedActions(
    tenantId: string,
    entityType:
      | "OFFER_VERSION"
      | "SUPPLEMENT_VERSION"
      | "MEASUREMENT_VERSION"
      | "LV_VERSION"
      | "LV_STRUCTURE_NODE"
      | "LV_POSITION"
      | "INVOICE",
    entityId: string,
    role: UserRole,
  ): string[] {
    if (entityType === "OFFER_VERSION") {
      const version = this.repos.getOfferVersionByTenant(tenantId, entityId);
      if (!version) {
        throw new DomainError("DOCUMENT_NOT_FOUND", "Dokument nicht gefunden", 404);
      }
      return this.allowedOfferActionsByStatus(version.status, role);
    }
    if (entityType === "SUPPLEMENT_VERSION") {
      const supplement = this.repos.getSupplementVersionByTenant(tenantId, entityId);
      if (!supplement) {
        throw new DomainError("DOCUMENT_NOT_FOUND", "Dokument nicht gefunden", 404);
      }
      return this.allowedSupplementActionsByStatus(supplement.status, role);
    }
    if (entityType === "MEASUREMENT_VERSION") {
      const mv = this.repos.getMeasurementVersionByTenant(tenantId, entityId);
      if (!mv) {
        throw new DomainError("DOCUMENT_NOT_FOUND", "Dokument nicht gefunden", 404);
      }
      return this.allowedMeasurementActionsByVersion(tenantId, mv, role);
    }
    if (entityType === "LV_VERSION") {
      const lv = this.repos.getLvVersionByTenant(tenantId, entityId);
      if (!lv) {
        throw new DomainError("DOCUMENT_NOT_FOUND", "Dokument nicht gefunden", 404);
      }
      return this.allowedLvVersionActions(tenantId, lv, role);
    }
    if (entityType === "LV_STRUCTURE_NODE") {
      const node = this.repos.getLvStructureNodeByTenant(tenantId, entityId);
      if (!node) {
        throw new DomainError("DOCUMENT_NOT_FOUND", "Dokument nicht gefunden", 404);
      }
      return this.allowedLvStructureNodeActions(tenantId, node, role);
    }
    if (entityType === "LV_POSITION") {
      const pos = this.repos.getLvPositionByTenant(tenantId, entityId);
      if (!pos) {
        throw new DomainError("DOCUMENT_NOT_FOUND", "Dokument nicht gefunden", 404);
      }
      return this.allowedLvPositionActions(tenantId, pos, role);
    }

    const invoice = this.repos.getInvoiceByTenant(tenantId, entityId);
    if (!invoice) {
      throw new DomainError("DOCUMENT_NOT_FOUND", "Dokument nicht gefunden", 404);
    }
    return this.allowedInvoiceActionsByStatus(invoice.status, role);
  }

  private allowedOfferActionsByStatus(status: OfferStatus, role: UserRole): string[] {
    const roleActions = new Set(OFFER_STATUS_ACTION_BY_ROLE[role]);
    const byStatus: Record<OfferStatus, string[]> = {
      ENTWURF: ["OFFER_SET_IN_FREIGABE"],
      IN_FREIGABE: ["OFFER_SET_FREIGEGEBEN"],
      FREIGEGEBEN: ["OFFER_SET_VERSENDET"],
      VERSENDET: ["OFFER_SET_ANGENOMMEN", "OFFER_SET_ABGELEHNT"],
      ANGENOMMEN: ["OFFER_CREATE_SUPPLEMENT"],
      ABGELEHNT: [],
      ARCHIVIERT: [],
    };
    const actions = [...byStatus[status]];
    if (statusAllowsOfferCreateVersion(status)) {
      actions.push("OFFER_CREATE_VERSION");
    }
    return actions.filter((action) => roleActions.has(action));
  }

  /**
   * Rechnungen: **BOOK_INVOICE** (ENTWURF, Rollen wie `assertCanBookInvoice`), **EXPORT_INVOICE** (Exportformat `XRECHNUNG` | `GAEB` nur im Body von POST /exports),
   * **RECORD_PAYMENT_INTAKE** (GEBUCHT_VERSENDET | TEILBEZAHLT), **RECORD_DUNNING_REMINDER** (GEBUCHT_VERSENDET | TEILBEZAHLT).
   * **EXPORT_INVOICE_XRECHNUNG** ist kein SoT-Action — nicht verwenden (verhindert Drift zu assertCanExport / EXPORT_ACTIONS_BY_ROLE).
   */
  private allowedInvoiceActionsByStatus(status: InvoiceStatus, role: UserRole): string[] {
    const roleActions = new Set(EXPORT_ACTIONS_BY_ROLE[role]);
    const byStatus: Record<InvoiceStatus, string[]> = {
      ENTWURF: [],
      GEPRUEFT: [],
      FREIGEGEBEN: ["EXPORT_INVOICE"],
      GEBUCHT_VERSENDET: ["EXPORT_INVOICE"],
      TEILBEZAHLT: ["EXPORT_INVOICE"],
      BEZAHLT: ["EXPORT_INVOICE"],
      STORNIERT: [],
    };
    const exportAllowed = byStatus[status].filter((action) => roleActions.has(action));
    const bookAllowed =
      status === "ENTWURF" && BOOK_INVOICE_ROLES.has(role) ? ["BOOK_INVOICE"] : [];
    const payAllowed =
      PAYMENT_INTAKE_ROLES.has(role) && (status === "GEBUCHT_VERSENDET" || status === "TEILBEZAHLT")
        ? ["RECORD_PAYMENT_INTAKE"]
        : [];
    const dunningAllowed =
      DUNNING_REMINDER_ROLES.has(role) && (status === "GEBUCHT_VERSENDET" || status === "TEILBEZAHLT")
        ? ["RECORD_DUNNING_REMINDER"]
        : [];
    return [...bookAllowed, ...exportAllowed, ...payAllowed, ...dunningAllowed];
  }

  private allowedMeasurementActionsByVersion(
    tenantId: string,
    mv: { id: string; measurementId: string; status: MeasurementStatus },
    role: UserRole,
  ): string[] {
    const roleActions = new Set(MEASUREMENT_ACTION_BY_ROLE[role]);
    const measurement = this.repos.getMeasurementByTenant(tenantId, mv.measurementId);
    const isCurrent = measurement?.currentVersionId === mv.id;
    if (!isCurrent) {
      return [];
    }
    const byStatus: Record<MeasurementStatus, string[]> = {
      ENTWURF: ["MEASUREMENT_SET_GEPRUEFT", "MEASUREMENT_UPDATE_POSITIONS"],
      GEPRUEFT: ["MEASUREMENT_SET_FREIGEGEBEN"],
      FREIGEGEBEN: ["MEASUREMENT_SET_ABGERECHNET", "MEASUREMENT_CREATE_VERSION"],
      ABGERECHNET: ["MEASUREMENT_SET_ARCHIVIERT", "MEASUREMENT_CREATE_VERSION"],
      ARCHIVIERT: [],
    };
    const actions = byStatus[mv.status].filter((action) => {
      if (action === "MEASUREMENT_CREATE_VERSION") {
        return statusAllowsMeasurementCreateVersion(mv.status) && roleActions.has(action);
      }
      return roleActions.has(action);
    });
    return actions;
  }

  private allowedSupplementActionsByStatus(status: SupplementStatus, role: UserRole): string[] {
    const roleActions = new Set(SUPPLEMENT_ACTION_BY_ROLE[role]);
    const byStatus: Record<SupplementStatus, string[]> = {
      ENTWURF: ["SUPPLEMENT_SET_IN_FREIGABE", "SUPPLEMENT_SET_ARCHIVIERT"],
      IN_FREIGABE: ["SUPPLEMENT_SET_FREIGEGEBEN"],
      FREIGEGEBEN: ["SUPPLEMENT_SET_VERSENDET"],
      VERSENDET: ["SUPPLEMENT_SET_BEAUFTRAGT", "SUPPLEMENT_SET_ABGELEHNT"],
      BEAUFTRAGT: ["SUPPLEMENT_SET_ARCHIVIERT", "SUPPLEMENT_APPLY_BILLING_IMPACT"],
      ABGELEHNT: ["SUPPLEMENT_SET_ARCHIVIERT"],
      ARCHIVIERT: [],
    };
    return byStatus[status].filter((action) => roleActions.has(action));
  }

  private allowedLvVersionActions(
    tenantId: string,
    lv: { id: string; lvCatalogId: string; status: LvVersionStatus },
    role: UserRole,
  ): string[] {
    const roleActions = new Set(LV_ACTION_BY_ROLE[role]);
    const catalog = this.repos.getLvCatalogByTenant(tenantId, lv.lvCatalogId);
    const isCurrent = catalog?.currentVersionId === lv.id;
    if (!isCurrent) {
      return [];
    }
    const byStatus: Record<LvVersionStatus, string[]> = {
      ENTWURF: ["LV_SET_FREIGEGEBEN", "LV_ADD_STRUCTURE_NODE", "LV_ADD_POSITION"],
      FREIGEGEBEN: ["LV_SET_ARCHIVIERT", "LV_CREATE_NEXT_VERSION"],
      ARCHIVIERT: [],
    };
    return byStatus[lv.status].filter((action) => {
      if (action === "LV_CREATE_NEXT_VERSION") {
        return statusAllowsLvCreateVersion(lv.status) && roleActions.has(action);
      }
      return roleActions.has(action);
    });
  }

  private allowedLvStructureNodeActions(
    tenantId: string,
    node: { id: string; lvVersionId: string },
    role: UserRole,
  ): string[] {
    const roleActions = new Set(LV_ACTION_BY_ROLE[role]);
    const version = this.repos.getLvVersionByTenant(tenantId, node.lvVersionId);
    if (!version || version.status !== "ENTWURF") {
      return [];
    }
    const catalog = this.repos.getLvCatalogByTenant(tenantId, version.lvCatalogId);
    if (!catalog || catalog.currentVersionId !== version.id) {
      return [];
    }
    return ["LV_UPDATE_NODE_EDITING_TEXT"].filter((a) => roleActions.has(a));
  }

  private allowedLvPositionActions(
    tenantId: string,
    pos: { id: string; lvVersionId: string },
    role: UserRole,
  ): string[] {
    const roleActions = new Set(LV_ACTION_BY_ROLE[role]);
    const version = this.repos.getLvVersionByTenant(tenantId, pos.lvVersionId);
    if (!version || version.status !== "ENTWURF") {
      return [];
    }
    const catalog = this.repos.getLvCatalogByTenant(tenantId, version.lvCatalogId);
    if (!catalog || catalog.currentVersionId !== version.id) {
      return [];
    }
    return ["LV_UPDATE_POSITION"].filter((a) => roleActions.has(a));
  }
}
