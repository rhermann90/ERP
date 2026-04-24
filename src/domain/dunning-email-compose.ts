import type { DunningStageConfigReadRow } from "./dunning-reminder-config-defaults.js";
import type { DunningStageTemplatesReadRow } from "./dunning-reminder-template-defaults.js";
import type { DunningEmailFooterFields } from "./dunning-email-footer.js";
import { DomainError } from "../errors/domain-error.js";

export function formatEurFromCents(cents: number): string {
  const v = cents / 100;
  return `${v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
}

/** System-Footer als Plain-Text (kein HTML). */
export function formatEmailFooterBlockPlainText(fields: DunningEmailFooterFields): string {
  const lines: string[] = [];
  const push = (s: string) => {
    const t = s.trim();
    if (t.length > 0) lines.push(t);
  };
  push(fields.companyLegalName);
  const addr = [fields.streetLine, `${fields.postalCode} ${fields.city}`.trim(), fields.countryCode].filter((x) => x.trim().length > 0);
  if (addr.length > 0) lines.push(addr.join(", "));
  push(fields.publicEmail);
  push(fields.publicPhone);
  push(fields.legalRepresentative);
  if (fields.registerCourt.trim() || fields.registerNumber.trim()) {
    lines.push(`${fields.registerCourt.trim()} ${fields.registerNumber.trim()}`.trim());
  }
  push(fields.vatId);
  push(fields.signatureLine);
  return lines.join("\n");
}

export type DunningEmailPlaceholderContext = {
  mahngebuehrEur: string;
  skontoBetragEur: string;
  skontofristDatum: string;
};

export function substituteDunningEmailPlaceholders(body: string, ctx: DunningEmailPlaceholderContext): string {
  return body
    .replaceAll("{{MahngebuehrEUR}}", ctx.mahngebuehrEur)
    .replaceAll("{{SkontoBetragEUR}}", ctx.skontoBetragEur)
    .replaceAll("{{SkontofristDatum}}", ctx.skontofristDatum);
}

export function findEmailTemplateBodyForStage(
  stages: DunningStageTemplatesReadRow[],
  stageOrdinal: number,
): string | null {
  const row = stages.find((s) => s.stageOrdinal === stageOrdinal);
  const ch = row?.channels.find((c) => c.channel === "EMAIL");
  return ch?.body ?? null;
}

export function findStageFeeCents(stages: DunningStageConfigReadRow[], stageOrdinal: number): number | null {
  const row = stages.find((s) => s.stageOrdinal === stageOrdinal);
  if (!row) return null;
  return row.feeCents;
}

export function assertStageOrdinalInRange(stageOrdinal: number): void {
  if (!Number.isInteger(stageOrdinal) || stageOrdinal < 1 || stageOrdinal > 9) {
    throw new DomainError("DUNNING_EMAIL_STAGE_INVALID", "stageOrdinal muss 1–9 sein", 400);
  }
}
