# Runbook — Cursor Fact-Forcing Gate (GateGuard) und Agent-Schreibzugriffe

**Zweck:** Einheitlicher Umgang, wenn Cursor-Agenten **`Write`** / **`StrReplace`** mit **`[Fact-Forcing Gate]`** blockiert werden — **Retry mit Fakten** statt stiller Umgehung per Shell/Python.

**Hintergrund:** Dieses Repository enthält **keine** GateGuard-Konfiguration unter [`.cursor/`](../../.cursor/). Die Meldung stammt typischerweise von **lokalen oder globalen Hooks** (z. B. ECC, Cursor Hooks) mit Namen wie `pre:edit-write:gateguard-fact-force` sowie Umgebungsvariablen wie `ECC_GATEGUARD`, `ECC_DISABLED_HOOKS`.

### Team-Empfehlung (Risiko vs. Fluss)

| Priorität | Vorgehen |
|-----------|----------|
| **1 — Standard** | **Streng:** Gate bleibt aktiv; Agent liefert **Fakten-Turn** und wiederholt `Write`/`StrReplace` (Spur A). Gilt für **Produktcode** und **sensible Pfade** überall. |
| **2 — Doku-Fluss (empfohlen, sofern Hook unterstützt)** | **Pfad-Whitelist** nur für Low-Risk-Text: z. B. `docs/**/*.md`, [`AGENTS.md`](../../AGENTS.md), [`.cursor/rules/*.mdc`](../../.cursor/rules/) — damit entfällt häufig die Shell bei **neuen** Markdown-Dateien, ohne `ECC_GATEGUARD=off` global zu nutzen. Konfiguration **lokal** nach ECC-/Cursor-Doku des Hooks; nicht ins Repo committen, sofern keine teamweite `hooks.json`-Policy beschlossen wird. |
| **3 — Nur Ausnahme** | **`ECC_GATEGUARD=off`** oder Hook in **`ECC_DISABLED_HOOKS`** nur für **kurze** lokale Sessions (Doku-Batch/Repair), mit **Team-Wissen** — nicht als Dauerzustand. |

**Offene Frage geschlossen:** Es gibt **keine** Pflicht zur globalen Whitelist; die **empfohlene** Entscheidung für dieses Repo ist: **Streng für Code**, für **reine Doku/Markdown-Pfade** optional **Whitelist**, wenn euer Hook das anbietet — sonst bei Blockade **Fakten + Retry**, danach **Shell nur mit PR-Hinweis** (Spur A, Punkt 4).

---

## Spur A — Agenten-Workflow (Standard)

1. **Blockade lesen:** Die Meldung verlangt u. a. Aufrufer/Referenzen, „kein Duplikat“, Datenformat (bei reiner Doku oft **n. z.**), Nutzeranweisung.
2. **Fakten in der Antwort formulieren** — in derselben Konversation, **bevor** erneut geschrieben wird.
3. **`Write` oder `StrReplace` wiederholen** mit derselben Zieloperation (nicht sofort Shell).
4. **Ausnahme Shell/Python:** Nur wenn nach **mindestens einem** Retry mit ausformulierten Fakten die Blockade **weiterhin** besteht — und **bevorzugt nur** für **Markdown/Doku** (`docs/**`, `AGENTS.md`, `.cursor/rules/*.mdc`). Im PR kurz vermerken: *GateGuard-Retry mit Fakten fehlgeschlagen — Inhalt geprüft.*
5. **Recovery aus der Meldung** (`ECC_GATEGUARD=off`, Hook in `ECC_DISABLED_HOOKS`): nur für **gezielte** lokale Reparatur- oder Doku-Sessions, **nicht** als Dauerzustand ohne Teamabsprache — zu breites Abschalten erhöht das Risiko ungeprüfter Dateianlage.

**Neue Dateien:** Häufig blockiert das Gate **`Write`** auf noch nicht existierende Pfade stärker als **`StrReplace`** auf bestehende. Reihenfolge: (1) Fakten liefern und `Write` wiederholen — (2) falls weiter blockiert: gleicher Inhalt per dokumentierter **Shell-/Python-Ausnahme** nur unter `docs/**` / `AGENTS.md` / `.cursor/rules/**` mit PR-Vermerk — (3) mittelfristig **Whitelist** (siehe Team-Empfehlung oben), um (2) zu vermeiden.

---

## Risiken und Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|--------|----------------|
| Ungeprüfte Dateien durch dauerhaft deaktiviertes Gate | Kein globales `ECC_GATEGUARD=off`; nur Whitelist für Doku-Pfade oder zeitlich begrenzte Sessions. |
| Shell-Schreiben ohne Review | PR-Kommentar „GateGuard: Shell nach Fakten-Retry“; Reviewer prüft Diff wie jeden anderen. |
| Uneinheitliches Verhalten im Team | Eintrag im internen Wiki (ein Satz): gewählte Strategie **Streng** / **Whitelist-Doku** / **Dev-only**. |

---

## Spur B — Lokale Konfiguration (auf dem Entwickler-Rechner)

Diese Schritte werden **nicht** ins Repo committet (außer das Team führt später **projektweite** Cursor-Hooks ein).

| Schritt | Aktion |
|--------|--------|
| 1 | **Hook-Quelle finden:** Cursor-Einstellungen → Hooks; ECC-Doku; oder Suche nach `gateguard`, `fact-force`, `ECC_GATEGUARD` in User-Konfigurationspfaden. |
| 2 | **Strategie wählen:** **Streng** **oder** **Entlastung Doku** (Whitelist: `docs/**/*.md`, `docs/runbook/**`, [`AGENTS.md`](../../AGENTS.md), [`.cursor/rules/*.mdc`](../../.cursor/rules/) — nur wenn der Hook Pfadmuster unterstützt) **oder** **Dev-only** (`ECC_GATEGUARD=off` / `ECC_DISABLED_HOOKS` nur für lokale Batches). Siehe **Team-Empfehlung** oben. |
| 3 | **Teamabgleich:** Im Wiki/Chat einmalig festhalten: *„ERP 2.0 — GateGuard: [ Streng \| Whitelist-Doku \| Dev-only kurz ]“* — vermeidet uneinheitliches Umgehen des Gates. |

---

## Verifikation (nach Konfigurationsänderung)

- **Lokal:** Kleine Änderung an einer bestehenden Datei unter `docs/` ausschließlich mit **`StrReplace`** oder **`Write`** aus dem Agenten; **ohne** `cat`/`python` zur Dateierzeugung.
- **Erwartung:** Nach einem Turn mit den geforderten Fakten soll der Schreibpfad durchgehen **oder** die Hook-Konfiguration (Spur B) ist nachvollziehbar angepasst.

**Stand dieses Runbooks:** siehe Git-Historie dieser Datei.

**Verweise:** [`AGENTS.md`](../../AGENTS.md) (Cursor/Fact-Forcing Gate), [`docs/runbook/ci-and-persistence-tests.md`](./ci-and-persistence-tests.md) (Querschnitt QA).
