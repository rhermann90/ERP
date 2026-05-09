import type { InvoiceTaxRegime } from "../domain/invoice-tax-regime.js";
import {
  AuditEvent,
  DifferenceBooking,
  ExportRun,
  DunningReminder,
  DunningEmailSend,
  Invoice,
  PaymentIntake,
  PaymentTermsHead,
  PaymentTermsVersion,
  LvCatalog,
  LvPosition,
  LvStructureNode,
  LvVersion,
  Measurement,
  MeasurementPosition,
  MeasurementVersion,
  Offer,
  OfferVersion,
  SupplementOffer,
  SupplementVersion,
  CustomerEInvoicePartyRow,
  ProjectInvoiceTaxOverride,
  TenantEInvoicePartyRow,
  TenantInvoiceTaxProfile,
  TenantId,
  TraceabilityLink,
  UUID,
} from "../domain/types.js";

export class InMemoryRepositories {
  public offers = new Map<UUID, Offer>();
  public offerVersions = new Map<UUID, OfferVersion>();
  public supplementOffers = new Map<UUID, SupplementOffer>();
  public supplementVersions = new Map<UUID, SupplementVersion>();
  public measurements = new Map<UUID, Measurement>();
  public measurementVersions = new Map<UUID, MeasurementVersion>();
  public measurementPositions = new Map<UUID, MeasurementPosition>();
  public lvCatalogs = new Map<UUID, LvCatalog>();
  public lvVersions = new Map<UUID, LvVersion>();
  public lvStructureNodes = new Map<UUID, LvStructureNode>();
  public lvPositions = new Map<UUID, LvPosition>();
  public auditEvents: AuditEvent[] = [];
  public exportRuns = new Map<UUID, ExportRun>();
  public traceabilityLinks = new Map<UUID, TraceabilityLink>();
  public invoices = new Map<UUID, Invoice>();
  public paymentTermsHeads = new Map<UUID, PaymentTermsHead>();
  public paymentTermsVersions = new Map<UUID, PaymentTermsVersion>();
  public paymentIntakes = new Map<UUID, PaymentIntake>();
  /** Schlüssel `${tenantId}:${idempotencyKey}` → paymentIntake.id */
  public paymentIntakeByIdempotencyKey = new Map<string, UUID>();
  public dunningReminders = new Map<UUID, DunningReminder>();
  public dunningEmailSends = new Map<UUID, DunningEmailSend>();
  /** `${tenantId}:${idempotencyKey}` → dunningEmailSend.id */
  public dunningEmailSendByIdempotencyKey = new Map<string, UUID>();
  /** §5.4 / §8.6 Differenzbuchungen (key = booking id). */
  public differenceBookings = new Map<UUID, DifferenceBooking>();

  /** FIN-5: ein Profil je Mandant (Postgres `tenant_invoice_tax_profiles`). */
  public tenantInvoiceTaxProfiles = new Map<TenantId, TenantInvoiceTaxProfile>();
  /** XRechnung Seller-Stammdaten je Mandant (`tenant_e_invoice_parties`). */
  public tenantEInvoiceParties = new Map<TenantId, TenantEInvoicePartyRow>();
  /** XRechnung Buyer-Stammdaten; Schlüssel `${tenantId}:${customerId}` (`customer_e_invoice_parties`). */
  public customerEInvoiceParties = new Map<string, CustomerEInvoicePartyRow>();
  /** Schlüssel `${tenantId}:${projectId}` → Override */
  public projectInvoiceTaxOverrides = new Map<string, ProjectInvoiceTaxOverride>();

  public getTenantInvoiceTaxProfile(tenantId: TenantId): TenantInvoiceTaxProfile | undefined {
    return this.tenantInvoiceTaxProfiles.get(tenantId);
  }

  public putTenantInvoiceTaxProfile(profile: TenantInvoiceTaxProfile): void {
    this.tenantInvoiceTaxProfiles.set(profile.tenantId, profile);
  }

  public getTenantEInvoiceParty(tenantId: TenantId): TenantEInvoicePartyRow | undefined {
    return this.tenantEInvoiceParties.get(tenantId);
  }

