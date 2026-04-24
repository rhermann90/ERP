# ERP Backend Integrationsstand

Dieser Stand ist als Integrations-/Abnahmebasis gedacht (API + Contracts + PWA-Shell), nicht als produktiver GoBD-/Compliance-Abschluss ohne separates Release-GO.

## Ersten Eindruck / Demo starten

- **Memory (schnell):** `ERP_REPOSITORY=memory` setzen *oder* **`DATABASE_URL` weglassen** (sonst schaltet Development bei gesetzter URL automatisch auf Postgres) + `AUTH_TOKEN_SECRET` + `npm run dev`, danach PWA (`npm run dev:web`). Keine lokale DB; Daten sind flüchtig.
- **Postgres (Persistenz prüfen):** `DATABASE_URL` + Migrationen (siehe unten), dann Backend und PWA — **LV §9 + Aufmass + Offer/OfferVersion** (Write-Through) und je nach Konfiguration **Audit**; siehe ADR-0006 und README-Abschnitt „Hinweis zur Persistenz“.
- **Wie in CI:** Wer dieselbe Postgres-Kette wie die Pipeline nachstellt (Service-Container, `PERSISTENCE_DB_TEST_URL`, `prisma migrate deploy`): [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) und [`docs/runbook/ci-and-persistence-tests.md`](./docs/runbook/ci-and-persistence-tests.md).

## Lokaler Stack — Reihenfolge

1. **Postgres** (wenn du nicht bewusst `ERP_REPOSITORY=memory` nutzt): Datenbank erreichbar machen, `DATABASE_URL` setzen (siehe `.env.example`).
2. **Schema:** `npm run prisma:migrate` (lokal) bzw. `npx prisma migrate deploy` (Deploy).
3. **Backend:** `AUTH_TOKEN_SECRET` setzen, optional `CORS_ORIGINS`, dann `npm run dev` (Port **3000**).
4. **PWA:** siehe [`apps/web/README.md`](./apps/web/README.md) (`npm run dev:web`).

**Vite (Major-Upgrades):** `vite`, `@vitejs/plugin-react` und `vite-plugin-pwa` werden **nicht** im Dependabot-Sammel-PR angehoben — bewusst in **einem** koordinierten PR nach Checkliste in [`docs/tickets/VITE-MAJOR-UPGRADE.md`](./docs/tickets/VITE-MAJOR-UPGRADE.md).

**Postgres ohne eingechecktes Compose:** z. B. einmalig `docker run --name erp-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=erp -p 5432:5432 -d postgres:16` und dann `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erp?schema=public` — oder eine lokale Postgres-Installation mit gleicher URL.

## Betriebsvariablen

- `AUTH_TOKEN_SECRET` (Pflicht außerhalb `NODE_ENV=test`): Signier-Secret für Bearer-Tokens, in Produktion mindestens 32 Zeichen.
- `ERP_ALLOW_INSECURE_DEV_AUTH=1` (nur non-prod): aktiviert einen unsicheren Demo-Fallback für lokale Demos; niemals in Produktion.
- `CORS_ORIGINS` (optional): kommagetrennte, exakte Browser-Origins, z. B. `http://localhost:5173`.
- **`DATABASE_URL`**: Postgres-Connection-String. **Pflicht**, wenn `NODE_ENV=production` oder `ERP_DEPLOYMENT=integration` (Fail-closed beim Start). In Development: wenn gesetzt und nicht `ERP_REPOSITORY=memory`, werden **LV + Aufmass + Offer/OfferVersion** (ADR-0006) und **Nachtrag (`supplement_offers` / `supplement_versions`, ADR-0002 D5)** nach Postgres geschrieben; Rechnung, Traceability-Links u. a. siehe Teilpersistenz unten.
- **`ERP_REPOSITORY=memory`**: erzwingt In-Memory-Modus (z. B. Tests, `buildApp({ repositoryMode: "memory" })`).
- **`ERP_DEPLOYMENT=integration`**: behandelt wie produktionsnah bzgl. DB-Pflicht (ohne `NODE_ENV=production` zu setzen).

Siehe Vorlage: [`.env.example`](./.env.example)

### Postgres / Prisma (Meilenstein LV + Aufmass + Offer)

1. `DATABASE_URL` setzen (siehe `.env.example`).
2. Schema anwenden: `npx prisma migrate deploy` (Deploy) oder lokal `npm run prisma:migrate` (`prisma migrate dev`).
3. **Kein** `db push` als verbindlicher Merge-Pfad — versionierte Migrationen unter `prisma/migrations/`.
4. Validierung ohne echte DB: `npm run prisma:validate`
5. Details: [`docs/adr/0006-offer-vertical-slice-persistence.md`](./docs/adr/0006-offer-vertical-slice-persistence.md)

## CI / Persistenz-Tests

- GitHub Actions: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) startet **Postgres**, setzt **`PERSISTENCE_DB_TEST_URL`** (und `DATABASE_URL`), führt **`prisma migrate deploy`** aus und **`npm test`** — Persistenz-Suites laufen **ohne SKIP**.
- Lokal und Troubleshooting: [`docs/runbook/ci-and-persistence-tests.md`](./docs/runbook/ci-and-persistence-tests.md)

