import { randomUUID } from "node:crypto";
import type { DifferenceBooking, Invoice, TenantId, UserId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import { AuditService } from "./audit-service.js";
import type { DifferenceBookingPersistencePort } from "../persistence/difference-booking-persistence.js";
import { noopDifferenceBookingPersistence } from "../persistence/difference-booking-persistence.js";

const BOOKED_INVOICE_STATUSES = new Set<Invoice["status"]>(["GEBUCHT_VERSENDET", "TEILBEZAHLT", "BEZAHLT"]);

function hasPriorSchlussrechnung(
  repos: InMemoryRepositories,
  tenantId: TenantId,
  measurementId: UUID,
  currentInvoiceId: UUID,
  currentIssueDate: string,
): boolean {
  const candidates: Invoice[] = [];
  for (const inv of repos.invoices.values()) {
    if (inv.tenantId !== tenantId || inv.measurementId !== measurementId) continue;
    if (!BOOKED_INVOICE_STATUSES.has(inv.status)) continue;
    if (inv.billingKind !== "SCHLUSSRECHNUNG") continue;
    if (inv.id === currentInvoiceId) continue;
    const d = inv.issueDate ?? "";
    if (!d) continue;
    candidates.push(inv);
  }
  for (const inv of candidates) {
    const d = inv.issueDate ?? "";
    if (d < currentIssueDate) return true;
    if (d === currentIssueDate && inv.id.localeCompare(currentInvoiceId) < 0) return true;
  }
  return false;
}

function measurementVersionNetStep1Cents(repos: InMemoryRepositories, tenantId: TenantId, measurementVersionId: UUID): number {
  const version = repos.getMeasurementVersionByTenant(tenantId, measurementVersionId);
  if (!version) return 0;
  const measurement = repos.getMeasurementByTenant(tenantId, version.measurementId);
  if (!measurement) return 0;
  const positions = repos.listMeasurementPositionsForVersion(tenantId, measurementVersionId);
  let sum = 0;
  for (const mp of positions) {
    const lp = repos.getLvPositionByTenant(tenantId, mp.lvPositionId);
    if (!lp || lp.lvVersionId !== measurement.lvVersionId) continue;
    if (lp.kind !== "NORMAL") continue;
    sum += Math.round(mp.quantity * lp.unitPriceCents);
  }
  return sum;
}

function pickReferenceInvoiceId(repos: InMemoryRepositories, tenantId: TenantId, measurementId: UUID): UUID | undefined {
  const list = repos
    .listInvoicesForMeasurement(tenantId, measurementId)
    .filter((inv) => BOOKED_INVOICE_STATUSES.has(inv.status));
  if (list.length === 0) return undefined;
  list.sort((a, b) => {
    const da = a.issueDate ?? "";
    const db = b.issueDate ?? "";
    if (da !== db) return db.localeCompare(da);
    return b.id.localeCompare(a.id);
  });
  return list[0]?.id;
}

export class DifferenceBookingService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly audit: AuditService,
    private readonly persistence: DifferenceBookingPersistencePort = noopDifferenceBookingPersistence,
  ) {}

  public listForProject(tenantId: TenantId, projectId: UUID): DifferenceBooking[] {
    if (!this.repos.tenantHasProjectContext(tenantId, projectId)) {
      throw new DomainError("PROJECT_NOT_FOUND", "Projekt-Kontext fuer Mandant nicht gefunden", 404);
    }
    return this.repos.listDifferenceBookingsForProject(tenantId, projectId);
  }

  /** Lesepfad: nur Zeilen mit `referenceInvoiceId === invoiceId` (explizite Zuordnung; ADR-0021: keine Entwurfs-Andeutung ohne Serverfeld). */
  public listForInvoiceReference(tenantId: TenantId, invoiceId: UUID): DifferenceBooking[] {
    const inv = this.repos.getInvoiceByTenant(tenantId, invoiceId);
    if (!inv) {
      throw new DomainError("DOCUMENT_NOT_FOUND", "Rechnung fuer Mandant nicht gefunden", 404);
    }
    return this.repos.listDifferenceBookingsForReferenceInvoice(tenantId, invoiceId);
  }

  /**
   * Gebündelte Lesesicht §8.6 / ADR-0021 Slice 3: OFFENE Zeilen plus Zuordnungen zu ENTWÜRFEN (ohne Client-Nachrechnung).
   */
  public summarizeProjectBookings(tenantId: TenantId, projectId: UUID): {
    open: DifferenceBooking[];
    allocatedByDraft: { draftInvoiceId: UUID; invoiceStatus: string; rows: DifferenceBooking[] }[];
  } {
    const rows = this.listForProject(tenantId, projectId);
    const open = rows.filter((r) => r.status === "OPEN");
    const allocated = rows.filter((r) => r.status === "ALLOCATED_TO_DRAFT" && r.allocatedInvoiceId);
    const byDraft = new Map<UUID, DifferenceBooking[]>();
    for (const r of allocated) {
      const id = r.allocatedInvoiceId!;
      const arr = byDraft.get(id) ?? [];
      arr.push(r);
      byDraft.set(id, arr);
    }
    const allocatedByDraft = [...byDraft.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([draftInvoiceId, draftRows]) => {
        const inv = this.repos.getInvoiceByTenant(tenantId, draftInvoiceId);
        return {
          draftInvoiceId,
          invoiceStatus: inv?.status ?? "UNKNOWN",
          rows: draftRows,
        };
      });
    return { open, allocatedByDraft };
  }

  public async afterMeasurementVersionCreated(input: {
    tenantId: TenantId;
    actorUserId: UserId;
    measurementId: UUID;
    predecessorMeasurementVersionId: UUID;
    subsequentMeasurementVersionId: UUID;
    reason: string;
  }): Promise<void> {
    const measurement = this.repos.getMeasurementByTenant(input.tenantId, input.measurementId);
    if (!measurement) return;
    const refInvoiceId = pickReferenceInvoiceId(this.repos, input.tenantId, measurement.id);
    if (!refInvoiceId) return;

    const priorNet = measurementVersionNetStep1Cents(this.repos, input.tenantId, input.predecessorMeasurementVersionId);
    const subNet = measurementVersionNetStep1Cents(this.repos, input.tenantId, input.subsequentMeasurementVersionId);
    const amountNetCents = subNet - priorNet;
    const now = new Date();
    const row: DifferenceBooking = {
      id: randomUUID(),
      tenantId: input.tenantId,
      projectId: measurement.projectId,
      customerId: measurement.customerId,
      measurementId: measurement.id,
      predecessorMeasurementVersionId: input.predecessorMeasurementVersionId,
      subsequentMeasurementVersionId: input.subsequentMeasurementVersionId,
      kind: "MEASUREMENT_CORRECTION_AFTER_INVOICE",
      amountNetCents,
      status: "OPEN",
      referenceInvoiceId: refInvoiceId,
      createdAt: now,
      createdBy: input.actorUserId,
    };
    this.repos.putDifferenceBooking(row);
    await this.persistence.syncFromMemory(this.repos, input.tenantId, row.id);
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "DIFFERENCE_BOOKING",
      entityId: row.id,
      action: "DIFFERENCE_BOOKING_CREATED",
      timestamp: now,
      actorUserId: input.actorUserId,
      reason: input.reason,
      afterState: {
        measurementId: row.measurementId,
        predecessorMeasurementVersionId: row.predecessorMeasurementVersionId,
        subsequentMeasurementVersionId: row.subsequentMeasurementVersionId,
        amountNetCents: row.amountNetCents,
        referenceInvoiceId: row.referenceInvoiceId,
      },
    });
  }

  public async afterMeasurementPositionsUpdated(input: {
    tenantId: TenantId;
    actorUserId: UserId;
    measurementVersionId: UUID;
    reason: string;
  }): Promise<void> {
    const booking = this.repos.getDifferenceBookingBySubsequentVersion(
      input.tenantId,
      input.measurementVersionId,
    );
    if (!booking || booking.status === "SETTLED") return;
    if (booking.kind !== "MEASUREMENT_CORRECTION_AFTER_INVOICE" || !booking.subsequentMeasurementVersionId) return;

    const priorNet = measurementVersionNetStep1Cents(this.repos, input.tenantId, booking.predecessorMeasurementVersionId!);
    const subNet = measurementVersionNetStep1Cents(this.repos, input.tenantId, booking.subsequentMeasurementVersionId);
    const nextAmount = subNet - priorNet;
    if (nextAmount === booking.amountNetCents) return;

    const before = { amountNetCents: booking.amountNetCents };
    booking.amountNetCents = nextAmount;
    this.repos.putDifferenceBooking(booking);
    await this.persistence.syncFromMemory(this.repos, input.tenantId, booking.id);
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "DIFFERENCE_BOOKING",
      entityId: booking.id,
      action: "DIFFERENCE_BOOKING_AMOUNT_RECALCULATED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: before,
      afterState: { amountNetCents: nextAmount },
    });
  }

  public async allocateToInvoiceDraft(input: {
    tenantId: TenantId;
    actorUserId: UserId;
    invoiceId: UUID;
    differenceBookingIds: UUID[];
    reason: string;
  }): Promise<void> {
    const inv = this.repos.getInvoiceByTenant(input.tenantId, input.invoiceId);
    if (!inv) {
      throw new DomainError("DOCUMENT_NOT_FOUND", "Rechnung nicht gefunden", 404);
    }
    if (inv.status !== "ENTWURF") {
      throw new DomainError(
        "INVOICE_NOT_DRAFT_FOR_ALLOCATION",
        "Differenzbuchung nur zu Rechnungsentwurf zuordenbar",
        409,
      );
    }
    const now = new Date();
    for (const bid of input.differenceBookingIds) {
      const b = this.repos.getDifferenceBookingByTenant(input.tenantId, bid);
      if (!b) {
        throw new DomainError("DIFFERENCE_BOOKING_NOT_FOUND", "Differenzbuchung nicht gefunden", 404);
      }
      if (b.status !== "OPEN") {
        throw new DomainError("DIFFERENCE_BOOKING_NOT_OPEN", "Differenzbuchung ist nicht offen", 409);
      }
      if (b.projectId !== inv.projectId || b.measurementId !== inv.measurementId) {
        throw new DomainError(
          "DIFFERENCE_BOOKING_INVOICE_CONTEXT_MISMATCH",
          "Differenzbuchung passt nicht zu Projekt/Aufmass der Rechnung",
          422,
        );
      }
      const before = { status: b.status, allocatedInvoiceId: b.allocatedInvoiceId };
      b.status = "ALLOCATED_TO_DRAFT";
      b.allocatedInvoiceId = input.invoiceId;
      b.allocatedAt = now;
      this.repos.putDifferenceBooking(b);
      await this.persistence.syncFromMemory(this.repos, input.tenantId, b.id);
      await this.audit.append({
        id: randomUUID(),
        tenantId: input.tenantId,
        entityType: "DIFFERENCE_BOOKING",
        entityId: b.id,
        action: "DIFFERENCE_BOOKING_ALLOCATED_TO_DRAFT",
        timestamp: now,
        actorUserId: input.actorUserId,
        reason: input.reason,
        beforeState: before,
        afterState: {
          status: b.status,
          allocatedInvoiceId: b.allocatedInvoiceId,
          invoiceId: input.invoiceId,
        },
      });
    }
  }

  public async deallocateFromInvoiceDraft(input: {
    tenantId: TenantId;
    actorUserId: UserId;
    invoiceId: UUID;
    differenceBookingIds: UUID[];
    reason: string;
  }): Promise<void> {
    const inv = this.repos.getInvoiceByTenant(input.tenantId, input.invoiceId);
    if (!inv) {
      throw new DomainError("DOCUMENT_NOT_FOUND", "Rechnung nicht gefunden", 404);
    }
    if (inv.status !== "ENTWURF") {
      throw new DomainError(
        "INVOICE_NOT_DRAFT_FOR_ALLOCATION",
        "Zuordnung nur bei Rechnungsentwurf aenderbar",
        409,
      );
    }
    const now = new Date();
    for (const bid of input.differenceBookingIds) {
      const b = this.repos.getDifferenceBookingByTenant(input.tenantId, bid);
      if (!b) {
        throw new DomainError("DIFFERENCE_BOOKING_NOT_FOUND", "Differenzbuchung nicht gefunden", 404);
      }
      if (b.status !== "ALLOCATED_TO_DRAFT" || b.allocatedInvoiceId !== input.invoiceId) {
        throw new DomainError(
          "DIFFERENCE_BOOKING_NOT_ALLOCATED_TO_INVOICE",
          "Differenzbuchung ist diesem Entwurf nicht zugeordnet",
          409,
        );
      }
      const before = { status: b.status, allocatedInvoiceId: b.allocatedInvoiceId };
      b.status = "OPEN";
      b.allocatedInvoiceId = undefined;
      b.allocatedAt = undefined;
      this.repos.putDifferenceBooking(b);
      await this.persistence.syncFromMemory(this.repos, input.tenantId, b.id);
      await this.audit.append({
        id: randomUUID(),
        tenantId: input.tenantId,
        entityType: "DIFFERENCE_BOOKING",
        entityId: b.id,
        action: "DIFFERENCE_BOOKING_DEALLOCATED_FROM_DRAFT",
        timestamp: now,
        actorUserId: input.actorUserId,
        reason: input.reason,
        beforeState: before,
        afterState: { status: b.status },
      });
    }
  }

  /** §8.6 Slice 2b: serverseitige Konditions-Differenz (Betrag bis FIN-8.4-Motor extern belegt / API-first). */
  public async createPaymentTermsDifferenceBooking(input: {
    tenantId: TenantId;
    actorUserId: UserId;
    projectId: UUID;
    measurementId: UUID;
    referenceInvoiceId: UUID;
    predecessorPaymentTermsVersionId: UUID;
    subsequentPaymentTermsVersionId: UUID;
    amountNetCents: number;
    reason: string;
  }): Promise<void> {
    if (!this.repos.tenantHasProjectContext(input.tenantId, input.projectId)) {
      throw new DomainError("PROJECT_NOT_FOUND", "Projekt-Kontext fuer Mandant nicht gefunden", 404);
    }
    const refInv = this.repos.getInvoiceByTenant(input.tenantId, input.referenceInvoiceId);
    if (!refInv || !BOOKED_INVOICE_STATUSES.has(refInv.status)) {
      throw new DomainError("DOCUMENT_NOT_FOUND", "Referenz-Rechnung nicht gefunden oder nicht gebucht", 404);
    }
    if (refInv.projectId !== input.projectId || refInv.measurementId !== input.measurementId) {
      throw new DomainError(
        "DIFFERENCE_BOOKING_INVOICE_CONTEXT_MISMATCH",
        "Referenz-Rechnung passt nicht zu Projekt/Aufmass",
        422,
      );
    }
    if (refInv.paymentTermsVersionId !== input.predecessorPaymentTermsVersionId) {
      throw new DomainError(
        "DIFFERENCE_BOOKING_PAYMENT_TERMS_REFERENCE_MISMATCH",
        "Referenz-Rechnung ist nicht an die angegebene Vorgaenger-Konditionsversion gebunden",
        422,
      );
    }
    const pred = this.repos.getPaymentTermsVersionByTenant(input.tenantId, input.predecessorPaymentTermsVersionId);
    const sub = this.repos.getPaymentTermsVersionByTenant(input.tenantId, input.subsequentPaymentTermsVersionId);
    if (!pred || !sub) {
      throw new DomainError("DOCUMENT_NOT_FOUND", "Zahlungsbedingungs-Version nicht gefunden", 404);
    }
    if (pred.headId !== sub.headId || pred.tenantId !== sub.tenantId) {
      throw new DomainError("VALIDATION_FAILED", "Konditionsversionen gehoeren nicht zum selben Kopf", 422);
    }
    const head = this.repos.getPaymentTermsHeadByTenant(input.tenantId, pred.headId);
    if (!head || head.projectId !== input.projectId) {
      throw new DomainError(
        "TRACEABILITY_FIELD_MISMATCH",
        "Zahlungsbedingungen gehoeren nicht zum Projekt",
        422,
      );
    }
    if (sub.versionNumber <= pred.versionNumber) {
      throw new DomainError(
        "VALIDATION_FAILED",
        "Nachfolge-Konditionsversion muss nach der Vorgaengerversion liegen",
        422,
      );
    }
    for (const b of this.repos.differenceBookings.values()) {
      if (b.tenantId !== input.tenantId) continue;
      if (b.kind !== "PAYMENT_TERMS_CHANGE_AFTER_INVOICE") continue;
      if (
        b.referenceInvoiceId === input.referenceInvoiceId &&
        b.predecessorPaymentTermsVersionId === input.predecessorPaymentTermsVersionId &&
        b.subsequentPaymentTermsVersionId === input.subsequentPaymentTermsVersionId
      ) {
        throw new DomainError(
          "DIFFERENCE_BOOKING_PAYMENT_TERMS_DUPLICATE",
          "Differenzbuchung fuer dieses Konditionspaar und diese Referenz-Rechnung existiert bereits",
          409,
        );
      }
    }
    const measurement = this.repos.getMeasurementByTenant(input.tenantId, input.measurementId);
    if (!measurement || measurement.projectId !== input.projectId) {
      throw new DomainError("MEASUREMENT_NOT_FOUND", "Aufmass nicht gefunden oder Projekt passt nicht", 404);
    }
    const now = new Date();
    const row: DifferenceBooking = {
      id: randomUUID(),
      tenantId: input.tenantId,
      projectId: measurement.projectId,
      customerId: measurement.customerId,
      measurementId: measurement.id,
      kind: "PAYMENT_TERMS_CHANGE_AFTER_INVOICE",
      amountNetCents: input.amountNetCents,
      status: "OPEN",
      referenceInvoiceId: input.referenceInvoiceId,
      predecessorPaymentTermsVersionId: input.predecessorPaymentTermsVersionId,
      subsequentPaymentTermsVersionId: input.subsequentPaymentTermsVersionId,
      createdAt: now,
      createdBy: input.actorUserId,
    };
    this.repos.putDifferenceBooking(row);
    await this.persistence.syncFromMemory(this.repos, input.tenantId, row.id);
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "DIFFERENCE_BOOKING",
      entityId: row.id,
      action: "DIFFERENCE_BOOKING_CREATED",
      timestamp: now,
      actorUserId: input.actorUserId,
      reason: input.reason,
      afterState: {
        kind: row.kind,
        referenceInvoiceId: row.referenceInvoiceId,
        predecessorPaymentTermsVersionId: row.predecessorPaymentTermsVersionId,
        subsequentPaymentTermsVersionId: row.subsequentPaymentTermsVersionId,
        amountNetCents: row.amountNetCents,
      },
    });
  }

  /** §8.6(a): Hinweis nach Buchung, wenn zuvor Schlussrechnung gebucht war und Ausgleichszellen jetzt SETTLED wurden. */
  public buildSchlussrechnungMitigation(input: {
    tenantId: TenantId;
    bookedInvoiceId: UUID;
    issueDate: string;
    settledSnapshots: { amountNetCents: number }[];
  }): { applies: false } | { applies: true; settledDifferenceNetSumCents: number; suggestedNextBillingKind: "FOLGERECHNUNG" | "GUTSCHRIFT" } {
    if (input.settledSnapshots.length === 0) return { applies: false };
    const sum = input.settledSnapshots.reduce((s, r) => s + r.amountNetCents, 0);
    if (sum === 0) return { applies: false };
    const inv = this.repos.getInvoiceByTenant(input.tenantId, input.bookedInvoiceId);
    if (!inv) return { applies: false };
    if (
      !hasPriorSchlussrechnung(
        this.repos,
        input.tenantId,
        inv.measurementId,
        input.bookedInvoiceId,
        input.issueDate,
      )
    ) {
      return { applies: false };
    }
    return {
      applies: true,
      settledDifferenceNetSumCents: sum,
      suggestedNextBillingKind: sum > 0 ? "FOLGERECHNUNG" : "GUTSCHRIFT",
    };
  }

  /** Nach erfolgreicher Buchung der Ausgleichs-Rechnung (ADR-0022). */
  public async settleAllocationsAfterInvoiceBooked(input: {
    tenantId: TenantId;
    invoiceId: UUID;
    actorUserId: UserId;
    reason: string;
  }): Promise<{ settledSnapshots: { amountNetCents: number }[] }> {
    const rows = this.repos
      .listDifferenceBookingsAllocatedToInvoice(input.tenantId, input.invoiceId)
      .filter((b) => b.status === "ALLOCATED_TO_DRAFT");
    const settledSnapshots = rows.map((r) => ({ amountNetCents: r.amountNetCents }));
    const now = new Date();
    for (const b of rows) {
      const before = { status: b.status, settledAt: b.settledAt };
      b.status = "SETTLED";
      b.settledAt = now;
      this.repos.putDifferenceBooking(b);
      await this.persistence.syncFromMemory(this.repos, input.tenantId, b.id);
      await this.audit.append({
        id: randomUUID(),
        tenantId: input.tenantId,
        entityType: "DIFFERENCE_BOOKING",
        entityId: b.id,
        action: "DIFFERENCE_BOOKING_SETTLED",
        timestamp: now,
        actorUserId: input.actorUserId,
        reason: input.reason,
        beforeState: before,
        afterState: { status: b.status, settledAt: b.settledAt?.toISOString(), invoiceId: input.invoiceId },
      });
    }
    return { settledSnapshots };
  }
}

export function differenceBookingToReadJson(b: DifferenceBooking): {
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
  referenceInvoiceId: string | null;
  allocatedInvoiceId: string | null;
  allocatedAt: string | null;
  settledAt: string | null;
  createdAt: string;
  createdBy: string;
} {
  return {
    id: b.id,
    projectId: b.projectId,
    measurementId: b.measurementId,
    predecessorMeasurementVersionId: b.predecessorMeasurementVersionId ?? null,
    subsequentMeasurementVersionId: b.subsequentMeasurementVersionId ?? null,
    predecessorPaymentTermsVersionId: b.predecessorPaymentTermsVersionId ?? null,
    subsequentPaymentTermsVersionId: b.subsequentPaymentTermsVersionId ?? null,
    kind: b.kind,
    amountNetCents: b.amountNetCents,
    status: b.status,
    referenceInvoiceId: b.referenceInvoiceId ?? null,
    allocatedInvoiceId: b.allocatedInvoiceId ?? null,
    allocatedAt: b.allocatedAt?.toISOString() ?? null,
    settledAt: b.settledAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    createdBy: b.createdBy,
  };
}
