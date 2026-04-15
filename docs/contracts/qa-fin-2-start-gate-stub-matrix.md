# Stub-Matrix — FIN-2-Start-Gate (G1–G10) × Phasen FIN-1 / FIN-2

**Quelle der Zeilen:** `docs/tickets/FIN-2-START-GATE.md` Abschnitt 1.  
**Zellen:** geplanter **Testtyp** pro Phase (noch nicht voll ausgeschöpft; FIN-0 liefert nur Strategie).

Legende: **C** = Contract (OpenAPI / `action-contracts` / `error-codes` Abgleich), **I** = Integration (Vitest + API/DB), **E** = E2E (Playwright o. Ä. gegen laufendes System), **M** = manueller / prozessualer Nachweis (Sign-off, ADR-Review, Ticket-Kommentar).

| Gate-ID | Kriterium (Kurz) | FIN-1 (Zahlungsbedingungen, 8.5) | FIN-2 (Rechnung / 8.4-Kette) |
| --- | --- | --- | --- |
| **G1** | LV persistiert, tenant-sicher | **I** (LV-DB-Suites, bestehende Inkremente fortführen) | **I** (Rechnungsbasis nur aus persistiertem LV; keine Schatten-LV) |
| **G2** | Aufmass persistiert, Tenant-Negativ | — (indirekt über Traceability) | **I** (Aufmass→Rechnung Referenztests) |
| **G3** | Traceability-Kette fail-closed | **C** (Contract-Felder Zahlungsbedingung ↔ Angebot, falls angebunden) | **I** + **E** (Export-/Traceability-Pfade wie heute, erweitert um Rechnungsentwurf) |
| **G4** | ADR FIN-2-Grenze merged | **M** (Review ADR-Text) | **M** + **C** (ADR ↔ OpenAPI-Operationen) |
| **G5** | `lvVersionId` verbindlich | **C** (Schema `CreatePaymentTermsVersionRequest` / Verknüpfungen) | **I** + **C** (`CreateInvoiceDraftRequest.lvVersionId` Pflicht, keine stillen Defaults) |
| **G6** | Phase-2-Abnahme „Rechnungs-Feed“ | **M** (QA-Report / Ticket: Inc1+Inc2 ausreichend) | **M** (gleicher Nachweis für FIN-2-Umfang) |
| **G7** | CI grün inkl. Persistenz | **I** (Regression `npm test` + CI Postgres) | **I** (identisch; kein zusätzlicher E2E-Pflicht bis MVP) |
| **G8** | OpenAPI ↔ Contracts, keine Phantom-Codes | **C** | **C** + **I** (Stub-Responses gegen `error-codes.json`, siehe `finance-fin0-openapi-mapping.md`) |
| **G9** | In-Memory vs. Postgres Strategie §16 | **M** + **C** (ADR-0007 Fortschreibung) | **M** + **I** (Audit-/Rechnungs-Persistenzpfade) |
| **G10** | PL-Freigabezeile | **M** | **M** |

**Hinweis:** Zeilen **G6**, **G9**, **G10** sind **nicht vollständig automatisierbar**; sie bleiben bewusst **M**-Anteil, ergänzt durch verlinkte Artefakte (QA-Report, ADR, Gate-Tabelle).

**Drift → Projektleitung:** Liegt ein Repo-Artefakt vor (z. B. ADR unter `docs/adr/`), die kanonische Tabelle in `docs/tickets/FIN-2-START-GATE.md` zeigt in **erfüllt** aber weiterhin **nein** ohne Eintrag unter **Nachweis**, ist die Checkliste nicht nachgezogen — **PL** bitte Spalten pflegen. Diese Matrix ersetzt **keine** Gate-Zeile und befreit nicht von G1–G10.
