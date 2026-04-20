/**
 * Parses docs/api-contract.yaml to catch syntax errors (CI + npm run verify:ci).
 * Uses the `yaml` package — no Ruby dependency.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { parse } from "yaml";

const root = fileURLToPath(new URL("..", import.meta.url));
const file = join(root, "docs", "api-contract.yaml");
parse(readFileSync(file, "utf8"));
console.log("docs/api-contract.yaml: YAML OK");
