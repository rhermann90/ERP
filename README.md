# ERP Backend Integrationsstand

Dieser Stand ist als Integrations-/Abnahmebasis gedacht (API + Contracts + PWA-Shell), nicht als produktiver GoBD-/Compliance-Abschluss ohne separates Release-GO.

## Mandanten-Produktivsystem — technische Mindestcheckliste

### Persistenz

Für **echte Mandantendaten** (nicht Demo/In-Memory):

1. **`DATABASE_URL`** setzen und vom API-Prozess aus erreichbar machen. Bei **`NODE_ENV=production`** oder **`ERP_DEPLOYMENT=integration`** ist die Variable **Pflicht** (Fail-closed beim Start); Details unter **Betriebsvariablen** und [`.env.example`](./.env.example).
2. **`ERP_REPOSITORY=memory` nicht** nutzen — sonst läuft die API ohne Postgres-Write-Through für die in „Hinweis zur Persistenz“ genannten Slices (Angebote, Rechnung, Zahlungseingang, Mahnwesen, Audit, …).
3. **Schema vor Traffic:** auf der Ziel-Datenbank **`npx prisma migrate deploy`** ausführen (Deploy-Pfad; versionierte Migrationen unter `prisma/migrations/`). CI-Vorbild: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml). **`prisma db push`** ist kein verbindlicher Produktionspfad.
4. **Readiness nach Deployment:** `GET /ready` aufrufen — im Postgres-Modus **`200`** mit `checks.database: ok` erwarten; bei **`503`** keinen produktiven Traffic auf die API schalten (siehe **Health / Readiness** unten).
5. **Build/Install:** Prisma-Client entsteht über **`npm install`** / `npm run prisma:generate` nach **`generated/prisma`** (gitignored — nicht committen).

### HTTPS und Header

1. **TLS:** Öffentliche API-URLs nur über **HTTPS** ausliefern (TLS-Terminierung am Ingress/Reverse-Proxy oder TLS direkt am API-Prozess — Architektur beim Betrieb festlegen).
2. **`CORS_ORIGINS`:** Auf die **exakte(n)** Origin(s) der produktiven PWA setzen (kommagetrennt; keine Wildcard für „alle Origins“); sonst schlagen Browser-`fetch`-Aufrufe mit CORS fehl. Details unter **Betriebsvariablen**; PWA-Basis-URL: [`apps/web/README.md`](./apps/web/README.md) (`VITE_API_BASE_URL`).
3. **`ERP_ENABLE_HSTS=1`:** Nur setzen, wenn Clients die API **tatsächlich per HTTPS** erreichen — sonst **HSTS-/Browser-Warnungen** (`Strict-Transport-Security` auf API-Antworten; Implementierung [`src/http/pwa-http-layer.ts`](./src/http/pwa-http-layer.ts)).

### Health / Orchestrierung und PWA-Anbindung

1. **`GET /health`:** **Liveness** — Prozess lebt; ohne DB-Abfrage. Für reinen „läuft der Pod?“-Probe geeignet.
2. **`GET /ready`:** **Readiness** — Im **Postgres-Modus** einmal `SELECT 1` gegen die DB; **`200`** mit `checks.database: ok` oder **`503`** bei DB-Fehler. Im **Memory-Modus** **`200`** mit `checks.database: not_configured` (kein DB-Check). Load Balancer / Ingress: Traffic erst bei **`200`** im Postgres-Betrieb schalten (Details auch unter **Health / Readiness** weiter unten im README).
3. **PWA:** Beim Build der ausgelieferten Shell **`VITE_API_BASE_URL`** auf die **öffentliche API-Origin** des Deployments setzen (gleiches Schema/Host wie vom Browser erreichbar); siehe [`apps/web/README.md`](./apps/web/README.md).
4. **FIN-4 / Contract-Drift (optional):** **`VITE_EXPECTED_OPENAPI_CONTRACT_VERSION`** kann auf dieselbe `info.version` wie [`docs/api-contract.yaml`](./docs/api-contract.yaml) gesetzt werden — bei Abweichung zu `x-erp-openapi-contract-version` auf FIN-4-Pfaden nur eine **`console.warn`** in der PWA; Details [`apps/web/README.md`](./apps/web/README.md) und [`docs/contracts/FIN4-external-client-integration.md`](./docs/contracts/FIN4-external-client-integration.md).

