import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Reproduzierbar ohne laufende Postgres-Instanz: Prisma-Schema + Migrationen syntaktisch valide.
 * Vollständiger „migrate deploy auf leerer DB“-Nachweis: siehe `test/persistence.integration.test.ts` mit `PERSISTENCE_DB_TEST_URL` (CI ohne SKIP).
 */
describe("persistence increment 1 — schema & migrations reproducible (no live DB)", () => {
  it('runs npm run prisma:validate (placeholder DATABASE_URL via scripts/prisma-env-placeholder.mjs)', () => {
    const repoRoot = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
    execFileSync("npm", ["run", "prisma:validate"], { cwd: repoRoot, stdio: "pipe" });
  });
});
