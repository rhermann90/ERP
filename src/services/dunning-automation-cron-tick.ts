import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { DunningReminderCandidatesService } from "./dunning-reminder-candidates-service.js";
import type { DunningReminderRunService } from "./dunning-reminder-run-service.js";

function stableUuidFromSeed(seed: string): string {
  const h = createHash("sha256").update(seed, "utf8").digest();
  const a = Buffer.from(h.subarray(0, 16));
  a[6] = (a[6]! & 0x0f) | 0x40;
  a[8] = (a[8]! & 0x3f) | 0x80;
  const hex = a.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function utcTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export type DunningAutomationCronTickSummary = {
  asOfDate: string;
  hourUtc: number;
  tenantsScanned: number;
  tenantsProcessed: number;
  stageRunsWithCandidates: number;
  stageRunsExecuted: number;
  errors: Array<{ tenantId: string; stageOrdinal: number; message: string }>;
};

/**
 * Ein Cron-Tick: alle Mandanten mit `run_mode = AUTO` (optional `job_hour_utc` = aktuelle UTC-Stunde oder null = jeder Lauf).
 * Pro Stufe 1–9: bei Kandidaten `EXECUTE` mit stabiler Idempotenz pro (Mandant, Stufe, asOfDate).
 * Kein Batch-E-Mail (5b-1); siehe ADR-0010.
 */
export async function runDunningAutomationCronTick(opts: {
  prisma: PrismaClient;
  dunningReminderCandidatesService: DunningReminderCandidatesService;
  dunningReminderRunService: DunningReminderRunService;
}): Promise<DunningAutomationCronTickSummary> {
  const { prisma, dunningReminderCandidatesService, dunningReminderRunService } = opts;
  const asOfDate = utcTodayIsoDate();
  const hourUtc = new Date().getUTCHours();
  const autos = await prisma.dunningTenantAutomation.findMany({ where: { runMode: "AUTO" } });

  const summary: DunningAutomationCronTickSummary = {
    asOfDate,
    hourUtc,
    tenantsScanned: autos.length,
    tenantsProcessed: 0,
    stageRunsWithCandidates: 0,
    stageRunsExecuted: 0,
    errors: [],
  };

  for (const row of autos) {
    if (row.jobHourUtc != null && row.jobHourUtc !== hourUtc) {
      continue;
    }
    summary.tenantsProcessed += 1;
    const actor = await prisma.user.findFirst({
      where: {
        tenantId: row.tenantId,
        active: true,
        role: { in: ["ADMIN", "GESCHAEFTSFUEHRUNG", "BUCHHALTUNG"] },
      },
      orderBy: { createdAt: "asc" },
    });
    if (!actor) {
      summary.errors.push({
        tenantId: row.tenantId,
        stageOrdinal: 0,
        message: "Kein aktiver Nutzer mit Mahn-Schreibrechte fuer Mandant",
      });
      continue;
    }

    for (let stageOrdinal = 1; stageOrdinal <= 9; stageOrdinal += 1) {
      try {
        const listed = await dunningReminderCandidatesService.listCandidates({
          tenantId: row.tenantId,
          stageOrdinal,
          asOfDate,
        });
        if (listed.data.candidates.length === 0) {
          continue;
        }
        summary.stageRunsWithCandidates += 1;
        const seed = `dunning-cron|${row.tenantId}|${stageOrdinal}|${asOfDate}`;
        const idempotencyKey = stableUuidFromSeed(seed);
        await dunningReminderRunService.run({
          tenantId: row.tenantId,
          actorUserId: actor.id,
          stageOrdinal,
          reason: "Automatischer Mahnlauf (interner Cron, M4 5b-2)",
          mode: "EXECUTE",
          asOfDate,
          idempotencyKey,
        });
        summary.stageRunsExecuted += 1;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        summary.errors.push({ tenantId: row.tenantId, stageOrdinal, message });
      }
    }
  }

  return summary;
}
