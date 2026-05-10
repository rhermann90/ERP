import { randomUUID } from "node:crypto";
import {
  computeInvoiceTotalsForTaxRegime,
  GERMAN_VAT_STANDARD_BPS,
  netCentsAfterStep84_6Mvp,
  sumLvNetCentsStep84_1,
} from "../domain/invoice-calculation.js";
import { getMandatoryTaxNoticeLines } from "../domain/invoice-tax-mandatory-notices.js";
import type { InvoiceTaxRegime } from "../domain/invoice-tax-regime.js";
import type { Invoice, InvoiceBillingKind, Measurement, TenantId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import type { InvoicePersistencePort } from "../persistence/invoice-persistence.js";
import { AuditService } from "./audit-service.js";
import { differenceBookingToReadJson } from "./difference-booking-service.js";
import type { TraceabilityService } from "./traceability-service.js";

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

const BOOKED_INVOICE_STATUSES_FOR_MITIGATION = new Set<Invoice["status"]>([
  "GEBUCHT_VERSENDET",
  "TEILBEZAHLT",
  "BEZAHLT",
]);

export type CreateInvoiceDraftInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  lvVersionId: UUID;
  offerVersionId: UUID;
  invoiceCurrencyCode: "EUR";
  /** Explizites Aufmass; sonst ältestes zur Kette passendes (createdAt, dann id). */
  measurementId?: UUID;
  paymentTermsVersionId?: UUID;
  /** 8.4(2) B2-1a: Skonto in Basispunkten; fehlend = 0. */
  skontoBps?: number;
  /** §8.6 Slice 2b: Kennzeichnung Schlussrechnung / Folge / Gutschrift (Standard REGULAR). */
  billingKind?: InvoiceBillingKind;
  /** ADR-0024: optional bei automatischem Folge-ENTWURF nach Schluss-Mitigation. */
  mitigationFollowUpSourceInvoiceId?: UUID;
  reason: string;
};

export type BookInvoiceInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  invoiceId: UUID;
  reason: string;
  /** ISO `yyyy-mm-dd` (UTC); default: heutiges UTC-Datum. */
  issueDate?: string;
};

/** ADR-0024 — Antwortteil `POST /invoices/:id/book`. */
export type SchlussrechnungFollowUpDraftResult =
  | { created: true; invoiceId: UUID; billingKind: "FOLGERECHNUNG" }
  | {
      created: false;
      skippedReason:
        | "MITIGATION_NOT_APPLICABLE"
        | "GUTSCHRIFT_REQUIRES_MANUAL_DRAFT"
        | "FOLLOW_UP_DRAFT_ALREADY_EXISTS";
      invoiceId?: UUID;
      billingKind?: "FOLGERECHNUNG" | "GUTSCHRIFT";
    };

export function schlussrechnungFollowUpDraftToJson(result: SchlussrechnungFollowUpDraftResult): {
  created: boolean;
  invoiceId: string | null;
  billingKind: "FOLGERECHNUNG" | "GUTSCHRIFT" | null;
  skippedReason:
    | "MITIGATION_NOT_APPLICABLE"
    | "GUTSCHRIFT_REQUIRES_MANUAL_DRAFT"
    | "FOLLOW_UP_DRAFT_ALREADY_EXISTS"
    | null;
} {
  if (result.created) {
    return {
      created: true,
      invoiceId: result.invoiceId,
      billingKind: result.billingKind,
      skippedReason: null,
    };
  }
  return {
    created: false,
    skippedReason: result.skippedReason,
    invoiceId: result.invoiceId ?? null,
    billingKind: result.billingKind ?? null,
  };
}

/** Lesepfad FIN-3: Zahlungseingänge je Rechnung (ohne Idempotency-Key im API-Body). */
export type PaymentIntakeReadRow = {
  paymentIntakeId: UUID;
  amountCents: number;
  externalReference: string;
  createdAt: string;
};

/** Lesepfad FIN-4: Mahn-Ereignisse je Rechnung (Leselogik über Repos/Persistenz). */
export type DunningReminderReadRow = {
  dunningReminderId: UUID;
  stageOrdinal: number;
  note?: string;
  createdAt: string;
};

/** Betriebliche Forderungsliste: gebuchte/teilbezahlte Rechnungen mit positivem Restsaldo (`GET /finance/open-receivables`). */
export type OpenReceivableReadRow = {
  invoiceId: UUID;
  status: "GEBUCHT_VERSENDET" | "TEILBEZAHLT";
  projectId: UUID;
  customerId: UUID;
  invoiceNumber?: string;
  issueDate?: string;
  totalGrossCents: number;
  totalPaidCents: number;
  openAmountCents: number;
};

