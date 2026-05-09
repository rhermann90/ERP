# UX-Grundmuster für endnutzertaugliche Screens (verbindlich)

**Geltungsbereich:** Neue oder überarbeitete Oberflächen unter `apps/web/`, sobald sie über Pilot-/Shell-Zustand hinaus „Produkt“ werden sollen — siehe [`pwa-backend-coverage-matrix.md`](./pwa-backend-coverage-matrix.md).

**Nicht verhandelbar:** Keine zweite SoT — [`docs/contracts/ui-action-executor-coverage.md`](../contracts/ui-action-executor-coverage.md), Mandantisolation, Traceability laut [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md).

**Referenz:** [`docs/ui-ux-style-guide.md`](../ui-ux-style-guide.md), [`docs/referenz-ui-ux.md`](../referenz-ui-ux.md), Web-Regel [`.cursor/rules/erp-web-ui.mdc`](../../.cursor/rules/erp-web-ui.mdc).

---

## 1. Lesen (Standardnutzer)

- **Strukturierte Darstellung:** Karten, Tabellen, kurze Labels — kein Pflicht-Rohtext (JSON) im Primärfluss.
- **Leer-/Platzhalter:** [`apps/web/src/components/product-ui/ProductEmptyState.tsx`](../../apps/web/src/components/product-ui/ProductEmptyState.tsx) für Hub-Seiten ohne Datenliste (ein einziges Seiten-`<h2>` pro Screen; Leertext als Absatz, keine konkurrierenden Überschriftenebenen).
- **Rohtext / Roh-JSON:** nur **Expertenmodus** (`showExpertUi`: Dev, `VITE_PWA_EXPERT_UI=1`, oder Mandanten-PWA Expertenmodus in [`App.tsx`](../../apps/web/src/App.tsx)) oder eingeklappte „Technische Details“.
- **Leerstand und Grenzfälle:** eigene Empty States (keine Daten, keine Berechtigung, Mandanten-Mismatch).

---

## 2. Schreiben (Mutationen)

- **SoT-first:** vor Primäraktionen **`allowedActions`** laden (`GET /documents/{id}/allowed-actions` für dokumentgebundene Entitäten).
- **Ausführung:** über bestehende Executor-Pfade (z. B. `executeActionWithSotGuard` / [`action-executor.ts`](../../apps/web/src/lib/action-executor.ts)) — keine parallelen „Speichern“-Buttons ohne Abgleich mit der Server-SoT.
- **Finanz:** dedizierte Contract-Pfade beachten (Invoice vs. Shell vs. FIN-4-Konfiguration) — dieselbe Trennung wie in `api-client` und `ui-action-executor-coverage`.

---

## 3. Expertenmodus

- **Zweck:** Diagnose, Integration, Pilot-Debugging.
- **Kein Ersatz** für geführte Formulare für das reguläre Personal — wenn eine Aktion nur im Expertenmodus erreichbar ist, bleibt die Matrix [`pwa-backend-coverage-matrix.md`](./pwa-backend-coverage-matrix.md) bei „Teil“ oder „Experte“, bis ein Produkt-Screen nachzieht.

---

## 4. Fehler

- **API-Fehler:** [`apps/web/src/lib/api-error.ts`](../../apps/web/src/lib/api-error.ts) — strukturierte Envelope-Felder nutzen (`message`, `code`, `correlationId` wo sinnvoll).
- **Nutzerkopie:** kurze, handlungsorientierte Überschrift; Technik-Jargon nicht als einzige Zeile im Standard-Banner.
- **Keine verschluckten Fehler:** Server-Fehler nicht still durch „leere Liste“ ersetzen.

---

## Checkliste vor Merge (UX-relevante Screens)

- [ ] Lesepfad ohne JSON-Pflicht für Standardnutzer
- [ ] Schreibaktionen nur nach SoT / Contract
- [ ] Empty / Error / Kein-Zugriff abgedeckt
- [ ] Experten-Inhalte klar getrennt
- [ ] Style-Guide und A11y-Basics (Fokus, Überschriftenhierarchie)
