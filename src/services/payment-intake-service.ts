import { randomUUID } from "node:crypto";
import type { Invoice, PaymentIntake, TenantId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import type { InvoicePersistencePort } from "../persistence/invoice-persistence.js";
import type { PaymentIntakePersistencePort } from "../persistence/payment-intake-persistence.js";
import { AuditService } from "./audit-service.js";

export type RecordPaymentIntakeInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  invoiceId: UUID;
  idempotencyKey: UUID;
  amountCents: number;
  externalReference: string;
  reason: string;
};

export type RecordPaymentIntakeResult = {
  replay: boolean;
  paymentIntakeId: UUID;
  invoiceId: UUID;
  amountCents: number;
  totalPaidCentsAfter: number;
  invoiceOpenCentsAfter: number;
  invoiceStatus: Invoice["status"];
};

const PAYABLE: ReadonlySet<Invoice["status"]> = new Set(["GEBUCHT_VERSENDET", "TEILBEZAHLT"]);

export class PaymentIntakeService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly audit: AuditService,
    private readonly invoicePersistence: InvoicePersistencePort,
    private readonly paymentIntakePersistence: PaymentIntakePersistencePort,
  ) {}

  public async record(input: RecordPaymentIntakeInput): Promise<RecordPaymentIntakeResult> {
    const existing = this.repos.getPaymentIntakeByIdempotency(input.tenantId, input.idempotencyKey);
    if (existing) {
      if (existing.invoiceId !== input.invoiceId || existing.amountCents !== input.amountCents) {
        throw new DomainError(
          "VALIDATION_FAILED",
          "Idempotency-Key bereits verwendet (abweichender Beleg)",
          400,
        );
      }
      return this.buildResult(existing, true);
    }

    const inv = this.repos.getInvoiceByTenant(input.tenantId, input.invoiceId);
    if (!inv) {
      throw new DomainError("DOCUMENT_NOT_FOUND", "Rechnung nicht gefunden", 404);
    }
    if (!PAYABLE.has(inv.status)) {
      throw new DomainError(
        "VALIDATION_FAILED",
        "Rechnung in diesem Status nicht zahlbar (nur gebucht/versendet oder teilbezahlt)",
        400,
      );
    }
    if (inv.totalGrossCents == null || inv.lvNetCents == null || inv.vatCents == null) {
      throw new DomainError(
        "VALIDATION_FAILED",
        "Rechnung ohne berechneten Bruttobetrag (8.4) — Zahlung nicht moeglich",
        400,
      );
    }
    const priorPaid = this.repos
      .listPaymentIntakesForInvoice(input.tenantId, input.invoiceId)
      .reduce((s, p) => s + p.amountCents, 0);
    if (priorPaid + input.amountCents > inv.totalGrossCents) {
      throw new DomainError(
        "VALIDATION_FAILED",
        "Zahlungsbetrag uebersteigt offenen Rechnungsbetrag",
        400,
      );
    }

    const id = randomUUID();
    const row: PaymentIntake = {
      id,
      tenantId: input.tenantId,
      invoiceId: input.invoiceId,
      idempotencyKey: input.idempotencyKey,
      amountCents: input.amountCents,
      externalReference: input.externalReference,
      createdAt: new Date(),
    };
    this.repos.putPaymentIntake(row);

    const newPaid = priorPaid + input.amountCents;
    let nextStatus = inv.status;
    if (newPaid >= inv.totalGrossCents) {
      nextStatus = "BEZAHLT";
    } else if (newPaid > 0 && inv.status === "GEBUCHT_VERSENDET") {
      nextStatus = "TEILBEZAHLT";
    }

    inv.status = nextStatus;
    this.repos.invoices.set(inv.id, inv);

    await this.paymentIntakePersistence.persistIntake(row);
    await this.invoicePersistence.syncInvoiceFromMemory(this.repos, input.tenantId, inv.id);

    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "INVOICE",
      entityId: inv.id,
      action: "STATUS_CHANGED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      afterState: {
        paymentIntakeId: id,
        amountCents: input.amountCents,
        totalPaidCents: newPaid,
        invoiceStatus: nextStatus,
        externalReference: input.externalReference,
      },
    });

    return this.buildResult(row, false);
  }

  private buildResult(row: PaymentIntake, replay: boolean): RecordPaymentIntakeResult {
    const inv = this.repos.getInvoiceByTenant(row.tenantId, row.invoiceId);
    if (!inv || inv.totalGrossCents == null) {
      throw new DomainError("DOCUMENT_NOT_FOUND", "Rechnung nicht gefunden", 404);
    }
    const totalPaidCentsAfter = this.repos
      .listPaymentIntakesForInvoice(row.tenantId, row.invoiceId)
      .reduce((s, p) => s + p.amountCents, 0);
    const invoiceOpenCentsAfter = Math.max(0, inv.totalGrossCents - totalPaidCentsAfter);
    return {
      replay,
      paymentIntakeId: row.id,
      invoiceId: row.invoiceId,
      amountCents: row.amountCents,
      totalPaidCentsAfter,
      invoiceOpenCentsAfter,
      invoiceStatus: inv.status,
    };
  }
}
