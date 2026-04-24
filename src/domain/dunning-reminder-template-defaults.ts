/**
 * §8.10 Mahn-Vorlagen (FIN-4 / M4): MVP-Defaults und/oder mandantenspezifische DB-Zeilen.
 * Slice 1: Lesepfad; Slice 2: serverseitige Pflichtplatzhalter bei Schreibpfad (`PATCH` Text `body`).
 */

import { DomainError } from "../errors/domain-error.js";

export type DunningTemplateChannel = "EMAIL" | "PRINT";

/** §8.10 Vorlagen-Typ-Kardinalität — je Stufe genau einer Typ (MVP-Zuordnung nach Ordinal-Band). */
export type DunningTemplateType = "REMINDER" | "DEMAND_NOTE" | "DUNNING";

export type DunningStageTemplateChannelRow = {
  channel: DunningTemplateChannel;
  templateType: DunningTemplateType;
  /** Freitext inkl. Pflichtplatzhaltern; bei `PATCH` prüft der Server Slice 2. */
  body: string;
};

export type DunningStageTemplatesReadRow = {
  stageOrdinal: number;
  channels: DunningStageTemplateChannelRow[];
};

export type DunningTemplateSource = "MVP_STATIC_DEFAULTS" | "TENANT_DATABASE";

export type DunningReminderTemplatesReadData = {
  templateSource: DunningTemplateSource;
  tenantId: string;
  stages: DunningStageTemplatesReadRow[];
};

/** Persistenz-Zeile (flach) vor Aggregation. */
export type DunningTemplatePersistenceRow = {
  stageOrdinal: number;
  channel: DunningTemplateChannel;
  templateType: DunningTemplateType;
  body: string;
};

export function mvpTemplateTypeForStageOrdinal(stageOrdinal: number): DunningTemplateType {
  if (stageOrdinal <= 3) return "REMINDER";
  if (stageOrdinal <= 6) return "DEMAND_NOTE";
  return "DUNNING";
}

function mvpBodyFor(
  stageOrdinal: number,
  channel: DunningTemplateChannel,
  templateType: DunningTemplateType,
): string {
  const ch = channel === "EMAIL" ? "E-Mail" : "Druck/PDF";
  const baseFee = "{{MahngebuehrEUR}}";
  if (templateType === "DUNNING") {
    return `Stufe ${stageOrdinal} (${ch}, Mahnung): Offener Betrag. Mahngebühr ${baseFee}.`;
  }
  return `Stufe ${stageOrdinal} (${ch}): Zahlungserinnerung bzw. Avis. Mahngebühr ${baseFee}. Skonto {{SkontoBetragEUR}} bis {{SkontofristDatum}}.`;
}

export function isCompleteTenantStageTemplates(rows: DunningTemplatePersistenceRow[]): boolean {
  const active = rows.filter((r) => r.stageOrdinal >= 1 && r.stageOrdinal <= 9);
  if (active.length !== 18) return false;
  const keys = new Set(active.map((r) => `${r.stageOrdinal}:${r.channel}`));
  if (keys.size !== 18) return false;
  for (let n = 1; n <= 9; n += 1) {
    if (!keys.has(`${n}:EMAIL`) || !keys.has(`${n}:PRINT`)) return false;
  }
  return true;
}

export function buildMvpStaticDunningReminderTemplates(tenantId: string): DunningReminderTemplatesReadData {
  const stages: DunningStageTemplatesReadRow[] = [];
  for (let stageOrdinal = 1; stageOrdinal <= 9; stageOrdinal += 1) {
    const templateType = mvpTemplateTypeForStageOrdinal(stageOrdinal);
    stages.push({
      stageOrdinal,
      channels: [
        {
          channel: "EMAIL",
          templateType,
          body: mvpBodyFor(stageOrdinal, "EMAIL", templateType),
        },
        {
          channel: "PRINT",
          templateType,
          body: mvpBodyFor(stageOrdinal, "PRINT", templateType),
        },
      ],
    });
  }
  return { templateSource: "MVP_STATIC_DEFAULTS", tenantId, stages };
}

/** §8.10 Pflichtplatzhalter im Freitext — nur bei Schreibpfad (M4 Slice 2), nicht bei GET/MVP-Read. */
export function assertMandatoryDunningTemplatePlaceholders(body: string, templateType: DunningTemplateType): void {
  const missing: string[] = [];
  if (!body.includes("{{MahngebuehrEUR}}")) {
    missing.push("{{MahngebuehrEUR}}");
  }
  if (templateType === "REMINDER" || templateType === "DEMAND_NOTE") {
    if (!body.includes("{{SkontoBetragEUR}}")) {
      missing.push("{{SkontoBetragEUR}}");
    }
    if (!body.includes("{{SkontofristDatum}}")) {
      missing.push("{{SkontofristDatum}}");
    }
  }
  if (missing.length > 0) {
    throw new DomainError(
      "DUNNING_TEMPLATE_PLACEHOLDERS_INVALID",
      `Mahn-Vorlage: Pflichtplatzhalter fehlen: ${missing.join(", ")}`,
      400,
      { missing },
    );
  }
}

export function aggregateTemplateRowsToStages(rows: DunningTemplatePersistenceRow[]): DunningStageTemplatesReadRow[] {
  const byOrdinal = new Map<number, DunningStageTemplateChannelRow[]>();
  for (const r of rows) {
    const list = byOrdinal.get(r.stageOrdinal) ?? [];
    list.push({ channel: r.channel, templateType: r.templateType, body: r.body });
    byOrdinal.set(r.stageOrdinal, list);
  }
  const stages: DunningStageTemplatesReadRow[] = [];
  for (let n = 1; n <= 9; n += 1) {
    const channels = byOrdinal.get(n);
    if (channels && channels.length > 0) {
      channels.sort((a, b) => a.channel.localeCompare(b.channel));
      stages.push({ stageOrdinal: n, channels });
    }
  }
  return stages;
}
