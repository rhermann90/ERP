# Checkliste: Rechnung & Finanz — Rechts- und Digitalrahmen (Ergänzung zur Software)

**Zweck:** Strukturierte Vorbereitung auf **Produktiv-Go**; **keine** Rechts- oder Steuerberatung. Abhaken nur nach **fachlicher** Klärung (intern/extern).

**Bezug Repo:** Integrationsstand und explizites Nicht-Ziel „GoBD-/Compliance-Abschluss ohne separates Release-GO“ siehe [`README.md`](../README.md); Produktions-Gate siehe u. a. [`docs/contracts/qa-report-persistence-increment-2.md`](../docs/contracts/qa-report-persistence-increment-2.md); Finanzgrenzen [`docs/adr/0007-finance-persistence-and-invoice-boundaries.md`](../docs/adr/0007-finance-persistence-and-invoice-boundaries.md).

**CI ≠ Mandanten-Go / ≠ fachliche Freigabe:** Grüne GitHub-Actions-Jobs (**`backend`**, **`e2e-smoke`** am PR-Head) belegen nur **technische** Integrität ([`docs/contracts/qa-fin-0-gate-readiness.md`](../docs/contracts/qa-fin-0-gate-readiness.md) §5a). Sie **ersetzen keine** Abhakungen in dieser Checkliste und **keine** PL-/StB-/DSB-Freigaben — siehe [`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](../docs/runbooks/m4-slice-5c-pl-mandanten-go.md) (Abschnitt „Grenzen“).

---

## 0) Scope & Rollen

- [ ] **Zielklarheit:** Nur B2B, B2G, B2C oder Mischform — jeweils andere Pflichten (z. B. E-Rechnung, Informationspflichten).
- [ ] **Verantwortlichkeiten:** Wer trägt fachliche Freigabe (PL), wer Steuer (StB), wer Datenschutz (DSB), wer IT-Sicherheit?
- [ ] **Release-GO:** Schriftliches Dokument „Produktiv-Go Finanz/Rechnung“ mit Datum, Version, Geltungsmandanten — getrennt vom reinen Software-Merge.

---

## 1) UStG (Rechnungsinhalt & Steuerlogik)

- [ ] **Pflichtangaben auf der Rechnung** (§ 14 UStG i. d. R.): vollständige Liste gegen Mustertext / StB geprüft; USt-IdNr., Ausstellungsdatum, fortlaufende Rechnungsnummer, Leistungszeitpunkt o. a. nach Vorgabe.
- [ ] **Steuersätze / -arten:** Standard-USt reicht nicht für alle Mandanten — **§19 UStG**, **§13b**, **Reverse Charge**, **Bauleistungen** u. a. gemäß Spez **8.16** / Roadmap **FIN-5** modelliert und getestet (kein stiller Fallback auf 19 %).
- [ ] **Brutto/Netto/Rundung:** Serverseitige **8.12**-Reihenfolge dokumentiert; Regressionstests für Randbeträge (Cent-Grenzen).
- [ ] **Korrekturbelege:** Storno/Gutschrift/Differenzbuchung (Spez **8.2** / **8.6**) fachlich und im UI/API nachvollziehbar; keine „stille“ Löschung gebuchter Daten.
- [ ] **Leistungsbeschreibung:** Pflicht zur ausreichenden Bestimmtheit der Leistung — kommt aus LV/Positionen/Angebot konsistent?

---

## 2) HGB / AO (Belege, Buchführung, Aufzeichnungen)

- [ ] **Belegkette:** LV → Aufmass → Angebot → Rechnung → Zahlung → ggf. Mahnung; **Traceability** fail-closed wie in Gate/Tests vorgesehen.
- [ ] **FIN-4 / Mahn-E-Mail — Impressum-Stammdaten (`GET /finance/dunning-email-footer`):** Abgleich mit **Rechtsform** des Mandanten (z. B. GmbH, UG, Einzelunternehmen, Freiberufler): welche Angaben sind **geschäftsbriefrechtlich** nötig (Vertretung, Register, USt-Id …)? **Nicht** allein auf `readyForEmailFooter` oder `impressumComplianceTier: EXTENDED` im Produkt verlassen — das sind **heuristische** Hilfen.
- [ ] **FIN-4 / Handelsregister & USt:** Wo Registerangaben oder USt-Id **fachlich** Pflicht sind: Stammdaten im System vollständig und mit StB/PL abgestimmt; dokumentierte Freigabe vor produktivem Mahn-E-Mail-Versand.
- [ ] **FIN-4 / Mahntexte & Footer:** Mahn-Vorlagen (§8.10 Platzhalter) und **System-Footer**-Stammdaten inhaltlich freigegeben (getrennte Prüfung möglich); kein Go-Live ohne dokumentierte **fachliche** Freigabe der relevanten Texte.
- [ ] **FIN-4 / Massen-E-Mail Mahnwesen (M4 Slice 5c):** technische Spezifikation und Betrieb mit **StB / DSB / PL** vor produktivem Versand **punktweise** abgleichen (nicht nur „Endpoint existiert“) — Repo-Spezifikation [`docs/tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md`](../docs/tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md); **PL-Session-Anker** [`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](../docs/runbooks/m4-slice-5c-pl-mandanten-go.md): u. a. `POST /finance/dunning-reminder-run/send-emails` (**`DRY_RUN`** vs **`EXECUTE`**), bei **`EXECUTE`** verpflichtendes **`confirmBatchSend: true`**, **PWA-Bestätigungsdialog** vor Aufruf, **Idempotenz** je Nachricht (wie 5a), **SMTP** und Mandanten-Isolation, **Rate-Limit** und maximale Batch-Größe gemäß Spec-Abschnitt **Implementationsanker** in derselben Datei (kanonischer Wert und Code-Ort; **kein** Modulpfad in dieser Checkliste — Pflege bei Refactors nur in Spec + Code), **Teilfehler**/`results[]` ohne transaktionalen Rollback bereits gesendeter Mails, Verhalten bei **`runMode: OFF`** (**409**). Querschnitt: [`docs/contracts/qa-fin-0-gate-readiness.md`](../docs/contracts/qa-fin-0-gate-readiness.md) §0 — kein stiller Massenversand. Kein Ersatz für diese Checkliste.
- [ ] **Unveränderbarkeit gebuchter Rechnungen:** Technisch und fachlich durchgesetzt (kein Edit nach „gebucht“ außer definierten Folgevorgängen).
- [ ] **Vollständigkeit:** Keine Lücken in fortlaufenden Nummernkreisen ohne dokumentierte Ursache/Storno.
- [ ] **Aufbewahrung & Auffindbarkeit:** Wo liegen Rechnungs-PDF/XML, wie lange, welches Format, welche Indexierung (Suche nach Nummer, Datum, Mandant)?
- [ ] **AO-Zusammenhang:** Betrifft StGB, GoBG Konformität, Verfahrensdokumentation und Betriebsprüfungen. Rechnung muss nach HGB vollständig, richtig und nachvollziehbar sein, die AO fordert zusätzlich Unveränderbarkeit (keine Stillen Änderungen), Protokollierung (Änderungs-Logs), Aufbewahrung (6 bzw. 10 Jahre) und maschinelle Auswertbarkeit.

