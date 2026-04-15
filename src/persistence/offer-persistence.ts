import type { PrismaClient } from "@prisma/client";
import type { Offer, OfferStatus, OfferVersion, TenantId, UUID } from "../domain/types.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";

export interface OfferPersistencePort {
  hydrateOffersIntoMemory(repos: InMemoryRepositories): Promise<void>;
  /** Schreibt Offer + alle zugehörigen Versionen aus dem In-Memory-Zustand in die DB (Write-Through nach Domänenmutation). */
  syncOfferSubgraphFromMemory(repos: InMemoryRepositories, tenantId: TenantId, offerId: UUID): Promise<void>;
  /** Initialer Seed: alle Offers aus Memory persistieren (nur leere DB). */
  syncAllOffersFromMemory(repos: InMemoryRepositories): Promise<void>;
}

export const noopOfferPersistence: OfferPersistencePort = {
  async hydrateOffersIntoMemory() {},
  async syncOfferSubgraphFromMemory() {},
  async syncAllOffersFromMemory() {},
};

function toDomainOffer(row: {
  tenantId: string;
  id: string;
  projectId: string;
  customerId: string;
  currentVersionId: string;
  createdAt: Date;
  createdBy: string;
}): Offer {
  return {
    tenantId: row.tenantId,
    id: row.id,
    projectId: row.projectId,
    customerId: row.customerId,
    currentVersionId: row.currentVersionId,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

function toDomainOfferVersion(row: {
  tenantId: string;
  id: string;
  offerId: string;
  versionNumber: number;
  status: string;
  lvVersionId: string;
  systemText: string;
  editingText: string;
  createdAt: Date;
  createdBy: string;
  releasedAt: Date | null;
}): OfferVersion {
  return {
    tenantId: row.tenantId,
    id: row.id,
    offerId: row.offerId,
    versionNumber: row.versionNumber,
    status: row.status as OfferStatus,
    lvVersionId: row.lvVersionId,
    systemText: row.systemText,
    editingText: row.editingText,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
    releasedAt: row.releasedAt ?? undefined,
  };
}

export class PrismaOfferPersistence implements OfferPersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async hydrateOffersIntoMemory(repos: InMemoryRepositories): Promise<void> {
    const offers = await this.prisma.offer.findMany();
    for (const row of offers) {
      repos.putOffer(toDomainOffer(row));
    }
    const versions = await this.prisma.offerVersion.findMany();
    for (const row of versions) {
      repos.putOfferVersion(toDomainOfferVersion(row));
    }
  }

  public async syncOfferSubgraphFromMemory(
    repos: InMemoryRepositories,
    tenantId: TenantId,
    offerId: UUID,
  ): Promise<void> {
    const offer = repos.getOfferByTenant(tenantId, offerId);
    if (!offer) return;

    const versions = [...repos.offerVersions.values()].filter(
      (v) => v.tenantId === tenantId && v.offerId === offerId,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET CONSTRAINTS ALL DEFERRED`);
      await tx.offer.upsert({
        where: { tenantId_id: { tenantId: offer.tenantId, id: offer.id } },
        create: {
          tenantId: offer.tenantId,
          id: offer.id,
          projectId: offer.projectId,
          customerId: offer.customerId,
          currentVersionId: offer.currentVersionId,
          createdAt: offer.createdAt,
          createdBy: offer.createdBy,
        },
        update: {
          projectId: offer.projectId,
          customerId: offer.customerId,
          currentVersionId: offer.currentVersionId,
        },
      });
      for (const v of versions) {
        await tx.offerVersion.upsert({
          where: { tenantId_id: { tenantId: v.tenantId, id: v.id } },
          create: {
            tenantId: v.tenantId,
            id: v.id,
            offerId: v.offerId,
            versionNumber: v.versionNumber,
            status: v.status,
            lvVersionId: v.lvVersionId,
            systemText: v.systemText,
            editingText: v.editingText,
            createdAt: v.createdAt,
            createdBy: v.createdBy,
            releasedAt: v.releasedAt ?? null,
          },
          update: {
            versionNumber: v.versionNumber,
            status: v.status,
            lvVersionId: v.lvVersionId,
            systemText: v.systemText,
            editingText: v.editingText,
            releasedAt: v.releasedAt ?? null,
          },
        });
      }
    });
  }

  public async syncAllOffersFromMemory(repos: InMemoryRepositories): Promise<void> {
    const seen = new Set<string>();
    for (const offer of repos.offers.values()) {
      const key = `${offer.tenantId}:${offer.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      await this.syncOfferSubgraphFromMemory(repos, offer.tenantId, offer.id);
    }
  }
}
