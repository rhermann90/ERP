# TICKET-002 — Nachtrags-Lebenszyklus v1.2 (Freigabe, Beauftragung, Wirkung, Traceability/Export)

## Status
**CLOSED (Iteration 1) — Final Closure erteilt; Implementierung und Abnahme abgeschlossen. Folgearbeit: Iteration 1b / Persistenz siehe unten.**

## Kontext (verbindlich)
`docs/ERP-Systembeschreibung.md`:
- **§5.3 Nachtragsangebot**: `Entwurf -> In Freigabe -> Freigegeben -> Versendet -> Beauftragt/Abgelehnt -> Archiviert`
- **Wirkung**: „Wirkung auf abrechenbare Mengen **erst nach Status Beauftragt**“
- **§7**: Jede Abweichung im **Aufmass** und in der **Rechnung** nachvollziehbar; Ursprungsangebot historisch unverändert

Abhängigkeit: **TICKET-001** (Minimal-API `POST /offers/{offerId}/supplements`) ist umgesetzt.

## Arbeitspaket-Ziel
Nachtrag technisch und fachlich von „nur ENTWURF-Anlage“ auf **vollständigen Lebenszyklus** mit **nicht-destruktiver Versionierung**, **fachlicher Wirkungsgrenze** (erst `BEAUFTRAGT`), **Audit**, **Export-/Traceability-Anbindung** (Preflight/Gates) und **Perspektive DB-Migration** (Prisma/Postgres).

## Scope (Vorschlag — zur Freigabe)

### In Scope (Iteration 1, nach GO)
1. **Domänenmodell Nachtrag**
   - `Nachtragsangebot` / `Nachtragsversion` (oder Fortführung `SupplementOffer` / `SupplementVersion`) mit `tenantId`, Referenz **`baseOfferVersionId`** (unveränderlich), Status gemäß §5.3.
   - Keine historische Mutation der Basis-Angebotsversion.
2. **Statusübergänge + AuthZ + Audit**
   - Parity zu Hauptangebot: kritische Übergänge nur mit `AuditEvent` und Rollenmatrix (SoT: `allowed-actions` oder dediziertes Endpoint-Set — Entscheidung ADR-0002).
   - Neue `actionId`s z. B. `SUPPLEMENT_SET_IN_FREIGABE`, `SUPPLEMENT_SET_FREIGEGEBEN`, `SUPPLEMENT_SET_VERSENDET`, `SUPPLEMENT_SET_BEAUFTRAGT`, `SUPPLEMENT_SET_ABGELEHNT`, `SUPPLEMENT_SET_ARCHIVIERT` (Namen final im Contract-Review).
3. **Wirkungsgrenze „Beauftragt“**
   - Vor `BEAUFTRAGT`: keine Abbildung auf „abrechenbare“ Strukturen (keine Aufmass-/Rechnungswirkung; ggf. reine Planungs-/Positions-Entwürfe).
   - Ab `BEAUFTRAGT`: fachliche Koppelung zu **Aufmass** (neue Aufmassversion / Nachtragsbezug) und **Rechnung** (Traceability-Pflicht aus §2 / §7) — minimal: stabile Referenzen + Preflight, keine vollständige Finanzlogik §8 in derselben Iteration, sofern gesondert geschnitten.
4. **Export / Traceability**
   - Rechnungs-Export: Traceability-Kette muss Nachtragsbezug abbilden können (z. B. `supplementVersionId` oder `supplementOfferId` im Link-Modell — ADR).
   - Offer-/GAEB-Export für Nachtrag: fail-closed Preflight analog Hauptangebot (separates Format-Matrix-Stück).
5. **Tests P0** (siehe `docs/contracts/qa-p0-ticket-002-nachtrag-lifecycle.md`)
6. **ADR** finalisieren: `docs/adr/0002-nachtrag-lifecycle.md` (aktuell Entwurf)

### Explizit Out of Scope (Iteration 1)
- Vollständige **Finanzlogik §8** (Skonto, Mahnstufen, komplexe Saldenketten), außer wenn im Gate ausdrücklich erweitert.
- UI — nur Backend + Contracts.

