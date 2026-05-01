# Decision Table - Phase 1 Open Options

| Entscheidung | Optionen | Gewaehlt | Verworfen | Begruendung / Trade-off |
| --- | --- | --- | --- | --- |
| Angebots-Aenderungen (Lebenszyklus) | A) Nach `VERSENDET` sofort fixiert; Korrektur nur neue Version/Nachtrag<br>B) `ENTWURF` und `VERSENDET` (ohne Annahme) anpassbar; ab `ANGENOMMEN` ausschliesslich Nachtrag | **B** | A | Entspricht `../../ERP-Systembeschreibung.md` (§-Struktur wie Archiv v1.2). Trade-off: Weicht von einer strikten „Versand fixiert alles“-Lesart ab; dafuer fachlich gewollte Nachbearbeitung bis zur Annahme. Rechtliche Bindung nach Zugang beim Kunden bleibt mandanten-/vertragsspezifisch (vgl. Annahme Abschnitt 16 in v1.2). |
| Kritische AuthZ-Absicherung | A) Nur AuthN Token<br>B) AuthN + rollenbasierte Aktionspruefung je Endpoint | **B** | A | Verhindert Ausfuehrung kritischer Aktionen trotz gueltiger Identitaet ohne Rolle. Trade-off: zusaetzliche Policy-Pflege bei Rollen-/Statusaenderungen. |
| UI-Aktionsquelle | A) UI leitet erlaubte Aktionen lokal ab<br>B) Backend liefert `allowedActions` als SoT | **B** | A | Keine Fachlogikduplikation im UI und konsistente Regeln ueber Clients. Trade-off: zusaetzlicher Endpoint/Abfrageaufwand. |
| Audit-Leserollen | A) Alle authentifizierten Nutzer<br>B) Least privilege (`ADMIN`,`BUCHHALTUNG`,`GESCHAEFTSFUEHRUNG`) | **B** | A | DSGVO-Minimierung und Need-to-know-Prinzip. Trade-off: weniger operative Einsicht fuer Fachrollen ohne Auditauftrag. |
| Audit-Feldtiefe | A) Vollzustand (`beforeState`/`afterState`)<br>B) Minimierte Sicht fuer Read-API | **B** | A | Datenschutz und reduzierte Angriffsoberflaeche. Vollstaendige Daten bleiben intern gespeichert, Read-API liefert minimierte Sicht. |
| Exportpolitik Entwurf/Format-Matrix | A) Soft fail (Warnungen)<br>B) Fail-closed + Entity/Format-Matrix | **B** | A | Rechtsrelevante Exporte muessen hart geblockt werden, wenn Regeln nicht erfuellt sind. Trade-off: mehr Preflight-Fehler in fruehen Prozessstadien. |
