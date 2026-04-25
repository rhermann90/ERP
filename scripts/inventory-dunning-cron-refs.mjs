/**
 * Fail-closed: no reintroduced internal dunning cron route in application source.
 * Does not scan docs/ (historical mentions allowed).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const needle = "/internal/cron/dunning-automation";
const srcRoot = join(root, "src");

function walk(dir, acc) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (st.isFile() && (name.endsWith(".ts") || name.endsWith(".mts"))) acc.push(p);
  }
}

const files = [];
walk(srcRoot, files);
const hits = [];
for (const f of files) {
  const t = readFileSync(f, "utf8");
  if (t.includes(needle)) hits.push(f);
}
if (hits.length > 0) {
  console.error("Forbidden internal dunning cron reference in src/:\n" + hits.join("\n"));
  process.exit(1);
}
console.log("check:dunning-inventory: OK (no " + needle + " under src/)");