## Quality Gates (Go/No-Go vor Merge)

| Gate | Kriterium |
|------|-----------|
| G1 | `npm run typecheck` grün |
| G2 | Alle **P0**-Tests in Ticket-002-Matrix grün |
| G3 | **Tenant-Isolation**: kein Cross-Tenant Read/Write auf Nachtrag-Pfaden |
| G4 | **Keine destruktiven Updates** an `baseOfferVersionId` / Basis-Angebotsversion |
| G5 | **Wirkung**: vor `BEAUFTRAGT` keine Aufmass-/Rechnungs-Koppelung, die §5.3 verletzt |
| G6 | **Audit**: jeder kritische Statuswechsel Nachtrag mit `AuditEvent` |
| G7 | **Traceability/Export**: fail-closed, wenn Kette oder Pflichtfelder fehlen (Rechnung) |
| G8 | **Contracts**: `action-contracts.json` / `error-codes.json` / `api-contract.yaml` konsistent zu Backend |

**NO-GO** bei Verletzung von G3–G7 oder roten P0-Tests.

## Migration-Perspektive (Prisma/Postgres) — Zielbild
- Tabellen (conceptuell): `supplement_offers`, `supplement_versions` (oder `nachtragsangebot` / `nachtragsversion`), jeweils `tenant_id` NOT NULL, FK auf `tenants`.
- `base_offer_version_id` NOT NULL, FK auf `offer_versions`; **kein** ON DELETE CASCADE auf historische Versionen (soft/archive pattern).
- Unique sinnvoll: `(tenant_id, supplement_offer_id, version_number)` für Versionen.
- Indizes für `tenant_id` + `status` für Listungen.
- Migrationen nur additive; keine Datenlöschung bei Statuswechsel.
- Umsetzungspräferenz: `prisma migrate dev` (versionierbare, reviewbare Migrationen) statt `db push` für den Produktivpfad.
- Detaillierte Spike-/Trade-off-Entscheidung: `docs/adr/0003-persistence-spike.md`.

## Freigabe-Checkliste (Product / Architektur / Review)
- [x] Review-GO für TICKET-002 erteilt
- [x] Scope In/Out formal bestätigt
- [x] Rollenmatrix Nachtrag final (Analogie Hauptangebot oder Abweichungen dokumentiert)
- [x] Schnitt: Aufmass/Rechnung minimal vs. vollständig geklärt

## Review-GO Eintrag (Pflicht vor Implementierung)
- **Status aktuell:** `GO`
- **Freigabe-Eintrag:**
  - `Review-GO: GO`
  - `Datum: 2026-04-14`
  - `Freigabe durch: Projektleiter + Softwarearchitekt`
  - `Optionales Vier-Augen-Reading: bereits erfolgt (Senior Code Reviewer Gate = GO im aktuellen Scope)`
  - `Scope bestätigt: Iteration 1 Referenzschnitt Aufmass/Rechnung + Preflight; keine vollen Nachtrags-Positionen`
  - `Quality Gates bestätigt: G1-G8 sind operationalisierbar und vor Merge verpflichtend`

*Hinweis: Dieser Eintrag galt als Startfreigabe für die Implementierung von Iteration 1; mit **Final Closure** unten ist Iteration 1 abgeschlossen.*

## Final Closure (Abnahme Iteration 1)

- **Status:** `GO` (final)
- **Datum/Uhrzeit:** 2026-04-14T18:00:00+02:00
- **Freigabe durch:** Projektleiter + Softwarearchitekt
- **Reviewer-Bestätigung:** Senior Code Reviewer — `GO` (Final Closure TICKET-002 Iteration 1), 2026-04-14
- **Evidenz (auditierbar):**
  - `docs/contracts/qa-p0-matrix-ticket-002.md` — P0-ID → `it("...")` in `test/app.test.ts`
  - `docs/contracts/qa-report-ticket-002.md` — Gate GO, P0 vollständig PASS
  - `docs/contracts/qa-defects-ticket-002.md` — keine offenen kritischen Defects
  - `docs/adr/0002-nachtrag-lifecycle.md` — ACCEPTED (Iteration-1-Schnitt)
  - Testlauf: `npm test` **39/39** grün; `npm run typecheck` grün
