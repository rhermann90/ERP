# QA P0 Matrix - Phase 1 Final

Quelle: `ERP Systembeschreibung v1.2.md`, `module-contracts.json`, `action-contracts.json`, `error-codes.json`, `docs/api-contract.yaml`, `decision-table-phase1.md`, `decision-log-phase1-frontend.md`

**Testdatei:** `test/app.test.ts` — Spalte *Test* verweist auf die Zeile der `it("...")`-Deklaration (Stand: letzter QA-Lauf).

## Testfaelle

| ID | Prio | Given | When | Then | Endpoint | Erwarteter Code | Envelope | Test (`test/app.test.ts`) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P0-01 | P0 | Gueltiger Token Tenant A, Header `x-tenant-id` Tenant B | `POST /offers/status` | Zugriff blockiert | `POST /offers/status` | `TENANT_SCOPE_VIOLATION` (403) | `correlationId`, `blocking=true` | **L68:** `it("enforces tenant isolation (negative)", ...)` |
| P0-02 | P0 | Rolle `VIEWER` | Kritische Statusaenderung | blockiert | `POST /offers/status` | `AUTH_ROLE_FORBIDDEN` (403) | normiert | **L233:** `it("blocks status transition for unauthorized role (negative authz)", ...)` |
| P0-03 | P0 | Ungueltiger Bearer Token | Kritische Aktion | AuthN blockiert | `POST /offers/status` | `UNAUTHORIZED` (401) | normiert | **L185:** `it("rejects invalid token signature (negative)", ...)` |
| P0-04 | P0 | Angebotsversion nach v1.2 in Endlage / keine neue Hauptversion | `POST /offers/version` | `FOLLOWUP_DOCUMENT_REQUIRED` | `POST /offers/version` | `409` | normiert | **L322:** `it("blocks POST /offers/version when current version is ANGENOMMEN (v1.2, FOLLOWUP_DOCUMENT_REQUIRED)", ...)` |
| P0-04b | P0 | `VERSENDET`, noch nicht angenommen | `POST /offers/version` | neue Version erlaubt (nicht-destruktiv) | `POST /offers/version` | `201` | — | **L275:** `it("allows creating a new version after offer was sent before acceptance (v1.2)", ...)` |
| P0-05 | P0 | Rechnung nicht exportbereit | `POST /exports` | fail-closed | `POST /exports` | `EXPORT_PREFLIGHT_FAILED` (422) | `details.validationErrors` | **L666:** `it("blocks invoice export for draft invoices (negative preflight)", ...)` |
| P0-06 | P0 | Traceability-Link fehlt | `POST /exports` | blockiert | `POST /exports` | `TRACEABILITY_LINK_MISSING` (422) | normiert | **L104:** `it("fails invoice export when traceability is broken (negative)", ...)` |
| P0-07 | P0 | Traceability-Felder inkonsistent | `POST /exports` | blockiert | `POST /exports` | `TRACEABILITY_FIELD_MISMATCH` (422) | normiert | **L119:** `it("fails invoice export when traceability fields are inconsistent (negative)", ...)` |
| P0-08 | P0 | Falsches Format zur Entitaet | `POST /exports` | fail-closed | `POST /exports` | `EXPORT_PREFLIGHT_FAILED` (422) | Details | **L683:** `it("enforces format policy matrix (negative)", ...)` |
| P0-09 | P0 | Rolle `VIEWER` | Audit Read | least-privilege | `GET /audit-events` | `FORBIDDEN_AUDIT_READ` (403) | normiert | **L157:** `it("enforces role isolation on audit endpoint (negative)", ...)` |
| P0-10 | P0 | Dokument vorhanden | `GET .../allowed-actions` | SoT-Liste | `GET /documents/{id}/allowed-actions` | `200` | — | **L263:** `it("returns backend source-of-truth allowed actions per role", ...)` |
| P0-11 | P0 | Status `IN_FREIGABE`, Rolle `VERTRIEB_BAULEITUNG` | SoT + `POST /offers/version` | `OFFER_CREATE_VERSION` + `201` | GET + `POST /offers/version` | `200` + `201` | — | **L633:** `it("exposes OFFER_CREATE_VERSION on allowed-actions while IN_FREIGABE (SoT matches POST /offers/version)", ...)` |
| P0-12 | P0 | Status `ANGENOMMEN` | SoT + `POST /offers/version` | kein `OFFER_CREATE_VERSION`, API `409` | GET + `POST /offers/version` | `FOLLOWUP_DOCUMENT_REQUIRED` | normiert | **L322:** `it("blocks POST /offers/version when current version is ANGENOMMEN (v1.2, FOLLOWUP_DOCUMENT_REQUIRED)", ...)` |
| P0-13 | P0 | Status `ABGELEHNT` | wie P0-12 | blockiert | `POST /offers/version` | `409` | normiert | **L358:** `it("blocks POST /offers/version when current version is ABGELEHNT (v1.2, SoT + API)", ...)` |
| P0-14 | P0 | Status `ARCHIVIERT` | wie P0-12 | blockiert | `POST /offers/version` | `409` | normiert | **L396:** `it("blocks POST /offers/version when current version is ARCHIVIERT (v1.2, SoT + API)", ...)` |
| **P0-15** | **P0** | Status **`ANGENOMMEN`**, Rollen **ADMIN / VERTRIEB_BAULEITUNG / GESCHAEFTSFUEHRUNG** | `GET .../allowed-actions` + **`POST /offers/{id}/supplements`** | SoT enthaelt **`OFFER_CREATE_SUPPLEMENT`**, POST je Rolle **`201`**, kein `OFFER_CREATE_VERSION` | `GET` + `POST /offers/{offerId}/supplements` | `200` + `201` | Positiv: Response Body | **L459:** `it("P0: SoT lists OFFER_CREATE_SUPPLEMENT after ANGENOMMEN for ADMIN, VERTRIEB_BAULEITUNG, GESCHAEFTSFUEHRUNG", ...)` |
| **P0-16** | **P0** | Status **`ANGENOMMEN`**, Rollen **VIEWER** (und zusaetzlich **BUCHHALTUNG**) | SoT + `POST /supplements` | **kein** `OFFER_CREATE_SUPPLEMENT` in Liste; **POST** `403` `AUTH_ROLE_FORBIDDEN` + Envelope | `GET` + `POST` | `403` | `correlationId`, `blocking=true` | **L513:** `it("P0: SoT omits OFFER_CREATE_SUPPLEMENT for VIEWER and BUCHHALTUNG after ANGENOMMEN; POST supplements forbidden", ...)` |
| P1-01 | P1 | Frontend Fehlerobjekt | alle kritischen Pfade | Passthrough / Map | diverse | laut `error-codes.json` | — | implizit ueber Envelope-Assertions in P0-Tests (z. B. **L68**, **L513**) |
| P2-01 | P2 | Row/Bulk `allowedActions` | — | Phase 2, kein P0-Fail | — | — | — | *nicht ausgefuehrt* |

