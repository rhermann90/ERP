import type { Invoice, TenantId, UUID } from "../domain/types.js";
import {
  isCompleteTenantStageConfig,
} from "../domain/dunning-reminder-config-defaults.js";
import { DomainError } from "../errors/domain-error.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import type { DunningReminderConfigService } from "./dunning-reminder-config-service.js";

const DUNNABLE: ReadonlySet<Invoice["status"]> = new Set(["GEBUCHT_VERSENDET", "TEILBEZAHLT"]);

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function utcTodayIsoDate(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Kalendertage ab ISO-Datum (UTC); `isoDate` muss yyyy-mm-dd sein. */
function addCalendarDaysToIsoDate(isoDate: string, days: number): string {
  const m = ISO_DATE.exec(isoDate);
  if (!m) {
    throw new DomainError("VALIDATION_FAILED", "Internes Datumsformat ungueltig", 400);
  }
  const base = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  base.setUTCDate(base.getUTCDate() + days);
  const y = base.getUTCFullYear();
  const mo = String(base.getUTCMonth() + 1).padStart(2, "0");
  const da = String(base.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

export type DunningReminderCandidateRow = {
  invoiceId: UUID;
  /**
   * MVP 5b-0: gleiches Datum wie `issueDate` (Fälligkeitsanker bis separates `dueDate` im Modell).
   * API-Feldname `dueDate` bleibt stabil für Clients gemäß ADR-0010.
   */
  dueDate: string;
  openAmountCents: number;
  lastDunningStageOrdinal?: number;
};

export type ListDunningReminderCandidatesResult = {
  data: {
    configSource: "MVP_STATIC_DEFAULTS" | "TENANT_DATABASE";
    asOfDate: string;
    stageOrdinal: number;
    daysAfterDueForStage: number;
    candidates: DunningReminderCandidateRow[];
  };
};

export class DunningReminderCandidatesService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly dunningReminderConfigService: DunningReminderConfigService,
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
    const asOfDate = rawAsOf && rawAsOf.length > 0 ? rawAsOf : utcTodayIsoDate();
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

      const deadlineIso = addCalendarDaysToIsoDate(inv.issueDate, stageRow.daysAfterDue);
      if (deadlineIso > asOfDate) continue;

      const row: DunningReminderCandidateRow = {
        invoiceId: inv.id,
        dueDate: inv.issueDate,
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
        candidates,
      },
    };
  }
}
