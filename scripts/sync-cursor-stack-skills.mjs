#!/usr/bin/env node
/**
 * Copies slash-workflow skill folders from upstream cursor-stack into .cursor/skills/.
 * Does not run in CI — call manually when refreshing from upstream.
 *
 * Requires outbound network + git. For air-gapped/offline setups, copy the same eight
 * folders from a cursor-stack artifact into `.cursor/skills/<name>/` — see
 * `.cursor/rules/cursor-stack.mdc` → "Geschlossene / offline Umgebungen".
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const REPO = "https://github.com/Himanshu-Sangshetti/cursor-stack.git";
const SKILL_DIRS = [
  "plan-ceo",
  "plan-eng",
  "code-review",
  "ship",
  "qa",
  "retro",
  "researcher",
  "workflow",
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "erp-cursor-stack-sync-"));
try {
  execSync(`git clone --depth 1 "${REPO}" repo`, {
    cwd: tmp,
    stdio: "inherit",
  });
  const srcRoot = path.join(tmp, "repo");
  const destRoot = path.join(root, ".cursor", "skills");
  fs.mkdirSync(destRoot, { recursive: true });

  for (const d of SKILL_DIRS) {
    const from = path.join(srcRoot, d);
    const to = path.join(destRoot, d);
    if (!fs.existsSync(from)) {
      console.error(`sync-cursor-stack-skills: missing upstream folder ${d}`);
      process.exit(1);
    }
    fs.rmSync(to, { recursive: true, force: true });
    fs.cpSync(from, to, { recursive: true });
  }

  console.log(
    `sync-cursor-stack-skills: OK → ${path.relative(root, destRoot)}/ (${SKILL_DIRS.join(", ")})`,
  );
  console.log("Next: review diff, run npm run validate:cursor-project-rules, then commit if intended.");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
