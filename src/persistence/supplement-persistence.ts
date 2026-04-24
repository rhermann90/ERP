import type { PrismaClient } from "@prisma/client";
import type { SupplementOffer, SupplementStatus, SupplementVersion, TenantId, UUID } from "../domain/types.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";

export interface SupplementPersistencePort {
  hydrateSupplementsIntoMemory(repos: InMemoryRepositories): Promise<void>;
  syncSupplementSubgraphFromMemory(repos: InMemoryRepositories, tenantId: TenantId, supplementOfferId: UUID): Promise<void>;
  syncAllSupplementsFromMemory(repos: InMemoryRepositories): Promise<void>;
}

export const noopSupplementPersistence: SupplementPersistencePort = {
  async hydrateSupplementsIntoMemory() {},
  async syncSupplementSubgraphFromMemory() {},
  async syncAllSupplementsFromMemory() {},
};

function toDomainSupplementOffer(row: {
  tenantId: string;
  id: string;
  offerId: string;
  baseOfferVersionId: string;
  createdAt: Date;
  createdBy: string;
}): SupplementOffer {
  return {
    tenantId: row.tenantId,
    id: row.id,
    offerId: row.offerId,
    baseOfferVersionId: row.baseOfferVersionId,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

function toDomainSupplementVersion(row: {
  tenantId: string;
  id: string;
  supplementOfferId: string;
  versionNumber: number;
  status: string;
  lvVersionId: string;
  systemText: string;
  editingText: string;
  createdAt: Date;
  createdBy: string;
}): SupplementVersion {
  return {
    tenantId: row.tenantId,
    id: row.id,
    supplementOfferId: row.supplementOfferId,
    versionNumber: row.versionNumber,
    status: row.status as SupplementStatus,
    lvVersionId: row.lvVersionId,
    systemText: row.systemText,
    editingText: row.editingText,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

export class PrismaSupplementPersistence implements SupplementPersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async hydrateSupplementsIntoMemory(repos: InMemoryRepositories): Promise<void> {
    const offers = await this.prisma.supplementOffer.findMany();
    for (const row of offers) {
      repos.putSupplementOffer(toDomainSupplementOffer(row));
    }
    const versions = await this.prisma.supplementVersion.findMany();
    for (const row of versions) {
      repos.putSupplementVersion(toDomainSupplementVersion(row));
    }
  }

  public async syncSupplementSubgraphFromMemory(
    repos: InMemoryRepositories,
    tenantId: TenantId,
    supplementOfferId: UUID,
  ): Promise<void> {
    const offer = repos.getSupplementOfferByTenant(tenantId, supplementOfferId);
    if (!offer) return;

    const versions = [...repos.supplementVersions.values()].filter(
      (v) => v.tenantId === tenantId && v.supplementOfferId === supplementOfferId,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.supplementOffer.upsert({
        where: { tenantId_id: { tenantId: offer.tenantId, id: offer.id } },
        create: {
          tenantId: offer.tenantId,
          id: offer.id,
          offerId: offer.offerId,
          baseOfferVersionId: offer.baseOfferVersionId,
          createdAt: offer.createdAt,
          createdBy: offer.createdBy,
        },
        update: {
          offerId: offer.offerId,
          baseOfferVersionId: offer.baseOfferVersionId,
        },
      });
      for (const v of versions) {
        await tx.supplementVersion.upsert({
          where: { tenantId_id: { tenantId: v.tenantId, id: v.id } },
          create: {
            tenantId: v.tenantId,
            id: v.id,
            supplementOfferId: v.supplementOfferId,
            versionNumber: v.versionNumber,
            status: v.status,
            lvVersionId: v.lvVersionId,
            systemText: v.systemText,
            editingText: v.editingText,
            createdAt: v.createdAt,
            createdBy: v.createdBy,
          },
          update: {
            versionNumber: v.versionNumber,
            status: v.status,
            lvVersionId: v.lvVersionId,
            systemText: v.systemText,
            editingText: v.editingText,
          },
        });
      }
    });
  }

  public async syncAllSupplementsFromMemory(repos: InMemoryRepositories): Promise<void> {
    const seen = new Set<string>();
    for (const so of repos.supplementOffers.values()) {
      const key = `${so.tenantId}:${so.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      await this.syncSupplementSubgraphFromMemory(repos, so.tenantId, so.id);
    }
  }
}
