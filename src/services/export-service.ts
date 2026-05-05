import { randomUUID } from "node:crypto";
import { DomainError } from "../errors/domain-error.js";
import { isFin5InvoiceTaxRegimeMappedForXrechnung } from "../domain/xrechnung-invoice-tax-mapping.js";
import { ExportFormat, ExportRun, Invoice, TenantId, UserId, UUID } from "../domain/types.js";
import { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import { AuditService } from "./audit-service.js";
import { buildXrechnungInvoiceXml } from "./xrechnung-xml-builder.js";

export class ExportService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly auditService: AuditService,
  ) {}

  public async prepareExport(input: {
    tenantId: TenantId;
    format: ExportFormat;
    entityType: "OFFER_VERSION" | "SUPPLEMENT_VERSION" | "INVOICE";
    entityId: UUID;
    actorUserId: UserId;
  }): Promise<ExportRun> {
    const validationErrors: string[] = [];
    let invoiceForXml: Invoice | undefined;
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
      invoiceForXml = invoice;
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
      if (input.format === "XRECHNUNG") {
        if (!isFin5InvoiceTaxRegimeMappedForXrechnung(invoice.invoiceTaxRegime)) {
          validationErrors.push("EXPORT_INVOICE_TAX_REGIME_NOT_MAPPED");
        }
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

    const xrechnungXml =
      validationErrors.length === 0 &&
      input.entityType === "INVOICE" &&
      input.format === "XRECHNUNG" &&
      invoiceForXml
        ? buildXrechnungInvoiceXml(invoiceForXml)
        : undefined;

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
      ...(xrechnungXml !== undefined ? { xrechnungXml } : {}),
    };
    this.repos.exportRuns.set(run.id, run);
    await this.auditService.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "EXPORT_RUN",
      entityId: run.id,
      action: validationErrors.length > 0 ? "EXPORT_FAILED" : "EXPORT_SUCCEEDED",
      actorUserId: input.actorUserId,
      timestamp: new Date(),
      beforeState: {},
      afterState: { format: run.format, status: run.status, validationErrors },
    });
    if (validationErrors.length > 0) {
      throw new DomainError("EXPORT_PREFLIGHT_FAILED", "Export-Preflight fehlgeschlagen", 422, {
        validationErrors,
      });
    }
    return run;
  }
}
