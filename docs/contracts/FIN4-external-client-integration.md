# FIN-4 — Externe Client-Integration (Mahnwesen, öffentliche API)

**Zweck:** Release-Kommunikation und **laufzeitfähiger** Abgleich mit dem OpenAPI-Artefakt, ohne Domänenlogik zu duplizieren.

## Keine fachliche Semantik (StB / Release / Compliance)

**`info.version`**, **`x-erp-openapi-contract-version`** und die OpenAPI-Schemas beschreiben ausschließlich das **HTTP-/Datenkontrakt-Paket** (Felder, Typen, Fehlercodes). Sie belegen **nicht**:

- inhaltliche oder juristische Korrektheit von Mahnungen, Texten, Fristen in der Mandantenpraxis,
- Abnahme nach [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md),
- eine formelle Mahnung / PDF (siehe [`docs/tickets/B5-FORMAL-DUNNING-PDF.md`](../tickets/B5-FORMAL-DUNNING-PDF.md)).

Fachliche und go-live-relevante Entscheidungen bleiben bei **StB / DSB / Release-Verantwortlichen** und den verlinkten Checklisten; technischer Contract-Abgleich ersetzt das nicht. Fachlicher Kontext Mahn-Kontext und Fristlogik: [`docs/adr/0011-fin4-semi-dunning-context.md`](../adr/0011-fin4-semi-dunning-context.md).

## Contract-Version

| Quelle | Wert |
|--------|------|
| `docs/api-contract.yaml` → `info.version` | muss identisch zu `ERP_OPENAPI_INFO_VERSION` in `src/domain/openapi-contract-version.ts` sein |
| HTTP-Antwort (FIN-4-Pfade, siehe unten) | Header **`x-erp-openapi-contract-version`** = derselbe String |
| HTTP-Antwort (`/finance/invoice-tax-profile…`, FIN-5) | derselbe Header (`src/http/pwa-http-layer.ts`) |

**CI:** `npm run validate:api-contract-yaml` bricht ab, wenn YAML und TypeScript divergieren.

**PWA (optional):** Build-Zeit-Variable `VITE_EXPECTED_OPENAPI_CONTRACT_VERSION` (siehe `apps/web/.env.example`, `apps/web/README.md`) — bei Abweichung zum Header auf den genannten Pfaden nur `console.warn`, kein Throw.

## Pfade, die den Header setzen

Antworten unter:

- `/finance/dunning-reminder…` (Vorlagen, Kandidaten, Konfig, Automation, Mahnlauf, …)
- `/finance/dunning-email-footer`
- `/finance/invoice-tax-profile` und Projekt-Override-Pfade (`…/projects/{projectId}`)

Server-zu-Server: Header direkt lesen. **Browser + CORS:** nur sichtbar, wenn die Origin in `CORS_ORIGINS` steht; dann ist `x-erp-openapi-contract-version` in `Access-Control-Expose-Headers` enthalten (`src/http/pwa-http-layer.ts`).

## Breaking-Änderungen (Kurz, ab `1.25.0`)

- **`GET /finance/dunning-reminder-candidates`:** `data` enthält Pflichtfeld **`eligibilityContext`**; jeder Kandidat **`stageDeadlineIso`** (neben `dueDate` / `invoiceId` / …).
- **`POST /finance/dunning-reminder-run`** (`DRY_RUN`): `planned[]` enthält je Zeile **`stageDeadlineIso`**.
- **`asOfDate`** (Default „heute“): **Mandanten-IANA-Zeitzone** (wie ADR-0011), nicht UTC — siehe OpenAPI-Beschreibungen.

Vollständige Schemas: `docs/api-contract.yaml`. Mapping: `docs/contracts/finance-fin0-openapi-mapping.md`.

## Neu ab `1.28.5` (Benutzerverwaltung — Listenpfad)

- **`GET /users`:** **Breaking** für Clients mit altem Shape — Antwort **`TenantUserListResponse`** mit **`data`**, **`page`**, **`pageSize`**, **`total`**; Query **`page`**, **`pageSize`** (max. 100). Kein FIN-4-Header-Pfad — gebündeltes OpenAPI/`info.version`-Bump für Integratoren.

## Neu ab `1.29.0` (FIN-5 — Rechnungssteuer-Profile / Fail-Closed 8.16)

- **`GET|PATCH /finance/invoice-tax-profile`** und Projekt-Override-Pfade unter **`/finance/invoice-tax-profile/projects/…`:** Mandanten-Default und Overrides für effektives Rechnungssteuerregime; auf diesen Pfaden sendet der Server **`x-erp-openapi-contract-version`** wie bei den FIN-4-Leitpfaden. ADR: [`docs/adr/0014-fin5-mvp-tax-fail-closed.md`](../adr/0014-fin5-mvp-tax-fail-closed.md).


