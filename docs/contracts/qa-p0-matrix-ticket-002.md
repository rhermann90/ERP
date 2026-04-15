# QA P0 Matrix - TICKET-002 Nachtrag Lifecycle

Quellen: `ERP Systembeschreibung v1.2.md`, `docs/tickets/TICKET-002-nachtrag-lifecycle-v12.md`, `docs/adr/0002-nachtrag-lifecycle.md`, `docs/contracts/qa-p0-ticket-002-nachtrag-lifecycle.md`, `docs/contracts/action-contracts.json`, `docs/api-contract.yaml`

Testbasis: `test/app.test.ts`

| P0-ID | Erwartung laut Ticket-002 | Evidenz-Test (`test/app.test.ts`) | Status |
| --- | --- | --- | --- |
| P0-N-01 | Tenant-Isolation auf Nachtragspfad (403/404, kein Leak) | `it("P0-N-01 tenant isolation on supplement status transition", ...)` | PASS |
| P0-N-02 | `ENTWURF -> IN_FREIGABE` + Audit | `it("P0-N-02..N-04 audit assertions for critical supplement transitions", ...)` | PASS |
| P0-N-03 | `IN_FREIGABE -> FREIGEGEBEN` + Audit | `it("P0-N-02..N-04 audit assertions for critical supplement transitions", ...)` | PASS |
| P0-N-04 | `FREIGEGEBEN -> VERSENDET` + Audit | `it("P0-N-02..N-04 audit assertions for critical supplement transitions", ...)` | PASS |
| P0-N-05 | `VERSENDET -> BEAUFTRAGT` **und** `VERSENDET -> ABGELEHNT` | `it("P0-N-02..N-05 supplement lifecycle transitions and audit path", ...)` + `it("P0-N-05 explicit ABGELEHNT branch with status and audit evidence", ...)` | PASS |
| P0-N-06 | Wirkung vor `BEAUFTRAGT` fail-closed (`409`) | `it("P0-N-06 fail-closed billing impact before BEAUFTRAGT", ...)` | PASS |
| P0-N-07 | Wirkung ab `BEAUFTRAGT` erlaubt inkl. Referenz | `it("P0-N-07/N-09 apply billing impact after BEAUFTRAGT and keep export traceability green", ...)` | PASS |
| P0-N-08 | Basisreferenz unveränderlich | `it("P0-N-08 baseOfferVersionId remains immutable after BEAUFTRAGT flow", ...)` | PASS |
| P0-N-09 | Export/Traceability fail-closed bei gebrochener Kette mit Nachtragsbezug | `it("P0-N-09 supplement-specific fail-closed traceability break after impact", ...)` | PASS |
| P0-N-10 | SoT: keine Aktion ohne `allowedActions`-Eintrag, statusbezogen | `it("P0-N-10 status-based SoT vs executable API for IN_FREIGABE/FREIGEGEBEN/VERSENDET/BEAUFTRAGT/ABGELEHNT", ...)` | PASS |
