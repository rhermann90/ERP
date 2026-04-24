# PRISMA-7-UPGRADE — geplantes Major-Upgrade (eigenes Inkrement)

## Status Hauptlinie (erledigt, 2026-04-24)

- **Versionen (exakt gepinnt):** `prisma` 7.8.0, `@prisma/client` 7.8.0, `@prisma/adapter-pg` 7.8.0 — siehe [package.json](../../package.json). `npm ls prisma @prisma/client @prisma/adapter-pg` zeigt eine einzige 7.8.0-Zeile ohne Split.
- **Laufzeit:** [`prisma.config.ts`](../../prisma.config.ts), Generator `prisma-client` + Output `generated/`, [`src/prisma-client.ts`](../../src/prisma-client.ts) mit `PrismaPg`-Adapter (keine direkten Imports aus `@prisma/client` im Anwendungscode).
- **Validierung:** `npm run prisma:validate`, `npx prisma generate`, `npm run verify:ci` (Audit, Contract-YAML, Typecheck, Web-Build, Vitest inkl. Root) erfolgreich lokal.
- **Persistenz / Migrate:** `npm run verify:ci:local-db` setzt **laufendes Docker** (Postgres 16 laut `ensure-local-test-db`) voraus; ohne Docker hier nicht ausgeführt — in CI (`backend` mit Postgres-Service) weiterhin Pflicht.
- **Dependabot:** Gruppen-PR [#21](https://github.com/rhermann90/ERP/pull/21) hob nur `@prisma/client` an und wurde **geschlossen** (Split-Risiko). Künftige Prisma-PRs müssen **CLI + Client + Adapter** gemeinsam anheben.
- **Transitive CLI-Deps:** Pakete wie `@hono/node-server` (Kette `prisma` → `@prisma/dev`) sind nur Dev-/CLI-Tooling, tauchen aber in **Dependency Review** auf. Bis Prisma ein Release mit angehobener Abhängigkeit liefert, können sie per Root-[`overrides`](../../package.json) in `package.json` auf eine gepatchte Version gezogen werden (z. B. [GHSA-92pp-h63x-v22m](https://github.com/advisories/GHSA-92pp-h63x-v22m) — Floor ≥ 1.19.13); `npm audit fix --force` vermeiden, wenn es einen ungewollten Prisma-Major nahelegt.

### Hinweis nach Merge mehrerer PRs (2026-04-24)

- **`origin/main`:** Prisma **7.8.0** (gepinnt), `prisma.config.ts`, `npm run check:prisma-stack`, CI-Job `e2e-smoke` setzt `DATABASE_URL` für `prisma generate` im Postinstall.
- **Feature-Branches:** nach `git fetch` / `git merge origin/main` jeweils `package.json`, Lockfile und dieses Ticket prüfen — nicht blind alte `^5.22.0`-Zeilen aus Konflikten übernehmen.

---


## Kontext

Dependabot-PRs für nur `@prisma/client` oder nur `prisma` führen zu einem **Versions-Split** und brechen `npm ci` / `postinstall` (`prisma generate`). Abgeschlossenes Beispiel: PR#14 (geschlossen). Künftig gruppiert [`.github/dependabot.yml`](../../.github/dependabot.yml) Prisma-Pakete in einem gemeinsamen PR.

Dieses Ticket beschreibt die **bewusste** Migration auf Prisma 7.x — nicht mergen, bevor alle Punkte erfüllt sind.

## Zielversion

- Zum Umsetzungszeitpunkt: aktuelle **stabile 7.x**-Releases von `prisma` und `@prisma/client` wählen (Release Notes lesen).
- **Pflicht:** `prisma` (devDependency) und `@prisma/client` (dependency) auf **dieselbe** Version pinnen bzw. identisches semver-Range, sodass `package-lock.json` **keine** gemischten `@prisma/*`-Major-Versionen enthält.

## Voraussetzungen

- **Node:** Prisma 7 fordert u.a. `^20.19 || ^22.12 || >=24.0` für den Client — CI nutzt Node 22 (siehe [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)); vor Upgrade Mindestversion mit [Prisma-Doku](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions) abgleichen.
- **PostgreSQL:** Weiterhin dieselbe Test-DB wie in CI (Postgres 16, `migrate deploy`).

## Checkliste Umsetzung

1. Offizielles Upgrade-Guide durcharbeiten: [Upgrading versions](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions).
2. `package.json`: `prisma` und `@prisma/client` gemeinsam anheben; `npm install` / Lockfile konsistent erzeugen.
3. [`prisma/schema.prisma`](../../prisma/schema.prisma) und ggf. neue Konfigurationsdateien (je nach 7.x-Anforderungen) anpassen.
4. Lokal: `npx prisma generate`, `npx prisma migrate deploy` gegen Test-DB.
5. Verifikation: `npm run typecheck`, `npm test`, `npm run test -w apps/web`, idealerweise `npm run verify:ci:local-db` (siehe Root-[`package.json`](../../package.json)).
6. CI grün: Job `backend` in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (inkl. Persistenz-Suite mit `PERSISTENCE_DB_TEST_URL`).

## Definition of Done

- Kein halbes Upgrade: alle direkten und relevanten transitive `@prisma/*`-Versionen im Lockfile passen zur gewählten 7.x.
- `npm run check:prisma-stack` grün (Major-Gleichheit + Konvention 5.x vs 7.x).
- `npm ci` inkl. `postinstall` / `prisma generate` erfolgreich.
- Alle obigen Tests und CI-Schritte grün.