---

## 3) GoBD (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen)

- [ ] **Unveränderbarkeit / Nachvollziehbarkeit:** Audit-Events zu relevanten Mutationen; keine unbemerkten Änderungen an Buchungsgrundlagen.
- [ ] **Eingangs-/Bearbeitungsprotokolle:** Wer hat wann gebucht/freigegeben (nicht nur technisch, auch organisatorisch nachweisbar)?
- [ ] **Zeitbezug:** Einheitliche Zeitzone, Nachvollziehbarkeit von „wann wurde was gebucht“.
- [ ] **Zugriffskontrolle:** Rollenmodell (Least Privilege) zur Spez passend; regelmäßige Zugriffsreviews.
- [ ] **Verfahrensdokumentation:** Kurzbeschreibung „wie entsteht eine Rechnung in diesem System“ inkl. Ausnahmen und Fehlercodes.
- [ ] **GoBD-Test / Zertifizierung:** Zertifizierung seitens Behörden nicht möglich. Softwarehersteller zertifiziert selbst die GoBD-Konformität. Eigene Zertifizierung nach Konformitätsprüfung nach Fertigstellung der Software.

---

## 4) E-Rechnung (XRechnung / EN 16931 / Übergabe)

- [ ] **Rechtlicher Anwendungsfall:** B2B ab 2025-01-01 (Übergangsfristen beachten), B2G nach Behördenanforderung — **welche Profile** (XRechnung-Version, Extension)?
- [ ] **Pflichtfelder-Matrix:** Abgleich Stammdaten (Käufer/Verkäufer, USt-Id, Bank, Leitweg-ID o. ä.) mit eurem Datenmodell.
- [ ] **Steuersemantik in XML:** Übereinstimmung mit **UStG**-Ausweis (Kategorien, Befreiungen, Steuerschuldnerschaft) — keine Diskrepanz zu PDF/HTML.
- [ ] **Signatur / Übermittlung:** Falls vorgeschrieben oder gewünscht — Verfahren, Schlüssel, Archivierung der eingereichten Datei + Quittung.
- [ ] **Regression:** Golden-File-Tests oder Validator-Pipeline (offizielle Tools / Drittanbieter) in CI oder Release-Pipeline.

