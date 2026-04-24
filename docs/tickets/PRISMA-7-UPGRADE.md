# PRISMA-7-UPGRADE — geplantes Major-Upgrade (eigenes Inkrement)

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
- `npm ci` inkl. `postinstall` / `prisma generate` erfolgreich.
- Alle obigen Tests und CI-Schritte grün.
