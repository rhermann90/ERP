# UAT — Evidenz und Abweichungsprotokoll

**Zweck:** Einheitliche Dokumentation von Ergebnissen für Abgleich mit **Gate §15** ([`qa-fin-mvp-gate-15-abnahme.md`](../contracts/qa-fin-mvp-gate-15-abnahme.md)) und dem **Pilot-Charter** ([`PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md`](../tickets/PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md)).

## Pro Lauf festhalten

| Feld | Inhalt |
|------|--------|
| Datum / Uhrzeit (Zeitzone) | |
| Tester | |
| Umgebung | Link zur PWA und API aus [`uat-one-pager-template.md`](./uat-one-pager-template.md) |
| Rolle | Admin / Viewer |
| Browser / Version | |

## Pro Abweichung oder Defekt

| Feld | Inhalt |
|------|--------|
| ID | fortlaufend PR-JIRA-… |
| Schritt | Referenz auf [`uat-manual-test-script.md`](./uat-manual-test-script.md) (z. B. Session 4.2) |
| Erwartung | Kurz |
| Ist-Verhalten | Kurz |
| Screenshot / Anhang | ja/nein + Dateiname |
| API-Korrelations-ID | falls im Fehlerdialog angezeigt |
| Schwere | Blocker / Major / Minor / Trivial |

## Abgleich mit Repo-Gates (optional)

- **Technischer RC-Nachweis:** Team liefert Referenz auf erfüllte Kommandos aus [`qa-fin-mvp-gate-15-abnahme.md`](../contracts/qa-fin-mvp-gate-15-abnahme.md).
- **Pilot-Umfang:** Kein erzwungenes Projekt-/Kunden-CRUD in der PWA — wenn „fehlend“, gegen Charter prüfen statt als Bug zu klassifizieren.
- **FIN-6 / Logging:** Datenschutz-relevante Logs — siehe [`fin6-logging-privacy-814.md`](../contracts/fin6-logging-privacy-814.md).

## Nach UAT

Ergebnis zusammenfassen: **GO** / **GO mit Einschränkungen** / **NO-GO** mit Blocker-Liste; Übergabe an Produkt/Entwicklung mit Link auf dieses Protokoll und auf den ausgefüllten Ein-Pager.