  public putTenantEInvoiceParty(row: TenantEInvoicePartyRow): void {
    this.tenantEInvoiceParties.set(row.tenantId, row);
  }

  public getCustomerEInvoiceParty(tenantId: TenantId, customerId: UUID): CustomerEInvoicePartyRow | undefined {
    return this.customerEInvoiceParties.get(`${tenantId}:${customerId}`);
  }

  public putCustomerEInvoiceParty(row: CustomerEInvoicePartyRow): void {
    this.customerEInvoiceParties.set(`${row.tenantId}:${row.customerId}`, row);
  }

  public deleteTenantEInvoiceParty(tenantId: TenantId): void {
    this.tenantEInvoiceParties.delete(tenantId);
  }

  public deleteCustomerEInvoiceParty(tenantId: TenantId, customerId: UUID): void {
    this.customerEInvoiceParties.delete(`${tenantId}:${customerId}`);
  }

  public listCustomerEInvoicePartiesForTenant(tenantId: TenantId): CustomerEInvoicePartyRow[] {
    return [...this.customerEInvoiceParties.values()].filter((r) => r.tenantId === tenantId);
  }

  public getProjectInvoiceTaxOverride(tenantId: TenantId, projectId: UUID): ProjectInvoiceTaxOverride | undefined {
    return this.projectInvoiceTaxOverrides.get(`${tenantId}:${projectId}`);
  }

  public putProjectInvoiceTaxOverride(row: ProjectInvoiceTaxOverride): void {
    this.projectInvoiceTaxOverrides.set(`${row.tenantId}:${row.projectId}`, row);
  }

  public deleteProjectInvoiceTaxOverride(tenantId: TenantId, projectId: UUID): void {
    this.projectInvoiceTaxOverrides.delete(`${tenantId}:${projectId}`);
  }

  /** Projekt-Override schlägt Mandanten-Default; ohne Eintrag → Standard-USt 19 %. */
  public resolveEffectiveInvoiceTaxRegime(tenantId: TenantId, projectId: UUID): InvoiceTaxRegime {
    const o = this.getProjectInvoiceTaxOverride(tenantId, projectId);
    if (o) return o.invoiceTaxRegime;
    return this.getTenantInvoiceTaxProfile(tenantId)?.defaultInvoiceTaxRegime ?? "STANDARD_VAT_19";
  }

  public resolveTaxReasonCodeForProject(tenantId: TenantId, projectId: UUID): string | undefined {
    return this.getProjectInvoiceTaxOverride(tenantId, projectId)?.taxReasonCode;
  }

  public getOfferByTenant(tenantId: TenantId, offerId: UUID): Offer | undefined {
    const offer = this.offers.get(offerId);
    if (!offer || offer.tenantId !== tenantId) {
      return undefined;
    }
    return offer;
  }

  public getOfferVersionByTenant(tenantId: TenantId, offerVersionId: UUID): OfferVersion | undefined {
    const version = this.offerVersions.get(offerVersionId);
    if (!version || version.tenantId !== tenantId) {
      return undefined;
    }
    return version;
  }

  /** Schreibpfad für Domäne/Seed (nicht direkt `.set` in Services). */
  public putOffer(offer: Offer): void {
    this.offers.set(offer.id, offer);
  }

  public putOfferVersion(version: OfferVersion): void {
    this.offerVersions.set(version.id, version);
  }

  public putSupplementOffer(supplementOffer: SupplementOffer): void {
    this.supplementOffers.set(supplementOffer.id, supplementOffer);
  }

  public putSupplementVersion(version: SupplementVersion): void {
    this.supplementVersions.set(version.id, version);
  }

