# FIN-5 — Team-Gate vor Implementierung (Abschnitt 8.16 vs. Fail-Closed)

**Status:** offen — ausfüllen durch **Produkt / Steuer-Fach / Release** (kein Agent-Ersatz).

**Zweck:** FIN-5 ([`docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) Teil 3, Meilenstein **M5**) darf erst als **Spur B** im Repo starten, wenn diese Entscheidung **schriftlich** hier oder in einem verlinkten ADR/Protokoll festgehalten ist.

**Domänenquelle:** [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) — Steuerlogik und EUR-Pfad (**8.16**), USt (**8.11**); ADR-0007 verweist auf späteres FIN-5-Flag ([`docs/tickets/FIN-2-START-GATE.md`](./FIN-2-START-GATE.md) Nachweis-Spalte zu **8.16**).

## Entscheidung (eine Option auswählen und begründen)

| Option | Bedeutung | Folge im Repo |
|--------|-----------|----------------|
| **A — Sonderfall aktiv (MVP-Subset)** | Genau **ein** ausgewählter Steuer-Sonderfall aus **8.16** soll produktiv werden | Feature-Flag + Domäne/OpenAPI/Tests laut MVP Teil 3; Export-Preflight ohne stillen Fallback auf Standard-USt |
| **B — Fail-Closed** | Kein produktiver Sonderfall bis zur nächsten expliziten Freigabe | Relevante Pfade bleiben **nicht aktivierbar** oder liefern dokumentiert **fail-closed**; Entscheidung im **ADR** festhalten |

**Gewählte Option (Team):** …

**Kurzbegründung / Risiko:** …

**Referenz Protokoll oder ADR (URL oder Repo-Pfad, nur echte Einträge — keine Platzhalter-URLs durch Agenten):** …

## Nach der Entscheidung (Maintainer)

1. In [`docs/plans/nächste-schritte.md`](../plans/nächste-schritte.md) die Zeile **„Gewählte Spur (Team)“** auf **B** setzen und ersten FIN-5-PR mit Scope/Ticket/ADR verknüpfen.
2. Bei Option **B:** neuen oder bestehenden ADR ergänzen (Fail-Closed-Umfang, welche APIs/UI betroffen sind).

## Verwandte Artefakte (ohne Misch-PR)

- Strategischer Kontext: [`docs/plans/nächste-schritte.md`](../plans/nächste-schritte.md) — Abschnitt **„Große Meilensteine“** / FIN-5.
- Nach FIN-5: FIN-6 und Querschnitte nur als **eigene** Epochen — [`docs/plans/roadmap-fertige-app.md`](../plans/roadmap-fertige-app.md) Phase D, [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md), [`B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md`](./B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md).
