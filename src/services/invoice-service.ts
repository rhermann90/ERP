import { randomUUID } from "node:crypto";
import {
  computeGrossFromLvNetEurMvp,
  GERMAN_VAT_STANDARD_BPS,
  sumLvNetCentsStep84_1,
} from "../domain/invoice-calculation.js";
import type { Invoice, TenantId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import type { InvoicePersistencePort } from "../persistence/invoice-persistence.js";
import { AuditService } from "./audit-service.js";

export type CreateInvoiceDraftInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  lvVersionId: UUID;
  offerVersionId: UUID;
  invoiceCurrencyCode: "EUR";
  paymentTermsVersionId?: UUID;
  reason: string;
};

export class InvoiceService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly audit: AuditService,
    private readonly persistence: InvoicePersistencePort,
  ) {}

  public async createDraft(input: CreateInvoiceDraftInput): Promise<{
    invoiceId: UUID;
    lvNetCents: number;
    vatRateBps: number;
    vatCents: number;
    totalGrossCents: number;
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
    const lvNetCents = sumLvNetCentsStep84_1(lvPositions);
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
      },
    });

    return { invoiceId: id, lvNetCents, vatRateBps, vatCents, totalGrossCents };
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
    };
  }
}
