/**
 * Fail-fast: prisma CLI + @prisma/client same major; conventions for 5.x vs 7.x (ERP).
 * Run: node scripts/check-prisma-stack.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = join(root, "package.json");
const schemaPath = join(root, "prisma", "schema.prisma");
const configPath = join(root, "prisma.config.ts");

function majorFromRange(v) {
  if (v == null || typeof v !== "string") return null;
  const s = v.trim();
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function fail(msg) {
  console.error(`check-prisma-stack: ${msg}`);
  process.exit(1);
}

const pkg = readJson(pkgPath);
const clientRange = pkg.dependencies?.["@prisma/client"];
const prismaRange = pkg.devDependencies?.prisma;
const clientM = majorFromRange(clientRange);
const prismaM = majorFromRange(prismaRange);
if (clientM == null || prismaM == null) {
  fail(`Missing prisma or @prisma/client in package.json (got client=${clientRange}, prisma=${prismaRange})`);
}
if (clientM !== prismaM) {
  fail(`Version split: @prisma/client major ${clientM} (${clientRange}) vs prisma major ${prismaM} (${prismaRange})`);
}

const hasConfig = existsSync(configPath);
const schema = existsSync(schemaPath) ? readFileSync(schemaPath, "utf8") : "";
const datasourceBlock = schema.match(/datasource\s+db\s*\{[^}]*\}/s)?.[0] ?? "";
const datasourceHasUrl = /\burl\s*=/.test(datasourceBlock);

if (prismaM >= 7) {
  if (!hasConfig) fail("Prisma major >= 7: expected prisma.config.ts at repo root (see PRISMA-7-UPGRADE / m4 reference branch).");
  if (datasourceHasUrl) {
    fail("Prisma major >= 7: datasource block in prisma/schema.prisma should not set url (use prisma.config.ts / upgrade guide).");
  }
} else {
  if (hasConfig) {
    console.warn("check-prisma-stack: warn — prisma.config.ts present while Prisma major < 7; remove unless intentionally migrating.");
  }
  if (!datasourceHasUrl) {
    fail("Prisma major < 7: expected datasource db { ... url = env(\"DATABASE_URL\") } in prisma/schema.prisma.");
  }
}

console.log(
  `check-prisma-stack: OK (prisma + @prisma/client major ${prismaM}; prisma.config.ts=${hasConfig}; datasource.url in schema=${datasourceHasUrl})`,
);
