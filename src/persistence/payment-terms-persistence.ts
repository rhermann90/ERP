import type { PrismaClient } from "@prisma/client";
import type { PaymentTermsHead, PaymentTermsVersion, TenantId, UUID } from "../domain/types.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";

export interface PaymentTermsPersistencePort {
  hydratePaymentTermsIntoMemory(repos: InMemoryRepositories): Promise<void>;
  syncPaymentTermsSubgraphFromMemory(repos: InMemoryRepositories, tenantId: TenantId, headId: UUID): Promise<void>;
  syncAllPaymentTermsFromMemory(repos: InMemoryRepositories): Promise<void>;
}

export const noopPaymentTermsPersistence: PaymentTermsPersistencePort = {
  async hydratePaymentTermsIntoMemory() {},
  async syncPaymentTermsSubgraphFromMemory() {},
  async syncAllPaymentTermsFromMemory() {},
};

function toDomainHead(row: {
  tenantId: string;
  id: string;
  projectId: string;
  customerId: string;
  createdAt: Date;
  createdBy: string;
}): PaymentTermsHead {
  return {
    tenantId: row.tenantId,
    id: row.id,
    projectId: row.projectId,
    customerId: row.customerId,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

function toDomainVersion(row: {
  tenantId: string;
  id: string;
  headId: string;
  versionNumber: number;
  termsLabel: string;
  createdAt: Date;
  createdBy: string;
}): PaymentTermsVersion {
  return {
    tenantId: row.tenantId,
    id: row.id,
    headId: row.headId,
    versionNumber: row.versionNumber,
    termsLabel: row.termsLabel,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

export class PrismaPaymentTermsPersistence implements PaymentTermsPersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async hydratePaymentTermsIntoMemory(repos: InMemoryRepositories): Promise<void> {
    const heads = await this.prisma.paymentTermsHead.findMany();
    for (const row of heads) {
      repos.putPaymentTermsHead(toDomainHead(row));
    }
    const versions = await this.prisma.paymentTermsVersion.findMany();
    for (const row of versions) {
      repos.putPaymentTermsVersion(toDomainVersion(row));
    }
  }

  public async syncPaymentTermsSubgraphFromMemory(
    repos: InMemoryRepositories,
    tenantId: TenantId,
    headId: UUID,
  ): Promise<void> {
    const head = repos.getPaymentTermsHeadByTenant(tenantId, headId);
    if (!head) return;

    const versions = [...repos.paymentTermsVersions.values()].filter(
      (v) => v.tenantId === tenantId && v.headId === headId,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentTermsHead.upsert({
        where: { tenantId_id: { tenantId: head.tenantId, id: head.id } },
        create: {
          tenantId: head.tenantId,
          id: head.id,
          projectId: head.projectId,
          customerId: head.customerId,
          createdAt: head.createdAt,
          createdBy: head.createdBy,
        },
        update: {
          projectId: head.projectId,
          customerId: head.customerId,
        },
      });
      for (const v of versions) {
        await tx.paymentTermsVersion.upsert({
          where: { tenantId_id: { tenantId: v.tenantId, id: v.id } },
          create: {
            tenantId: v.tenantId,
            id: v.id,
            headId: v.headId,
            versionNumber: v.versionNumber,
            termsLabel: v.termsLabel,
            createdAt: v.createdAt,
            createdBy: v.createdBy,
          },
          update: {
            versionNumber: v.versionNumber,
            termsLabel: v.termsLabel,
          },
        });
      }
    });
  }

  public async syncAllPaymentTermsFromMemory(repos: InMemoryRepositories): Promise<void> {
    const seen = new Set<string>();
    for (const h of repos.paymentTermsHeads.values()) {
      const key = `${h.tenantId}:${h.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      await this.syncPaymentTermsSubgraphFromMemory(repos, h.tenantId, h.id);
    }
  }
}
