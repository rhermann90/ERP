/**
 * Startet Repo-`docker compose` (Service `postgres`), wartet auf pg_isready und
 * stellt sicher, dass die Datenbank `erp_test` existiert (idempotent; hilft bei alten Volumes).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function composeExec(args, input) {
  const r = spawnSync("docker", ["compose", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    input,
  });
  const out = `${r.stderr ?? ""}${r.stdout ?? ""}`;
  return { ok: r.status === 0, out };
}

async function main() {
  const up = composeExec(["up", "-d"]);
  if (!up.ok) {
    console.error("docker compose up -d fehlgeschlagen:\n", up.out);
    process.exit(1);
  }
  for (let i = 0; i < 45; i++) {
    const pr = composeExec(["exec", "-T", "postgres", "pg_isready", "-U", "erp", "-d", "postgres"]);
    if (pr.ok) break;
    if (i === 44) {
      console.error("Postgres nicht bereit nach 45s:\n", pr.out);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  const cre = composeExec([
    "exec",
    "-T",
    "postgres",
    "psql",
    "-U",
    "erp",
    "-d",
    "postgres",
    "-c",
    "CREATE DATABASE erp_test OWNER erp;",
  ]);
  if (!cre.ok && !/already exists/i.test(cre.out)) {
    console.error("CREATE DATABASE erp_test fehlgeschlagen:\n", cre.out);
    process.exit(1);
  }
  console.log("Lokaler Postgres (Compose) bereit; Datenbank erp_test nutzbar.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
