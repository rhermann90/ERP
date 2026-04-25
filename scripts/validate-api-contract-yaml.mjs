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
const doc = parse(readFileSync(file, "utf8"));
const yamlVersion = doc?.info?.version;
const versionTs = join(root, "src", "domain", "openapi-contract-version.ts");
const tsSrc = readFileSync(versionTs, "utf8");
const m = tsSrc.match(/ERP_OPENAPI_INFO_VERSION\s*=\s*"([^"]+)"/);
const tsVersion = m?.[1];
if (!yamlVersion || !tsVersion || yamlVersion !== tsVersion) {
  console.error(
    `OpenAPI version mismatch: docs/api-contract.yaml info.version=${JSON.stringify(yamlVersion)} vs src/domain/openapi-contract-version.ts ERP_OPENAPI_INFO_VERSION=${JSON.stringify(tsVersion)}`,
  );
  process.exit(1);
}
console.log("docs/api-contract.yaml: YAML OK");
console.log(`OpenAPI info.version sync: ${yamlVersion}`);
