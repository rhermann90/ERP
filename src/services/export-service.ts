import { randomUUID } from "node:crypto";
import { DomainError } from "../errors/domain-error.js";
import type { AuditEvent, ExportFormat, ExportRun, TenantId, UserId, UUID } from "../domain/types.js";
import { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import type { PrismaClient } from "../prisma-client.js";
import { Prisma } from "../prisma-client.js";
import { AuditService } from "./audit-service.js";

function mapExportRunRowToExportRun(row: {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  format: string;
  status: string;
  validationErrors: unknown;
  createdAt: Date;
  createdBy: string;
}): ExportRun {
  const errs = row.validationErrors;
  const validationErrors = Array.isArray(errs)
    ? errs.filter((e): e is string => typeof e === "string")
    : [];
  return {
    id: row.id,
    tenantId: row.tenantId,
    entityType: row.entityType as ExportRun["entityType"],
    entityId: row.entityId,
    format: row.format as ExportRun["format"],
    status: row.status as ExportRun["status"],
    validationErrors,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

export class ExportService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaClient | null = null,
  ) {}

  public async prepareExport(input: {
    tenantId: TenantId;
    format: ExportFormat;
    entityType: "OFFER_VERSION" | "SUPPLEMENT_VERSION" | "INVOICE";
    entityId: UUID;
    actorUserId: UserId;
  }): Promise<ExportRun> {
    const validationErrors: string[] = [];
    const formatPolicy: Record<"OFFER_VERSION" | "SUPPLEMENT_VERSION" | "INVOICE", Array<"XRECHNUNG" | "GAEB">> = {
      OFFER_VERSION: ["GAEB"],
      SUPPLEMENT_VERSION: ["GAEB"],
      INVOICE: ["XRECHNUNG"],
    };
    if (!formatPolicy[input.entityType].includes(input.format)) {
      validationErrors.push("FORMAT_NOT_ALLOWED_FOR_ENTITY");
    }
    if (input.entityType === "OFFER_VERSION") {
      const version = this.repos.getOfferVersionByTenant(input.tenantId, input.entityId);
      if (!version) {
        throw new DomainError("EXPORT_ENTITY_NOT_FOUND", "Export-Entität nicht gefunden", 404);
      }
      if (!version.systemText) {
        validationErrors.push("SYSTEM_TEXT_MISSING");
      }
      if (!version.lvVersionId) {
        validationErrors.push("LV_VERSION_MISSING");
      }
      if (version.status === "ENTWURF") {
        validationErrors.push("DOCUMENT_NOT_LEGALLY_RELEASED");
      }
    }
    if (input.entityType === "INVOICE") {
      const invoice = this.repos.getInvoiceByTenant(input.tenantId, input.entityId);
      if (!invoice) {
        throw new DomainError("EXPORT_ENTITY_NOT_FOUND", "Rechnung nicht gefunden", 404);
      }
      const allowedStatuses = new Set(["FREIGEGEBEN", "GEBUCHT_VERSENDET", "TEILBEZAHLT", "BEZAHLT"]);
      if (!allowedStatuses.has(invoice.status)) {
        validationErrors.push("INVOICE_STATUS_NOT_EXPORTABLE");
      }
      if (invoice.status === "ENTWURF") {
        validationErrors.push("IMMUTABILITY_NOT_REACHED");
      }
      if (!invoice.invoiceNumber || !invoice.issueDate || !invoice.totalGrossCents) {
        validationErrors.push("INVOICE_REQUIRED_FIELDS_MISSING");
      }
    }
    if (input.entityType === "SUPPLEMENT_VERSION") {
      const version = this.repos.getSupplementVersionByTenant(input.tenantId, input.entityId);
      if (!version) {
        throw new DomainError("EXPORT_ENTITY_NOT_FOUND", "Nachtragsversion nicht gefunden", 404);
      }
      if (!version.systemText) {
        validationErrors.push("SYSTEM_TEXT_MISSING");
      }
      if (!version.lvVersionId) {
        validationErrors.push("LV_VERSION_MISSING");
      }
      if (!new Set(["FREIGEGEBEN", "VERSENDET", "BEAUFTRAGT", "ABGELEHNT"]).has(version.status)) {
        validationErrors.push("DOCUMENT_NOT_LEGALLY_RELEASED");
      }
    }

    const run: ExportRun = {
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: input.entityType,
      entityId: input.entityId,
      format: input.format,
      status: validationErrors.length > 0 ? "FAILED" : "SUCCEEDED",
      validationErrors,
      createdAt: new Date(),
      createdBy: input.actorUserId,
    };
    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "EXPORT_RUN",
      entityId: run.id,
      action: validationErrors.length > 0 ? "EXPORT_FAILED" : "EXPORT_SUCCEEDED",
      actorUserId: input.actorUserId,
      timestamp: new Date(),
      beforeState: {},
      afterState: { format: run.format, status: run.status, validationErrors },
    };
    if (this.prisma) {
      await this.prisma.$transaction(async (tx) => {
        await tx.exportRunRow.create({
          data: {
            tenantId: run.tenantId,
            id: run.id,
            entityType: run.entityType,
            entityId: run.entityId,
            format: run.format,
            status: run.status,
            validationErrors: run.validationErrors as Prisma.InputJsonValue,
            createdAt: run.createdAt,
            createdBy: run.createdBy,
          },
        });
        await this.auditService.appendAuditEventTx(tx, auditEvent);
      });
      this.repos.putExportRun(run);
      this.auditService.appendInMemoryOnly(auditEvent);
    } else {
      this.repos.putExportRun(run);
      await this.auditService.append(auditEvent);
    }
    if (validationErrors.length > 0) {
      throw new DomainError("EXPORT_PREFLIGHT_FAILED", "Export-Preflight fehlgeschlagen", 422, {
        validationErrors,
      });
    }
    return run;
  }

  public async listExportRuns(input: {
    tenantId: TenantId;
    allowedEntityTypes: Array<ExportRun["entityType"]>;
    page: number;
    pageSize: number;
    filter?: {
      entityType?: ExportRun["entityType"];
      status?: ExportRun["status"];
      format?: ExportFormat;
    };
  }): Promise<{ data: ExportRun[]; page: number; pageSize: number; total: number }> {
    const entityTypesIn =
      input.filter?.entityType !== undefined
        ? [input.filter.entityType]
        : input.allowedEntityTypes;

    const whereBase = {
      tenantId: input.tenantId,
      entityType: { in: [...entityTypesIn] },
      ...(input.filter?.status !== undefined ? { status: input.filter.status } : {}),
      ...(input.filter?.format !== undefined ? { format: input.filter.format } : {}),
    };

    if (this.prisma) {
      const total = await this.prisma.exportRunRow.count({ where: whereBase });
      const rows = await this.prisma.exportRunRow.findMany({
        where: whereBase,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      });
      const data = rows.map(mapExportRunRowToExportRun);
      return { data, page: input.page, pageSize: input.pageSize, total };
    }

    const filtered = [...this.repos.exportRuns.values()].filter((run) => {
      if (run.tenantId !== input.tenantId) return false;
      if (!entityTypesIn.includes(run.entityType)) return false;
      if (input.filter?.status !== undefined && run.status !== input.filter.status) return false;
      if (input.filter?.format !== undefined && run.format !== input.filter.format) return false;
      return true;
    });
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const start = (input.page - 1) * input.pageSize;
    const pageData = filtered.slice(start, start + input.pageSize);
    return {
      data: pageData,
      page: input.page,
      pageSize: input.pageSize,
      total: filtered.length,
    };
  }

  public async getExportRunByTenant(input: {
    tenantId: TenantId;
    exportRunId: UUID;
  }): Promise<ExportRun | null> {
    if (this.prisma) {
      const row = await this.prisma.exportRunRow.findUnique({
        where: { tenantId_id: { tenantId: input.tenantId, id: input.exportRunId } },
      });
      return row ? mapExportRunRowToExportRun(row) : null;
    }
    const run = this.repos.exportRuns.get(input.exportRunId);
    if (!run || run.tenantId !== input.tenantId) return null;
    return run;
  }
}