export class InvoiceService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly audit: AuditService,
    private readonly persistence: InvoicePersistencePort,
    private readonly traceability: TraceabilityService,
  ) {}

  public async createDraft(input: CreateInvoiceDraftInput): Promise<{
    invoiceId: UUID;
    lvNetCents: number;
    vatRateBps: number;
    vatCents: number;
    totalGrossCents: number;
    skontoBps: number;
    invoiceTaxRegime: InvoiceTaxRegime;
    mandatoryTaxNoticeLines: string[];
    billingKind: InvoiceBillingKind;
  }> {
    if (input.invoiceCurrencyCode !== "EUR") {
      throw new DomainError("VALIDATION_FAILED", "Nur EUR laut Spez", 400);
    }
    const ov = this.repos.getOfferVersionByTenant(input.tenantId, input.offerVersionId);
    if (!ov) {
      throw new DomainError("OFFER_VERSION_NOT_FOUND", "Angebotsversion nicht gefunden", 404);
    }
    if (ov.lvVersionId !== input.lvVersionId) {
      throw new DomainError(
        "TRACEABILITY_FIELD_MISMATCH",
        "lvVersionId passt nicht zur gewaehlten Angebotsversion (Gate G5)",
        422,
      );
    }
    const offer = this.repos.getOfferByTenant(input.tenantId, ov.offerId);
    if (!offer) {
      throw new DomainError("OFFER_NOT_FOUND", "Angebot nicht gefunden", 404);
    }
    const candidateMeasurements = [...this.repos.measurements.values()].filter(
      (m) =>
        m.tenantId === input.tenantId &&
        m.projectId === offer.projectId &&
        m.customerId === offer.customerId &&
        m.lvVersionId === input.lvVersionId,
    );
    if (candidateMeasurements.length === 0) {
      throw new DomainError(
        "TRACEABILITY_LINK_MISSING",
        "Kein Aufmass fuer Projekt/Kunde/LV-Version — Rechnungskette unvollstaendig",
        422,
      );
    }

    let measurement: Measurement;
    const explicitId = input.measurementId?.trim();
    if (explicitId) {
      const byId = this.repos.getMeasurementByTenant(input.tenantId, explicitId);
      if (!byId) {
        throw new DomainError("MEASUREMENT_NOT_FOUND", "Aufmass nicht gefunden", 404);
      }
      const chainOk =
        byId.projectId === offer.projectId &&
        byId.customerId === offer.customerId &&
        byId.lvVersionId === input.lvVersionId;
      if (!chainOk) {
        throw new DomainError(
          "TRACEABILITY_FIELD_MISMATCH",
          "measurementId passt nicht zur Angebotskette (Projekt/Kunde/LV-Version)",
          422,
        );
      }
      measurement = byId;
    } else {
      candidateMeasurements.sort((a, b) => {
        const dt = a.createdAt.getTime() - b.createdAt.getTime();
        if (dt !== 0) return dt;
        return a.id.localeCompare(b.id);
      });
      measurement = candidateMeasurements[0]!;
    }

    if (input.mitigationFollowUpSourceInvoiceId) {
      const bk = input.billingKind ?? "REGULAR";
      if (bk !== "GUTSCHRIFT" && bk !== "FOLGERECHNUNG") {
        throw new DomainError(
          "VALIDATION_FAILED",
          "mitigationFollowUpSourceInvoiceId nur mit billingKind GUTSCHRIFT oder FOLGERECHNUNG",
          400,
        );
      }
      const srcInv = this.repos.getInvoiceByTenant(input.tenantId, input.mitigationFollowUpSourceInvoiceId);
      if (!srcInv) {
        throw new DomainError("DOCUMENT_NOT_FOUND", "Mitigations-Bezugsrechnung nicht gefunden", 404);
      }
      if (!BOOKED_INVOICE_STATUSES_FOR_MITIGATION.has(srcInv.status)) {
        throw new DomainError(
          "INVOICE_NOT_BOOKED_FOR_MITIGATION_LINK",
          "mitigationFollowUpSourceInvoiceId verlangt gebuchte Rechnung",
          422,
        );
      }
      if (srcInv.measurementId !== measurement.id) {
        throw new DomainError(
          "TRACEABILITY_FIELD_MISMATCH",
          "Mitigations-Bezugsrechnung passt nicht zum Aufmass des Entwurfs",
          422,
        );
      }
    }

    if (input.paymentTermsVersionId) {
      const ptv = this.repos.getPaymentTermsVersionByTenant(input.tenantId, input.paymentTermsVersionId);
      if (!ptv) {
        throw new DomainError("DOCUMENT_NOT_FOUND", "Zahlungsbedingungs-Version nicht gefunden", 404);
      }
      const head = this.repos.getPaymentTermsHeadByTenant(input.tenantId, ptv.headId);
      if (!head || head.projectId !== offer.projectId) {
        throw new DomainError(
          "TRACEABILITY_FIELD_MISMATCH",
          "Zahlungsbedingungen gehoeren nicht zum Projekt des Angebots",
          422,
        );
      }
    }

    const lvPositions = this.repos.listLvPositionsForVersion(input.tenantId, input.lvVersionId);
    const lvNetAfterStep1 = sumLvNetCentsStep84_1(lvPositions);
    const skontoBps = input.skontoBps ?? 0;
    const pipelineNet = netCentsAfterStep84_6Mvp(lvNetAfterStep1, { skontoBps });
    if (pipelineNet <= 0) {
      throw new DomainError(
        "VALIDATION_FAILED",
        "LV-Summe Netto (8.4 Schritt 1) ist 0 — keine abrechenbare NORMAL-Position",
        400,
      );
    }
    const billingKind = input.billingKind ?? "REGULAR";
    const lvNetCents = billingKind === "GUTSCHRIFT" ? -pipelineNet : pipelineNet;
    const regime = this.repos.resolveEffectiveInvoiceTaxRegime(input.tenantId, offer.projectId);
    const taxReasonCode = this.repos.resolveTaxReasonCodeForProject(input.tenantId, offer.projectId);
    const totals = computeInvoiceTotalsForTaxRegime(lvNetCents, regime);
    const { vatRateBpsEffective, vatCents, totalGrossCents, invoiceTaxRegime } = totals;

    const id = randomUUID();
    const invoice: Invoice = {
      id,
      tenantId: input.tenantId,
      projectId: offer.projectId,
      customerId: offer.customerId,
      measurementId: measurement.id,
      lvId: input.lvVersionId,
      offerId: offer.id,
      offerVersionId: input.offerVersionId,
      status: "ENTWURF",
      immutableFromStatus: "GEBUCHT_VERSENDET",
      lvNetCents,
      vatCents,
      totalGrossCents,
      paymentTermsVersionId: input.paymentTermsVersionId,
      skontoBps,
      invoiceTaxRegime,
      vatRateBpsEffective,
      taxReasonCode,
      billingKind,
      mitigationFollowUpSourceInvoiceId: input.mitigationFollowUpSourceInvoiceId,
    };
    this.repos.invoices.set(id, invoice);
    this.repos.traceabilityLinks.set(id, {
      tenantId: input.tenantId,
      invoiceId: id,
      measurementId: measurement.id,
      lvId: input.lvVersionId,
      offerId: offer.id,
      projectId: offer.projectId,
      customerId: offer.customerId,
    });

    await this.persistence.syncInvoiceFromMemory(this.repos, input.tenantId, id);

    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "INVOICE",
      entityId: id,
      action: "STATUS_CHANGED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      afterState: {
        status: "ENTWURF",
        offerVersionId: input.offerVersionId,
        lvVersionId: input.lvVersionId,
        lvNetCents,
        vatCents,
        totalGrossCents,
        skontoBps,
        invoiceTaxRegime,
        vatRateBpsEffective,
      },
    });

    return {
      invoiceId: id,
      lvNetCents,
      vatRateBps: vatRateBpsEffective,
      vatCents,
      totalGrossCents,
      skontoBps,
      invoiceTaxRegime,
      mandatoryTaxNoticeLines: getMandatoryTaxNoticeLines(invoiceTaxRegime),
      billingKind,
    };
  }

  public findMitigationFollowUpDraftForSource(tenantId: TenantId, bookedInvoiceId: UUID): Invoice | undefined {
    for (const inv of this.repos.invoices.values()) {
      if (inv.tenantId !== tenantId) continue;
      if (inv.status !== "ENTWURF") continue;
      if (inv.mitigationFollowUpSourceInvoiceId !== bookedInvoiceId) continue;
      return inv;
    }
    return undefined;
  }

  /**
   * ADR-0024: Nach Schluss-Mitigation (Plus) automatischer FOLGERECHNUNG-ENTWURF; Gutschrift fail-closed.
   */
  public async resolveSchlussrechnungFollowUpDraft(input: {
    tenantId: TenantId;
    actorUserId: UUID;
    bookedInvoiceId: UUID;
    mitigation: { applies: false } | { applies: true; suggestedNextBillingKind: "FOLGERECHNUNG" | "GUTSCHRIFT" };
    bookReason: string;
  }): Promise<SchlussrechnungFollowUpDraftResult> {
    if (!input.mitigation.applies) {
      return { created: false, skippedReason: "MITIGATION_NOT_APPLICABLE" };
    }
    const existing = this.findMitigationFollowUpDraftForSource(input.tenantId, input.bookedInvoiceId);
    if (existing) {
      return {
        created: false,
        skippedReason: "FOLLOW_UP_DRAFT_ALREADY_EXISTS",
        invoiceId: existing.id,
        billingKind: "FOLGERECHNUNG",
      };
    }
    if (input.mitigation.suggestedNextBillingKind === "GUTSCHRIFT") {
      return {
        created: false,
        skippedReason: "GUTSCHRIFT_REQUIRES_MANUAL_DRAFT",
        billingKind: "GUTSCHRIFT",
      };
    }
    const booked = this.repos.getInvoiceByTenant(input.tenantId, input.bookedInvoiceId);
    if (!booked?.offerVersionId) {
      throw new DomainError(
        "INVOICE_TRACEABILITY_INCOMPLETE",
        "Automatischer Folge-Entwurf: Angebotsversion fehlt auf gebuchter Rechnung",
        422,
      );
    }
    const draft = await this.createDraft({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      lvVersionId: booked.lvId,
      offerVersionId: booked.offerVersionId,
      invoiceCurrencyCode: "EUR",
      measurementId: booked.measurementId,
      paymentTermsVersionId: booked.paymentTermsVersionId,
      skontoBps: booked.skontoBps ?? 0,
      billingKind: "FOLGERECHNUNG",
      mitigationFollowUpSourceInvoiceId: input.bookedInvoiceId,
      reason: `ADR-0024: automatischer Folge-Entwurf nach Buchung ${input.bookedInvoiceId} (${input.bookReason})`,
    });
    return { created: true, invoiceId: draft.invoiceId, billingKind: "FOLGERECHNUNG" };
  }

  /**
   * ENTWURF → GEBUCHT_VERSENDET (FIN-2 MVP): verbindliche Rechnungsnummer je Mandant, Traceability fail-closed.
   * Zwischenstatus GEPRUEFT/FREIGEGEBEN kann später ergänzt werden (siehe Authorization allowedActions).
   */
  public async bookInvoice(input: BookInvoiceInput): Promise<{
    invoiceId: UUID;
    status: Invoice["status"];
    invoiceNumber: string;
    issueDate: string;
    totalGrossCents: number;
  }> {
    const inv = this.repos.getInvoiceByTenant(input.tenantId, input.invoiceId);
    if (!inv) {
      throw new DomainError("DOCUMENT_NOT_FOUND", "Rechnung nicht gefunden", 404);
    }
    if (inv.status !== "ENTWURF") {
      throw new DomainError(
        "INVOICE_NOT_BOOKABLE",
        "Rechnung ist nicht im Status ENTWURF",
        409,
      );
    }
    if (inv.lvNetCents == null || inv.vatCents == null || inv.totalGrossCents == null) {
      throw new DomainError(
        "INVOICE_DRAFT_INCOMPLETE",
        "Rechnungsentwurf ohne Betraege — Entwurf neu erzeugen",
        422,
      );
    }

    const effectiveNow = this.repos.resolveEffectiveInvoiceTaxRegime(input.tenantId, inv.projectId);
    const snapshotRegime = inv.invoiceTaxRegime ?? ("STANDARD_VAT_19" as InvoiceTaxRegime);
    if (effectiveNow !== snapshotRegime) {
      throw new DomainError(
        "INVOICE_TAX_REGIME_CHANGED_RECREATE_DRAFT",
        "Steuerregime seit Entwurf geaendert — Entwurf verwerfen und neu anlegen",
        409,
      );
    }

    this.traceability.assertInvoiceTraceability(input.tenantId, input.invoiceId);

    const issueDate = input.issueDate ?? new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(issueDate)) {
      throw new DomainError("VALIDATION_FAILED", "issueDate muss ISO yyyy-mm-dd sein", 400);
    }

    const invoiceNumber = this.allocateNextInvoiceNumber(input.tenantId);
    const previous: Invoice = { ...inv };

    const updated: Invoice = {
      ...inv,
      status: "GEBUCHT_VERSENDET",
      invoiceNumber,
      issueDate,
    };
    this.repos.invoices.set(inv.id, updated);

    try {
      await this.persistence.syncInvoiceFromMemory(this.repos, input.tenantId, inv.id);
    } catch (err) {
      this.repos.invoices.set(inv.id, previous);
      if (isPrismaUniqueViolation(err)) {
        throw new DomainError(
          "INVOICE_NUMBER_CONFLICT",
          "Rechnungsnummer vergeben — bitte erneut buchen",
          409,
        );
      }
      throw err;
    }

    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "INVOICE",
      entityId: inv.id,
      action: "STATUS_CHANGED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: {
        status: previous.status,
        lvNetCents: previous.lvNetCents,
        vatCents: previous.vatCents,
        totalGrossCents: previous.totalGrossCents,
      },
      afterState: {
        status: updated.status,
        invoiceNumber: updated.invoiceNumber,
        issueDate: updated.issueDate,
        lvNetCents: updated.lvNetCents,
        vatCents: updated.vatCents,
        totalGrossCents: updated.totalGrossCents,
      },
    });

    return {
      invoiceId: inv.id,
      status: updated.status,
      invoiceNumber,
      issueDate,
      totalGrossCents: inv.totalGrossCents,
    };
  }

  /** Mandantenbezogen fortlaufend `RE-{UTC-Jahr}-{0001}` — Kollisionen durch DB-Unique + Retry abgefangen. */
  private allocateNextInvoiceNumber(tenantId: TenantId): string {
    const year = new Date().getUTCFullYear();
    const prefix = `RE-${year}-`;
    let maxSeq = 0;
    for (const row of this.repos.invoices.values()) {
      if (row.tenantId !== tenantId || !row.invoiceNumber?.startsWith(prefix)) continue;
      const rest = row.invoiceNumber.slice(prefix.length);
      const n = parseInt(rest, 10);
      if (!Number.isNaN(n)) maxSeq = Math.max(maxSeq, n);
    }
    return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
  }

  public getInvoice(tenantId: TenantId, invoiceId: UUID): {
    invoiceId: UUID;
    projectId: UUID;
    customerId: UUID;
    measurementId: UUID;
    lvVersionId: UUID;
    offerId: UUID;
    offerVersionId?: UUID;
    status: Invoice["status"];
    invoiceNumber?: string;
    issueDate?: string;
    lvNetCents?: number;
    invoiceTaxRegime: InvoiceTaxRegime;
    taxReasonCode?: string;
    mandatoryTaxNoticeLines?: string[];
    vatRateBps?: number;
    vatCents?: number;
    totalGrossCents?: number;
    totalPaidCents?: number;
    paymentTermsVersionId?: UUID;
    skontoBps: number;
    billingKind: InvoiceBillingKind;
    allocatedDifferenceBookings: ReturnType<typeof differenceBookingToReadJson>[];
  } {
    const inv = this.repos.getInvoiceByTenant(tenantId, invoiceId);
    if (!inv) {
      throw new DomainError("DOCUMENT_NOT_FOUND", "Rechnung nicht gefunden", 404);
    }
    const paidList = this.repos.listPaymentIntakesForInvoice(tenantId, inv.id);
    const totalPaidCents = paidList.reduce((s, p) => s + p.amountCents, 0);
    const regime = inv.invoiceTaxRegime ?? ("STANDARD_VAT_19" as InvoiceTaxRegime);
    const notices = getMandatoryTaxNoticeLines(regime);
    const allocatedDifferenceBookings = this.repos
      .listDifferenceBookingsAllocatedToInvoice(tenantId, inv.id)
      .map(differenceBookingToReadJson);
    return {
      invoiceId: inv.id,
      projectId: inv.projectId,
      customerId: inv.customerId,
      measurementId: inv.measurementId,
      lvVersionId: inv.lvId,
      offerId: inv.offerId,
      offerVersionId: inv.offerVersionId,
      status: inv.status,
      invoiceNumber: inv.invoiceNumber,
      issueDate: inv.issueDate,
      lvNetCents: inv.lvNetCents,
      invoiceTaxRegime: regime,
      taxReasonCode: inv.taxReasonCode,
      mandatoryTaxNoticeLines: notices.length > 0 ? notices : undefined,
      vatRateBps:
        inv.lvNetCents != null && inv.vatCents != null
          ? (inv.vatRateBpsEffective ?? GERMAN_VAT_STANDARD_BPS)
          : undefined,
      vatCents: inv.vatCents,
      totalGrossCents: inv.totalGrossCents,
      totalPaidCents: paidList.length > 0 ? totalPaidCents : undefined,
      paymentTermsVersionId: inv.paymentTermsVersionId,
      skontoBps: inv.skontoBps ?? 0,
      billingKind: inv.billingKind ?? "REGULAR",
      allocatedDifferenceBookings,
    };
  }

  /** Mandanten-isoliert; Rechnung muss existieren. Sortierung nach `createdAt` aufsteigend. */
  public listPaymentIntakesForInvoiceRead(tenantId: TenantId, invoiceId: UUID): PaymentIntakeReadRow[] {
    const inv = this.repos.getInvoiceByTenant(tenantId, invoiceId);
    if (!inv) {
      throw new DomainError("DOCUMENT_NOT_FOUND", "Rechnung nicht gefunden", 404);
    }
    const rows = this.repos.listPaymentIntakesForInvoice(tenantId, invoiceId);
    return rows
      .map((p) => ({
        paymentIntakeId: p.id,
        amountCents: p.amountCents,
        externalReference: p.externalReference,
        createdAt: p.createdAt.toISOString(),
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  /** FIN-4: Mahn-Ereignisse lesen — gleiche Leserolle wie Rechnung; sortiert nach `createdAt`. */
  public listDunningRemindersForInvoiceRead(tenantId: TenantId, invoiceId: UUID): DunningReminderReadRow[] {
    const inv = this.repos.getInvoiceByTenant(tenantId, invoiceId);
    if (!inv) {
      throw new DomainError("DOCUMENT_NOT_FOUND", "Rechnung nicht gefunden", 404);
    }
    const rows = this.repos.listDunningRemindersForInvoice(tenantId, invoiceId);
    return rows
      .map((r) => ({
        dunningReminderId: r.id,
        stageOrdinal: r.stageOrdinal,
        note: r.note,
        createdAt: r.createdAt.toISOString(),
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  private static readonly OPEN_RECEIVABLE_STATUSES: ReadonlySet<Invoice["status"]> = new Set([
    "GEBUCHT_VERSENDET",
    "TEILBEZAHLT",
  ]);

  /**
   * Gebuchte/teilbezahlte Rechnungen mit positivem Restsaldo (ohne Mahnstufen-Filter).
   * Leserechte wie `GET /invoices/:invoiceId`.
   */
  public listOpenReceivablesRead(
    tenantId: TenantId,
    filter?: { projectId?: UUID; customerId?: UUID },
  ): OpenReceivableReadRow[] {
    const rows: OpenReceivableReadRow[] = [];
    for (const inv of this.repos.listInvoicesForTenant(tenantId)) {
      if (!InvoiceService.OPEN_RECEIVABLE_STATUSES.has(inv.status)) continue;
      if (filter?.projectId && inv.projectId !== filter.projectId) continue;
      if (filter?.customerId && inv.customerId !== filter.customerId) continue;
      const total = inv.totalGrossCents;
      if (total == null) continue;
      const paidList = this.repos.listPaymentIntakesForInvoice(tenantId, inv.id);
      const totalPaidCents = paidList.reduce((s, p) => s + p.amountCents, 0);
      const openAmountCents = total - totalPaidCents;
      if (openAmountCents <= 0) continue;
      rows.push({
        invoiceId: inv.id,
        status: inv.status as "GEBUCHT_VERSENDET" | "TEILBEZAHLT",
        projectId: inv.projectId,
        customerId: inv.customerId,
        invoiceNumber: inv.invoiceNumber,
        issueDate: inv.issueDate,
        totalGrossCents: total,
        totalPaidCents,
        openAmountCents,
      });
    }
    rows.sort((a, b) => {
      const dA = a.issueDate ?? "";
      const dB = b.issueDate ?? "";
      if (dA !== dB) return dB.localeCompare(dA);
      return a.invoiceId.localeCompare(b.invoiceId);
    });
    return rows;
  }
}
