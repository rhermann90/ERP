#!/usr/bin/env node
/**
 * Applies ledger signoffs to compliance-rechnung-finanz.ledger.md and
 * compliance-rechnung-finanz-filled.md (checkbox + dated suffix blocks).
 * Usage:
 *   node scripts/apply-compliance-signoffs.mjs           # dry-run (no write)
 *   node scripts/apply-compliance-signoffs.mjs --apply   # write both markdown files
 */
import { writeFileSync } from "node:fs";
import {
  LEDGER_PATH,
  ledgerMarkdownApplyTargets,
  applyBlocksToBulletLine,
  extractLineIdToBulletIndex,
  loadChecklist,
  loadLedger,
  validateLedgerPayload,
} from "./compliance-signoffs-shared.mjs";

const apply = process.argv.includes("--apply");

function applyOneFile(checklistPath, signoffs) {
  const md = loadChecklist(checklistPath);
  const lines = md.split(/\r?\n/);
  const lineIdToIndex = extractLineIdToBulletIndex(lines);

  /** @type {Map<number, Array<{isoDate: string, suffix: string}>>} */
  const byBulletIndex = new Map();
  for (const s of signoffs) {
    const idx = lineIdToIndex.get(s.lineId);
    if (!byBulletIndex.has(idx)) byBulletIndex.set(idx, []);
    byBulletIndex.get(idx).push({ isoDate: s.isoDate, suffix: s.suffix });
  }

  const out = [...lines];
  let changed = 0;
  for (const [idx, blocks] of byBulletIndex) {
    const before = out[idx];
    const after = applyBlocksToBulletLine(before, blocks);
    if (after !== before) {
      changed++;
      out[idx] = after;
      if (!apply) {
        console.log(`[dry-run] ${checklistPath}:${idx + 1}: would update checkbox/suffixes`);
      }
    }
  }

  if (apply) {
    const text = out.join("\n").replace(/\n?$/, "\n");
    writeFileSync(checklistPath, text, "utf8");
    console.log(`apply-compliance-signoffs: wrote ${checklistPath} (${changed} line(s) updated).`);
  }
  return changed;
}

function main() {
  const targets = ledgerMarkdownApplyTargets();
  const primaryMd = loadChecklist(targets[0]);
  const primaryLines = primaryMd.split(/\r?\n/);
  const lineIdToIndex = extractLineIdToBulletIndex(primaryLines);
  const raw = loadLedger(LEDGER_PATH);
  const { signoffs } = validateLedgerPayload(raw, lineIdToIndex);

  let totalWouldChange = 0;
  for (const path of targets) {
    totalWouldChange += applyOneFile(path, signoffs);
  }

  if (!apply) {
    console.log(
      `apply-compliance-signoffs: dry-run OK (${signoffs.length} signoff(s), ${totalWouldChange} line change(s) across ${targets.length} file(s)). Use --apply to write.`,
    );
    return;
  }
}

try {
  main();
} catch (e) {
  console.error(e.message || String(e));
  process.exit(1);
}