### Secrets und Auth

1. **`AUTH_TOKEN_SECRET`:** In Produktion **mindestens 32 Zeichen**, zufällig, aus einem **Secret-Manager** / sicheren Deploy-Mechanismus — nicht aus Repos oder Tickets kopieren. Pflicht außerhalb `NODE_ENV=test` (siehe **Betriebsvariablen** und [`.env.example`](./.env.example)).
2. **`ERP_ALLOW_INSECURE_DEV_AUTH`:** **Nicht** in Produktion setzen — aktiviert einen unsicheren Demo-Fallback nur für non-prod (siehe **Betriebsvariablen**).
3. **Kein Demo-/Ein-Knopf-Login in Prod:** **`ERP_LOGIN_*`** (technisches Passwort-Login bei In-Memory) und **`ERP_SEED_ADMIN_*` / `ERP_SEED_VIEWER_*`** (Seed-Demo-Benutzer in Postgres) sind **Entwicklungs- und Demo-Konfiguration** — in einer Mandanten-Produktion **weglassen** oder nur nach explizitem Sicherheitskonzept nutzen; regulärer Betrieb mit Postgres: Benutzer und Passwörter wie in [`docs/authentication-login.md`](./docs/authentication-login.md) beschrieben.

### Qualität vor Release

1. **Lokal mindestens `npm run verify:pre-merge`:** entspricht **`verify:ci`** plus die im Root-[`package.json`](./package.json) verdrahteten **Playwright**-Specs (`e2e/app-shell-smoke.spec.ts`, `e2e/login-finance-smoke.spec.ts`, `e2e/login-finance-smoke-fin5-tail.spec.ts`); siehe [`AGENTS.md`](./AGENTS.md).
2. **Schema-, Persistenz- oder OpenAPI-/DB-kritische Änderungen:** zusätzlich die **Postgres-Kette** wie in [`docs/runbook/ci-and-persistence-tests.md`](./docs/runbook/ci-and-persistence-tests.md) (z. B. **`npm run verify:ci:local-db`** mit Compose auf Host-Port **15432**) — nicht nur „grün ohne DB“.
3. **Release-Kandidat (Finanz-MVP Gate §15):** Kommando-Matrix — [`docs/contracts/qa-fin-mvp-gate-15-abnahme.md`](./docs/contracts/qa-fin-mvp-gate-15-abnahme.md). **Staging/Prod-Umgebung** vor dem ersten Deploy — [`docs/runbooks/phase-a-staging-prod-env-checklist.md`](./docs/runbooks/phase-a-staging-prod-env-checklist.md) (inkl. `migrate deploy`, `/health`, `/ready`).

### Compliance, Finanz-Go-Live und Merge-Disziplin (Empfehlungen)

Alles folgende ist **keine** Repo-blockierende Menschen-Pflichtfreigabe, sondern **Empfehlungen**, damit Mandanten-Produktivität und Risiko bewusst abgeschlossen werden können:

