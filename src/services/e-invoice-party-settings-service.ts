import { randomUUID } from "node:crypto";
import type {
  CustomerEInvoicePartyRow,
  EInvoicePartySnapshot,
  TenantEInvoicePartyRow,
  TenantId,
  UUID,
} from "../domain/types.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import type { EInvoicePartyPersistencePort } from "../persistence/e-invoice-party-persistence.js";
import { AuditService } from "./audit-service.js";

function tenantRowToSnapshot(row: TenantEInvoicePartyRow): EInvoicePartySnapshot {
  const { tenantId: _t, ...snap } = row;
  return snap;
}

function customerRowToSnapshot(row: CustomerEInvoicePartyRow): EInvoicePartySnapshot {
  const { tenantId: _t, customerId: _c, ...snap } = row;
  return snap;
}

function partySnapshotForAudit(s: EInvoicePartySnapshot): Record<string, unknown> {
  return s as unknown as Record<string, unknown>;
}

export class EInvoicePartySettingsService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly audit: AuditService,
    private readonly persistence: EInvoicePartyPersistencePort,
  ) {}

  public getTenantRead(tenantId: TenantId): { configured: boolean; party: EInvoicePartySnapshot | null } {
    const row = this.repos.getTenantEInvoiceParty(tenantId);
    if (!row) return { configured: false, party: null };
    return { configured: true, party: tenantRowToSnapshot(row) };
  }

  public async putTenantParty(input: TenantEInvoicePartyRow & { actorUserId: UUID; reason: string }): Promise<{
    configured: boolean;
    party: EInvoicePartySnapshot;
  }> {
    const before = this.repos.getTenantEInvoiceParty(input.tenantId);
    this.repos.putTenantEInvoiceParty(input);
    await this.persistence.upsertTenantFromMemory(this.repos, input.tenantId);
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "TENANT_E_INVOICE_PARTY",
      entityId: input.tenantId,
      action: "TENANT_E_INVOICE_PARTY_UPSERTED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: before ? partySnapshotForAudit(tenantRowToSnapshot(before)) : undefined,
      afterState: partySnapshotForAudit(tenantRowToSnapshot(input)),
    });
    return { configured: true, party: tenantRowToSnapshot(input) };
  }

  public async deleteTenantParty(input: { tenantId: TenantId; actorUserId: UUID; reason: string }): Promise<void> {
    const before = this.repos.getTenantEInvoiceParty(input.tenantId);
    if (!before) return;
    this.repos.deleteTenantEInvoiceParty(input.tenantId);
    await this.persistence.deleteTenantParty(input.tenantId);
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "TENANT_E_INVOICE_PARTY",
      entityId: input.tenantId,
      action: "TENANT_E_INVOICE_PARTY_DELETED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: partySnapshotForAudit(tenantRowToSnapshot(before)),
    });
  }

  public listCustomersRead(tenantId: TenantId): {
    customers: Array<{ customerId: UUID } & EInvoicePartySnapshot>;
  } {
    const rows = this.repos.listCustomerEInvoicePartiesForTenant(tenantId);
    return {
      customers: rows.map((r) => ({ customerId: r.customerId, ...customerRowToSnapshot(r) })),
    };
  }

  public getCustomerRead(
    tenantId: TenantId,
    customerId: UUID,
  ): { configured: boolean; customerId: UUID; party: EInvoicePartySnapshot | null } {
    const row = this.repos.getCustomerEInvoiceParty(tenantId, customerId);
    if (!row) return { configured: false, customerId, party: null };
    return { configured: true, customerId, party: customerRowToSnapshot(row) };
  }

  public async putCustomerParty(
    input: CustomerEInvoicePartyRow & { actorUserId: UUID; reason: string },
  ): Promise<{ configured: boolean; customerId: UUID; party: EInvoicePartySnapshot }> {
    const before = this.repos.getCustomerEInvoiceParty(input.tenantId, input.customerId);
    this.repos.putCustomerEInvoiceParty(input);
    await this.persistence.upsertCustomerFromMemory(this.repos, input.tenantId, input.customerId);
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "CUSTOMER_E_INVOICE_PARTY",
      entityId: input.customerId,
      action: "CUSTOMER_E_INVOICE_PARTY_UPSERTED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: before ? partySnapshotForAudit(customerRowToSnapshot(before)) : undefined,
      afterState: partySnapshotForAudit(customerRowToSnapshot(input)),
    });
    return { configured: true, customerId: input.customerId, party: customerRowToSnapshot(input) };
  }

  public async deleteCustomerParty(input: {
    tenantId: TenantId;
    customerId: UUID;
    actorUserId: UUID;
    reason: string;
  }): Promise<void> {
    const before = this.repos.getCustomerEInvoiceParty(input.tenantId, input.customerId);
    if (!before) return;
    this.repos.deleteCustomerEInvoiceParty(input.tenantId, input.customerId);
    await this.persistence.deleteCustomerParty(input.tenantId, input.customerId);
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "CUSTOMER_E_INVOICE_PARTY",
      entityId: input.customerId,
      action: "CUSTOMER_E_INVOICE_PARTY_DELETED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: partySnapshotForAudit(customerRowToSnapshot(before)),
    });
  }
}
