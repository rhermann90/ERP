# Freigabe-Ledger (`compliance-signoffs.json`)

Maschinelle Brücke zwischen einem **genehmigten Freigabe-Tool** (menschl. StB / DSB / Release-Owner; im JSON-Ledger-Kürzel historisch **`PL`**) und den Checkbox-/Suffix-Zeilen in der **technischen Ledger-Datei** [`compliance-rechnung-finanz.ledger.md`](./compliance-rechnung-finanz.ledger.md). Das **druckbare Begleitblatt** für Menschen ist [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md) — gleiche Themen und Nummerierung (A.1 … G.6), aber **ohne** HTML-Marker.

Siehe [`prompts-agents-compliance-abarbeitung.md`](./prompts-agents-compliance-abarbeitung.md) → **Hybrid-Freigabe (Ledger)**.

## Dateien

| Datei | Zweck |
|-------|--------|
| [`compliance-signoffs.schema.json`](./compliance-signoffs.schema.json) | JSON Schema (Editor + Dokumentation der Felder) |
| [`compliance-signoffs.json`](./compliance-signoffs.json) | Aktuelles Ledger (kann leer sein: `"signoffs": []`) |
| [`compliance-signoffs.example.json`](./compliance-signoffs.example.json) | Nur Beispiel — **nicht** produktiv verwenden |
| [`compliance-rechnung-finanz.ledger.md`](./compliance-rechnung-finanz.ledger.md) | Maschinelle Checkbox-Zeilen mit `<!-- compliance-line: chk-… -->` |
| [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md) | Markdown mit Narrativ + **dieselben** `chk-*`-Marker wie Ledger; Apply aktualisiert Ledger **und** diese Datei |
| [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md) | Druckbares Begleitblatt (Freigabetabellen von Hand) |
| [`compliance-freigabe-runbook.md`](./compliance-freigabe-runbook.md) | Ablauf Wer/Wie: Protokoll → Ledger → validate/apply |

## Druck vs. Ledger — Pflegehinweis

Bei inhaltlicher Änderung eines Prüfpunkts **Begleitblatt**, **Ledger** und die **Marker-Anlage** in `compliance-rechnung-finanz-filled.md` (Identität der `chk-*`-Zeilen zum Ledger) sowie die Map `LINE_ALLOWED_SUFFIXES` in [`scripts/compliance-signoffs-shared.mjs`](../scripts/compliance-signoffs-shared.mjs) konsistent halten.

**PR-/Review-Kurzcheck:** Zählen die Überschriften **A.n … G.n** im Begleitblatt weiterhin 1:1 zu den **`chk-*`-Markern** im Ledger (**54** Zeilen; Finanz-Scope nur Mandanten→Endkunden, **ADR 0012**)? Sind die Kopier-Prompts in [`prompts-agents-compliance-abarbeitung.md`](./prompts-agents-compliance-abarbeitung.md) noch passend, wenn sich die **Teil**-Struktur ändert?

## Stabile `lineId`-Konvention

Marker haben das Format `chk-<teil><nr>` und entsprechen den Blöcken **Teil A–G** im Begleitblatt (z. B. `chk-a01` … `chk-a09`, `chk-b01` … `chk-b11`, … `chk-g06`). **54** Zeilen — kanonische erlaubte Suffixe je ID nur im Shared-Skript (`LINE_ALLOWED_SUFFIXES`), nicht als Duplikat-Tabelle hier gepflegt.

## Beispiel-JSON (Platzhalter)

```json
{
  "$schema": "./compliance-signoffs.schema.json",
  "signoffs": [
    {
      "lineId": "chk-a02",
      "suffix": "StB",
      "isoDate": "2026-06-10",
      "evidenceRef": "INTERNAL-STB-MANDANTEN-ENDKUNDEN-KETTE",
      "approvalId": "opaque-tool-ref-optional"
    },
    {
      "lineId": "chk-c05",
      "suffix": "StB+DSB+PL",
      "isoDate": "2026-06-12",
      "evidenceRef": "INTERNAL-5C-ABSCHLUSSSESSION"
    }
  ]
}
```

## Felder pro Eintrag (`signoffs[]`)

| Feld | Pflicht | Format / Regel |
|------|---------|------------------|
| `lineId` | ja | Entspricht `<!-- compliance-line: lineId -->` in **`compliance-rechnung-finanz.ledger.md`** (`^[a-z0-9-]+$`). |
| `suffix` | ja | Nur Werte aus der **globalen Allowlist** (siehe unten). |
| `isoDate` | ja | `YYYY-MM-DD`, gültiges Kalenderdatum. |
| `evidenceRef` | ja | Interner Nachweis (z. B. `INT-1234`), ≥ 2 Zeichen, **keine** erfundenen URLs. |
| `approvalId` / `token` | nein | Opaque Referenz aus dem Freigabe-Tool. |