## Neu ab `1.28.2` (Phase 2 — LV §9 Einzelknoten-Lesepfad)

- **`GET /lv/versions/{lvVersionId}/nodes/{nodeId}`:** ein Strukturknoten wie in `structureNodes[]` / Snapshot; **404** `LV_NODE_NOT_FOUND`, wenn die ID keine Knoten-ID dieser Version ist (z. B. Positions-ID übergeben).

## Neu ab `1.28.1` (Phase 2 — LV §9 Hierarchie-Lesepfad, Contract-Klarstellung)

- **`GET /lv/versions/{lvVersionId}/structure`**, **`GET /lv/versions/{lvVersionId}/positions/{positionId}`:** Projektion wie Snapshot-Knoten/-Positionen (`editingText`); OpenAPI-Schemata **`LvStructureNode`** / **`LvPositionV2`** sind Aliase zu **`LvStructureNodeResource`** / **`LvPositionResource`**. **`LvHierarchySnapshot`** ohne eingebettete `allowedActions` — SoT weiterhin über **`GET /documents/{id}/allowed-actions`**.

## Neu ab `1.27.0` (Phase 2 — LV §9 Lesepfad)

- **`GET /lv/versions/{lvVersionId}`:** Snapshot mit Katalogkurzinfo (nullable), Version, `structureNodes[]`, `positions[]` — nicht Teil der FIN-4-Pfade; `info.version`-Bump für Integratoren mit gebündeltem OpenAPI.

## Neu ab `1.26.0` (M4 Slice 5c — Batch-E-Mail)

- **`POST /finance/dunning-reminder-run/send-emails`:** Batch-Versand bzw. **DRY_RUN** je Rechnungszeile; wiederholt die **5a**-Semantik pro `items[]`-Eintrag (explizites **`toEmail`**, bei **`EXECUTE`** **`idempotencyKey`** pro Zeile, **`confirmBatchSend: true`** Pflicht). Max. **25** Zeilen.
- **Fehlercodes (Auswahl):** `DUNNING_BATCH_EMAIL_CONFIRM_REQUIRED`, `DUNNING_BATCH_EMAIL_DUPLICATE_INVOICE_ID`, `DUNNING_BATCH_EMAIL_DUPLICATE_IDEMPOTENCY_KEY`, `DUNNING_BATCH_EMAIL_TOO_MANY_ITEMS` — vollständig in [`error-codes.json`](./error-codes.json).
- **Mandant `runMode=OFF`:** wie Mahnlauf **5b-1** — **409** `DUNNING_REMINDER_RUN_DISABLED` (HTTP **1b**).
- **Spec (Semantik, Compliance-Anker):** [`docs/tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md`](../tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md).

## Empfehlung für Integratoren

1. Bei Start oder nach 4xx/Schema-Fehlern **`x-erp-openapi-contract-version`** mit dem in eurem gebündelten OpenAPI erwarteten `info.version` vergleichen.
2. OpenAPI-Datei aus dem **gleichen Git-Tag** wie das deployte Backend beziehen.
3. Strikte Response-Validierung: JSON-Schema/OpenAPI-Generator **neu generieren**, sobald sich `info.version` oder die genannten Endpunkte ändern.

## Strikte Response-Validierung (Client-seitig)

**Symptom nach Deploy:** Euer Client bricht mit Schema-/Typfehlern ab (z. B. „required property missing: `eligibilityContext`“, unbekanntes Feld nicht erlaubt), obwohl der Server **HTTP 200** liefert.

**Ursache:** Generierter oder handgeschriebener Code validiert die Antwort gegen ein **älteres** OpenAPI/JSON-Schema. Der Header **`x-erp-openapi-contract-version`** zeigt nur, **dass** sich der Contract geändert hat — er macht alte Schemas nicht automatisch gültig.

**Empfohlene Schritte:**

1. Response-Header und Server-Logs (`x-correlation-id`) zum Vorfall sichern.
2. OpenAPI-Artefakt vom **deployten** Commit/Tag laden und `info.version` mit dem Header abgleichen.
3. Client-Codegen / Zod / JSON-Schema **neu erzeugen** und Release koppeln (gleiche Version wie Backend).
4. **Nicht** erwarten, dass das Backend „alte“ Antwortformen dauerhaft anbietet — Pflichtfelder wie `eligibilityContext` und `stageDeadlineIso` sind Teil der Traceability (ADR-0011); ein serverseitiges Abspecken würde die Nachvollziehbarkeit schwächen.

## Entfernt (kein technischer Ersatz im Produktcode)

Hintergrund-Cron und Mandantenmodus **AUTO** — [`docs/adr/0011-fin4-semi-dunning-context.md`](../adr/0011-fin4-semi-dunning-context.md); Archiv-Hinweis [`docs/runbooks/dunning-automation-cron.md`](../runbooks/dunning-automation-cron.md).

