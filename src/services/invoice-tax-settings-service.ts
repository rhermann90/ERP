import { randomUUID } from "node:crypto";
import { parseInvoiceTaxRegime } from "../domain/invoice-tax-regime.js";
import type { TenantId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import type { InvoiceTaxProfilePersistencePort } from "../persistence/invoice-tax-profile-persistence.js";
import { AuditService } from "./audit-service.js";

export class InvoiceTaxSettingsService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly audit: AuditService,
    private readonly persistence: InvoiceTaxProfilePersistencePort,
  ) {}

  public getTenantProfileRead(tenantId: TenantId) {
    const p = this.repos.getTenantInvoiceTaxProfile(tenantId);
    return {
      tenantId,
      defaultInvoiceTaxRegime: p?.defaultInvoiceTaxRegime ?? ("STANDARD_VAT_19" as const),
      construction13bConfig: p?.construction13bConfig,
    };
  }

  public async patchTenantProfile(input: {
    tenantId: TenantId;
    actorUserId: UUID;
    defaultInvoiceTaxRegime: string;
    construction13bConfig?: Record<string, unknown>;
    reason: string;
  }): Promise<{ tenantId: TenantId; defaultInvoiceTaxRegime: string }> {
    const regime = parseInvoiceTaxRegime(input.defaultInvoiceTaxRegime);
    if (!regime) {
      throw new DomainError("INVOICE_TAX_REGIME_INVALID", "Unbekanntes Steuerregime", 400);
    }
    const before = this.repos.getTenantInvoiceTaxProfile(input.tenantId);
    const afterEntity = {
      tenantId: input.tenantId,
      defaultInvoiceTaxRegime: regime,
      construction13bConfig: input.construction13bConfig,
    };
    this.repos.putTenantInvoiceTaxProfile(afterEntity);
    await this.persistence.upsertTenantProfileFromMemory(this.repos, input.tenantId);
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "TENANT_INVOICE_TAX_PROFILE",
      entityId: input.tenantId,
      action: "TENANT_INVOICE_TAX_PROFILE_PATCHED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: before
        ? { defaultInvoiceTaxRegime: before.defaultInvoiceTaxRegime, construction13bConfig: before.construction13bConfig }
        : undefined,
      afterState: { defaultInvoiceTaxRegime: regime, construction13bConfig: input.construction13bConfig },
    });
    return { tenantId: input.tenantId, defaultInvoiceTaxRegime: regime };
  }

  public getProjectOverrideRead(tenantId: TenantId, projectId: UUID) {
    const o = this.repos.getProjectInvoiceTaxOverride(tenantId, projectId);
    if (!o) return { projectId, invoiceTaxRegime: null as null, taxReasonCode: undefined as string | undefined };
    return {
      projectId,
      invoiceTaxRegime: o.invoiceTaxRegime,
      taxReasonCode: o.taxReasonCode,
      construction13bConfig: o.construction13bConfig,
    };
  }

  public async putProjectOverride(input: {
    tenantId: TenantId;
    actorUserId: UUID;
    projectId: UUID;
    invoiceTaxRegime: string;
    taxReasonCode?: string;
    construction13bConfig?: Record<string, unknown>;
    reason: string;
  }): Promise<{ projectId: UUID; invoiceTaxRegime: string }> {
    const regime = parseInvoiceTaxRegime(input.invoiceTaxRegime);
    if (!regime) {
      throw new DomainError("INVOICE_TAX_REGIME_INVALID", "Unbekanntes Steuerregime", 400);
    }
    const before = this.repos.getProjectInvoiceTaxOverride(input.tenantId, input.projectId);
    const row = {
      tenantId: input.tenantId,
      projectId: input.projectId,
      invoiceTaxRegime: regime,
      taxReasonCode: input.taxReasonCode,
      construction13bConfig: input.construction13bConfig,
    };
    this.repos.putProjectInvoiceTaxOverride(row);
    await this.persistence.upsertProjectOverrideFromMemory(this.repos, input.tenantId, input.projectId);
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "PROJECT_INVOICE_TAX_OVERRIDE",
      entityId: input.projectId,
      action: "PROJECT_INVOICE_TAX_OVERRIDE_UPSERTED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: before
        ? {
            invoiceTaxRegime: before.invoiceTaxRegime,
            taxReasonCode: before.taxReasonCode,
            construction13bConfig: before.construction13bConfig,
          }
        : undefined,
      afterState: {
        invoiceTaxRegime: regime,
        taxReasonCode: input.taxReasonCode,
        construction13bConfig: input.construction13bConfig,
      },
    });
    return { projectId: input.projectId, invoiceTaxRegime: regime };
  }

  public async deleteProjectOverride(input: {
    tenantId: TenantId;
    actorUserId: UUID;
    projectId: UUID;
    reason: string;
  }): Promise<void> {
    const before = this.repos.getProjectInvoiceTaxOverride(input.tenantId, input.projectId);
    if (!before) return;
    this.repos.deleteProjectInvoiceTaxOverride(input.tenantId, input.projectId);
    await this.persistence.deleteProjectOverride(input.tenantId, input.projectId);
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "PROJECT_INVOICE_TAX_OVERRIDE",
      entityId: input.projectId,
      action: "PROJECT_INVOICE_TAX_OVERRIDE_DELETED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: {
        invoiceTaxRegime: before.invoiceTaxRegime,
        taxReasonCode: before.taxReasonCode,
        construction13bConfig: before.construction13bConfig,
      },
    });
  }
}
