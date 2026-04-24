import type { PrismaClient } from "../prisma-client.js";
import {
  emptyDunningEmailFooterFields,
  type DunningEmailFooterFields,
} from "../domain/dunning-email-footer.js";
import type { PrismaTransactionClient } from "./prisma-tx-types.js";

export interface DunningEmailFooterPersistencePort {
  findByTenant(tenantId: string): Promise<DunningEmailFooterFields | null>;
  upsertFooterInTx?: (
    tx: PrismaTransactionClient,
    tenantId: string,
    fields: DunningEmailFooterFields,
  ) => Promise<{ hadRow: boolean; previous: DunningEmailFooterFields }>;
}

export const noopDunningEmailFooterPersistence: DunningEmailFooterPersistencePort = {
  async findByTenant() {
    return null;
  },
  upsertFooterInTx: undefined,
};

function rowToFields(r: {
  companyLegalName: string;
  streetLine: string;
  postalCode: string;
  city: string;
  countryCode: string;
  publicEmail: string;
  publicPhone: string;
  legalRepresentative: string;
  registerCourt: string;
  registerNumber: string;
  vatId: string;
  signatureLine: string;
}): DunningEmailFooterFields {
  return {
    companyLegalName: r.companyLegalName,
    streetLine: r.streetLine,
    postalCode: r.postalCode,
    city: r.city,
    countryCode: r.countryCode,
    publicEmail: r.publicEmail,
    publicPhone: r.publicPhone,
    legalRepresentative: r.legalRepresentative,
    registerCourt: r.registerCourt,
    registerNumber: r.registerNumber,
    vatId: r.vatId,
    signatureLine: r.signatureLine,
  };
}

export class PrismaDunningEmailFooterPersistence implements DunningEmailFooterPersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async findByTenant(tenantId: string): Promise<DunningEmailFooterFields | null> {
    const r = await this.prisma.dunningTenantEmailFooter.findUnique({ where: { tenantId } });
    if (!r) return null;
    return rowToFields(r);
  }

  public async upsertFooterInTx(
    tx: PrismaTransactionClient,
    tenantId: string,
    fields: DunningEmailFooterFields,
  ): Promise<{ hadRow: boolean; previous: DunningEmailFooterFields }> {
    const existing = await tx.dunningTenantEmailFooter.findUnique({ where: { tenantId } });
    const hadRow = Boolean(existing);
    const previous = existing ? rowToFields(existing) : emptyDunningEmailFooterFields();
    await tx.dunningTenantEmailFooter.upsert({
      where: { tenantId },
      create: { tenantId, ...fields },
      update: { ...fields },
    });
    return { hadRow, previous };
  }
}