**Repository-Prozess (Merge):** PR-Vorlage [`.github/pull_request_template.md`](./.github/pull_request_template.md); Merge-Evidence und QA-Pflicht **§5a** in [`docs/contracts/qa-fin-0-gate-readiness.md`](./docs/contracts/qa-fin-0-gate-readiness.md). Branch-Schutz (Pflicht-Statuscheck **`backend`**): [`docs/runbooks/github-branch-protection-backend.md`](./docs/runbooks/github-branch-protection-backend.md).

**Hinweis Health:** Es gibt `GET /health` (Liveness). Ein separates **Ready**-Endpoint (z. B. DB erreichbar) ist Sache des Backends; die PWA verwendet `VITE_API_BASE_URL` nur als API-Origin — bis ein Ready-Pfad dokumentiert ist, sind Start-/Verbindungsprobleme normale HTTP-/Netzwerkfehler.

## API / Contracts

- OpenAPI: [`docs/api-contract.yaml`](./docs/api-contract.yaml)
- Contracts: [`docs/contracts/`](./docs/contracts/)
- Passwort-Login / Multi-User (Mandant): [`docs/authentication-login.md`](./docs/authentication-login.md)
- Domäne (MVP): [`docs/ERP-Systembeschreibung.md`](./docs/ERP-Systembeschreibung.md)
- Entwicklungsphasen MVP (Finanz v1.3): [`docs/ENTWICKLUNGSPHASEN-MVP-V1.3.md`](./docs/ENTWICKLUNGSPHASEN-MVP-V1.3.md)
- Koordination / Merge-Evidence **§5a/§5b** (vollständige Vorlagen + Abschluss-Referenz): [`docs/contracts/qa-fin-0-gate-readiness.md`](./docs/contracts/qa-fin-0-gate-readiness.md) — PL-Rahmen: [`docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md`](./docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md), Vorlage [`docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md`](./docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md), GitHub-Review [`docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](./docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md), Multi-Agent-Regeln [`.cursor/rules/erp-multi-agent.mdc`](./.cursor/rules/erp-multi-agent.mdc)
- FIN-2-Start-Gate (binär G1–G10): [`docs/tickets/FIN-2-START-GATE.md`](./docs/tickets/FIN-2-START-GATE.md)

## Hinweis zur Persistenz

- **Arbeits-Cache:** weiterhin `InMemoryRepositories` für alle Aggregate im Prozess (SoT im Prozess; Postgres ist Abbild für die unten genannten Slices).
- **Postgres (Write-Through, `repositoryMode=postgres`):** Tabellen **`lv_*`**, **`measurement_*`**, **`offers`**, **`offer_versions`** (inkl. FK `offer_versions` → `lv_versions`, FIN-2-Gate **G5**), **`supplement_offers`** / **`supplement_versions`** (Nachtrag, FK zu Offers/OfferVersion/LV), **`payment_terms_heads`** / **`payment_terms_versions`** (Zahlungsbedingungen, FIN-1, ADR-0008), **`invoices`** (Rechnungskopf FIN-2-Slice, ADR-0007), **`users`** / **`password_reset_challenges`** (Login/Reset, siehe `docs/authentication-login.md`), sowie **`audit_events`** bei Audit-Schreibpfad. Startup-Reihenfolge: **LV + Aufmass → Offers → Supplements → Zahlungsbedingungen → Rechnungen** (`src/api/app.ts`).
- **Nur im Arbeitsspeicher (keine eigene Persistenz-Tabelle):** **`traceabilityLinks`** (werden aus Rechnungs-/Domänendaten beim Hydrate aufgebaut), **`exportRuns`**.
- **Weiterentwicklung FIN-2:** vollständiger **8.4**-Betragsmotor und produktive Buchungsübergänge sind **nicht** durch den aktuellen Rechnungs-Entwurf abgedeckt; Gate und Scope: [`docs/tickets/FIN-2-START-GATE.md`](./docs/tickets/FIN-2-START-GATE.md). **Nachtrag (`supplement_*`)** in Postgres (ADR-0002 D5); **FIN-1** **`payment_terms_*`** (ADR-0008).
- **LV löschen bei hängenden Angeboten:** FKs sind **`ON DELETE RESTRICT`** — kein stiller Fix. Offene fachliche Regel: [`docs/tickets/FOLLOWUP-LV-DELETE-WITH-DEPENDENT-OFFERS.md`](./docs/tickets/FOLLOWUP-LV-DELETE-WITH-DEPENDENT-OFFERS.md).
- **Audit-Events:** bei `repositoryMode=postgres` in **`audit_events`** (Migration); fehlgeschlagener Insert → HTTP **500** `AUDIT_PERSIST_FAILED` (fail-hard, Option B). `GET /audit-events` bleibt DSGVO-minimiert. Details: [`docs/tickets/FOLLOWUP-AUDIT-PERSISTENCE.md`](./docs/tickets/FOLLOWUP-AUDIT-PERSISTENCE.md), [`docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md).