- **Scope-Grenze:** Iteration 1 ist abgeschlossen. **Nicht** Teil dieses Closures: **Iteration 1b** (Nachtrags-Positions-/LV-Tiefe), **Persistenzmigration** (siehe `docs/adr/0003-persistence-spike.md`).

### Quality Gates G1–G8 (Iteration 1 — erfüllt)

| Gate | Status | Nachweis |
|------|--------|----------|
| G1 | Erfüllt | `npm run typecheck` grün |
| G2 | Erfüllt | P0 TICKET-002 laut Matrix/Report vollständig PASS; `npm test` 39/39 |
| G3 | Erfüllt | Tenant-Isolation Nachtrag-Pfade (P0 / Tests) |
| G4 | Erfüllt | Keine destruktive Mutation `baseOfferVersionId` / Basisversion |
| G5 | Erfüllt | Billing/Wirkung erst ab `BEAUFTRAGT`; vorher fail-closed |
| G6 | Erfüllt | Kritische Supplement-Transitions mit Audit (Tests inkl. Assertions) |
| G7 | Erfüllt | Traceability/Export fail-closed inkl. Nachtragsbezug |
| G8 | Erfüllt | `action-contracts.json`, `error-codes.json`, `api-contract.yaml` konsistent zum Backend |

**Phase-2-Start:** siehe `docs/tickets/PHASE-2-STARTAUFTRAG.md`.

### Entscheidungen (2026-04-14, schließt offene Workshop-Fragen)

**Wer erteilt das Review-GO formal?**  
- **Projektleiter + Softwarearchitekt** (im Projekt: dokumentierte Rolle; GO = Eintrag in diesem Ticket mit **Datum** und Namen).  
- Optional: zweites Vier-Augen-Reading durch **Senior Code Reviewer**, wenn organisatorisch gewünscht — dann ebenfalls Datum im Ticket.

**Iteration 1 — Schnitt Aufmass / Rechnung:**  
- **Gewählt:** Stabile **Referenzen** (`supplementOfferId` / `supplementVersionId` im Traceability-/Link-Modell) + **fail-closed Preflight** für Exporte; **keine** vollständige Positions-/Finanzlogik in Iteration 1.  
- **Mindest-Positionen / Nachtrags-LV-Struktur:** **Iteration 1b** (eigenes Gate), sobald Referenzen und Status-Lifecycle in G1–G8 grün sind.  
- **Rationale:** §5.3-Wirkung „erst nach Beauftragt“ ist ohne Referenzmodell nicht auditierbar; Positionsdetail erhöht Risiko vor fixierter Wirkungsgrenze.

**Status-Konvention (Vorpräferenz bis ADR-0002 final):**  
- Eigenes **Nachtrags-Status-Enum** (analog §5.3), **nicht** Wiederverwendung der Hauptangebot-Strings auf derselben Entität — vermeidet fachliche Vermischung in Code und SoT.

**SoT / allowed-actions (Vorpräferenz):**  
- **`entityType`** für Nachtragsdokumente explizit (z. B. `SUPPLEMENT_OFFER` oder `SUPPLEMENT_VERSION`) in `GET /documents/{id}/allowed-actions`, sobald Entitäten existieren; Minimal-API bleibt unverändert bis Migration der Routen im ADR beschrieben ist.

**Hauptangebot Angenommen / Abgelehnt (Rollen):**  
- **ADMIN**, **VERTRIEB_BAULEITUNG**, **GESCHAEFTSFUEHRUNG** dürfen aus `VERSENDET` **ANGENOMMEN** bzw. **ABGELEHNT** setzen (bereits in `AuthorizationService` umgesetzt; fachlich bestätigt).

## Verweise
- `docs/ERP-Systembeschreibung.md` (§5.3, §7)
- `docs/tickets/TICKET-001-nachtrag-minimal-api.md`
- `docs/adr/0002-nachtrag-lifecycle.md` (ACCEPTED für Iteration-1-Schnitt)
- `docs/tickets/PHASE-2-STARTAUFTRAG.md`
