import type { PrismaClient } from "@prisma/client";
import type { PaymentIntake, TenantId } from "../domain/types.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";

export interface PaymentIntakePersistencePort {
  hydrateIntoMemory(repos: InMemoryRepositories): Promise<void>;
  persistIntake(row: PaymentIntake): Promise<void>;
}

export const noopPaymentIntakePersistence: PaymentIntakePersistencePort = {
  async hydrateIntoMemory() {},
  async persistIntake() {},
};

export class PrismaPaymentIntakePersistence implements PaymentIntakePersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async hydrateIntoMemory(repos: InMemoryRepositories): Promise<void> {
    const rows = await this.prisma.paymentIntake.findMany();
    for (const row of rows) {
      const p: PaymentIntake = {
        id: row.id,
        tenantId: row.tenantId,
        invoiceId: row.invoiceId,
        idempotencyKey: row.idempotencyKey,
        amountCents: row.amountCents,
        externalReference: row.externalReference,
        createdAt: row.createdAt,
      };
      repos.putPaymentIntake(p);
    }
  }

  public async persistIntake(row: PaymentIntake): Promise<void> {
    await this.prisma.paymentIntake.create({
      data: {
        tenantId: row.tenantId,
        id: row.id,
        invoiceId: row.invoiceId,
        idempotencyKey: row.idempotencyKey,
        amountCents: row.amountCents,
        externalReference: row.externalReference,
        createdAt: row.createdAt,
      },
    });
  }
}
