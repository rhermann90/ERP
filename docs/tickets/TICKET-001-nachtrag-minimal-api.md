# TICKET-001 — Minimal-API Nachtragsangebot (v1.2 Folgeprozess)

## Kontext
`docs/_archiv/systembeschreibung-und-phasen-legacy/ERP Systembeschreibung v1.2.md` verlangt nach verbindlicher Annahme (`ANGENOMMEN`) Änderungen **ausschließlich über Nachtragsangebot** mit Referenz auf die konkrete Basis-Angebotsversion.

## Phase-1-Scope
**Umgesetzt (Minimal-API)** im aktuellen Backend-Slice.

## Aktueller Stand
- `POST /offers/{offerId}/supplements` vorhanden.
- Fachliche Gates: Tenant-Scoping, Rollenprüfung (`ADMIN|VERTRIEB_BAULEITUNG|GESCHAEFTSFUEHRUNG`), Basis-Angebotsversion muss `ANGENOMMEN` sein.
- Ergebnis: `SupplementVersion` in `ENTWURF`, Referenz auf `baseOfferVersionId`, AuditEvent `VERSION_CREATED` mit `entityType=SUPPLEMENT_VERSION`.

## Akzeptanzkriterien (Status)
1. `POST /offers/{offerId}/supplements` mit Payload `baseOfferVersionId`, `lvVersionId`, `editingText`, `reason` ✅
2. Mandantentrennung + Referenz auf Basisversion ✅
3. Tests Positiv/Negativ (`ANGENOMMEN` notwendig) ✅

## Verweise
- `docs/_archiv/historische-phase1-qa-und-kontraktdiff/delta-backend-spec-v1.2.md` (Abschnitt Nachtrag; **Archiv** — v1.2-Delta, nicht aktuelle Leitplanke)
- `docs/adr/0001-phase1-critical-decisions.md` (ADR-1, ADR-10)

## Folge-Ticket
- Vollständiger Nachtrags-Lebenszyklus v1.2 (Freigabe, Beauftragung, Wirkung, Traceability/Export): **`docs/tickets/TICKET-002-nachtrag-lifecycle-v12.md`** (Implementierung erst nach Review-GO).
