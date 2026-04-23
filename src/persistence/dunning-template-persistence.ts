import type { PrismaClient } from "@prisma/client";
import type { DunningTemplateChannel, DunningTemplatePersistenceRow, DunningTemplateType } from "../domain/dunning-reminder-template-defaults.js";
import type { PrismaTransactionClient } from "./prisma-tx-types.js";

export interface DunningTemplatePersistencePort {
  findTemplatesByTenant(tenantId: string): Promise<DunningTemplatePersistenceRow[]>;
  upsertTemplateBodyInTx?: (
    tx: PrismaTransactionClient,
    tenantId: string,
    stageOrdinal: number,
    channel: DunningTemplateChannel,
    templateType: DunningTemplateType,
    body: string,
  ) => Promise<{ previousBody: string | null; previousType: DunningTemplateType | null }>;
}

export const noopDunningTemplatePersistence: DunningTemplatePersistencePort = {
  async findTemplatesByTenant() {
    return [];
  },
  upsertTemplateBodyInTx: undefined,
};

function parseTemplateType(raw: string): DunningTemplateType | null {
  if (raw === "REMINDER" || raw === "DEMAND_NOTE" || raw === "DUNNING") return raw;
  return null;
}

function parseChannel(raw: string): DunningTemplateChannel | null {
  if (raw === "EMAIL" || raw === "PRINT") return raw;
  return null;
}

export class PrismaDunningTemplatePersistence implements DunningTemplatePersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async findTemplatesByTenant(tenantId: string): Promise<DunningTemplatePersistenceRow[]> {
    const rows = await this.prisma.dunningTenantStageTemplate.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: [{ stageOrdinal: "asc" }, { channel: "asc" }],
    });
    const out: DunningTemplatePersistenceRow[] = [];
    for (const r of rows) {
      const channel = parseChannel(r.channel);
      const templateType = parseTemplateType(r.templateType);
      if (!channel || !templateType) continue;
      out.push({
        stageOrdinal: r.stageOrdinal,
        channel,
        templateType,
        body: r.body,
      });
    }
    return out;
  }

  public async upsertTemplateBodyInTx(
    tx: PrismaTransactionClient,
    tenantId: string,
    stageOrdinal: number,
    channel: DunningTemplateChannel,
    templateType: DunningTemplateType,
    body: string,
  ): Promise<{ previousBody: string | null; previousType: DunningTemplateType | null }> {
    const existing = await tx.dunningTenantStageTemplate.findFirst({
      where: { tenantId, stageOrdinal, channel, deletedAt: null },
    });
    let previousBody: string | null = null;
    let previousType: DunningTemplateType | null = null;
    if (existing) {
      previousBody = existing.body;
      const pt = parseTemplateType(existing.templateType);
      previousType = pt;
    }
    await tx.dunningTenantStageTemplate.upsert({
      where: { tenantId_stageOrdinal_channel: { tenantId, stageOrdinal, channel } },
      create: {
        tenantId,
        stageOrdinal,
        channel,
        templateType,
        body,
        deletedAt: null,
      },
      update: {
        body,
        templateType,
        deletedAt: null,
      },
    });
    return { previousBody, previousType };
  }
}
