import type { PrismaClient } from "../prisma-client.js";
import type { PrismaTransactionClient } from "./prisma-tx-types.js";

export type TenantPwaDisplaySettingsRow = {
  tenantId: string;
  pwaExpertModeEnabled: boolean;
};

export interface TenantPwaDisplaySettingsPersistencePort {
  findByTenant(tenantId: string): Promise<TenantPwaDisplaySettingsRow | null>;
  upsertExpertModeInTx?: (
    tx: PrismaTransactionClient,
    tenantId: string,
    pwaExpertModeEnabled: boolean,
  ) => Promise<{ previous: TenantPwaDisplaySettingsRow | null }>;
}

export const noopTenantPwaDisplaySettingsPersistence: TenantPwaDisplaySettingsPersistencePort = {
  async findByTenant() {
    return null;
  },
  upsertExpertModeInTx: undefined,
};

export class PrismaTenantPwaDisplaySettingsPersistence implements TenantPwaDisplaySettingsPersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async findByTenant(tenantId: string): Promise<TenantPwaDisplaySettingsRow | null> {
    const r = await this.prisma.tenantPwaDisplaySettings.findUnique({ where: { tenantId } });
    if (!r) return null;
    return { tenantId: r.tenantId, pwaExpertModeEnabled: r.pwaExpertModeEnabled };
  }

  public async upsertExpertModeInTx(
    tx: PrismaTransactionClient,
    tenantId: string,
    pwaExpertModeEnabled: boolean,
  ): Promise<{ previous: TenantPwaDisplaySettingsRow | null }> {
    const existing = await tx.tenantPwaDisplaySettings.findUnique({ where: { tenantId } });
    const previous = existing
      ? { tenantId: existing.tenantId, pwaExpertModeEnabled: existing.pwaExpertModeEnabled }
      : null;
    await tx.tenantPwaDisplaySettings.upsert({
      where: { tenantId },
      create: { tenantId, pwaExpertModeEnabled },
      update: { pwaExpertModeEnabled },
    });
    return { previous };
  }
}
