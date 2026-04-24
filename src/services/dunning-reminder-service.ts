import { randomUUID } from "node:crypto";
import type { DunningReminder, Invoice, TenantId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import type { DunningReminderPersistencePort } from "../persistence/dunning-reminder-persistence.js";
import { AuditService } from "./audit-service.js";

const DUNNABLE: ReadonlySet<Invoice["status"]> = new Set(["GEBUCHT_VERSENDET", "TEILBEZAHLT"]);

export type RecordDunningReminderInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  invoiceId: UUID;
  stageOrdinal: number;
  note?: string;
  reason: string;
};

export type RecordDunningReminderResult = {
  dunningReminderId: UUID;
  stageOrdinal: number;
  createdAt: string;
};

export class DunningReminderService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly audit: AuditService,
    private readonly dunningReminderPersistence: DunningReminderPersistencePort,
  ) {}

  public async record(input: RecordDunningReminderInput): Promise<RecordDunningReminderResult> {
    const inv = this.repos.getInvoiceByTenant(input.tenantId, input.invoiceId);
    if (!inv) {
      throw new DomainError("DOCUMENT_NOT_FOUND", "Rechnung nicht gefunden", 404);
    }
    if (!DUNNABLE.has(inv.status)) {
      throw new DomainError(
        "DUNNING_INVOICE_NOT_ELIGIBLE",
        "Mahn-Ereignis nur bei gebuchter oder teilbezahlter Rechnung erlaubt",
        400,
      );
    }

    const id = randomUUID();
    const createdAt = new Date();
    const row: DunningReminder = {
      id,
      tenantId: input.tenantId,
      invoiceId: input.invoiceId,
      stageOrdinal: input.stageOrdinal,
      note: input.note,
      createdAt,
    };
    this.repos.putDunningReminder(row);

    try {
      await this.dunningReminderPersistence.persistDunningReminder(row);
    } catch (err) {
      this.repos.removeDunningReminder(row);
      throw err;
    }

    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "INVOICE",
      entityId: inv.id,
      action: "STATUS_CHANGED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      afterState: {
        dunningReminderId: id,
        stageOrdinal: input.stageOrdinal,
        note: input.note,
      },
    });

    return {
      dunningReminderId: id,
      stageOrdinal: input.stageOrdinal,
      createdAt: createdAt.toISOString(),
    };
  }
}
