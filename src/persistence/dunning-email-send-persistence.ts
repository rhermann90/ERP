import type { PrismaClient } from "@prisma/client";
import type { DunningEmailSend, TenantId } from "../domain/types.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";

export interface DunningEmailSendPersistencePort {
  hydrateIntoMemory(repos: InMemoryRepositories): Promise<void>;
  persistSend(row: DunningEmailSend): Promise<void>;
}

export const noopDunningEmailSendPersistence: DunningEmailSendPersistencePort = {
  async hydrateIntoMemory() {},
  async persistSend() {},
};

export class PrismaDunningEmailSendPersistence implements DunningEmailSendPersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async hydrateIntoMemory(repos: InMemoryRepositories): Promise<void> {
    const rows = await this.prisma.dunningEmailSend.findMany();
    for (const row of rows) {
      const r: DunningEmailSend = {
        id: row.id,
        tenantId: row.tenantId as TenantId,
        invoiceId: row.invoiceId,
        idempotencyKey: row.idempotencyKey,
        stageOrdinal: row.stageOrdinal,
        recipientEmail: row.recipientEmail,
        auditEventId: row.auditEventId,
        smtpMessageId: row.smtpMessageId ?? undefined,
        createdAt: row.createdAt,
      };
      repos.putDunningEmailSend(r);
    }
  }

  public async persistSend(row: DunningEmailSend): Promise<void> {
    await this.prisma.dunningEmailSend.create({
      data: {
        id: row.id,
        tenantId: row.tenantId,
        invoiceId: row.invoiceId,
        idempotencyKey: row.idempotencyKey,
        stageOrdinal: row.stageOrdinal,
        recipientEmail: row.recipientEmail,
        auditEventId: row.auditEventId,
        smtpMessageId: row.smtpMessageId ?? null,
        createdAt: row.createdAt,
      },
    });
  }
}
