import type { PrismaClient } from "../prisma-client.js";
import type { DifferenceBooking, TenantId, UUID } from "../domain/types.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";

export interface DifferenceBookingPersistencePort {
  hydrateIntoMemory(repos: InMemoryRepositories): Promise<void>;
  syncFromMemory(repos: InMemoryRepositories, tenantId: TenantId, bookingId: UUID): Promise<void>;
}

export const noopDifferenceBookingPersistence: DifferenceBookingPersistencePort = {
  async hydrateIntoMemory() {},
  async syncFromMemory() {},
};

function toDomain(row: {
  tenantId: string;
  id: string;
  projectId: string;
  customerId: string;
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
  allocatedAt: Date | null;
  settledAt: Date | null;
  createdAt: Date;
  createdBy: string;
}): DifferenceBooking {
  return {
    tenantId: row.tenantId,
    id: row.id,
    projectId: row.projectId,
    customerId: row.customerId,
    measurementId: row.measurementId,
    predecessorMeasurementVersionId: row.predecessorMeasurementVersionId ?? undefined,
    subsequentMeasurementVersionId: row.subsequentMeasurementVersionId ?? undefined,
    predecessorPaymentTermsVersionId: row.predecessorPaymentTermsVersionId ?? undefined,
    subsequentPaymentTermsVersionId: row.subsequentPaymentTermsVersionId ?? undefined,
    kind: row.kind as DifferenceBooking["kind"],
    amountNetCents: row.amountNetCents,
    status: row.status as DifferenceBooking["status"],
    referenceInvoiceId: row.referenceInvoiceId ?? undefined,
    allocatedInvoiceId: row.allocatedInvoiceId ?? undefined,
    allocatedAt: row.allocatedAt ?? undefined,
    settledAt: row.settledAt ?? undefined,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

export class PrismaDifferenceBookingPersistence implements DifferenceBookingPersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async hydrateIntoMemory(repos: InMemoryRepositories): Promise<void> {
    const rows = await this.prisma.differenceBooking.findMany();
    for (const row of rows) {
      repos.putDifferenceBooking(toDomain(row));
    }
  }

  public async syncFromMemory(repos: InMemoryRepositories, tenantId: TenantId, bookingId: UUID): Promise<void> {
    const row = repos.differenceBookings.get(bookingId);
    if (!row || row.tenantId !== tenantId) return;
    await this.prisma.differenceBooking.upsert({
      where: { tenantId_id: { tenantId: row.tenantId, id: row.id } },
      create: {
        tenantId: row.tenantId,
        id: row.id,
        projectId: row.projectId,
        customerId: row.customerId,
        measurementId: row.measurementId,
        predecessorMeasurementVersionId: row.predecessorMeasurementVersionId ?? null,
        subsequentMeasurementVersionId: row.subsequentMeasurementVersionId ?? null,
        predecessorPaymentTermsVersionId: row.predecessorPaymentTermsVersionId ?? null,
        subsequentPaymentTermsVersionId: row.subsequentPaymentTermsVersionId ?? null,
        kind: row.kind,
        amountNetCents: row.amountNetCents,
        status: row.status,
        referenceInvoiceId: row.referenceInvoiceId ?? null,
        allocatedInvoiceId: row.allocatedInvoiceId ?? null,
        allocatedAt: row.allocatedAt ?? null,
        settledAt: row.settledAt ?? null,
        createdAt: row.createdAt,
        createdBy: row.createdBy,
      },
      update: {
        predecessorMeasurementVersionId: row.predecessorMeasurementVersionId ?? null,
        subsequentMeasurementVersionId: row.subsequentMeasurementVersionId ?? null,
        predecessorPaymentTermsVersionId: row.predecessorPaymentTermsVersionId ?? null,
        subsequentPaymentTermsVersionId: row.subsequentPaymentTermsVersionId ?? null,
        amountNetCents: row.amountNetCents,
        status: row.status,
        referenceInvoiceId: row.referenceInvoiceId ?? null,
        allocatedInvoiceId: row.allocatedInvoiceId ?? null,
        allocatedAt: row.allocatedAt ?? null,
        settledAt: row.settledAt ?? null,
      },
    });
  }
}