---

## 5) DSGVO

- [ ] **Verzeichnis von Verarbeitungstätigkeiten:** Rechnungs- und Zahlungsdaten, Audit-Logs, Exporte, E-Mail-Versand — bei **M4 Slice 5c (Massen-Mahn-E-Mail)** explizit: Versand mit **vom Anwender gesetzter** Empfänger-Adresse je Zeile (`toEmail`, keine stille Kundenstamm-Ableitung), Batch-Ausführung, SMTP-/Provider-Protokolle; Abgleich mit **Abschnitt 2** (Punkt Massen-E-Mail 5c) und [`M4-BATCH-DUNNING-EMAIL-SPEC.md`](../docs/tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md).
- [ ] **Zweckbindung & Minimierung:** Welche Felder in welchem UI/API-Layer (vgl. minimierte Audit-Lesepfade im Repo).
- [ ] **Aufbewahrung vs. Löschung:** Konfliktfälle (Handels-/Steuerrecht vs. Löschrechte) mit StB/DSB dokumentiert.
- [ ] **Auskunft / Datenportabilität:** Welche Daten werden herausgegeben, in welchem Format, welche Fristen?
- [ ] **Unterauftragsverarbeiter:** Hosting, E-Mail, Archiv, ggf. E-Rechnung-Dienstleister — AV-Verträge vorhanden; für **produktiven** Mahn-**Massen**-Versand (5c) den genutzten **SMTP-/E-Mail-Provider** und etwaige Weiterleitungen gesondert benennen und mit DSB/PL freigeben (siehe **Abschnitt 2**, 5c).
- [ ] **TOM:** Verschlüsselung, Backups, Zugriff Produktion, Incident-Response für Finanzdaten.

---

## 6) Software- und Release-Bezug (Repo-intern)

- [ ] **README-Position** verstanden: Integrationsbasis ≠ GoBD-Abschluss ohne separates GO.
- [ ] **QA-Gate „Produktions-ERP“:** Bewusst **NO_GO** bis Roadmap/Artefakte erfüllt — kein implizites Go durch einzelne Features.
- [ ] **FIN-Phasen:** FIN-2 (Kern Rechnung/8.4), FIN-3 (Zahlung), FIN-4 (Mahnung), FIN-5 (Steuer-Sonderfälle), FIN-6 (Härtung **8.14**/Abnahme) — Abnahme **§15** aus Systembeschreibung mit Referenztests.
- [ ] **Offene Follow-ups:** Audit/Transaktionen (`docs/tickets/FOLLOWUP-*`), LV-Löschen mit abhängigen Angeboten — vor Go prüfen. **Mahn-UX / Finanz-Vorbereitung (PWA):** Ticket [`docs/tickets/FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md`](../docs/tickets/FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md) — Hash/Routing-Zielbild laut Ticket **erledigt**; verbleibende organisatorische Schärfungen (z. B. Rollenmatrix, Navigation) nur nach **PL** und bei Bedarf vor Mandanten-Go erneut bestätigen.

---

## 7) Abschluss vor Produktiv-Start (Sammelkriterium)

- [ ] Alle Punkte in **0–6** mit **Verweis** (Ticket, ADR, Testname, Prozessdokument) belegt oder explizit als „nicht im Scope“ mit Risikoakzeptanz der PL.
- [ ] **Steuerberater-Freigabe** für Rechnungslayout inkl. Sonderfälle und E-Rechnung-Sample.
- [ ] **DSB-Stellungnahme** zu Zahlungs- und Rechnungsdaten (mindestens Kurzcheck).
- [ ] **Pilotmandant** mit begrenztem Umfang und Monitoring-Plan.

---

## Team-Dokumentation (nach fachlicher Bearbeitung)

Nach Durcharbeitung mit **StB / DSB / PL:** Kurz **Datum**, **Ergebnis** (z. B. Freigabe mit Einschränkung / offene Punkte) und **Verweis** auf das interne Protokoll oder Wiki festhalten — **nicht** durch automatisierte Agenten-Sessions; **keine** Platzhalter-URLs im Repo als Ersatz für echte Nachweise.

---

*Checkliste als Ergänzung zur Software-Roadmap, nicht als Ersatz für externe Prüfung.*
