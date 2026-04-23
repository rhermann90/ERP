/**
 * §8.10 Mahnstufen-Metadaten (FIN-4): MVP-Defaults und/oder mandantenspezifische DB-Zeilen.
 */
export type DunningStageConfigReadRow = {
  stageOrdinal: number;
  /** Illustrative days after due date until escalation (not legally binding). */
  daysAfterDue: number;
  feeCents: number;
  label: string;
};

export type DunningConfigSource = "MVP_STATIC_DEFAULTS" | "TENANT_DATABASE";

export type DunningReminderConfigReadData = {
  configSource: DunningConfigSource;
  tenantId: string;
  stages: DunningStageConfigReadRow[];
};

/** Exakt neun Stufen mit Ordinal 1..9 (je einmal) → Lesepfad darf `TENANT_DATABASE` liefern. */
export function isCompleteTenantStageConfig(stages: DunningStageConfigReadRow[]): boolean {
  if (stages.length !== 9) return false;
  const ordinals = new Set(stages.map((s) => s.stageOrdinal));
  if (ordinals.size !== 9) return false;
  for (let n = 1; n <= 9; n += 1) {
    if (!ordinals.has(n)) return false;
  }
  return true;
}

export function buildMvpStaticDunningReminderConfig(tenantId: string): DunningReminderConfigReadData {
  const stages: DunningStageConfigReadRow[] = [];
  for (let stageOrdinal = 1; stageOrdinal <= 9; stageOrdinal += 1) {
    stages.push({
      stageOrdinal,
      daysAfterDue: 14 * stageOrdinal,
      feeCents: 0,
      label: `Mahnstufe ${stageOrdinal} (MVP-Default)`,
    });
  }
  return { configSource: "MVP_STATIC_DEFAULTS", tenantId, stages };
}