Mehrere Einträge **dieselbe** `lineId` sind erlaubt, wenn die Zeile mehrere datierte Suffixe braucht (z. B. `StB` und `PL+DSB` bei einem gemeinsamen Prüfpunkt). Pro Paar `(lineId, suffix)` ist höchstens **ein** Datum erlaubt.

## Befüllung bei echten Nachweisen

[`compliance-signoffs.json`](./compliance-signoffs.json) darf **`"signoffs": []`** bleiben, bis echte Freigaben mit intern nachziehbarem Nachweis existieren — **keine** fingierten `evidenceRef`- oder Datums-Einträge ins Repo.

**Vor jedem neuen oder geänderten Eintrag prüfen (Quellen):**

| Prüfpunkt | Wo |
|-----------|-----|
| Erlaubter `suffix` für die gewählte `lineId` | [`scripts/compliance-signoffs-shared.mjs`](../scripts/compliance-signoffs-shared.mjs) → `LINE_ALLOWED_SUFFIXES` |
| Feldregeln und globale Suffix-Enum | [`compliance-signoffs.schema.json`](./compliance-signoffs.schema.json) |
| Protokoll → JSON → validate/apply; Form von `evidenceRef` | [`compliance-freigabe-runbook.md`](./compliance-freigabe-runbook.md) |
| `lineId` stimmt mit Marker im Ledger überein | Zeile `<!-- compliance-line: … -->` unmittelbar **über** der Checkbox in [`compliance-rechnung-finanz.ledger.md`](./compliance-rechnung-finanz.ledger.md) (Spiegel: [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md)) |
| Inhaltliche Zuordnung Teil A–G zu `chk-*` | [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md) (Begleitblatt; menschliche Tabellen **von Hand**) |

**Pro dokumentiertem Nachweis genau ein JSON-Objekt mit:** `lineId`, `suffix` (muss für diese ID in `LINE_ALLOWED_SUFFIXES` erlaubt sein), `isoDate` (`YYYY-MM-DD`), `evidenceRef` (intern, ≥ 2 Zeichen); optional `approvalId` / `token`.

**Nach Ergänzung der Datei:** `npm run validate:compliance-signoffs` → bei Erfolg `npm run apply:compliance-signoffs` (Dry-Run) → `npm run apply:compliance-signoffs:apply`.

**Hinweise:** Die Reihenfolge der Objekte im Array ist für Validator und Apply **egal**. Es besteht **keine** Pflicht, alle **54** Marker-Zeilen zu befüllen — nicht erwähnte Zeilen bleiben unverändert (`[ ]` ohne neue Suffix-Blöcke). Das **druckbare** Begleitblatt wird durch Apply **nicht** geändert; bei Mandanten-Go ggf. parallel zu internen Nachweisen pflegen.

## Globale Suffix-Allowlist

Exakt diese Zeichenketten (wie in der Abhaken-Konvention):

- `PL`
- `StB`
- `DSB`
- `PL+DSB`
- `StB+DSB`
- `StB+DSB+PL`

## Erlaubte Suffixe je `lineId` (Validator)

Kanonisch und vollständig in [`scripts/compliance-signoffs-shared.mjs`](../scripts/compliance-signoffs-shared.mjs) (`LINE_ALLOWED_SUFFIXES`). Bei neuen Markern: Ledger-Datei, diese Map und das Begleitblatt abstimmen.

## Skripte

- **Validierung:** `npm run validate:compliance-signoffs`
- **Anwendung:** `npm run apply:compliance-signoffs` (Dry-Run) / `npm run apply:compliance-signoffs:apply` (schreibt **`compliance-rechnung-finanz.ledger.md`** und **`compliance-rechnung-finanz-filled.md`**)

Das Anwendungs-Skript setzt die Checkbox auf `[x]` und hängt fehlende Blöcke ` — **YYYY-MM-DD · suffix**` idempotent an — es entfernt **keine** bestehenden manuellen Suffixe.

## Repo vs. lokal

Ob das Ledger **mitcommittet** wird oder lokal/gitignored bleibt, ist eine **Team-Entscheidung**. Bei mitcommittetem Ledger kann CI die Validierung durchsetzen.
