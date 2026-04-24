import { randomUUID } from "node:crypto";
import {
  computeGrossFromLvNetEurMvp,
  GERMAN_VAT_STANDARD_BPS,
  netCentsAfterStep84_6Mvp,
  sumLvNetCentsStep84_1,
} from "../domain/invoice-calculation.js";
import type { Invoice, TenantId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import type { InvoicePersistencePort } from "../persistence/invoice-persistence.js";
import { AuditService } from "./audit-service.js";
import type { TraceabilityService } from "./traceability-service.js";

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

export type CreateInvoiceDraftInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  lvVersionId: UUID;
  offerVersionId: UUID;
  invoiceCurrencyCode: "EUR";
  paymentTermsVersionId?: UUID;
  /** 8.4(2) B2-1a: Skonto in Basispunkten; fehlend = 0. */
  skontoBps?: number;
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

/** Lesepfad FIN-3: Zahlungseingänge je Rechnung (ohne Idempotency-Key im API-Body). */
export type PaymentIntakeReadRow = {
  paymentIntakeId: UUID;
  amountCents: number;
  externalReference: string;
  createdAt: string;
};

/** Lesepfad FIN-4 (Stub): Mahn-Ereignisse je Rechnung. */
export type DunningReminderReadRow = {
  dunningReminderId: UUID;
  stageOrdinal: number;
  note?: string;
  createdAt: string;
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
    const measurements = [...this.repos.measurements.values()].filter(
      (m) =>
        m.tenantId === input.tenantId &&
        m.projectId === offer.projectId &&
        m.customerId === offer.customerId &&
        m.lvVersionId === input.lvVersionId,
    );
    if (measurements.length === 0) {
      throw new DomainError(
        "TRACEABILITY_LINK_MISSING",
        "Kein Aufmass fuer Projekt/Kunde/LV-Version — Rechnungskette unvollstaendig",
        422,
      );
    }
    const measurement = measurements[0]!;

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
    const lvNetCents = netCentsAfterStep84_6Mvp(lvNetAfterStep1, { skontoBps });
    if (lvNetCents <= 0) {
      throw new DomainError(
        "VALIDATION_FAILED",
        "LV-Summe Netto (8.4 Schritt 1) ist 0 — keine abrechenbare NORMAL-Position",
        400,
      );
    }
    const { vatRateBps, vatCents, totalGrossCents } = computeGrossFromLvNetEurMvp(lvNetCents);

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
      },
    });

    return { invoiceId: id, lvNetCents, vatRateBps, vatCents, totalGrossCents, skontoBps };
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
    vatRateBps?: number;
    vatCents?: number;
    totalGrossCents?: number;
    totalPaidCents?: number;
    paymentTermsVersionId?: UUID;
    skontoBps: number;
  } {
    const inv = this.repos.getInvoiceByTenant(tenantId, invoiceId);
    if (!inv) {
      throw new DomainError("DOCUMENT_NOT_FOUND", "Rechnung nicht gefunden", 404);
    }
    const paidList = this.repos.listPaymentIntakesForInvoice(tenantId, inv.id);
    const totalPaidCents = paidList.reduce((s, p) => s + p.amountCents, 0);
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
      vatRateBps: inv.lvNetCents != null && inv.vatCents != null ? GERMAN_VAT_STANDARD_BPS : undefined,
      vatCents: inv.vatCents,
      totalGrossCents: inv.totalGrossCents,
      totalPaidCents: paidList.length > 0 ? totalPaidCents : undefined,
      paymentTermsVersionId: inv.paymentTermsVersionId,
      skontoBps: inv.skontoBps ?? 0,
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

  /** FIN-4 Stub: gleiche Leserolle wie Rechnung; sortiert nach `createdAt`. */
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
}
