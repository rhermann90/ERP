#!/usr/bin/env node
/**
 * Validates Checklisten/compliance-signoffs.json against <!-- compliance-line --> markers in
 * compliance-rechnung-finanz.ledger.md and the identical block in compliance-rechnung-finanz-filled.md.
 */
import {
  LEDGER_PATH,
  LINE_ALLOWED_SUFFIXES,
  ledgerMarkdownApplyTargets,
  extractLineIdToBulletIndex,
  loadChecklist,
  loadLedger,
  validateLedgerPayload,
  normalizeComplianceBulletLine,
} from "./compliance-signoffs-shared.mjs";

function main() {
  const targets = ledgerMarkdownApplyTargets();
  /** @type {Map<string, number>|null} */
  let canonical = null;
  /** @type {string[]|null} */
  let primaryLines = null;
  /** @type {string[]|null} */
  let secondaryLines = null;
  /** @type {Map<string, number>|null} */
  let secondaryMap = null;

  for (const path of targets) {
    const md = loadChecklist(path);
    const lines = md.split(/\r?\n/);
    const lineIdToIndex = extractLineIdToBulletIndex(lines);
    if (!canonical) {
      canonical = lineIdToIndex;
      primaryLines = lines;
      for (const id of canonical.keys()) {
        if (!LINE_ALLOWED_SUFFIXES[id]?.length) {
          throw new Error(
            `LINE_ALLOWED_SUFFIXES missing or empty for checklist marker "${id}" — extend scripts/compliance-signoffs-shared.mjs`,
          );
        }
      }
    } else {
      const a = [...canonical.keys()].sort().join("\n");
      const b = [...lineIdToIndex.keys()].sort().join("\n");
      if (a !== b) {
        throw new Error(
          `compliance-line marker set mismatch:\nprimary (${targets[0]})\nvs (${path})\n— Anlage in filled.md muss Ledger-Zeilen spiegeln (IDs und Bullet-Text).`,
        );
      }
      secondaryLines = lines;
      secondaryMap = lineIdToIndex;
    }
  }

  if (!primaryLines || !secondaryLines || !secondaryMap) {
    throw new Error("expected two markdown targets from ledgerMarkdownApplyTargets()");
  }
  for (const lineId of canonical.keys()) {
    const i0 = canonical.get(lineId);
    const i1 = secondaryMap.get(lineId);
    const bullet0 = primaryLines[i0];
    const bullet1 = secondaryLines[i1];
    const stem0 = normalizeComplianceBulletLine(bullet0);
    const stem1 = normalizeComplianceBulletLine(bullet1);
    if (stem0 !== stem1) {
      throw new Error(
        `compliance bullet text mismatch for "${lineId}":\n  primary (${targets[0]}): ${JSON.stringify(stem0)}\n  secondary (${targets[1]}): ${JSON.stringify(stem1)}`,
      );
    }
  }

  const raw = loadLedger(LEDGER_PATH);
  validateLedgerPayload(raw, canonical);
  console.log(
    `validate:compliance-signoffs: OK (${raw.signoffs?.length ?? 0} signoff(s), ${canonical.size} line marker(s), ${targets.length} markdown target(s))`,
  );
}

try {
  main();
} catch (e) {
  console.error(e.message || String(e));
  process.exit(1);
}
