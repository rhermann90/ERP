import type { PrismaClient } from "../prisma-client.js";
import type { ProjectInvoiceTaxOverride, TenantId, TenantInvoiceTaxProfile, UUID } from "../domain/types.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import { Prisma } from "../prisma-client.js";

export interface InvoiceTaxProfilePersistencePort {
  hydrateIntoMemory(repos: InMemoryRepositories): Promise<void>;
  upsertTenantProfileFromMemory(repos: InMemoryRepositories, tenantId: TenantId): Promise<void>;
  upsertProjectOverrideFromMemory(repos: InMemoryRepositories, tenantId: TenantId, projectId: UUID): Promise<void>;
  deleteProjectOverride(tenantId: TenantId, projectId: UUID): Promise<void>;
}

export const noopInvoiceTaxProfilePersistence: InvoiceTaxProfilePersistencePort = {
  async hydrateIntoMemory() {},
  async upsertTenantProfileFromMemory() {},
  async upsertProjectOverrideFromMemory() {},
  async deleteProjectOverride() {},
};

function toInputJson(config: Record<string, unknown> | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (config === undefined) return Prisma.JsonNull;
  return config as unknown as Prisma.InputJsonValue;
}

function jsonToRecord(v: Prisma.JsonValue | null | undefined): Record<string, unknown> | undefined {
  if (v == null) return undefined;
  if (typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return undefined;
}

export class PrismaInvoiceTaxProfilePersistence implements InvoiceTaxProfilePersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async hydrateIntoMemory(repos: InMemoryRepositories): Promise<void> {
    const tenants = await this.prisma.tenantInvoiceTaxProfile.findMany();
    for (const row of tenants) {
      repos.putTenantInvoiceTaxProfile({
        tenantId: row.tenantId,
        defaultInvoiceTaxRegime: row.defaultInvoiceTaxRegime as TenantInvoiceTaxProfile["defaultInvoiceTaxRegime"],
        construction13bConfig: jsonToRecord(row.construction13bConfigJson),
      });
    }
    const projects = await this.prisma.projectInvoiceTaxOverride.findMany();
    for (const row of projects) {
      repos.putProjectInvoiceTaxOverride({
        tenantId: row.tenantId,
        projectId: row.projectId,
        invoiceTaxRegime: row.invoiceTaxRegime as ProjectInvoiceTaxOverride["invoiceTaxRegime"],
        taxReasonCode: row.taxReasonCode ?? undefined,
        construction13bConfig: jsonToRecord(row.construction13bConfigJson),
      });
    }
  }

  public async upsertTenantProfileFromMemory(repos: InMemoryRepositories, tenantId: TenantId): Promise<void> {
    const p = repos.getTenantInvoiceTaxProfile(tenantId);
    if (!p) return;
    await this.prisma.tenantInvoiceTaxProfile.upsert({
      where: { tenantId: p.tenantId },
      create: {
        tenantId: p.tenantId,
        defaultInvoiceTaxRegime: p.defaultInvoiceTaxRegime,
        construction13bConfigJson: toInputJson(p.construction13bConfig),
      },
      update: {
        defaultInvoiceTaxRegime: p.defaultInvoiceTaxRegime,
        construction13bConfigJson: toInputJson(p.construction13bConfig),
      },
    });
  }

  public async upsertProjectOverrideFromMemory(
    repos: InMemoryRepositories,
    tenantId: TenantId,
    projectId: UUID,
  ): Promise<void> {
    const row = repos.getProjectInvoiceTaxOverride(tenantId, projectId);
    if (!row) return;
    await this.prisma.projectInvoiceTaxOverride.upsert({
      where: { tenantId_projectId: { tenantId: row.tenantId, projectId: row.projectId } },
      create: {
        tenantId: row.tenantId,
        projectId: row.projectId,
        invoiceTaxRegime: row.invoiceTaxRegime,
        taxReasonCode: row.taxReasonCode ?? null,
        construction13bConfigJson: toInputJson(row.construction13bConfig),
      },
      update: {
        invoiceTaxRegime: row.invoiceTaxRegime,
        taxReasonCode: row.taxReasonCode ?? null,
        construction13bConfigJson: toInputJson(row.construction13bConfig),
      },
    });
  }

  public async deleteProjectOverride(tenantId: TenantId, projectId: UUID): Promise<void> {
    await this.prisma.projectInvoiceTaxOverride.deleteMany({ where: { tenantId, projectId } });
  }
}
