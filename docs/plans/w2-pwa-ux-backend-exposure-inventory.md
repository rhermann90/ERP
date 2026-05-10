# W2 — PWA: sichtbare Backend-/Diagnose-Flächen (Inventar)

**Zweck:** Priorisierte Übersicht, wo die PWA noch **Roh-JSON**, **API-Pfade im Fließtext** oder **(GET)**-Jargon im Standardfluss zeigt — Grundlage für Ent-Backend-ung Richtung [`pwa-ux-patterns-end-user.md`](./pwa-ux-patterns-end-user.md).

**Stand:** 2026-05-09; bei UX-PRs fortlaufend ergänzen.

## Abnahme (DoD) je Route

- **`showExpertUi` / `showIntegrationHints` aus:** kein **Pflicht**-Roh-JSON im Primärfluss; strukturierte Felder, Tabellen und Kurzmeldungen bleiben.
- **Experte an:** `FinanceCollapsibleJson`, `ShellExpertDiagnosticsJson`, eingeklappte Rohdaten — wie in den Komponenten verdrahtet.
- **Code-Abgleich (2026-05-09):** Alle `FinanceCollapsibleJson`-Nutzungen in der Finanz-Vorbereitung stehen unter `showIntegrationHints` (oder äquivalentem Guard). Dokument-Shell: nach erfolgreicher Modal-SoT-Aktion Kurzmeldung statt vollem Antwort-JSON, wenn Experte aus ([`App.tsx`](../../apps/web/src/App.tsx) `runAction`).

## Priorität (Umsetzung)

1. **Finanz-Vorbereitung** `#/finanz-vorbereitung` — höchste Nutzerfrequenz, viele `FinanceCollapsibleJson`-Blöcke.
2. **Rechnungs-Shell** `#/dokument` + `InvoiceShellReadonlyPanel` — Lesepfade für Traceability; Roh-JSON konsistent hinter Experten-Diagnose.
3. **Pilot-Routen** `#/geschaeftsprozess`, `#/lv-bearbeiten`, `#/angebote-arbeitsflaeche`, Hubs — schrittweise.

## Matrix (Route → Komponenten → Standard vs. Experte)

| Route / Bereich | Hauptkomponenten | Roh-JSON / API im Standard (`showExpertUi` / `showIntegrationHints` false) | Experte |
|-----------------|------------------|---------------------------------------------------------------------------|---------|
| `#/finanz-vorbereitung` | `FinancePreparation`, `FinancePrepStep*`, `FinancePreparationDunningPanel`, `FinancePreparationPaymentPanel`, `FinanceDunningGrundeinstellungenPanel`, `FinanceInvoiceTaxSettingsPanel` | **Keine** `FinanceCollapsibleJson`-Pflicht; strukturierte Tabellen/Formulare; Mahn-Tab Kurz-Einleitung ohne API-Pfad-Wand | `FinanceCollapsibleJson` für GET/POST-Rohantworten; lange FIN-4-Erläuterung mit Endpunkten |
| `#/dokument` (INVOICE) | `InvoiceShellReadonlyPanel`, `App` (SoT-Aktionen) | Kurzcopy; Lesepfad-JSON in `ShellExpertDiagnosticsJson`; nach erfolgreicher Modal-Aktion **Kurzmeldung** statt vollem JSON-Body | Volle Aktions-Antwort als JSON im Banner; Shell-Blöcke aufgeklappt |
| `#/lv-bearbeiten` | `LvBearbeitenPage`, `LvVersionSotPanel`, `LvEntityTextSotPanel`, `LvWorkbench` | SoT-Liste ohne Roh-JSON; Textaktion-Erfolg Kurzmeldung | Roh-JSON SoT / Serverantwort (`allowExecution`) |
| `#/geschaeftsprozess` | `GeschaeftsprozessWizard` | SoT-Zusammenfassung als lesbare Liste; Aufmass: **geführte** Menge/Einheit/Anmerkung (kein Pflicht-`positionsJson`-Textarea) | `positionsJson`-Textarea, Roh-`allowedActions`-JSON, API-lastige Labels |
| `#/angebote-arbeitsflaeche` | `OfferSupplementWorkspacePage` | Erfolg Kurztext; Route-Zeile nur mit Experte | Banner/Route-Rohdarstellung |
| `#/stammdaten`, `#/admin/users` | diverse Hub-Panels | z. B. `StammdatenPaymentTermsPanel`: Tabelle/DL; Roh-JSON nur in eingeklapptem Experten-`details` | vollständige Rohdaten |

## Leitplanken

- Keine zweite SoT-Logik — [`docs/contracts/ui-action-executor-coverage.md`](../contracts/ui-action-executor-coverage.md).
- Differenzbuchung **Entwurf-UI** nur nach Gate — [`docs/adr/0021-difference-booking-slice2-draft-integration-scope.md`](../adr/0021-difference-booking-slice2-draft-integration-scope.md).

## Verweise

- Roadmap: [`pwa-domain-increment-roadmap.md`](./pwa-domain-increment-roadmap.md)
- MVP-Zielbild: [`docs/PWA-Entwicklungsreferenz.md`](../PWA-Entwicklungsreferenz.md)
