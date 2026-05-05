import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../prisma-client.js";
import type { AuditEvent, TenantId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { TenantPwaDisplaySettingsPersistencePort } from "../persistence/tenant-pwa-display-settings-persistence.js";
import { AuditService } from "./audit-service.js";

export type TenantPwaDisplaySettingsReadData = {
  settingsSource: "NOT_CONFIGURED" | "TENANT_DATABASE";
  tenantId: string;
  pwaExpertModeEnabled: boolean;
};

export type PatchTenantPwaDisplaySettingsInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  reason: string;
  pwaExpertModeEnabled: boolean;
};

export class TenantPwaDisplaySettingsService {
  constructor(
    private readonly persistence: TenantPwaDisplaySettingsPersistencePort,
    private readonly audit: AuditService,
    private readonly prisma: PrismaClient | null,
  ) {}

  public async getReadModel(tenantId: string): Promise<TenantPwaDisplaySettingsReadData> {
    const row = await this.persistence.findByTenant(tenantId);
    if (!row) {
      return {
        settingsSource: "NOT_CONFIGURED",
        tenantId,
        pwaExpertModeEnabled: false,
      };
    }
    return {
      settingsSource: "TENANT_DATABASE",
      tenantId,
      pwaExpertModeEnabled: row.pwaExpertModeEnabled,
    };
  }

  private assertDbWritable(): void {
    const upsert = this.persistence.upsertExpertModeInTx;
    if (!this.prisma || !upsert) {
      throw new DomainError(
        "PWA_DISPLAY_SETTINGS_NOT_PERSISTABLE",
        "Mandanten-PWA-Anzeige-Einstellungen sind nur mit Datenbank-Persistenz schreibbar (nicht im In-Memory-Modus).",
        503,
      );
    }
  }

  public async patchExpertMode(input: PatchTenantPwaDisplaySettingsInput): Promise<TenantPwaDisplaySettingsReadData> {
    this.assertDbWritable();
    const upsertInTx = this.persistence.upsertExpertModeInTx!;

    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "TENANT_PWA_DISPLAY_SETTINGS",
      entityId: input.tenantId,
      action: "TENANT_PWA_DISPLAY_SETTINGS_PATCHED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: {},
      afterState: {},
    };

    await this.prisma!.$transaction(async (tx) => {
      const { previous } = await upsertInTx(tx, input.tenantId, input.pwaExpertModeEnabled);
      auditEvent.beforeState = {
        settingsSource: previous ? "TENANT_DATABASE" : "NOT_CONFIGURED",
        pwaExpertModeEnabled: previous?.pwaExpertModeEnabled ?? false,
      };
      auditEvent.afterState = {
        settingsSource: "TENANT_DATABASE",
        pwaExpertModeEnabled: input.pwaExpertModeEnabled,
      };
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);

    return this.getReadModel(input.tenantId);
  }
}
