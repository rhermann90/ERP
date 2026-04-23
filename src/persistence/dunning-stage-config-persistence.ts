import type { PrismaClient } from "@prisma/client";
import type { DunningStageConfigReadRow } from "../domain/dunning-reminder-config-defaults.js";
import type { PrismaTransactionClient } from "./prisma-tx-types.js";

export type DunningStageConfigPatch = {
  daysAfterDue?: number;
  feeCents?: number;
  label?: string;
};

export interface DunningStageConfigPersistencePort {
  /** Liefert aktive Zeilen (`deleted_at IS NULL`), sortiert nach `stageOrdinal`. */
  findStagesByTenant(tenantId: string): Promise<DunningStageConfigReadRow[]>;
  /** Nur Postgres; fehlt bei noop → Schreibpfad nicht verfügbar. Immer innerhalb einer Transaktion aufrufen. */
  replaceTenantStagesInTx?(
    tx: PrismaTransactionClient,
    tenantId: string,
    stages: DunningStageConfigReadRow[],
  ): Promise<void>;
  updateTenantStageInTx?(
    tx: PrismaTransactionClient,
    tenantId: string,
    stageOrdinal: number,
    patch: DunningStageConfigPatch,
  ): Promise<DunningStageConfigReadRow | null>;
  softDeleteTenantStageInTx?(
    tx: PrismaTransactionClient,
    tenantId: string,
    stageOrdinal: number,
  ): Promise<boolean>;
}

export const noopDunningStageConfigPersistence: DunningStageConfigPersistencePort = {
  async findStagesByTenant() {
    return [];
  },
};

export class PrismaDunningStageConfigPersistence implements DunningStageConfigPersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async findStagesByTenant(tenantId: string): Promise<DunningStageConfigReadRow[]> {
    const rows = await this.prisma.dunningTenantStageConfig.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { stageOrdinal: "asc" },
    });
    return rows.map((r) => ({
      stageOrdinal: r.stageOrdinal,
      daysAfterDue: r.daysAfterDue,
      feeCents: r.feeCents,
      label: r.label,
    }));
  }

  public async replaceTenantStagesInTx(
    tx: PrismaTransactionClient,
    tenantId: string,
    stages: DunningStageConfigReadRow[],
  ): Promise<void> {
    const sorted = [...stages].sort((a, b) => a.stageOrdinal - b.stageOrdinal);
    await tx.dunningTenantStageConfig.deleteMany({ where: { tenantId } });
    await tx.dunningTenantStageConfig.createMany({
      data: sorted.map((s) => ({
        tenantId,
        stageOrdinal: s.stageOrdinal,
        daysAfterDue: s.daysAfterDue,
        feeCents: s.feeCents,
        label: s.label,
        deletedAt: null,
      })),
    });
  }

  public async updateTenantStageInTx(
    tx: PrismaTransactionClient,
    tenantId: string,
    stageOrdinal: number,
    patch: DunningStageConfigPatch,
  ): Promise<DunningStageConfigReadRow | null> {
    const existing = await tx.dunningTenantStageConfig.findFirst({
      where: { tenantId, stageOrdinal, deletedAt: null },
    });
    if (!existing) return null;
    const updated = await tx.dunningTenantStageConfig.update({
      where: { tenantId_stageOrdinal: { tenantId, stageOrdinal } },
      data: {
        ...(patch.daysAfterDue !== undefined ? { daysAfterDue: patch.daysAfterDue } : {}),
        ...(patch.feeCents !== undefined ? { feeCents: patch.feeCents } : {}),
        ...(patch.label !== undefined ? { label: patch.label } : {}),
      },
    });
    if (updated.deletedAt !== null) return null;
    return {
      stageOrdinal: updated.stageOrdinal,
      daysAfterDue: updated.daysAfterDue,
      feeCents: updated.feeCents,
      label: updated.label,
    };
  }

  public async softDeleteTenantStageInTx(
    tx: PrismaTransactionClient,
    tenantId: string,
    stageOrdinal: number,
  ): Promise<boolean> {
    const now = new Date();
    const res = await tx.dunningTenantStageConfig.updateMany({
      where: { tenantId, stageOrdinal, deletedAt: null },
      data: { deletedAt: now },
    });
    return res.count === 1;
  }
}
