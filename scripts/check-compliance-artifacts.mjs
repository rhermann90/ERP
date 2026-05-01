#!/usr/bin/env node
/**
 * Ensures canonical Compliance artefact files exist (no content validation).
 * Prevents accidental deletion of e.g. printable checklist while links remain in docs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const REQUIRED_PATHS = [
  "Checklisten/compliance-rechnung-finanz.md",
  "Checklisten/compliance-rechnung-finanz.ledger.md",
  "Checklisten/compliance-rechnung-finanz-filled.md",
  "Checklisten/compliance-signoffs.schema.json",
  "Checklisten/compliance-signoffs.schema.md",
  "scripts/compliance-signoffs-shared.mjs",
  "scripts/validate-compliance-signoffs.mjs",
  "scripts/apply-compliance-signoffs.mjs",
];

let failed = false;
for (const rel of REQUIRED_PATHS) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`check-compliance-artifacts: MISSING ${rel}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(`check-compliance-artifacts: OK (${REQUIRED_PATHS.length} paths)`);
