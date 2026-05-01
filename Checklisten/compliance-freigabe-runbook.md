# Runbook: Compliance-Freigabe (Ledger → Ledger-Datei)

**Entwicklungsphase:** Dieser Ablauf ist **optional**, bis das Team eine **formale** Hybrid-Freigabe mit echten Nachweisen anstrebt (vor Produktiv-Go). `compliance-signoffs.json` darf leer bleiben; `verify:ci` validiert dann nur Marker-/JSON-Struktur.

Kurzfassung für **Release-Verantwortliche** und technische Rollen mit Zugriff auf das **genehmigte Freigabe-Tool** / interne Protokolle — **wenn** formale Freigaben geführt werden. Ersetzt keine StB-/DSB-Fachprüfung.

## Rollen

| Wer | Aufgabe |
|-----|---------|
| **StB / DSB** | Fachliche Klärung; Nachweise **intern** (Wiki, Ticket, Beschluss — keine Platzhalter-URLs ins Repo). |
| **PL** (oder ausdrücklich beauftragte Rolle) | Trägt **nach** dokumentierter Freigabe Einträge in [`compliance-signoffs.json`](./compliance-signoffs.json) ein; führt Validate und Apply aus (oder beauftragt einen Orchestrator-Agenten **nur** mit Ledger-Input). |
| **Agenten** | Keine Kürzel ohne Ledger-Zeile; siehe [`prompts-agents-compliance-abarbeitung.md`](./prompts-agents-compliance-abarbeitung.md) → Hybrid-Freigabe. |

## Minimalinhalt `evidenceRef`

- Interner Schlüssel mit Bezug zum Nachweis: Ticket-ID, Wiki-Anker, Beschlussnummer, Protokollauszug-ID.
- Mindestens 2 Zeichen; **keine** erfundenen öffentlichen URLs.
- Optional: `approvalId` / `token` aus dem Freigabe-Tool (opaque).

## Ablauf

1. Freigabe im **Tool oder Protokoll** festhalten (Datum, Rolle, Umfang).
2. **`compliance-signoffs.json`** ergänzen: pro Ledger-Zeile ein oder mehrere Objekte mit `lineId`, `suffix`, `isoDate`, `evidenceRef` (Schema: [`compliance-signoffs.schema.json`](./compliance-signoffs.schema.json)).
3. **`npm run validate:compliance-signoffs`** — muss ohne Fehler durchlaufen.
4. **`npm run apply:compliance-signoffs`** — Dry-Run: prüfen, welche Zeilen sich ändern würden.
5. **`npm run apply:compliance-signoffs:apply`** — schreibt Zeilen mit passendem `<!-- compliance-line: … -->` in [`compliance-rechnung-finanz.ledger.md`](./compliance-rechnung-finanz.ledger.md) **und** in der Anlage von [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md) (gleiche Marker; Validierung prüft Mengen- und Bullet-Text-Parität).

**Hinweis:** [`compliance-rechnung-finanz-ausgefüllt.rtf`](./compliance-rechnung-finanz-ausgefüllt.rtf) (Rich-Text) ist ein **anderes** Artefakt und wird von Apply **nicht** geändert — maschinelle Checkboxen nur in den beiden Markdown-Dateien oben.

Das **Begleitblatt zum Ausdrucken** bleibt [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md): Freigaben dort **von Hand** nach den Tabellen; Apply ändert diese Datei **nicht**.

**Drift-Risiko:** Prüfpunkt geändert → Begleitblatt **und** Ledger **und** Marker-Anlage in [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md) **und** `LINE_ALLOWED_SUFFIXES` im Shared-Skript prüfen; bei Bedarf [`prompts-agents-compliance-abarbeitung.md`](./prompts-agents-compliance-abarbeitung.md) (Legende **§ → Teile A–G**, Workshop-Tabellen) anpassen. Vor Merge: `npm run validate:compliance-signoffs`.

Das Apply-Skript **entfernt** keine bestehenden Suffixe; es setzt `[x]` und hängt fehlende ` — **YYYY-MM-DD · suffix**`-Blöcke an.

## Abschluss Teil G

Die Sammelpunkte **G.1–G.6** setzen voraus, dass **A–F** inhaltlich belegt sind und die jeweiligen **menschlichen** Freigaben dokumentiert sind — siehe Begleitblatt und interne Protokolle. Ledger und Skript **ersetzen** keine Gesamtbeurteilung „Mandanten-Go“.

## Referenz

- Schema und Beispiel-JSON: [`compliance-signoffs.schema.md`](./compliance-signoffs.schema.md).
- Alle `lineId`-Werte und erlaubte Suffixe: [`scripts/compliance-signoffs-shared.mjs`](../scripts/compliance-signoffs-shared.mjs).

## CI

[`package.json`](../package.json) `verify:ci` enthält `validate:compliance-signoffs`. Ein ungültiges Ledger bricht die Pipeline ab.
