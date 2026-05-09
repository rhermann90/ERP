import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../prisma-client.js";
import type { AuditEvent, TenantId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import { AuditService } from "./audit-service.js";

function notFound(entity: string): DomainError {
  return new DomainError("CRM_ENTITY_NOT_FOUND", `${entity} nicht gefunden`, 404);
}

function staleVersion(): DomainError {
  return new DomainError(
    "CRM_STALE_VERSION",
    "Datensatz wurde zwischenzeitlich geaendert — bitte neu laden",
    409,
  );
}

export type CrmConstructionSiteDto = {
  tenantId: string;
  id: string;
  label: string;
  versionNumber: number;
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
  versionNumber: number;
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
  versionNumber: number;
  email: string | null;
  phone: string | null;
  createdAt: string;
  createdBy: string;
};

function siteDto(r: {
  tenantId: string;
  id: string;
  label: string;
  versionNumber: number;
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
    versionNumber: r.versionNumber,
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
  versionNumber: number;
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
    versionNumber: r.versionNumber,
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
  versionNumber: number;
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
    versionNumber: r.versionNumber,
    email: r.email,
    phone: r.phone,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
  };
}

export class CrmStammdatenService {
  constructor(
    private readonly prisma: PrismaClient | null,
    private readonly audit: AuditService,
  ) {}

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
    reason: string;
    label: string;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    countryCode?: string | null;
  }): Promise<CrmConstructionSiteDto> {
    const prisma = this.db();
    const now = new Date();
    const id = randomUUID();
    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: input.tenantId as TenantId,
      entityType: "CRM_CONSTRUCTION_SITE",
      entityId: id as UUID,
      action: "CRM_CONSTRUCTION_SITE_CREATED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: {},
      afterState: {},
    };
    let row: Awaited<ReturnType<typeof prisma.crmConstructionSite.create>>;
    await prisma.$transaction(async (tx) => {
      row = await tx.crmConstructionSite.create({
        data: {
          tenantId: input.tenantId,
          id,
          versionNumber: 1,
          label: input.label,
          street: input.street ?? null,
          postalCode: input.postalCode ?? null,
          city: input.city ?? null,
          countryCode: input.countryCode ?? null,
          createdAt: now,
          createdBy: input.actorUserId,
        },
      });
      auditEvent.afterState = {
        id,
        label: row.label,
        versionNumber: row.versionNumber,
      };
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);
    return siteDto(row!);
  }

  async patchConstructionSite(
    tenantId: string,
    id: string,
    actorUserId: string,
    reason: string,
    expectedVersion: number,
    patch: {
      label?: string;
      street?: string | null;
      postalCode?: string | null;
      city?: string | null;
      countryCode?: string | null;
    },
  ): Promise<CrmConstructionSiteDto> {
    const prisma = this.db();
    const before = await prisma.crmConstructionSite.findUnique({
      where: { tenantId_id: { tenantId, id } },
    });
    if (!before) throw notFound("Baustelle");

    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: tenantId as TenantId,
      entityType: "CRM_CONSTRUCTION_SITE",
      entityId: id as UUID,
      action: "CRM_CONSTRUCTION_SITE_PATCHED",
      timestamp: new Date(),
      actorUserId,
      reason,
      beforeState: {
        id: before.id,
        label: before.label,
        versionNumber: before.versionNumber,
      },
      afterState: {},
    };

    await prisma.$transaction(async (tx) => {
      const res = await tx.crmConstructionSite.updateMany({
        where: { tenantId, id, versionNumber: expectedVersion },
        data: {
          ...(patch.label !== undefined ? { label: patch.label } : {}),
          ...(patch.street !== undefined ? { street: patch.street } : {}),
          ...(patch.postalCode !== undefined ? { postalCode: patch.postalCode } : {}),
          ...(patch.city !== undefined ? { city: patch.city } : {}),
          ...(patch.countryCode !== undefined ? { countryCode: patch.countryCode } : {}),
          versionNumber: { increment: 1 },
        },
      });
      if (res.count === 0) {
        const cur = await tx.crmConstructionSite.findUnique({ where: { tenantId_id: { tenantId, id } } });
        if (!cur) throw notFound("Baustelle");
        throw staleVersion();
      }
      const after = await tx.crmConstructionSite.findUnique({ where: { tenantId_id: { tenantId, id } } });
      auditEvent.afterState = {
        id: after!.id,
        label: after!.label,
        versionNumber: after!.versionNumber,
      };
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);
    const row = await prisma.crmConstructionSite.findUnique({ where: { tenantId_id: { tenantId, id } } });
    return siteDto(row!);
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
    reason: string;
    legalName: string;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    countryCode?: string | null;
  }): Promise<CrmCustomerDto> {
    const prisma = this.db();
    const now = new Date();
    const id = randomUUID();
    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: input.tenantId as TenantId,
      entityType: "CRM_CUSTOMER",
      entityId: id as UUID,
      action: "CRM_CUSTOMER_CREATED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: {},
      afterState: {},
    };
    let row: Awaited<ReturnType<typeof prisma.crmCustomer.create>>;
    await prisma.$transaction(async (tx) => {
      row = await tx.crmCustomer.create({
        data: {
          tenantId: input.tenantId,
          id,
          versionNumber: 1,
          legalName: input.legalName,
          street: input.street ?? null,
          postalCode: input.postalCode ?? null,
          city: input.city ?? null,
          countryCode: input.countryCode ?? null,
          createdAt: now,
          createdBy: input.actorUserId,
        },
      });
      auditEvent.afterState = {
        id,
        legalName: row.legalName,
        versionNumber: row.versionNumber,
      };
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);
    return customerDto(row!);
  }

  async patchCustomer(
    tenantId: string,
    id: string,
    actorUserId: string,
    reason: string,
    expectedVersion: number,
    patch: {
      legalName?: string;
      street?: string | null;
      postalCode?: string | null;
      city?: string | null;
      countryCode?: string | null;
    },
  ): Promise<CrmCustomerDto> {
    const prisma = this.db();
    const before = await prisma.crmCustomer.findUnique({
      where: { tenantId_id: { tenantId, id } },
    });
    if (!before) throw notFound("CRM-Kunde");

    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: tenantId as TenantId,
      entityType: "CRM_CUSTOMER",
      entityId: id as UUID,
      action: "CRM_CUSTOMER_PATCHED",
      timestamp: new Date(),
      actorUserId,
      reason,
      beforeState: {
        id: before.id,
        legalName: before.legalName,
        versionNumber: before.versionNumber,
      },
      afterState: {},
    };

    await prisma.$transaction(async (tx) => {
      const res = await tx.crmCustomer.updateMany({
        where: { tenantId, id, versionNumber: expectedVersion },
        data: {
          ...(patch.legalName !== undefined ? { legalName: patch.legalName } : {}),
          ...(patch.street !== undefined ? { street: patch.street } : {}),
          ...(patch.postalCode !== undefined ? { postalCode: patch.postalCode } : {}),
          ...(patch.city !== undefined ? { city: patch.city } : {}),
          ...(patch.countryCode !== undefined ? { countryCode: patch.countryCode } : {}),
          versionNumber: { increment: 1 },
        },
      });
      if (res.count === 0) {
        const cur = await tx.crmCustomer.findUnique({ where: { tenantId_id: { tenantId, id } } });
        if (!cur) throw notFound("CRM-Kunde");
        throw staleVersion();
      }
      const after = await tx.crmCustomer.findUnique({ where: { tenantId_id: { tenantId, id } } });
      auditEvent.afterState = {
        id: after!.id,
        legalName: after!.legalName,
        versionNumber: after!.versionNumber,
      };
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);
    const row = await prisma.crmCustomer.findUnique({ where: { tenantId_id: { tenantId, id } } });
    return customerDto(row!);
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
    reason: string;
    id: string;
    primaryCustomerId: string;
    constructionSiteId: string;
    status?: string;
    label?: string | null;
  }): Promise<CrmProjectDto> {
    const prisma = this.db();
    const now = new Date();
    const cust = await prisma.crmCustomer.findUnique({
      where: { tenantId_id: { tenantId: input.tenantId, id: input.primaryCustomerId } },
    });
    if (!cust) {
      throw new DomainError("CRM_FOREIGN_CUSTOMER_MISSING", "CRM-Kunde fuer Projekt nicht gefunden", 422);
    }
    const site = await prisma.crmConstructionSite.findUnique({
      where: { tenantId_id: { tenantId: input.tenantId, id: input.constructionSiteId } },
    });
    if (!site) {
      throw new DomainError("CRM_FOREIGN_SITE_MISSING", "Baustelle fuer Projekt nicht gefunden", 422);
    }
    const projectId = input.id;
    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: input.tenantId as TenantId,
      entityType: "CRM_PROJECT",
      entityId: projectId as UUID,
      action: "CRM_PROJECT_CREATED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: {},
      afterState: {},
    };
    let row: Awaited<ReturnType<typeof prisma.crmProject.create>>;
    await prisma.$transaction(async (tx) => {
      row = await tx.crmProject.create({
        data: {
          tenantId: input.tenantId,
          id: projectId,
          primaryCustomerId: input.primaryCustomerId,
          constructionSiteId: input.constructionSiteId,
          status: input.status ?? "AKTIV",
          versionNumber: 1,
          label: input.label ?? null,
          createdAt: now,
          createdBy: input.actorUserId,
        },
      });
      auditEvent.afterState = {
        id: row.id,
        status: row.status,
        label: row.label,
        versionNumber: row.versionNumber,
        primaryCustomerId: row.primaryCustomerId,
        constructionSiteId: row.constructionSiteId,
      };
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);
    return projectDto(row!);
  }

  async patchProject(
    tenantId: string,
    id: string,
    actorUserId: string,
    reason: string,
    expectedVersion: number,
    patch: {
      primaryCustomerId?: string;
      constructionSiteId?: string;
      status?: string;
      label?: string | null;
    },
  ): Promise<CrmProjectDto> {
    const prisma = this.db();
    if (patch.primaryCustomerId !== undefined) {
      const cust = await prisma.crmCustomer.findUnique({
        where: { tenantId_id: { tenantId, id: patch.primaryCustomerId } },
      });
      if (!cust) throw new DomainError("CRM_FOREIGN_CUSTOMER_MISSING", "CRM-Kunde fuer Projekt nicht gefunden", 422);
    }
    if (patch.constructionSiteId !== undefined) {
      const site = await prisma.crmConstructionSite.findUnique({
        where: { tenantId_id: { tenantId, id: patch.constructionSiteId } },
      });
      if (!site) throw new DomainError("CRM_FOREIGN_SITE_MISSING", "Baustelle fuer Projekt nicht gefunden", 422);
    }

    const before = await prisma.crmProject.findUnique({
      where: { tenantId_id: { tenantId, id } },
    });
    if (!before) throw notFound("Projekt");

    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: tenantId as TenantId,
      entityType: "CRM_PROJECT",
      entityId: id as UUID,
      action: "CRM_PROJECT_PATCHED",
      timestamp: new Date(),
      actorUserId,
      reason,
      beforeState: {
        id: before.id,
        status: before.status,
        label: before.label,
        versionNumber: before.versionNumber,
        primaryCustomerId: before.primaryCustomerId,
        constructionSiteId: before.constructionSiteId,
      },
      afterState: {},
    };

    await prisma.$transaction(async (tx) => {
      const res = await tx.crmProject.updateMany({
        where: { tenantId, id, versionNumber: expectedVersion },
        data: {
          ...(patch.primaryCustomerId !== undefined ? { primaryCustomerId: patch.primaryCustomerId } : {}),
          ...(patch.constructionSiteId !== undefined ? { constructionSiteId: patch.constructionSiteId } : {}),
          ...(patch.status !== undefined ? { status: patch.status } : {}),
          ...(patch.label !== undefined ? { label: patch.label } : {}),
          versionNumber: { increment: 1 },
        },
      });
      if (res.count === 0) {
        const cur = await tx.crmProject.findUnique({ where: { tenantId_id: { tenantId, id } } });
        if (!cur) throw notFound("Projekt");
        throw staleVersion();
      }
      const after = await tx.crmProject.findUnique({ where: { tenantId_id: { tenantId, id } } });
      auditEvent.afterState = {
        id: after!.id,
        status: after!.status,
        label: after!.label,
        versionNumber: after!.versionNumber,
        primaryCustomerId: after!.primaryCustomerId,
        constructionSiteId: after!.constructionSiteId,
      };
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);
    const row = await prisma.crmProject.findUnique({ where: { tenantId_id: { tenantId, id } } });
    return projectDto(row!);
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
    reason: string;
    projectId: string;
    customerId?: string | null;
    role: string;
    displayName: string;
    email?: string | null;
    phone?: string | null;
  }): Promise<CrmProjectContactDto> {
    const prisma = this.db();
    const project = await prisma.crmProject.findUnique({
      where: { tenantId_id: { tenantId: input.tenantId, id: input.projectId } },
    });
    if (!project) throw notFound("Projekt");
    if (input.customerId) {
      const cust = await prisma.crmCustomer.findUnique({
        where: { tenantId_id: { tenantId: input.tenantId, id: input.customerId } },
      });
      if (!cust) throw new DomainError("CRM_FOREIGN_CUSTOMER_MISSING", "CRM-Kunde fuer Kontakt nicht gefunden", 422);
    }
    const now = new Date();
    const id = randomUUID();
    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: input.tenantId as TenantId,
      entityType: "CRM_PROJECT_CONTACT",
      entityId: id as UUID,
      action: "CRM_PROJECT_CONTACT_CREATED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: {},
      afterState: {},
    };
    let row: Awaited<ReturnType<typeof prisma.crmProjectContact.create>>;
    await prisma.$transaction(async (tx) => {
      row = await tx.crmProjectContact.create({
        data: {
          tenantId: input.tenantId,
          id,
          versionNumber: 1,
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
      auditEvent.afterState = {
        id,
        projectId: row.projectId,
        role: row.role,
        displayName: row.displayName,
        versionNumber: row.versionNumber,
      };
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);
    return contactDto(row!);
  }

  async patchProjectContact(
    tenantId: string,
    id: string,
    actorUserId: string,
    reason: string,
    expectedVersion: number,
    patch: {
      customerId?: string | null;
      role?: string;
      displayName?: string;
      email?: string | null;
      phone?: string | null;
    },
  ): Promise<CrmProjectContactDto> {
    const prisma = this.db();
    if (patch.customerId !== undefined && patch.customerId !== null) {
      const cust = await prisma.crmCustomer.findUnique({
        where: { tenantId_id: { tenantId, id: patch.customerId } },
      });
      if (!cust) throw new DomainError("CRM_FOREIGN_CUSTOMER_MISSING", "CRM-Kunde fuer Kontakt nicht gefunden", 422);
    }

    const before = await prisma.crmProjectContact.findUnique({
      where: { tenantId_id: { tenantId, id } },
    });
    if (!before) throw notFound("Projektkontakt");

    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: tenantId as TenantId,
      entityType: "CRM_PROJECT_CONTACT",
      entityId: id as UUID,
      action: "CRM_PROJECT_CONTACT_PATCHED",
      timestamp: new Date(),
      actorUserId,
      reason,
      beforeState: {
        id: before.id,
        projectId: before.projectId,
        role: before.role,
        displayName: before.displayName,
        versionNumber: before.versionNumber,
      },
      afterState: {},
    };

    await prisma.$transaction(async (tx) => {
      const res = await tx.crmProjectContact.updateMany({
        where: { tenantId, id, versionNumber: expectedVersion },
        data: {
          ...(patch.customerId !== undefined ? { customerId: patch.customerId } : {}),
          ...(patch.role !== undefined ? { role: patch.role } : {}),
          ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
          ...(patch.email !== undefined ? { email: patch.email } : {}),
          ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
          versionNumber: { increment: 1 },
        },
      });
      if (res.count === 0) {
        const cur = await tx.crmProjectContact.findUnique({ where: { tenantId_id: { tenantId, id } } });
        if (!cur) throw notFound("Projektkontakt");
        throw staleVersion();
      }
      const after = await tx.crmProjectContact.findUnique({ where: { tenantId_id: { tenantId, id } } });
      auditEvent.afterState = {
        id: after!.id,
        projectId: after!.projectId,
        role: after!.role,
        displayName: after!.displayName,
        versionNumber: after!.versionNumber,
      };
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);
    const row = await prisma.crmProjectContact.findUnique({ where: { tenantId_id: { tenantId, id } } });
    return contactDto(row!);
  }
}
