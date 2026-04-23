import type { PrismaClient } from "@prisma/client";
import type { PrismaTransactionClient } from "./prisma-tx-types.js";

export type DunningTenantAutomationRunMode = "OFF" | "SEMI" | "AUTO";

export type DunningTenantAutomationRow = {
  tenantId: string;
  runMode: DunningTenantAutomationRunMode;
  jobHourUtc: number | null;
};

export interface DunningTenantAutomationPersistencePort {
  findByTenant(tenantId: string): Promise<DunningTenantAutomationRow | null>;
  upsertAutomationInTx?: (
    tx: PrismaTransactionClient,
    tenantId: string,
    row: DunningTenantAutomationRow,
  ) => Promise<{ previous: DunningTenantAutomationRow | null }>;
}

export const noopDunningTenantAutomationPersistence: DunningTenantAutomationPersistencePort = {
  async findByTenant() {
    return null;
  },
  upsertAutomationInTx: undefined,
};

function rowToDomain(r: { tenantId: string; runMode: string; jobHourUtc: number | null }): DunningTenantAutomationRow {
  const runMode = r.runMode as DunningTenantAutomationRunMode;
  return { tenantId: r.tenantId, runMode, jobHourUtc: r.jobHourUtc };
}

export class PrismaDunningTenantAutomationPersistence implements DunningTenantAutomationPersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async findByTenant(tenantId: string): Promise<DunningTenantAutomationRow | null> {
    const r = await this.prisma.dunningTenantAutomation.findUnique({ where: { tenantId } });
    if (!r) return null;
    return rowToDomain(r);
  }

  public async upsertAutomationInTx(
    tx: PrismaTransactionClient,
    tenantId: string,
    row: DunningTenantAutomationRow,
  ): Promise<{ previous: DunningTenantAutomationRow | null }> {
    const existing = await tx.dunningTenantAutomation.findUnique({ where: { tenantId } });
    const previous = existing ? rowToDomain(existing) : null;
    await tx.dunningTenantAutomation.upsert({
      where: { tenantId },
      create: {
        tenantId,
        runMode: row.runMode,
        jobHourUtc: row.jobHourUtc,
      },
      update: {
        runMode: row.runMode,
        jobHourUtc: row.jobHourUtc,
      },
    });
    return { previous };
  }
}