  public getInvoiceByTenant(tenantId: TenantId, invoiceId: UUID): Invoice | undefined {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) {
      return undefined;
    }
    return invoice;
  }

  public listInvoicesForTenant(tenantId: TenantId): Invoice[] {
    return [...this.invoices.values()].filter((inv) => inv.tenantId === tenantId);
  }

  public listInvoicesForMeasurement(tenantId: TenantId, measurementId: UUID): Invoice[] {
    return [...this.invoices.values()].filter(
      (inv) => inv.tenantId === tenantId && inv.measurementId === measurementId,
    );
  }

  public listDifferenceBookingsForProject(tenantId: TenantId, projectId: UUID): DifferenceBooking[] {
    return [...this.differenceBookings.values()].filter(
      (b) => b.tenantId === tenantId && b.projectId === projectId,
    );
  }

  public getDifferenceBookingBySubsequentVersion(
    tenantId: TenantId,
    subsequentMeasurementVersionId: UUID,
  ): DifferenceBooking | undefined {
    return [...this.differenceBookings.values()].find(
      (b) => b.tenantId === tenantId && b.subsequentMeasurementVersionId === subsequentMeasurementVersionId,
    );
  }

  public putDifferenceBooking(row: DifferenceBooking): void {
    this.differenceBookings.set(row.id, row);
  }

  public getPaymentIntakeByIdempotency(tenantId: TenantId, idempotencyKey: UUID): PaymentIntake | undefined {
    const id = this.paymentIntakeByIdempotencyKey.get(`${tenantId}:${idempotencyKey}`);
    if (!id) return undefined;
    const row = this.paymentIntakes.get(id);
    if (!row || row.tenantId !== tenantId) return undefined;
    return row;
  }

  public listPaymentIntakesForInvoice(tenantId: TenantId, invoiceId: UUID): PaymentIntake[] {
    return [...this.paymentIntakes.values()].filter((p) => p.tenantId === tenantId && p.invoiceId === invoiceId);
  }

  public putPaymentIntake(row: PaymentIntake): void {
    this.paymentIntakes.set(row.id, row);
    this.paymentIntakeByIdempotencyKey.set(`${row.tenantId}:${row.idempotencyKey}`, row.id);
  }

  /** Rollback bei fehlgeschlagener DB-Persistenz (FIN-3). */
  public removePaymentIntake(row: PaymentIntake): void {
    this.paymentIntakes.delete(row.id);
    this.paymentIntakeByIdempotencyKey.delete(`${row.tenantId}:${row.idempotencyKey}`);
  }

  public listDunningRemindersForInvoice(tenantId: TenantId, invoiceId: UUID): DunningReminder[] {
    return [...this.dunningReminders.values()].filter((r) => r.tenantId === tenantId && r.invoiceId === invoiceId);
  }

  public putDunningReminder(row: DunningReminder): void {
    this.dunningReminders.set(row.id, row);
  }

  /** Rollback bei fehlgeschlagener DB-Persistenz (FIN-4 Schreibpfad). */
  public removeDunningReminder(row: DunningReminder): void {
    this.dunningReminders.delete(row.id);
  }

  public getDunningEmailSendByIdempotency(tenantId: TenantId, idempotencyKey: UUID): DunningEmailSend | undefined {
    const id = this.dunningEmailSendByIdempotencyKey.get(`${tenantId}:${idempotencyKey}`);
    if (!id) return undefined;
    const row = this.dunningEmailSends.get(id);
    if (!row || row.tenantId !== tenantId) return undefined;
    return row;
  }

  public putDunningEmailSend(row: DunningEmailSend): void {
    this.dunningEmailSends.set(row.id, row);
    this.dunningEmailSendByIdempotencyKey.set(`${row.tenantId}:${row.idempotencyKey}`, row.id);
  }

  public removeDunningEmailSend(row: DunningEmailSend): void {
    this.dunningEmailSends.delete(row.id);
    this.dunningEmailSendByIdempotencyKey.delete(`${row.tenantId}:${row.idempotencyKey}`);
  }

  public getSupplementOfferByTenant(tenantId: TenantId, supplementOfferId: UUID): SupplementOffer | undefined {
    const supplement = this.supplementOffers.get(supplementOfferId);
    if (!supplement || supplement.tenantId !== tenantId) {
      return undefined;
    }
    return supplement;
  }

  public getSupplementVersionByTenant(tenantId: TenantId, supplementVersionId: UUID): SupplementVersion | undefined {
    const version = this.supplementVersions.get(supplementVersionId);
    if (!version || version.tenantId !== tenantId) {
      return undefined;
    }
    return version;
  }

  public getMeasurementByTenant(tenantId: TenantId, measurementId: UUID): Measurement | undefined {
    const m = this.measurements.get(measurementId);
    if (!m || m.tenantId !== tenantId) {
      return undefined;
    }
    return m;
  }

  public getMeasurementVersionByTenant(tenantId: TenantId, measurementVersionId: UUID): MeasurementVersion | undefined {
    const v = this.measurementVersions.get(measurementVersionId);
    if (!v || v.tenantId !== tenantId) {
      return undefined;
    }
    return v;
  }

  public listMeasurementPositionsForVersion(tenantId: TenantId, measurementVersionId: UUID): MeasurementPosition[] {
    return [...this.measurementPositions.values()].filter(
      (p) => p.tenantId === tenantId && p.measurementVersionId === measurementVersionId,
    );
  }

  public getLvCatalogByTenant(tenantId: TenantId, catalogId: UUID): LvCatalog | undefined {
    const c = this.lvCatalogs.get(catalogId);
    if (!c || c.tenantId !== tenantId) {
      return undefined;
    }
    return c;
  }

  public getLvVersionByTenant(tenantId: TenantId, lvVersionId: UUID): LvVersion | undefined {
    const v = this.lvVersions.get(lvVersionId);
    if (!v || v.tenantId !== tenantId) {
      return undefined;
    }
    return v;
  }

  public getLvStructureNodeByTenant(tenantId: TenantId, nodeId: UUID): LvStructureNode | undefined {
    const n = this.lvStructureNodes.get(nodeId);
    if (!n || n.tenantId !== tenantId) {
      return undefined;
    }
    return n;
  }

  public getLvPositionByTenant(tenantId: TenantId, positionId: UUID): LvPosition | undefined {
    const p = this.lvPositions.get(positionId);
    if (!p || p.tenantId !== tenantId) {
      return undefined;
    }
    return p;
  }

  public listLvStructureNodesForVersion(tenantId: TenantId, lvVersionId: UUID): LvStructureNode[] {
    return [...this.lvStructureNodes.values()].filter(
      (n) => n.tenantId === tenantId && n.lvVersionId === lvVersionId,
    );
  }

  public listLvPositionsForVersion(tenantId: TenantId, lvVersionId: UUID): LvPosition[] {
    return [...this.lvPositions.values()].filter((p) => p.tenantId === tenantId && p.lvVersionId === lvVersionId);
  }

  public getPaymentTermsHeadByTenant(tenantId: TenantId, headId: UUID): PaymentTermsHead | undefined {
    const h = this.paymentTermsHeads.get(headId);
    if (!h || h.tenantId !== tenantId) {
      return undefined;
    }
    return h;
  }

  public getPaymentTermsHeadByTenantProject(tenantId: TenantId, projectId: UUID): PaymentTermsHead | undefined {
    return [...this.paymentTermsHeads.values()].find((h) => h.tenantId === tenantId && h.projectId === projectId);
  }

  public getPaymentTermsVersionByTenant(tenantId: TenantId, versionId: UUID): PaymentTermsVersion | undefined {
    const v = this.paymentTermsVersions.get(versionId);
    if (!v || v.tenantId !== tenantId) {
      return undefined;
    }
    return v;
  }

  public putPaymentTermsHead(head: PaymentTermsHead): void {
    this.paymentTermsHeads.set(head.id, head);
  }

  public putPaymentTermsVersion(version: PaymentTermsVersion): void {
    this.paymentTermsVersions.set(version.id, version);
  }

  /** Höchste `versionNumber` zum Projekt-Kopf (FIN-1); nur tenant-scope. */
  public getLatestPaymentTermsVersionForProject(tenantId: TenantId, projectId: UUID): PaymentTermsVersion | undefined {
    const head = this.getPaymentTermsHeadByTenantProject(tenantId, projectId);
    if (!head) return undefined;
    const versions = [...this.paymentTermsVersions.values()].filter(
      (v) => v.tenantId === tenantId && v.headId === head.id,
    );
    if (versions.length === 0) return undefined;
    return versions.reduce((a, b) => (a.versionNumber >= b.versionNumber ? a : b));
  }

}
