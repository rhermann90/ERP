import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../prisma-client.js";
import { DomainError } from "../errors/domain-error.js";

function notFound(entity: string): DomainError {
  return new DomainError("CRM_ENTITY_NOT_FOUND", `${entity} nicht gefunden`, 404);
}

export type CrmConstructionSiteDto = {
  tenantId: string;
  id: string;
  label: string;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  createdAt: string;
  createdBy: string;
};

export type CrmCustomerDto = {
  tenantId: string;
  id: string;
  legalName: string;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  createdAt: string;
  createdBy: string;
};

export type CrmProjectDto = {
  tenantId: string;
  id: string;
  primaryCustomerId: string;
  constructionSiteId: string;
  status: string;
  versionNumber: number;
  label: string | null;
  createdAt: string;
  createdBy: string;
};

export type CrmProjectContactDto = {
  tenantId: string;
  id: string;
  projectId: string;
  customerId: string | null;
  role: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  createdBy: string;
};

function siteDto(r: {
  tenantId: string;
  id: string;
  label: string;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  createdAt: Date;
  createdBy: string;
}): CrmConstructionSiteDto {
  return {
    tenantId: r.tenantId,
    id: r.id,
    label: r.label,
    street: r.street,
    postalCode: r.postalCode,
    city: r.city,
    countryCode: r.countryCode,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
  };
}

function customerDto(r: {
  tenantId: string;
  id: string;
  legalName: string;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  createdAt: Date;
  createdBy: string;
}): CrmCustomerDto {
  return {
    tenantId: r.tenantId,
    id: r.id,
    legalName: r.legalName,
    street: r.street,
    postalCode: r.postalCode,
    city: r.city,
    countryCode: r.countryCode,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
  };
}

function projectDto(r: {
  tenantId: string;
  id: string;
  primaryCustomerId: string;
  constructionSiteId: string;
  status: string;
  versionNumber: number;
  label: string | null;
  createdAt: Date;
  createdBy: string;
}): CrmProjectDto {
  return {
    tenantId: r.tenantId,
    id: r.id,
    primaryCustomerId: r.primaryCustomerId,
    constructionSiteId: r.constructionSiteId,
    status: r.status,
    versionNumber: r.versionNumber,
    label: r.label,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
  };
}

function contactDto(r: {
  tenantId: string;
  id: string;
  projectId: string;
  customerId: string | null;
  role: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  createdBy: string;
}): CrmProjectContactDto {
  return {
    tenantId: r.tenantId,
    id: r.id,
    projectId: r.projectId,
    customerId: r.customerId,
    role: r.role,
    displayName: r.displayName,
    email: r.email,
    phone: r.phone,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
  };
}

export class CrmStammdatenService {
  constructor(private readonly prisma: PrismaClient | null) {}

  private db(): PrismaClient {
    if (!this.prisma) {
      throw new DomainError("CRM_PERSISTENCE_UNAVAILABLE", "CRM-Stammdaten nur mit Postgres verfuegbar", 503);
    }
    return this.prisma;
  }

  async listConstructionSites(tenantId: string): Promise<{ data: CrmConstructionSiteDto[] }> {
    const rows = await this.db().crmConstructionSite.findMany({
      where: { tenantId },
      orderBy: { label: "asc" },
    });
    return { data: rows.map(siteDto) };
  }

  async getConstructionSite(tenantId: string, id: string): Promise<CrmConstructionSiteDto> {
    const row = await this.db().crmConstructionSite.findUnique({
      where: { tenantId_id: { tenantId, id } },
    });
    if (!row) throw notFound("Baustelle");
    return siteDto(row);
  }

  async createConstructionSite(input: {
    tenantId: string;
    actorUserId: string;
    label: string;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    countryCode?: string | null;
  }): Promise<CrmConstructionSiteDto> {
    const now = new Date();
    const row = await this.db().crmConstructionSite.create({
      data: {
        tenantId: input.tenantId,
        id: randomUUID(),
        label: input.label,
        street: input.street ?? null,
        postalCode: input.postalCode ?? null,
        city: input.city ?? null,
        countryCode: input.countryCode ?? null,
        createdAt: now,
        createdBy: input.actorUserId,
      },
    });
    return siteDto(row);
  }

