import type { PrismaClient } from "@prisma/client";
import type { Invoice, TenantId, UUID } from "../domain/types.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";

export interface InvoicePersistencePort {
  hydrateInvoicesIntoMemory(repos: InMemoryRepositories): Promise<void>;
  syncInvoiceFromMemory(repos: InMemoryRepositories, tenantId: TenantId, invoiceId: UUID): Promise<void>;
  syncAllInvoicesFromMemory(repos: InMemoryRepositories): Promise<void>;
}

export const noopInvoicePersistence: InvoicePersistencePort = {
  async hydrateInvoicesIntoMemory() {},
  async syncInvoiceFromMemory() {},
  async syncAllInvoicesFromMemory() {},
};

function toDomainInvoice(row: {
  tenantId: string;
  id: string;
  projectId: string;
  customerId: string;
  measurementId: string;
  lvId: string;
  offerId: string;
  offerVersionId: string | null;
  status: string;
  immutableFromStatus: string;
  invoiceNumber: string | null;
  issueDate: string | null;
  totalGrossCents: number | null;
  lvNetCents: number | null;
  vatCents: number | null;
  supplementOfferId: string | null;
  supplementVersionId: string | null;
  paymentTermsVersionId: string | null;
  skontoBps: number;
}): Invoice {
  return {
    tenantId: row.tenantId,
    id: row.id,
    projectId: row.projectId,
    customerId: row.customerId,
    measurementId: row.measurementId,
    lvId: row.lvId,
    offerId: row.offerId,
    offerVersionId: row.offerVersionId ?? undefined,
    status: row.status as Invoice["status"],
    immutableFromStatus: row.immutableFromStatus as Invoice["immutableFromStatus"],
    invoiceNumber: row.invoiceNumber ?? undefined,
    issueDate: row.issueDate ?? undefined,
    totalGrossCents: row.totalGrossCents ?? undefined,
    lvNetCents: row.lvNetCents ?? undefined,
    vatCents: row.vatCents ?? undefined,
    supplementOfferId: row.supplementOfferId ?? undefined,
    supplementVersionId: row.supplementVersionId ?? undefined,
    paymentTermsVersionId: row.paymentTermsVersionId ?? undefined,
    skontoBps: row.skontoBps,
  };
}

export class PrismaInvoicePersistence implements InvoicePersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async hydrateInvoicesIntoMemory(repos: InMemoryRepositories): Promise<void> {
    const rows = await this.prisma.invoice.findMany();
    for (const row of rows) {
      const inv = toDomainInvoice(row);
      repos.invoices.set(row.id, inv);
      repos.traceabilityLinks.set(inv.id, {
        tenantId: inv.tenantId,
        invoiceId: inv.id,
        measurementId: inv.measurementId,
        lvId: inv.lvId,
        offerId: inv.offerId,
        projectId: inv.projectId,
        customerId: inv.customerId,
        supplementOfferId: inv.supplementOfferId,
        supplementVersionId: inv.supplementVersionId,
      });
    }
  }

  public async syncInvoiceFromMemory(repos: InMemoryRepositories, tenantId: TenantId, invoiceId: UUID): Promise<void> {
    const inv = repos.getInvoiceByTenant(tenantId, invoiceId);
    if (!inv) return;
    await this.prisma.invoice.upsert({
      where: { tenantId_id: { tenantId: inv.tenantId, id: inv.id } },
      create: {
        tenantId: inv.tenantId,
        id: inv.id,
        projectId: inv.projectId,
        customerId: inv.customerId,
        measurementId: inv.measurementId,
        lvId: inv.lvId,
        offerId: inv.offerId,
        offerVersionId: inv.offerVersionId ?? null,
        status: inv.status,
        immutableFromStatus: inv.immutableFromStatus,
        invoiceNumber: inv.invoiceNumber ?? null,
        issueDate: inv.issueDate ?? null,
        totalGrossCents: inv.totalGrossCents ?? null,
        lvNetCents: inv.lvNetCents ?? null,
        vatCents: inv.vatCents ?? null,
        supplementOfferId: inv.supplementOfferId ?? null,
        supplementVersionId: inv.supplementVersionId ?? null,
        paymentTermsVersionId: inv.paymentTermsVersionId ?? null,
        skontoBps: inv.skontoBps ?? 0,
      },
      update: {
        projectId: inv.projectId,
        customerId: inv.customerId,
        measurementId: inv.measurementId,
        lvId: inv.lvId,
        offerId: inv.offerId,
        offerVersionId: inv.offerVersionId ?? null,
        status: inv.status,
        immutableFromStatus: inv.immutableFromStatus,
        invoiceNumber: inv.invoiceNumber ?? null,
        issueDate: inv.issueDate ?? null,
        totalGrossCents: inv.totalGrossCents ?? null,
        lvNetCents: inv.lvNetCents ?? null,
        vatCents: inv.vatCents ?? null,
        supplementOfferId: inv.supplementOfferId ?? null,
        supplementVersionId: inv.supplementVersionId ?? null,
        paymentTermsVersionId: inv.paymentTermsVersionId ?? null,
        skontoBps: inv.skontoBps ?? 0,
      },
    });
  }

  public async syncAllInvoicesFromMemory(repos: InMemoryRepositories): Promise<void> {
    const seen = new Set<string>();
    for (const inv of repos.invoices.values()) {
      const key = `${inv.tenantId}:${inv.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      await this.syncInvoiceFromMemory(repos, inv.tenantId, inv.id);
    }
  }
}