1. **Compliance-Artefakte:** Einstieg [`Checklisten/README.md`](./Checklisten/README.md) und [`Checklisten/compliance-rechnung-finanz.md`](./Checklisten/compliance-rechnung-finanz.md) — relevante Punkte **durcharbeiten** und im Paket dokumentiert abhaken (Felder/Vorlagen wie im Repo vorgesehen). **`npm run validate:compliance-artifacts`** und **`npm run validate:compliance-signoffs`** prüfen nur **Datei-/Schema-Konsistenz** im Repo; sie ersetzen keine inhaltliche Bearbeitung der Checklisten.
2. **Finanz-spezifisch (z. B. Mahn-Massen-E-Mail, M4 Slice 5c):** Vor Produktivnutzung die Agenda im Runbook [`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](./docs/runbooks/m4-slice-5c-pl-mandanten-go.md) *(historischer Pfadname)* mit der gleichen Compliance-Spur wie in Punkt 1 **abarbeiten** (SMTP, Footer, Stufen, Testmandant, Rollback-Klarheit).
3. **Merge-Disziplin:** Auf `main` die CI-Jobs **`backend`** und **`e2e-smoke`** grün halten; für Finanz-PRs die Checkliste [`docs/contracts/review-checklist-finanz-pr.md`](./docs/contracts/review-checklist-finanz-pr.md) nutzen. Betriebshinweise und erweiterte Policy: [`AGENTS.md`](./AGENTS.md).

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
- `ERP_ENABLE_HSTS=1` (optional): setzt `Strict-Transport-Security` auf API-Antworten — **nur** sinnvoll hinter HTTPS-Terminierung (sonst Browser-Warnungen).
- **`DATABASE_URL`**: Postgres-Connection-String. **Pflicht**, wenn `NODE_ENV=production` oder `ERP_DEPLOYMENT=integration` (Fail-closed beim Start). In Development: wenn gesetzt und nicht `ERP_REPOSITORY=memory`, werden **LV + Aufmass + Offer/OfferVersion** (ADR-0006) und **Nachtrag (`supplement_offers` / `supplement_versions`, ADR-0002 D5)** nach Postgres geschrieben; Rechnung, Traceability-Links u. a. siehe Teilpersistenz unten.
- **`ERP_REPOSITORY=memory`**: erzwingt In-Memory-Modus (z. B. Tests, `buildApp({ repositoryMode: "memory" })`).
- **`ERP_DEPLOYMENT=integration`**: behandelt wie produktionsnah bzgl. DB-Pflicht (ohne `NODE_ENV=production` zu setzen).

Siehe Vorlage: [`.env.example`](./.env.example)

### Postgres / Prisma (Meilenstein LV + Aufmass + Offer)

1. `DATABASE_URL` setzen (siehe `.env.example`).
2. Schema anwenden: `npx prisma migrate deploy` (Deploy) oder lokal `npm run prisma:migrate` (`prisma migrate dev`).
3. **Kein** `db push` als verbindlicher Merge-Pfad — versionierte Migrationen unter `prisma/migrations/`.
4. Validierung ohne echte DB: `npm run prisma:validate`
5. **Prisma-Client (`generated/prisma`):** Das Schema schreibt den Client nach `generated/prisma` (nicht nach `node_modules`). Der Ordner **`generated/`** ist **gitignored** — nicht versionieren; er entsteht durch **`npm install`** (Root-`postinstall`: `prisma generate`) oder `npm run prisma:generate`. PR-Checkliste: [`docs/runbook/ci-and-persistence-tests.md`](./docs/runbook/ci-and-persistence-tests.md) (Abschnitt „PR-Checkliste (Persistenz / Schema)“).
6. **ORM-Version:** Die tatsächliche Prisma-Major-Version steht in [`package.json`](./package.json) (`prisma` / `@prisma/client`). Geplantes Upgrade auf 7.x: [`docs/tickets/PRISMA-7-UPGRADE.md`](./docs/tickets/PRISMA-7-UPGRADE.md); Konsistenz-Check: `npm run check:prisma-stack`.
7. Details: [`docs/adr/0006-offer-vertical-slice-persistence.md`](./docs/adr/0006-offer-vertical-slice-persistence.md)

## CI / Persistenz-Tests

- GitHub Actions: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) startet **Postgres**, setzt **`PERSISTENCE_DB_TEST_URL`** (und `DATABASE_URL`), führt **`prisma migrate deploy`** aus und **`npm test`** — Persistenz-Suites laufen **ohne SKIP**. **Kein zweiter CI-Job nötig:** derselbe Job **`backend`** ist die kanonische Merge-Evidence; `npm run verify:ci:local-db` ist das **lokale Äquivalent** (siehe Runbook).
- **Lokale CI-Parität:** `npm run verify:ci:local-db` (Compose-Postgres auf Host-Port **15432**, siehe [`docs/runbook/ci-and-persistence-tests.md`](./docs/runbook/ci-and-persistence-tests.md)).
- Lokal und Troubleshooting: [`docs/runbook/ci-and-persistence-tests.md`](./docs/runbook/ci-and-persistence-tests.md)
- **Playwright E2E (`npm run test:e2e`):** startet eigene API/Web-Instanzen auf **127.0.0.1:13000** / **15173** (siehe `playwright.config.ts`); parallel zu `npm run dev` nutzbar. Wiederverwendung bestehender Server nur mit `PW_TEST_REUSE_SERVERS=1`.
- **Lokale Merge-Vorprüfung (`backend` + Finanz-E2E wie `e2e-smoke`):** `npm run verify:pre-merge` — siehe [`AGENTS.md`](./AGENTS.md).

**Repository-Prozess (Merge):** PR-Vorlage [`.github/pull_request_template.md`](./.github/pull_request_template.md); Merge-Evidence und QA-Pflicht **§5a** in [`docs/contracts/qa-fin-0-gate-readiness.md`](./docs/contracts/qa-fin-0-gate-readiness.md). Branch-Schutz (Pflicht-Statuscheck **`backend`**): [`docs/runbooks/github-branch-protection-backend.md`](./docs/runbooks/github-branch-protection-backend.md). **Aktueller Entwicklungsplan (nächste Schritte):** [`docs/plans/nächste-schritte.md`](./docs/plans/nächste-schritte.md).

**Health / Readiness:** `GET /health` = Liveness (Prozess lebt). `GET /ready` = Readiness: im **Postgres-Modus** einmal `SELECT 1` über Prisma (**503**, wenn die DB nicht erreichbar); im **Memory-Modus** **200** mit `checks.database: not_configured`. Die PWA nutzt weiterhin `VITE_API_BASE_URL` als Origin — Orchestrierung kann `/ready` für Traffic schalten, sobald die Umgebung Postgres nutzt. Optional: `VITE_EXPECTED_OPENAPI_CONTRACT_VERSION` in der PWA auf dieselbe `info.version` wie das deployte Backend setzen — Laufzeit-Hinweis bei Contract-Drift auf FIN-4-Pfaden, siehe [`apps/web/README.md`](./apps/web/README.md) und [`docs/contracts/FIN4-external-client-integration.md`](./docs/contracts/FIN4-external-client-integration.md).

## API / Contracts

- OpenAPI: [`docs/api-contract.yaml`](./docs/api-contract.yaml)
- Contracts: [`docs/contracts/`](./docs/contracts/)
- PWA / v1.3-Rollen → API-Rolle (Mapping-Tabelle): [`docs/contracts/ui-role-mapping-v1-3.md`](./docs/contracts/ui-role-mapping-v1-3.md)
- Passwort-Login / Multi-User (Mandant): [`docs/authentication-login.md`](./docs/authentication-login.md)
- Domäne (MVP): [`docs/ERP-Systembeschreibung.md`](./docs/ERP-Systembeschreibung.md)
- KI-/Agenten-Orientierung: [`AGENTS.md`](./AGENTS.md) · Code-Landkarte [`docs/CODEMAPS/overview.md`](./docs/CODEMAPS/overview.md) · **Cursor:** Projektregeln [`.cursor/rules/cursor-stack.mdc`](./.cursor/rules/cursor-stack.mdc); Skills aus [cursor-stack](https://github.com/Himanshu-Sangshetti/cursor-stack) aktualisieren mit `npm run sync:cursor-stack-skills` (braucht Netzwerk + Git), dann Diff prüfen und `npm run validate:cursor-project-rules` — **ohne Netzwerk/Git:** die acht Skill-Ordner manuell aus einem cursor-stack-Artefakt nach `.cursor/skills/<name>/` kopieren (Schrittfolge in `.cursor/rules/cursor-stack.mdc`, Abschnitt „Geschlossene / offline Umgebungen“); Slash-Befehle (`/ship`, …) können je nach Cursor-Build variieren; Inhalt liegt in `.cursor/skills/*/SKILL.md`.
- **Abgrenzung:** Domänen- und IDE-Regeln in [`.cursor/rules/cursor-stack.mdc`](./.cursor/rules/cursor-stack.mdc); Befehlstabelle und Repo-Rituale (u. a. P1-3 nach qualifizierten Finanz-/Contract-Merges) in [`AGENTS.md`](./AGENTS.md) — die Dateien ergänzen sich, sie ersetzen sich nicht.
- MVP Finanz — Phasen, Meilensteine und Arbeitsablauf: [`docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](./docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md)
- **Archiv (nicht als Leitfaden):** abgeschlossene Phase-1-QA und v1.2-Delta — [`docs/_archiv/historische-phase1-qa-und-kontraktdiff/README.md`](./docs/_archiv/historische-phase1-qa-und-kontraktdiff/README.md); Legacy-Systembeschreibung — [`docs/_archiv/systembeschreibung-und-phasen-legacy/README.md`](./docs/_archiv/systembeschreibung-und-phasen-legacy/README.md); historische MVP-Finanz-Dateinamen — [`docs/_archiv/mvp-finanz-legacy-stubs/README.md`](./docs/_archiv/mvp-finanz-legacy-stubs/README.md)
- Koordination / Merge-Evidence **§5a/§5b** (vollständige Vorlagen + Abschluss-Referenz): [`docs/contracts/qa-fin-0-gate-readiness.md`](./docs/contracts/qa-fin-0-gate-readiness.md) — Sprint-/Prioritäts-Snapshots *(historische Pfade)*: [`docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md`](./docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md), Vorlage [`docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md`](./docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md), GitHub-Review [`docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](./docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md), Multi-Agent-Regeln [`.cursor/rules/erp-multi-agent.mdc`](./.cursor/rules/erp-multi-agent.mdc)
- FIN-2-Start-Gate (binär G1–G10): [`docs/tickets/FIN-2-START-GATE.md`](./docs/tickets/FIN-2-START-GATE.md)
- **FIN-3 (Zahlungseingang 8.7):** `POST /finance/payments/intake` mit Idempotenz, Persistenz `payment_intakes`, Rechnungsstatus **TEILBEZAHLT** / **BEZAHLT**; Lesepfad **`GET /invoices/{invoiceId}/payment-intakes`** (gleiche Leserolle wie Rechnung). Details: [`docs/contracts/finance-fin0-openapi-mapping.md`](./docs/contracts/finance-fin0-openapi-mapping.md); OpenAPI **Finance (FIN-3)** in [`docs/api-contract.yaml`](./docs/api-contract.yaml).
- **FIN-4 (Mahnwesen 8.10):** Tabelle **`dunning_reminders`** + Lesepfad **`GET /invoices/{invoiceId}/dunning-reminders`**; Mandanten-FK wie FIN-3. **Stufen-Konfig:** Tabelle **`dunning_tenant_stage_config`** (optional **`deleted_at`** für Soft-Delete), HTTP **`GET|PUT|PATCH|DELETE /finance/dunning-reminder-config`** bzw. **`…/stages/{stageOrdinal}`** — ADR **Kern:** [`docs/adr/0009-fin4-mahnwesen-slice.md`](./docs/adr/0009-fin4-mahnwesen-slice.md). **M4** (Vorlagen, E-Mail-Footer, Vorschau/Versand inkl. SMTP 5a): [`docs/adr/0010-fin4-m4-dunning-email-and-templates.md`](./docs/adr/0010-fin4-m4-dunning-email-and-templates.md). **SoT Buchung (Shell):** **`BOOK_INVOICE`** in `allowed-actions` für Rechnung **ENTWURF** — `docs/contracts/action-contracts.json`.
- **Produktiv-Go (UStG / HGB / AO / GoBD / E-Rechnung / DSGVO):** Für Merge gelten die **CI-/Review-Erwartungen** des Repos (keine zusätzliche Repo-Pflicht für Mandanten-Go). Für **inhaltlichen** Abschluss vor Produktivnutzung die Empfehlungen unter **„Compliance, Finanz-Go-Live und Merge-Disziplin (Empfehlungen)“** oben sowie [`Checklisten/README.md`](./Checklisten/README.md) / [`Checklisten/compliance-rechnung-finanz.md`](./Checklisten/compliance-rechnung-finanz.md); **`validate:compliance-*`** nur als Formalchecker. Ausführliche Einordnung: [`AGENTS.md`](./AGENTS.md) Punkt 6.

## Hinweis zur Persistenz

- **Arbeits-Cache:** weiterhin `InMemoryRepositories` für alle Aggregate im Prozess (SoT im Prozess; Postgres ist Abbild für die unten genannten Slices).
- **Postgres (Write-Through, `repositoryMode=postgres`):** Tabellen **`lv_*`**, **`measurement_*`**, **`offers`**, **`offer_versions`** (inkl. FK `offer_versions` → `lv_versions`, FIN-2-Gate **G5**), **`supplement_offers`** / **`supplement_versions`** (Nachtrag, FK zu Offers/OfferVersion/LV), **`payment_terms_heads`** / **`payment_terms_versions`** (Zahlungsbedingungen, FIN-1, ADR-0008), **`invoices`** (Rechnungskopf FIN-2-Slice, ADR-0007), **`payment_intakes`** (Zahlungseingang FIN-3, Idempotenz je Mandant), **`dunning_reminders`** und **`dunning_tenant_stage_config`** (FIN-4 **Kern**, ADR-0009), **`dunning_tenant_stage_templates`**, **`dunning_tenant_email_footer`**, **`dunning_email_sends`** (FIN-4 **M4**, ADR-0010), **`users`** / **`password_reset_challenges`** (Login/Reset, siehe `docs/authentication-login.md`), sowie **`audit_events`** bei Audit-Schreibpfad. Startup-Reihenfolge: **LV + Aufmass → Offers → Supplements → Zahlungsbedingungen → Rechnungen → Zahlungseingänge → Mahn-Ereignisse** (`src/api/app.ts`).
- **Nach Pull oder Schema-Wechsel:** `npx prisma migrate deploy` (oder lokal `npm run prisma:migrate`), damit neue Spalten/Migrationen — z. B. **`dunning_tenant_stage_config.deleted_at`** — in der DB existieren; sonst schlagen Konfig-Schreibpfade oder Tests mit Schema-Drift fehl.
- **Nur im Arbeitsspeicher (keine eigene Persistenz-Tabelle):** **`traceabilityLinks`** (werden aus Rechnungs-/Domänendaten beim Hydrate aufgebaut), **`exportRuns`**.
- **Weiterentwicklung FIN-2:** `POST /invoices/{invoiceId}/book` bucht **ENTWURF → GEBUCHT_VERSENDET** (mandantenweite Rechnungsnummer `RE-{Jahr}-{nnnn}`, Traceability, Audit, Postgres-Unique auf `(tenant_id, invoice_number)`). Der vollständige **8.4**-Betragsmotor (Schritte 2–6) und weitere Statusketten (**GEPRUEFT** / **FREIGEGEBEN**) sind weiterhin offen; Gate und Scope: [`docs/tickets/FIN-2-START-GATE.md`](./docs/tickets/FIN-2-START-GATE.md). **Nachtrag (`supplement_*`)** in Postgres (ADR-0002 D5); **FIN-1** **`payment_terms_*`** (ADR-0008).
- **LV löschen bei hängenden Angeboten:** FKs sind **`ON DELETE RESTRICT`** — kein stiller Fix. Offene fachliche Regel: [`docs/tickets/FOLLOWUP-LV-DELETE-WITH-DEPENDENT-OFFERS.md`](./docs/tickets/FOLLOWUP-LV-DELETE-WITH-DEPENDENT-OFFERS.md).
- **Audit-Events:** bei `repositoryMode=postgres` in **`audit_events`** (Migration); fehlgeschlagener Insert → HTTP **500** `AUDIT_PERSIST_FAILED` (fail-hard, Option B). `GET /audit-events` bleibt DSGVO-minimiert. Details: [`docs/tickets/FOLLOWUP-AUDIT-PERSISTENCE.md`](./docs/tickets/FOLLOWUP-AUDIT-PERSISTENCE.md), [`docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md).
