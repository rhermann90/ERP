# PRISMA-7-UPGRADE — geplantes Major-Upgrade (eigenes Inkrement)

## Status (Single Source of Truth)

| Feld | Stand (lokal geprüft 2026-04-23) |
| --- | --- |
| **Phase** | `GEPLANT` — `main` ist noch **nicht** auf Prisma 7 umgestellt. |
| **Produktionslinie `origin/main`** | `prisma` / `@prisma/client` **^5.22.0**; [`prisma/schema.prisma`](../../prisma/schema.prisma): `generator` = `prisma-client-js`, `datasource` mit `url = env("DATABASE_URL")`; **kein** `prisma.config.ts` im Root. |
| **Referenz-Implementierung Prisma 7** | Branch `origin/feat/m4-mahnlauf-mandant-automation`: `prisma` / `@prisma/client` **7.8.0** (gepinnt), Root-Datei `prisma.config.ts`, Generator `prisma-client` mit `output = "../generated/prisma"`. Dient als **technische Vorlage**, bis ein PR nach `main` die Checkliste unten erfüllt. |
| **Automatische Stack-Prüfung** | `npm run check:prisma-stack` (Root) — gleiche Major für CLI + Client; Konvention 5.x vs 7.x. |

**Hinweis Git:** Auf Feature-Branches können Merge-Commits Betreffzeilen wie „Prisma 7.x Hauptlinie“ tragen, **ohne** dass `main` bereits Prisma 7 nutzt — immer `package.json` auf dem **Ziel-Branch** und dieses Ticket prüfen.

### Remote-Branch-Inventar (Stichprobe, nicht abschließend)

| Branch | Prisma (`package.json`) | Bemerkung |
| --- | --- | --- |
| `origin/main` | ^5.22.0 | Produktionslinie |
| `origin/feat/m4-mahnlauf-mandant-automation` | 7.8.0 (gepinnt) | Referenz für 7.x-Layout (`prisma.config.ts`, `generated/prisma`) |
| `origin/feat/wip-recovery-from-stash-2026-04-21` | 7.8.0 (gepinnt) | Abweichend von `main`; vor Arbeit Branch explizit wählen |

Aktualisieren: `git fetch origin` und `git show origin/<branch>:package.json | grep prisma`.

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
