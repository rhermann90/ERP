import type { PrismaClient } from "../prisma-client.js";
import type { DunningReminder, TenantId } from "../domain/types.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";

export interface DunningReminderPersistencePort {
  hydrateIntoMemory(repos: InMemoryRepositories): Promise<void>;
  persistDunningReminder(row: DunningReminder): Promise<void>;
}

export const noopDunningReminderPersistence: DunningReminderPersistencePort = {
  async hydrateIntoMemory() {},
  async persistDunningReminder() {},
};

export class PrismaDunningReminderPersistence implements DunningReminderPersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async hydrateIntoMemory(repos: InMemoryRepositories): Promise<void> {
    const rows = await this.prisma.dunningReminder.findMany();
    for (const row of rows) {
      const r: DunningReminder = {
        id: row.id,
        tenantId: row.tenantId as TenantId,
        invoiceId: row.invoiceId,
        stageOrdinal: row.stageOrdinal,
        note: row.note ?? undefined,
        createdAt: row.createdAt,
      };
      repos.putDunningReminder(r);
    }
  }

  public async persistDunningReminder(row: DunningReminder): Promise<void> {
    await this.prisma.dunningReminder.create({
      data: {
        tenantId: row.tenantId,
        id: row.id,
        invoiceId: row.invoiceId,
        stageOrdinal: row.stageOrdinal,
        note: row.note ?? null,
        createdAt: row.createdAt,
      },
    });
  }
}
