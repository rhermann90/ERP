# PRISMA-7-UPGRADE — geplantes Major-Upgrade (eigenes Inkrement)

## Status Hauptlinie (erledigt, 2026-04-24)

- **Versionen (exakt gepinnt):** `prisma` 7.8.0, `@prisma/client` 7.8.0, `@prisma/adapter-pg` 7.8.0 — siehe [package.json](../../package.json). `npm ls prisma @prisma/client @prisma/adapter-pg` zeigt eine einzige 7.8.0-Zeile ohne Split.
- **Laufzeit:** [`prisma.config.ts`](../../prisma.config.ts), Generator `prisma-client` + Output `generated/`, [`src/prisma-client.ts`](../../src/prisma-client.ts) mit `PrismaPg`-Adapter (keine direkten Imports aus `@prisma/client` im Anwendungscode).
- **Validierung:** `npm run prisma:validate`, `npx prisma generate`, `npm run verify:ci` (Audit, Contract-YAML, Typecheck, Web-Build, Vitest inkl. Root) erfolgreich lokal.
- **Persistenz / Migrate:** `npm run verify:ci:local-db` setzt **laufendes Docker** (Postgres 16 laut `ensure-local-test-db`) voraus; ohne Docker hier nicht ausgeführt — in CI (`backend` mit Postgres-Service) weiterhin Pflicht.
- **Dependabot:** Gruppen-PR [#21](https://github.com/rhermann90/ERP/pull/21) hob nur `@prisma/client` an und wurde **geschlossen** (Split-Risiko). Künftige Prisma-PRs müssen **CLI + Client + Adapter** gemeinsam anheben.

### Remote-Branches noch mit Prisma 5.22 (Stand Abfrage)

Bei Reaktivierung: `git merge origin/main` (oder Rebase) und Konflikte nach obigem Muster auflösen — nicht blind alte `package.json`-Zeilen behalten.

| Remote-Branch | `@prisma/client` in package.json |
|---------------|----------------------------------|
| `origin/feat/fin-0-mapping-idempotency-parity-2026-04-21` | ^5.22.0 |
| `origin/feat/fin-0-post-pr1-mapping-parity` | ^5.22.0 |
| `origin/feat/fin-0-runde-2026-04-19-openapi-mapping-parity` | ^5.22.0 |
| `origin/feat/fin-0-stub-tenant-get-invoice-2026-04-21` | ^5.22.0 |
| `origin/feat/fin-0-web-finance-vorbereitung` | ^5.22.0 |
| `origin/feat/fin-0-web-post-merge-doku` | ^5.22.0 |
| `origin/feat/fin-0-web-ui-doku-2026-04-19` | ^5.22.0 |
| `origin/feat/finance-ci-gate-verify` | ^5.22.0 |
| `origin/feat/pr-b-pwa-shell-role-ux` | ^5.22.0 |
| `origin/feat/wip-recovery-from-stash-2026-04-21` | ^5.22.0 |

`origin/feat/m4-mahnlauf-mandant-automation` und `main` sind auf **7.x** (Hauptlinie).

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
- `npm ci` inkl. `postinstall` / `prisma generate` erfolgreich.
- Alle obigen Tests und CI-Schritte grün.
