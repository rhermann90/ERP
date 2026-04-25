import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../prisma-client.js";
import type { AuditEvent, TenantId, UUID } from "../domain/types.js";
import type {
  DunningTenantAutomationRunMode,
  PaymentTermDayKind,
  PreferredDunningChannel,
} from "../persistence/dunning-tenant-automation-persistence.js";
import { DomainError } from "../errors/domain-error.js";
import type { DunningTenantAutomationPersistencePort } from "../persistence/dunning-tenant-automation-persistence.js";
import { AuditService } from "./audit-service.js";

export type DunningTenantAutomationReadData = {
  automationSource: "NOT_CONFIGURED" | "TENANT_DATABASE";
  tenantId: string;
  /** Effektiver Modus: ohne DB-Zeile gilt SEMI (UI kann Batch nutzen). */
  runMode: DunningTenantAutomationRunMode;
  /** Historisch; immer null (kein Cron). */
  jobHourUtc: null;
  ianaTimezone: string;
  federalStateCode: string | null;
  paymentTermDayKind: PaymentTermDayKind;
  preferredDunningChannel: PreferredDunningChannel;
};

export type DunningTenantEligibilityContext = {
  ianaTimezone: string;
  federalStateCode: string | null;
  paymentTermDayKind: PaymentTermDayKind;
  preferredDunningChannel: PreferredDunningChannel;
};

export type PatchDunningTenantAutomationInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  reason: string;
  runMode: DunningTenantAutomationRunMode;
  ianaTimezone?: string;
  federalStateCode?: string | null;
  paymentTermDayKind?: PaymentTermDayKind;
  preferredDunningChannel?: PreferredDunningChannel;
};

const DEFAULT_CONTEXT: DunningTenantEligibilityContext = {
  ianaTimezone: "Europe/Berlin",
  federalStateCode: null,
  paymentTermDayKind: "CALENDAR",
  preferredDunningChannel: "EMAIL",
};

export class DunningTenantAutomationService {
  constructor(
    private readonly persistence: DunningTenantAutomationPersistencePort,
    private readonly audit: AuditService,
    private readonly prisma: PrismaClient | null,
  ) {}

  /** Für Mahn-Kandidaten: Mandantenzeit, Bundesland, Kalender/Werktage, Kanal. */
  public async getEligibilityContext(tenantId: string): Promise<DunningTenantEligibilityContext> {
    const row = await this.persistence.findByTenant(tenantId);
    if (!row) {
      return { ...DEFAULT_CONTEXT };
    }
    return {
      ianaTimezone: row.ianaTimezone,
      federalStateCode: row.federalStateCode,
      paymentTermDayKind: row.paymentTermDayKind,
      preferredDunningChannel: row.preferredDunningChannel,
    };
  }

  public async getReadModel(tenantId: string): Promise<DunningTenantAutomationReadData> {
    const row = await this.persistence.findByTenant(tenantId);
    if (!row) {
      return {
        automationSource: "NOT_CONFIGURED",
        tenantId,
        runMode: "SEMI",
        jobHourUtc: null,
        ...DEFAULT_CONTEXT,
      };
    }
    return {
      automationSource: "TENANT_DATABASE",
      tenantId,
      runMode: row.runMode,
      jobHourUtc: null,
      ianaTimezone: row.ianaTimezone,
      federalStateCode: row.federalStateCode,
      paymentTermDayKind: row.paymentTermDayKind,
      preferredDunningChannel: row.preferredDunningChannel,
    };
  }

  private assertDbWritable(): void {
    const upsert = this.persistence.upsertAutomationInTx;
    if (!this.prisma || !upsert) {
      throw new DomainError(
        "DUNNING_AUTOMATION_NOT_PERSISTABLE",
        "Mandanten-Mahnlauf-Automatisierung ist nur mit Datenbank-Persistenz schreibbar (nicht im In-Memory-Modus).",
        503,
      );
    }
  }

  public async patchTenantAutomation(input: PatchDunningTenantAutomationInput): Promise<DunningTenantAutomationReadData> {
    this.assertDbWritable();
    const upsertInTx = this.persistence.upsertAutomationInTx!;

    const prev = await this.persistence.findByTenant(input.tenantId);
    const ianaTimezone =
      input.ianaTimezone !== undefined ? input.ianaTimezone.trim() : (prev?.ianaTimezone ?? DEFAULT_CONTEXT.ianaTimezone);
    if (!ianaTimezone || ianaTimezone.length > 64) {
      throw new DomainError("VALIDATION_FAILED", "ianaTimezone muss 1–64 Zeichen sein", 400);
    }
    const federalStateCode =
      input.federalStateCode !== undefined
        ? input.federalStateCode === null || input.federalStateCode.trim() === ""
          ? null
          : input.federalStateCode.trim().toUpperCase()
        : (prev?.federalStateCode ?? null);
    if (federalStateCode != null && !/^[A-Z0-9]{2,4}$/u.test(federalStateCode)) {
      throw new DomainError("VALIDATION_FAILED", "federalStateCode: erwartet z.B. BW, BY, BE (2–4 Zeichen)", 400);
    }
    const paymentTermDayKind =
      input.paymentTermDayKind !== undefined
        ? input.paymentTermDayKind
        : (prev?.paymentTermDayKind ?? DEFAULT_CONTEXT.paymentTermDayKind);
    const preferredDunningChannel =
      input.preferredDunningChannel !== undefined
        ? input.preferredDunningChannel
        : (prev?.preferredDunningChannel ?? DEFAULT_CONTEXT.preferredDunningChannel);

    const nextRow = {
      tenantId: input.tenantId,
      runMode: input.runMode,
      jobHourUtc: null as number | null,
      ianaTimezone,
      federalStateCode,
      paymentTermDayKind,
      preferredDunningChannel,
    };

    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "DUNNING_TENANT_STAGE_CONFIG",
      entityId: input.tenantId,
      action: "DUNNING_TENANT_AUTOMATION_PATCHED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: {},
      afterState: {},
    };

    await this.prisma!.$transaction(async (tx) => {
      const { previous } = await upsertInTx(tx, input.tenantId, nextRow);
      auditEvent.beforeState = {
        automationSource: previous ? "TENANT_DATABASE" : "NOT_CONFIGURED",
        runMode: previous?.runMode ?? "SEMI",
        jobHourUtc: null,
        ianaTimezone: previous?.ianaTimezone ?? DEFAULT_CONTEXT.ianaTimezone,
        federalStateCode: previous?.federalStateCode ?? null,
        paymentTermDayKind: previous?.paymentTermDayKind ?? DEFAULT_CONTEXT.paymentTermDayKind,
        preferredDunningChannel: previous?.preferredDunningChannel ?? DEFAULT_CONTEXT.preferredDunningChannel,
      };
      auditEvent.afterState = {
        automationSource: "TENANT_DATABASE",
        runMode: nextRow.runMode,
        jobHourUtc: null,
        ianaTimezone: nextRow.ianaTimezone,
        federalStateCode: nextRow.federalStateCode,
        paymentTermDayKind: nextRow.paymentTermDayKind,
        preferredDunningChannel: nextRow.preferredDunningChannel,
      };
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);

    return this.getReadModel(input.tenantId);
  }
}
