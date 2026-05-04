# FIN-2 — Nächstes Teilprojekt (Reihenfolge ohne Parallel-Gates)

**Status:** beschlossen für Repo-Umsetzung (Micro-Schritte Finanz-MVP).  
**Zweck:** Vor Arbeit an **8.4(2–6)-Motor**, **Pfad C** (GEPRÜFT/FREIGEGEBEN) oder **LV→Rechnung-E2E** genau **ein** Teilprojekt prioritär fahren — keine Vermischung ohne dokumentiertes Gate ([`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md) Non-Goals).

## Festgelegte Reihenfolge

| Priorität | Teilprojekt | Begründung |
|-----------|-------------|------------|
| **1** | **LV→Rechnung Traceability Lesepfad / Nachweis** | Geringste Domänenrisiken: bestehende APIs (`GET /invoices/{id}`, Shell, E2E) um konsistente **lvVersionId**-/Ketten-Sichtbarkeit und Regressionstests erweitern — Vorbereitung für echte Phase-2-Einspeisung ohne neuen 8.4-Motor. |
| **2** | **8.4(2–6)-Motor** (über B2-1a/Skonto hinaus) | Nur nach Priorität 1 und separatem Scope/Gate; ADR-0007 Non-Goals beachten. |
| **3** | **Pfad C** — Zwischenstatus GEPRÜFT/FREIGEGEBEN | ADR-0007 §8 (Variante B); eigenes Gate und API-Automat — nicht parallel zu Priorität 2 mischen. |

## Review-Anker

- [`FIN-2-START-GATE.md`](./FIN-2-START-GATE.md) — relevante **G1–G10** je nach Teilprojekt.  
- [`MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) Teil 7 Master-Tabelle FIN-2.

## Änderung der Reihenfolge

Nur durch Team-Beschluss und Aktualisierung **dieser** Datei (PR mit Begründung).
