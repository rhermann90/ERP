import { randomUUID } from "node:crypto";
import type { DifferenceBooking, Invoice, TenantId, UserId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import { AuditService } from "./audit-service.js";
import type { DifferenceBookingPersistencePort } from "../persistence/difference-booking-persistence.js";
import { noopDifferenceBookingPersistence } from "../persistence/difference-booking-persistence.js";

const BOOKED_INVOICE_STATUSES = new Set<Invoice["status"]>(["GEBUCHT_VERSENDET", "TEILBEZAHLT", "BEZAHLT"]);

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

function tenantHasProjectContext(repos: InMemoryRepositories, tenantId: TenantId, projectId: UUID): boolean {
  if ([...repos.measurements.values()].some((m) => m.tenantId === tenantId && m.projectId === projectId)) {
    return true;
  }
  if ([...repos.offers.values()].some((o) => o.tenantId === tenantId && o.projectId === projectId)) {
    return true;
  }
  if ([...repos.invoices.values()].some((i) => i.tenantId === tenantId && i.projectId === projectId)) {
    return true;
  }
  return false;
}

export class DifferenceBookingService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly audit: AuditService,
    private readonly persistence: DifferenceBookingPersistencePort = noopDifferenceBookingPersistence,
  ) {}

  public listForProject(tenantId: TenantId, projectId: UUID): DifferenceBooking[] {
    if (!tenantHasProjectContext(this.repos, tenantId, projectId)) {
      throw new DomainError("PROJECT_NOT_FOUND", "Projekt-Kontext fuer Mandant nicht gefunden", 404);
    }
    return this.repos.listDifferenceBookingsForProject(tenantId, projectId);
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
    if (!booking || booking.status !== "OPEN") return;

    const priorNet = measurementVersionNetStep1Cents(this.repos, input.tenantId, booking.predecessorMeasurementVersionId);
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
}
