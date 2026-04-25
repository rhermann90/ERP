import type { Invoice, TenantId, UUID } from "../domain/types.js";
import {
  isCompleteTenantStageConfig,
} from "../domain/dunning-reminder-config-defaults.js";
import { deadlineAfterIssueDate, localTodayIsoDateInZone } from "../domain/dunning-due-date.js";
import { DomainError } from "../errors/domain-error.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import type { DunningTenantEligibilityContext } from "./dunning-tenant-automation-service.js";
import type { DunningReminderConfigService } from "./dunning-reminder-config-service.js";

const DUNNABLE: ReadonlySet<Invoice["status"]> = new Set(["GEBUCHT_VERSENDET", "TEILBEZAHLT"]);

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const FALLBACK_ELIGIBILITY: DunningTenantEligibilityContext = {
  ianaTimezone: "Europe/Berlin",
  federalStateCode: null,
  paymentTermDayKind: "CALENDAR",
  preferredDunningChannel: "EMAIL",
};

export type DunningReminderCandidateRow = {
  invoiceId: UUID;
  /**
   * MVP: Fälligkeitsanker = Rechnungsdatum (`issueDate`), bis ein separates Rechnungs-`dueDate` persistiert wird.
   * Die tatsächliche Stufenfrist steht in `stageDeadlineIso` (gleiche Berechnung wie Eligibility).
   */
  dueDate: string;
  /** Ende der Frist für diese Stufe: `issueDate` + `daysAfterDue` (Kalender- oder Werktage laut Mandanten-Automation). */
  stageDeadlineIso: string;
  openAmountCents: number;
  lastDunningStageOrdinal?: number;
};

/** Kontext, der für `asOfDate` und Fristberechnung verwendet wurde (tenant-scoped). */
export type DunningCandidatesEligibilityContextRead = {
  ianaTimezone: string;
  federalStateCode: string | null;
  paymentTermDayKind: "CALENDAR" | "BUSINESS";
  preferredDunningChannel: "EMAIL" | "PRINT";
};

export type ListDunningReminderCandidatesResult = {
  data: {
    configSource: "MVP_STATIC_DEFAULTS" | "TENANT_DATABASE";
    asOfDate: string;
    stageOrdinal: number;
    daysAfterDueForStage: number;
    eligibilityContext: DunningCandidatesEligibilityContextRead;
    candidates: DunningReminderCandidateRow[];
  };
};

export type DunningEligibilityContextSource = {
  get(tenantId: TenantId): Promise<DunningTenantEligibilityContext>;
};

export class DunningReminderCandidatesService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly dunningReminderConfigService: DunningReminderConfigService,
    private readonly eligibilityContext?: DunningEligibilityContextSource,
  ) {}

  public async listCandidates(input: {
    tenantId: TenantId;
    stageOrdinal: number;
    asOfDate?: string;
  }): Promise<ListDunningReminderCandidatesResult> {
    const { stageOrdinal, tenantId } = input;
    if (!Number.isInteger(stageOrdinal) || stageOrdinal < 1 || stageOrdinal > 9) {
      throw new DomainError("DUNNING_RUN_STAGE_INVALID", "stageOrdinal muss eine ganze Zahl 1–9 sein", 400);
    }

    const rawAsOf = input.asOfDate?.trim();
    const ctx = this.eligibilityContext
      ? await this.eligibilityContext.get(tenantId)
      : FALLBACK_ELIGIBILITY;
    const asOfDate =
      rawAsOf && rawAsOf.length > 0 ? rawAsOf : localTodayIsoDateInZone(ctx.ianaTimezone);
    if (!ISO_DATE.test(asOfDate)) {
      throw new DomainError("VALIDATION_FAILED", "asOfDate muss ISO yyyy-mm-dd sein", 400);
    }

    const cfg = await this.dunningReminderConfigService.getReadModel(tenantId);
    const { stages } = cfg;
    if (!isCompleteTenantStageConfig(stages)) {
      throw new DomainError(
        "DUNNING_RUN_CONFIG_INCOMPLETE",
        "Mahnstufen-Konfiguration unvollstaendig (erwarte 9 Stufen mit Ordinal 1–9)",
        409,
      );
    }
    const stageRow = stages.find((s) => s.stageOrdinal === stageOrdinal);
    if (!stageRow) {
      throw new DomainError(
        "DUNNING_RUN_STAGE_INVALID",
        "Keine Stufenmetadaten fuer die gewaehlte stageOrdinal",
        400,
      );
    }

    const candidates: DunningReminderCandidateRow[] = [];

    for (const inv of this.repos.listInvoicesForTenant(tenantId)) {
      if (!DUNNABLE.has(inv.status)) continue;
      if (!inv.issueDate || !ISO_DATE.test(inv.issueDate)) continue;
      const total = inv.totalGrossCents;
      if (total == null) continue;
      const paid = this.repos
        .listPaymentIntakesForInvoice(tenantId, inv.id)
        .reduce((s, p) => s + p.amountCents, 0);
      const openAmountCents = total - paid;
      if (openAmountCents <= 0) continue;

      const reminders = this.repos.listDunningRemindersForInvoice(tenantId, inv.id);
      const maxOrdinal =
        reminders.length === 0 ? 0 : Math.max(...reminders.map((r) => r.stageOrdinal));

      if (stageOrdinal === 1) {
        if (maxOrdinal !== 0) continue;
      } else if (maxOrdinal !== stageOrdinal - 1) {
        continue;
      }

      const deadlineIso = deadlineAfterIssueDate(
        inv.issueDate,
        stageRow.daysAfterDue,
        ctx.paymentTermDayKind,
        ctx.federalStateCode,
      );
      if (deadlineIso > asOfDate) continue;

      const row: DunningReminderCandidateRow = {
        invoiceId: inv.id,
        dueDate: inv.issueDate,
        stageDeadlineIso: deadlineIso,
        openAmountCents,
      };
      if (reminders.length > 0) {
        row.lastDunningStageOrdinal = maxOrdinal;
      }
      candidates.push(row);
    }

    candidates.sort((a, b) => a.invoiceId.localeCompare(b.invoiceId));

    return {
      data: {
        configSource: cfg.configSource,
        asOfDate,
        stageOrdinal,
        daysAfterDueForStage: stageRow.daysAfterDue,
        eligibilityContext: {
          ianaTimezone: ctx.ianaTimezone,
          federalStateCode: ctx.federalStateCode,
          paymentTermDayKind: ctx.paymentTermDayKind,
          preferredDunningChannel: ctx.preferredDunningChannel,
        },
        candidates,
      },
    };
  }
}
