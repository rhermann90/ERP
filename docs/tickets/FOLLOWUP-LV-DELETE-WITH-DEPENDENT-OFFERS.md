# FOLLOWUP — LV-Löschfälle bei hängenden Angeboten (FK `ON DELETE RESTRICT`)

**Status:** offen — **fachliche Regel durch Team / Domäne** erforderlich, bevor ein Implementierungs-PR „still“ FKs oder APIs ändert.

## Kontext

Migration `20260414120000_lv_measurement_phase2_persistence` u. a.:

- `offer_versions.lv_version_id` → `lv_versions` (**RESTRICT**),
- `lv_versions` → `lv_catalogs` (**RESTRICT**),
- weitere RESTRICT-/CASCADE-Kombinationen auf dem LV-Baum.

Damit ist ein **DB-seitiges** Löschen einer `lv_versions`-Zeile **abgelehnt**, solange mindestens eine `offer_versions`-Zeile desselben Tenants dieselbe `lv_version_id` referenziert. Es gibt **keinen** stillen technischen Workaround im Sinne von „CASCADE ohne Domänenentscheidung“.

## Warum kein stiller Fix

- Traceability und FIN-2-Start-Gate (**G5**) verlangen eine **verbindliche** LV-Bezugsgröße; ein unbemerktes Löschen oder Umbiegen von FKs würde die Prüfkette unterlaufen.
- v1.3 / ADR-0006: **keine** Vereinfachung der SoT-Regeln.

## Von Team / Domäne zu klären (Beispielfragen)

1. Darf eine **FREIGEGEBENE** LV-Version überhaupt gelöscht werden, wenn noch Angebotsversionen darauf zeigen? (Vermutung: nein.)
2. Ist **Archivierung** statt physischem Delete die kanonische Operation?
3. Welche **Fehlercodes** / HTTP-Status soll eine API zurückgeben, wenn ein Löschversuch durch abhängige `offer_versions` blockiert wird? (Nur nach Contract-Update in `docs/contracts/error-codes.json` — keine Phantom-Codes.)
4. Rolle von **Nachträgen** (`supplement_versions.lv_version_id` perspektivisch): gleiche Regelmatrix?

## Abhängigkeiten

- Nächster Persistenz-Slice (**Nachtrag/Supplement** o. ä.) nach **Ticket-Priorität**; dieser Blocker nur relevant, sobald **LV-Lösch- oder Archivierungs-APIs** produktiv angebunden werden.
- **FIN-2** / **8.4** bleiben bis [`FIN-2-START-GATE.md`](./FIN-2-START-GATE.md) voll erfüllt **out of scope**.

## Nicht-Ziel

- Keine Änderung von `ON DELETE`-Semantik in einer Migration **ohne** ADR-Update und dokumentierter Architektur-/Release-Freigabe.

## Umsetzung (nach Team-/Ticket-Regel)

- **Option A — Implementierung:** sobald Team/Domäne die fachlichen Antworten (Abschnitt „Von Team / Domäne zu klären“) geliefert hat: API/Domain + ggf. Migration **nur** im Scope des genehmigten Tickets; weiterhin **keine** Phantom-Error-Codes.
- **Option B — Technischer Spike:** kurzer Nachweis (z. B. repro-Skript, dokumentierte FK-Fehlermeldungen) **nur** in Ticket/ADR — **ohne** Schemaänderung bis dokumentierter Freigabe.
- Bis dahin: **kein** heimliches Anpassen von FKs/`ON DELETE`.

## Verknuepfung (Betrieb / CI)

- PR-Checkliste Punkt **LV-Löschen / FKs:** [`docs/runbook/ci-and-persistence-tests.md`](docs/runbook/ci-and-persistence-tests.md) (Abschnitt „PR-Checkliste“, letzter Punkt).
