#!/usr/bin/env node
/**
 * Guards canonical Cursor project rules: one active file (cursor-stack.mdc) and
 * legacy erp-*.mdc paths as non-applied redirects.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const rulesDir = path.join(root, ".cursor", "rules");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function fail(msg) {
  console.error(`validate-cursor-project-rules: ${msg}`);
  process.exit(1);
}

const canonical = path.join(rulesDir, "cursor-stack.mdc");
if (!fs.existsSync(canonical)) {
  fail("missing .cursor/rules/cursor-stack.mdc (canonical Projektregeln)");
}

const stack = read(".cursor/rules/cursor-stack.mdc");
if (!/alwaysApply:\s*true/.test(stack)) {
  fail("cursor-stack.mdc must set alwaysApply: true");
}
for (const needle of ["# Projektregeln", "## Domain core", "## Delivery paths"]) {
  if (!stack.includes(needle)) {
    fail(`cursor-stack.mdc must contain ${JSON.stringify(needle)}`);
  }
}

const stubs = [
  ".cursor/rules/erp-multi-agent.mdc",
  ".cursor/rules/erp-delivery-review.mdc",
  ".cursor/rules/erp-web-ui.mdc",
];

for (const rel of stubs) {
  if (!fs.existsSync(path.join(root, rel))) {
    fail(`missing ${rel}`);
  }
  const body = read(rel);
  if (!body.includes("Projektregeln (Redirect)")) {
    fail(`${rel} must be a Redirect stub`);
  }
  if (!/alwaysApply:\s*false/.test(body)) {
    fail(`${rel} must set alwaysApply: false`);
  }
  if (!body.includes("cursor-stack.mdc")) {
    fail(`${rel} must link to cursor-stack.mdc`);
  }
  if (body.includes("alwaysApply: true")) {
    fail(`${rel} must not set alwaysApply: true`);
  }
}

const legacyMarkers = [
  [".cursor/rules/erp-multi-agent.mdc", "ERP Multi-Agent Core Rules"],
  [".cursor/rules/erp-delivery-review.mdc", "# ERP Delivery, Merge Gates"],
  [".cursor/rules/erp-web-ui.mdc", "# ERP Web UI (PWA)"],
];
for (const [rel, forbidden] of legacyMarkers) {
  if (read(rel).includes(forbidden)) {
    fail(`${rel} still contains legacy marker ${JSON.stringify(forbidden)}`);
  }
}

console.log("validate-cursor-project-rules: OK (canonical + 3 redirect stubs)");
