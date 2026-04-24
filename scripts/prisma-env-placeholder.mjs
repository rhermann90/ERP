/**
 * Prisma CLI lädt env("DATABASE_URL") aus prisma.config.ts (validate, generate, postinstall).
 * Fehlt die Variable, setzen wir einen syntaktisch gültigen Platzhalter — ohne echte DB-Verbindung.
 */
import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = "postgresql://127.0.0.1:5432/prisma_validate_placeholder";
}

const cmd = process.argv[2] ?? "validate";
const r = spawnSync("npx", ["prisma", cmd, ...process.argv.slice(3)], { stdio: "inherit", shell: true });
process.exit(r.status ?? 1);