  async patchConstructionSite(
    tenantId: string,
    id: string,
    patch: {
      label?: string;
      street?: string | null;
      postalCode?: string | null;
      city?: string | null;
      countryCode?: string | null;
    },
  ): Promise<CrmConstructionSiteDto> {
    try {
      const row = await this.db().crmConstructionSite.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          ...(patch.label !== undefined ? { label: patch.label } : {}),
          ...(patch.street !== undefined ? { street: patch.street } : {}),
          ...(patch.postalCode !== undefined ? { postalCode: patch.postalCode } : {}),
          ...(patch.city !== undefined ? { city: patch.city } : {}),
          ...(patch.countryCode !== undefined ? { countryCode: patch.countryCode } : {}),
        },
      });
      return siteDto(row);
    } catch {
      throw notFound("Baustelle");
    }
  }

  async listCustomers(tenantId: string): Promise<{ data: CrmCustomerDto[] }> {
    const rows = await this.db().crmCustomer.findMany({
      where: { tenantId },
      orderBy: { legalName: "asc" },
    });
    return { data: rows.map(customerDto) };
  }

  async getCustomer(tenantId: string, id: string): Promise<CrmCustomerDto> {
    const row = await this.db().crmCustomer.findUnique({
      where: { tenantId_id: { tenantId, id } },
    });
    if (!row) throw notFound("CRM-Kunde");
    return customerDto(row);
  }

  async createCustomer(input: {
    tenantId: string;
    actorUserId: string;
    legalName: string;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    countryCode?: string | null;
  }): Promise<CrmCustomerDto> {
    const now = new Date();
    const row = await this.db().crmCustomer.create({
      data: {
        tenantId: input.tenantId,
        id: randomUUID(),
        legalName: input.legalName,
        street: input.street ?? null,
        postalCode: input.postalCode ?? null,
        city: input.city ?? null,
        countryCode: input.countryCode ?? null,
        createdAt: now,
        createdBy: input.actorUserId,
      },
    });
    return customerDto(row);
  }

  async patchCustomer(
    tenantId: string,
    id: string,
    patch: {
      legalName?: string;
      street?: string | null;
      postalCode?: string | null;
      city?: string | null;
      countryCode?: string | null;
    },
  ): Promise<CrmCustomerDto> {
    try {
      const row = await this.db().crmCustomer.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          ...(patch.legalName !== undefined ? { legalName: patch.legalName } : {}),
          ...(patch.street !== undefined ? { street: patch.street } : {}),
          ...(patch.postalCode !== undefined ? { postalCode: patch.postalCode } : {}),
          ...(patch.city !== undefined ? { city: patch.city } : {}),
          ...(patch.countryCode !== undefined ? { countryCode: patch.countryCode } : {}),
        },
      });
      return customerDto(row);
    } catch {
      throw notFound("CRM-Kunde");
    }
  }

  async listProjects(tenantId: string): Promise<{ data: CrmProjectDto[] }> {
    const rows = await this.db().crmProject.findMany({
      where: { tenantId },
      orderBy: { id: "asc" },
    });
    return { data: rows.map(projectDto) };
  }

  async getProject(tenantId: string, id: string): Promise<CrmProjectDto> {
    const row = await this.db().crmProject.findUnique({
      where: { tenantId_id: { tenantId, id } },
    });
    if (!row) throw notFound("Projekt");
    return projectDto(row);
  }

  async createProject(input: {
    tenantId: string;
    actorUserId: string;
    id: string;
    primaryCustomerId: string;
    constructionSiteId: string;
    status?: string;
    label?: string | null;
  }): Promise<CrmProjectDto> {
    const now = new Date();
    const cust = await this.db().crmCustomer.findUnique({
      where: { tenantId_id: { tenantId: input.tenantId, id: input.primaryCustomerId } },
    });
    if (!cust) {
      throw new DomainError("CRM_FOREIGN_CUSTOMER_MISSING", "CRM-Kunde fuer Projekt nicht gefunden", 422);
    }
    const site = await this.db().crmConstructionSite.findUnique({
      where: { tenantId_id: { tenantId: input.tenantId, id: input.constructionSiteId } },
    });
    if (!site) {
      throw new DomainError("CRM_FOREIGN_SITE_MISSING", "Baustelle fuer Projekt nicht gefunden", 422);
    }
    const row = await this.db().crmProject.create({
      data: {
        tenantId: input.tenantId,
        id: input.id,
        primaryCustomerId: input.primaryCustomerId,
        constructionSiteId: input.constructionSiteId,
        status: input.status ?? "AKTIV",
        versionNumber: 1,
        label: input.label ?? null,
        createdAt: now,
        createdBy: input.actorUserId,
      },
    });
    return projectDto(row);
  }

  async patchProject(
    tenantId: string,
    id: string,
    patch: {
      primaryCustomerId?: string;
      constructionSiteId?: string;
      status?: string;
      label?: string | null;
      versionNumber?: number;
    },
  ): Promise<CrmProjectDto> {
    if (patch.primaryCustomerId) {
      const cust = await this.db().crmCustomer.findUnique({
        where: { tenantId_id: { tenantId, id: patch.primaryCustomerId } },
      });
      if (!cust) throw new DomainError("CRM_FOREIGN_CUSTOMER_MISSING", "CRM-Kunde fuer Projekt nicht gefunden", 422);
    }
    if (patch.constructionSiteId) {
      const site = await this.db().crmConstructionSite.findUnique({
        where: { tenantId_id: { tenantId, id: patch.constructionSiteId } },
      });
      if (!site) throw new DomainError("CRM_FOREIGN_SITE_MISSING", "Baustelle fuer Projekt nicht gefunden", 422);
    }
    try {
      const row = await this.db().crmProject.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          ...(patch.primaryCustomerId !== undefined ? { primaryCustomerId: patch.primaryCustomerId } : {}),
          ...(patch.constructionSiteId !== undefined ? { constructionSiteId: patch.constructionSiteId } : {}),
          ...(patch.status !== undefined ? { status: patch.status } : {}),
          ...(patch.label !== undefined ? { label: patch.label } : {}),
          ...(patch.versionNumber !== undefined ? { versionNumber: patch.versionNumber } : {}),
        },
      });
      return projectDto(row);
    } catch {
      throw notFound("Projekt");
    }
  }

  async listProjectContacts(tenantId: string, projectId: string): Promise<{ data: CrmProjectContactDto[] }> {
    const project = await this.db().crmProject.findUnique({
      where: { tenantId_id: { tenantId, id: projectId } },
    });
    if (!project) throw notFound("Projekt");
    const rows = await this.db().crmProjectContact.findMany({
      where: { tenantId, projectId },
      orderBy: { displayName: "asc" },
    });
    return { data: rows.map(contactDto) };
  }

  async getProjectContact(tenantId: string, id: string): Promise<CrmProjectContactDto> {
    const row = await this.db().crmProjectContact.findUnique({
      where: { tenantId_id: { tenantId, id } },
    });
    if (!row) throw notFound("Projektkontakt");
    return contactDto(row);
  }

  async createProjectContact(input: {
    tenantId: string;
    actorUserId: string;
    projectId: string;
    customerId?: string | null;
    role: string;
    displayName: string;
    email?: string | null;
    phone?: string | null;
  }): Promise<CrmProjectContactDto> {
    const project = await this.db().crmProject.findUnique({
      where: { tenantId_id: { tenantId: input.tenantId, id: input.projectId } },
    });
    if (!project) throw notFound("Projekt");
    if (input.customerId) {
      const cust = await this.db().crmCustomer.findUnique({
        where: { tenantId_id: { tenantId: input.tenantId, id: input.customerId } },
      });
      if (!cust) throw new DomainError("CRM_FOREIGN_CUSTOMER_MISSING", "CRM-Kunde fuer Kontakt nicht gefunden", 422);
    }
    const now = new Date();
    const row = await this.db().crmProjectContact.create({
      data: {
        tenantId: input.tenantId,
        id: randomUUID(),
        projectId: input.projectId,
        customerId: input.customerId ?? null,
        role: input.role,
        displayName: input.displayName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        createdAt: now,
        createdBy: input.actorUserId,
      },
    });
    return contactDto(row);
  }

  async patchProjectContact(
    tenantId: string,
    id: string,
    patch: {
      customerId?: string | null;
      role?: string;
      displayName?: string;
      email?: string | null;
      phone?: string | null;
    },
  ): Promise<CrmProjectContactDto> {
    if (patch.customerId !== undefined && patch.customerId !== null) {
      const cust = await this.db().crmCustomer.findUnique({
        where: { tenantId_id: { tenantId, id: patch.customerId } },
      });
      if (!cust) throw new DomainError("CRM_FOREIGN_CUSTOMER_MISSING", "CRM-Kunde fuer Kontakt nicht gefunden", 422);
    }
    try {
      const row = await this.db().crmProjectContact.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          ...(patch.customerId !== undefined ? { customerId: patch.customerId } : {}),
          ...(patch.role !== undefined ? { role: patch.role } : {}),
          ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
          ...(patch.email !== undefined ? { email: patch.email } : {}),
          ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
        },
      });
      return contactDto(row);
    } catch {
      throw notFound("Projektkontakt");
    }
  }
}
