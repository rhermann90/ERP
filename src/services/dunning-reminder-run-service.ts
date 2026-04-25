import { createHash, randomUUID } from "node:crypto";
import type { TenantId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { DunningReminderRunIntentPersistencePort } from "../persistence/dunning-reminder-run-intent-persistence.js";
import type { DunningReminderCandidatesService } from "./dunning-reminder-candidates-service.js";
import type { DunningReminderService } from "./dunning-reminder-service.js";

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

export type DunningReminderRunMode = "DRY_RUN" | "EXECUTE";

export type DunningReminderRunInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  stageOrdinal: number;
  reason: string;
  mode: DunningReminderRunMode;
  asOfDate?: string;
  invoiceIds?: UUID[];
  note?: string;
  /** Pflicht bei `EXECUTE` (Route prüft). */
  idempotencyKey?: UUID;
};

function envelopeWithReplayOutcome(stored: Record<string, unknown>): Record<string, unknown> {
  const data = stored.data as Record<string, unknown>;
  return { data: { ...data, outcome: "REPLAY" } };
}

export class DunningReminderRunService {
  constructor(
    private readonly candidatesService: DunningReminderCandidatesService,
    private readonly dunningReminderService: DunningReminderService,
    private readonly runIntentPersistence: DunningReminderRunIntentPersistencePort,
  ) {}

  private fingerprintForExecute(input: {
    stageOrdinal: number;
    asOfDate: string;
    invoiceIds?: UUID[];
  }): string {
    const payload =
      input.invoiceIds === undefined || input.invoiceIds.length === 0
        ? { stageOrdinal: input.stageOrdinal, asOfDate: input.asOfDate, scope: "all" as const }
        : {
            stageOrdinal: input.stageOrdinal,
            asOfDate: input.asOfDate,
            scope: "partial" as const,
            invoiceIds: [...input.invoiceIds].sort((a, b) => a.localeCompare(b)),
          };
    return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  }

  public async run(input: DunningReminderRunInput): Promise<Record<string, unknown>> {
    const candidatesResult = await this.candidatesService.listCandidates({
      tenantId: input.tenantId,
      stageOrdinal: input.stageOrdinal,
      asOfDate: input.asOfDate,
    });
    const { asOfDate, stageOrdinal, configSource, candidates } = candidatesResult.data;
    const sorted = [...candidates].sort((a, b) => a.invoiceId.localeCompare(b.invoiceId));

    const explicitInvoiceIds =
      input.invoiceIds !== undefined && input.invoiceIds.length > 0 ? input.invoiceIds : undefined;

    const resolveTargets = (): typeof sorted => {
      if (explicitInvoiceIds !== undefined) {
        const allowed = new Set(sorted.map((c) => c.invoiceId));
        const invalid = explicitInvoiceIds.filter((id) => !allowed.has(id));
        if (invalid.length > 0) {
          throw new DomainError(
            "DUNNING_RUN_INVOICES_INVALID",
            "invoiceIds enthalten Rechnungen, die fuer diese Stufe/asOfDate nicht als Kandidaten gelten",
            400,
            { invalidInvoiceIds: invalid },
          );
        }
        const want = new Set(explicitInvoiceIds);
        return sorted.filter((c) => want.has(c.invoiceId));
      }
      return sorted;
    };

    if (input.mode === "DRY_RUN") {
      const targets = resolveTargets();
      return {
        data: {
          mode: "DRY_RUN",
          outcome: "PREVIEW",
          stageOrdinal,
          asOfDate,
          configSource,
          planned: targets.map((t) => ({
            invoiceId: t.invoiceId,
            dueDate: t.dueDate,
            stageDeadlineIso: t.stageDeadlineIso,
            openAmountCents: t.openAmountCents,
            wouldRecordStageOrdinal: stageOrdinal,
          })),
        },
      };
    }

    const idempotencyKey = input.idempotencyKey;
    if (!idempotencyKey) {
      throw new DomainError(
        "VALIDATION_FAILED",
        "EXECUTE erfordert Header Idempotency-Key (UUID)",
        400,
      );
    }

    const fp = this.fingerprintForExecute({
      stageOrdinal,
      asOfDate,
      invoiceIds: explicitInvoiceIds,
    });

    const existing = await this.runIntentPersistence.findByTenantAndKey(input.tenantId, idempotencyKey);
    if (existing) {
      if (existing.fingerprint !== fp) {
        throw new DomainError(
          "DUNNING_RUN_IDEMPOTENCY_MISMATCH",
          "Idempotency-Key bereits mit anderem Mahnlauf-Parameter verwendet",
          400,
        );
      }
      return envelopeWithReplayOutcome(JSON.parse(existing.responseJson) as Record<string, unknown>);
    }

    const targets = resolveTargets();

    const executed: Array<{
      invoiceId: UUID;
      dunningReminderId: UUID;
      createdAt: string;
      stageOrdinal: number;
    }> = [];

    for (const t of targets) {
      const r = await this.dunningReminderService.record({
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        invoiceId: t.invoiceId,
        stageOrdinal,
        note: input.note,
        reason: input.reason,
      });
      executed.push({
        invoiceId: t.invoiceId,
        dunningReminderId: r.dunningReminderId,
        createdAt: r.createdAt,
        stageOrdinal: r.stageOrdinal,
      });
    }

    const envelope: Record<string, unknown> = {
      data: {
        mode: "EXECUTE",
        outcome: "COMPLETED",
        stageOrdinal,
        asOfDate,
        configSource,
        executed,
      },
    };
    const responseJson = JSON.stringify(envelope);

    try {
      await this.runIntentPersistence.insert({
        id: randomUUID(),
        tenantId: input.tenantId,
        idempotencyKey,
        fingerprint: fp,
        responseJson,
      });
    } catch (err) {
      if (isPrismaUniqueViolation(err)) {
        const again = await this.runIntentPersistence.findByTenantAndKey(input.tenantId, idempotencyKey);
        if (again && again.fingerprint === fp) {
          return envelopeWithReplayOutcome(JSON.parse(again.responseJson) as Record<string, unknown>);
        }
        throw new DomainError(
          "DUNNING_RUN_IDEMPOTENCY_MISMATCH",
          "Idempotency-Key bereits mit anderem Mahnlauf-Parameter verwendet",
          400,
        );
      }
      throw err;
    }

    return envelope;
  }
}
