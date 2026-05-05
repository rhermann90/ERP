import type { PrismaClient } from "../prisma-client.js";
import type {
  CustomerEInvoicePartyRow,
  EInvoicePartySnapshot,
  TenantEInvoicePartyRow,
  TenantId,
  UUID,
} from "../domain/types.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";

export interface EInvoicePartyPersistencePort {
  hydrateIntoMemory(repos: InMemoryRepositories): Promise<void>;
  upsertTenantFromMemory(repos: InMemoryRepositories, tenantId: TenantId): Promise<void>;
  upsertCustomerFromMemory(repos: InMemoryRepositories, tenantId: TenantId, customerId: UUID): Promise<void>;
  syncAllFromMemory(repos: InMemoryRepositories): Promise<void>;
  deleteTenantParty(tenantId: TenantId): Promise<void>;
  deleteCustomerParty(tenantId: TenantId, customerId: UUID): Promise<void>;
}

export const noopEInvoicePartyPersistence: EInvoicePartyPersistencePort = {
  async hydrateIntoMemory() {},
  async upsertTenantFromMemory() {},
  async upsertCustomerFromMemory() {},
  async syncAllFromMemory() {},
  async deleteTenantParty() {},
  async deleteCustomerParty() {},
};

function tenantRowToDomain(
  row: Awaited<ReturnType<PrismaClient["tenantEInvoiceParty"]["findUnique"]>>,
): TenantEInvoicePartyRow | undefined {
  if (!row) return undefined;
  return {
    tenantId: row.tenantId,
    legalName: row.legalName,
    streetName: row.streetName,
    cityName: row.cityName,
    postalZone: row.postalZone,
    countryCode: row.countryCode,
    vatId: row.vatId ?? undefined,
    companyId: row.companyId ?? undefined,
    companyIdSchemeId: row.companyIdSchemeId ?? undefined,
    email: row.email ?? undefined,
  };
}

function customerRowToDomain(
  row: Awaited<ReturnType<PrismaClient["customerEInvoiceParty"]["findUnique"]>>,
): CustomerEInvoicePartyRow | undefined {
  if (!row) return undefined;
  return {
    tenantId: row.tenantId,
    customerId: row.customerId,
    legalName: row.legalName,
    streetName: row.streetName,
    cityName: row.cityName,
    postalZone: row.postalZone,
    countryCode: row.countryCode,
    vatId: row.vatId ?? undefined,
    companyId: row.companyId ?? undefined,
    companyIdSchemeId: row.companyIdSchemeId ?? undefined,
    email: row.email ?? undefined,
  };
}

function partyCreateUpdate(s: EInvoicePartySnapshot) {
  return {
    legalName: s.legalName,
    streetName: s.streetName,
    cityName: s.cityName,
    postalZone: s.postalZone,
    countryCode: s.countryCode,
    vatId: s.vatId ?? null,
    companyId: s.companyId ?? null,
    companyIdSchemeId: s.companyIdSchemeId ?? null,
    email: s.email ?? null,
  };
}

export class PrismaEInvoicePartyPersistence implements EInvoicePartyPersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async hydrateIntoMemory(repos: InMemoryRepositories): Promise<void> {
    const tenants = await this.prisma.tenantEInvoiceParty.findMany();
    for (const row of tenants) {
      const d = tenantRowToDomain(row);
      if (d) repos.putTenantEInvoiceParty(d);
    }
    const customers = await this.prisma.customerEInvoiceParty.findMany();
    for (const row of customers) {
      const d = customerRowToDomain(row);
      if (d) repos.putCustomerEInvoiceParty(d);
    }
  }

  public async upsertTenantFromMemory(repos: InMemoryRepositories, tenantId: TenantId): Promise<void> {
    const row = repos.getTenantEInvoiceParty(tenantId);
    if (!row) return;
    const p = partyCreateUpdate(row);
    await this.prisma.tenantEInvoiceParty.upsert({
      where: { tenantId: row.tenantId },
      create: { tenantId: row.tenantId, ...p },
      update: p,
    });
  }

  public async upsertCustomerFromMemory(
    repos: InMemoryRepositories,
    tenantId: TenantId,
    customerId: UUID,
  ): Promise<void> {
    const row = repos.getCustomerEInvoiceParty(tenantId, customerId);
    if (!row) return;
    const p = partyCreateUpdate(row);
    await this.prisma.customerEInvoiceParty.upsert({
      where: { tenantId_customerId: { tenantId: row.tenantId, customerId: row.customerId } },
      create: { tenantId: row.tenantId, customerId: row.customerId, ...p },
      update: p,
    });
  }

  public async syncAllFromMemory(repos: InMemoryRepositories): Promise<void> {
    for (const row of repos.tenantEInvoiceParties.values()) {
      await this.upsertTenantFromMemory(repos, row.tenantId);
    }
    for (const row of repos.customerEInvoiceParties.values()) {
      await this.upsertCustomerFromMemory(repos, row.tenantId, row.customerId);
    }
  }

  public async deleteTenantParty(tenantId: TenantId): Promise<void> {
    await this.prisma.tenantEInvoiceParty.deleteMany({ where: { tenantId } });
  }

  public async deleteCustomerParty(tenantId: TenantId, customerId: UUID): Promise<void> {
    await this.prisma.customerEInvoiceParty.deleteMany({ where: { tenantId, customerId } });
  }
}
