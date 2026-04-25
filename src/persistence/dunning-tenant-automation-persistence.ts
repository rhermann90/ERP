import type { PrismaClient } from "../prisma-client.js";
import type { PrismaTransactionClient } from "./prisma-tx-types.js";

export type DunningTenantAutomationRunMode = "OFF" | "SEMI";

export type PaymentTermDayKind = "CALENDAR" | "BUSINESS";

export type PreferredDunningChannel = "EMAIL" | "PRINT";

export type DunningTenantAutomationRow = {
  tenantId: string;
  runMode: DunningTenantAutomationRunMode;
  jobHourUtc: number | null;
  ianaTimezone: string;
  federalStateCode: string | null;
  paymentTermDayKind: PaymentTermDayKind;
  preferredDunningChannel: PreferredDunningChannel;
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

function normalizeRunMode(raw: string): DunningTenantAutomationRunMode {
  if (raw === "OFF" || raw === "SEMI") return raw;
  return "SEMI";
}

function normalizeDayKind(raw: string): PaymentTermDayKind {
  return raw === "BUSINESS" ? "BUSINESS" : "CALENDAR";
}

function normalizeChannel(raw: string): PreferredDunningChannel {
  return raw === "PRINT" ? "PRINT" : "EMAIL";
}

function rowToDomain(r: {
  tenantId: string;
  runMode: string;
  jobHourUtc: number | null;
  ianaTimezone: string;
  federalStateCode: string | null;
  paymentTermDayKind: string;
  preferredDunningChannel: string;
}): DunningTenantAutomationRow {
  return {
    tenantId: r.tenantId,
    runMode: normalizeRunMode(r.runMode),
    jobHourUtc: null,
    ianaTimezone: r.ianaTimezone?.trim() || "Europe/Berlin",
    federalStateCode: r.federalStateCode?.trim() ? r.federalStateCode.trim().toUpperCase() : null,
    paymentTermDayKind: normalizeDayKind(r.paymentTermDayKind),
    preferredDunningChannel: normalizeChannel(r.preferredDunningChannel),
  };
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
        jobHourUtc: null,
        ianaTimezone: row.ianaTimezone,
        federalStateCode: row.federalStateCode,
        paymentTermDayKind: row.paymentTermDayKind,
        preferredDunningChannel: row.preferredDunningChannel,
      },
      update: {
        runMode: row.runMode,
        jobHourUtc: null,
        ianaTimezone: row.ianaTimezone,
        federalStateCode: row.federalStateCode,
        paymentTermDayKind: row.paymentTermDayKind,
        preferredDunningChannel: row.preferredDunningChannel,
      },
    });
    return { previous };
  }
}