## v1.2-Anhang: OFFER_CREATE_VERSION (SoT vs API)

| Status | `OFFER_CREATE_VERSION` in allowedActions | `POST /offers/version` | Referenz |
| --- | --- | --- | --- |
| `ENTWURF` … `VERSENDET` (ohne Annahme) | ja (Rollen ADMIN/VERTRIEB_BAULEITUNG) | `201` wo erlaubt | v1.2 Abs. 2 / 5.2 |
| `ANGENOMMEN`, `ABGELEHNT`, `ARCHIVIERT` | nein | `409 FOLLOWUP_DOCUMENT_REQUIRED` | v1.2 |

## v1.2-Anhang: OFFER_CREATE_SUPPLEMENT (Nachtrag, SoT vs API)

| Status | `OFFER_CREATE_SUPPLEMENT` in allowedActions | `POST /offers/{offerId}/supplements` | Referenz |
| --- | --- | --- | --- |
| `ANGENOMMEN` | ja fuer **ADMIN, VERTRIEB_BAULEITUNG, GESCHAEFTSFUEHRUNG**; **nein** fuer **VIEWER, BUCHHALTUNG** | `201` wenn Rolle + Basis `ANGENOMMEN`; sonst `403` / `409` | `action-contracts.json` `OFFER_CREATE_SUPPLEMENT`; **P0-15, P0-16** |

## Ergaenzende Regression (ohne eigene P0-ID)

| Beschreibung | Test (`test/app.test.ts`) |
| --- | --- |
| Nachtrag Minimal-API (Happy Path ein Rolle) | **L578:** `it("creates supplement offer from accepted base version (minimal API)", ...)` |
| Nachtrag ohne angenommene Basis | **L617:** `it("blocks supplement creation when base offer is not accepted", ...)` |
| Angebots-Export Readiness (Offer) | **L88:** `it("fails export if legal readiness missing for offer (negative)", ...)` |
| Rechnungs-Export positiv | **L698:** `it("allows invoice export for immutable legal status (positive)", ...)` |
