# Begleitblatt: Rechnung, Finanz und Datenschutz (ERP – Mandantenrechnung)

**Markdown-Fassung (UTF-8).** Für Rich-Text/Word kann zusätzlich [`compliance-rechnung-finanz-ausgefüllt.rtf`](./compliance-rechnung-finanz-ausgefüllt.rtf) genutzt werden; inhaltliche Referenz ist diese Datei.

**Dokument für:** Release-Owner, Steuerberatung, Datenschutzbeauftragte, ggf. externer Rechtsrat  
**Version / Stand:** 2026-05-01 — Scope: nur Mandanten-Endkundenrechnungen (Begleitblatt ersetzt keine Rechts-/Steuerberatung; keine GoBD-/HGB-/DSGVO-Zertifizierung durch Software oder Repo).

Siehe auch das druckbare Begleitblatt [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md) und **ADR 0012** (Scope nur Mandant → Endkunde).

---

## Wichtig vorab

Kein Rechts- oder Steuerberatungsdokument und kein Behördenformular. Es strukturiert die Fragen vor produktivem Einsatz von Mandantenrechnungen. Grüne CI-/Techniktests im Repository sind nicht automatisch ein fachliches Mandanten-Go — Abstimmung mit StB/DSB/Release-Owner **vor Mandanten-Go** schriftlich (Entwicklungsphase: [AGENTS.md](../AGENTS.md) Punkt 6).

### Produktumfang (ein finanzrelevanter Belegpfad)

- Nur Rechnungen, Zahlungseingänge und Mahnungen des Mandanten gegenüber seinen Endkunden (Kette LV/Aufmaß/Angebot/Rechnung).
- Keine Modellierung einer Software-/Plattformabrechnung an den Mandanten im ERP (siehe Teil B.9, ADR 0012).

### Rechtlicher Rahmen (Orientierung)

Themenfelder: UStG, HGB, GoBD-Idee, DSGVO, allgemeine StGB-Risikohinweise am Dokumentende — konkrete Auslegung mit StB, DSB, ggf. Rechtsrat.

Die Software ersetzt keine Prüfung durch Steuerberatung oder Datenschutz.

---

## Kurzlexikon

| Begriff | Bedeutung |
|--------|----------|
| PL | Ledger-Kürzel für interne Release-/Freigabe-Owner (nicht „Projektleitung“ als Entwicklungssteuerung) |
| StB | Steuerberatung |
| DSB | Datenschutzbeauftragte/r |
| Rechtsrat | Externe Rechtsberatung (Anwalt), falls eingebunden |
| Mandant | Unternehmen, das das ERP nutzt |
| Externer Zahlungsnachweis | Beleg außerhalb des ERP (z. B. Bank, Zahlungsdienst für Endkunden des Mandanten); nicht gleichbedeutend mit nicht modellierter Plattformabrechnung |

---

## Freigabetabelle (pro Prüfpunkt; nur genannte Rollen ausfüllen)

| Rolle | Datum (TT.MM.JJJJ) | Kürzel / Signatur |
|-------|-------------------|-------------------|
| PL | | |
| StB | | |
| DSB | | |
| Rechtsrat (falls genutzt) | | |

Hinweis: Maschinelle Repo-Nachweise nur, wenn die Rolle wirklich freigegeben hat und intern belegt ist. Checkboxen in der **Anlage** unten werden aus [`compliance-signoffs.json`](./compliance-signoffs.json) per `npm run apply:compliance-signoffs:apply` gesetzt (parallel zu [`compliance-rechnung-finanz.ledger.md`](./compliance-rechnung-finanz.ledger.md)).

---

# Teil A — Vorhaben und Produktiv-Start

## A.1 Zielbild

- B2B (primär), optional B2C/B2G; Zielmärkte DE, AT, CH (Drittland). Keine automatische Gleichbehandlung EU vs. Drittland. Ausfüllen: PL, StB, DSB wo genannt.

## A.2 Belegmodell

Kette LV → Aufmaß → Angebot → Rechnung → Zahlung; Traceability fail-closed vor Buchung (ADR 0007, Systembeschreibung Abschnitt 8).

## A.3 Datenschutz

Zwecke, Zweckbindung, Datenminimierung, Mandantenisolation; VVT intern (Art. 30 DSGVO).

## A.4 Systemabgrenzung

ERP führend für modellierten Pfad; externer Zahlungsnachweis organisatorisch mit StB; DSB bei Auftragsverarbeitung.

## A.5 Rollen

PL/StB/DSB; Namen nur intern.

## A.6 Produktiv-Go

Schriftlich intern (Datum, Version, Geltungsbereich).

## A.7 Stammdaten-Kontext

Land/Geschäftsmodell mit StB/DSB.

## A.8 Rollenmatrix und Eskalation

Organisatorisch vor Go-Live.

## A.9 Vorlage Produktiv-Go

Intern abstimmen; keine erfundenen URLs im Repo.

---

# Teil B — Rechnungen und Umsatzsteuer

Kern: Pflichtangaben (StB), Steuersätze, serverseitige Rundung (8.4/8.12), EUR, Korrekturkonzept — **Ist-Stand Storno:** Status `STORNIERT` im Typenum ohne vollständigen Workflow; Pilot mit StB klären. B.9 Scope Plattform außerhalb (ADR 0012, PL). Matrix je Leistungsart (8.16). USt-Id (StB).

---

# Teil C — Buchführung und Aufbewahrung

Belegkette **mit Aufmaß**; Mahn-Footer C.2; Mahntexte C.4; **C.5** Batch-Mahn mit Dry-Run/EXECUTE/runMode — kein stiller Massenversand ohne Freigabe (M4-Spec). Unveränderlichkeit gebuchter Rechnung (ADR 0007). C.8 Betrieb/Archiv mit StB/PL/DSB.

---

# Teil D — E-Rechnung

Anwendungsfall/Zeitrahmen mit StB (z. B. § 14a UStG); Profile DACH; Stammdaten-Matrix; Export INVOICE → XRECHNUNG mit Preflight im Repo — steuerliche Gleichheit mit StB; D.5 Signatur falls genutzt; D.6 QS/Validator.

---

# Teil E — DSGVO

VVT, Minimierung, Hosting (EU-Teamannahme vor Abnahme prüfen), Aufbewahrung vs. Löschung, Betroffenenrechte, AVV, TOM; E.8 technische Integrität ≠ Strafrechtsbescheinigung.

---

# Teil F — Mahnwesen

Rollen; SMTP/DSB; kein stiller Massenversand im Pilot (M4, QA-Gate).

---

# Teil G — Abschluss

G.1–G.6 inkl. FIN-2-MVP vs. Zwischenstatus GEPRUEFT/FREIGEGEBEN und Roadmap.

---

## Technische Vertiefung (Repo-Pfade)

- `docs/ERP-Systembeschreibung.md` — Abschnitte 8, 9, 11, 12  
- `docs/adr/0007-finance-persistence-and-invoice-boundaries.md`  
- `docs/adr/0012-finance-scope-tenant-customer-invoices-only.md`  
- `docs/tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md`  
- `docs/runbooks/m4-slice-5c-pl-mandanten-go.md`  

---

# Rechtlicher Hinweis (Orientierung, kein Produktnachweis)

Fehlerhafte oder manipulierte Buchführung kann strafrechtliche Konsequenzen haben (z. B. §§ 263, 269, 283 StGB). Zusätzlich HGB, DSGVO, GoBD-Idee. Dieses Dokument ersetzt keine fachliche Prüfung.

---

# Anlage: Compliance-Ledger (JSON-synchron)

Die folgenden Zeilen sind **identisch** zu den Markern in [`compliance-rechnung-finanz.ledger.md`](./compliance-rechnung-finanz.ledger.md).  
**Aktualisieren:** Einträge in `compliance-signoffs.json` pflegen, dann `npm run validate:compliance-signoffs` und `npm run apply:compliance-signoffs:apply` (setzt Checkboxen hier und im Ledger).


<!-- compliance-line: chk-a01 -->
- [ ] A.1 Zielbild Kunden/Länder — Freigabe koordiniert

<!-- compliance-line: chk-a02 -->
- [ ] A.2 Produktumfang Mandanten-Endkunden LV-Kette mit StB/PL geklärt

<!-- compliance-line: chk-a03 -->
- [ ] A.3 VVT/DSGVO ERP-Daten Endkunden des Mandanten dokumentiert

<!-- compliance-line: chk-a04 -->
- [ ] A.4 Externe Zahlungsnachweise vs. ERP-Kette Endkunden mit StB geklärt

<!-- compliance-line: chk-a05 -->
- [ ] A.5 Verantwortliche Rollen erreichbar

<!-- compliance-line: chk-a06 -->
- [ ] A.6 Schriftliches Produktiv-Go Pilot angelegt

<!-- compliance-line: chk-a07 -->
- [ ] A.7 Stammdaten-Kontext mit StB/DSB abgestimmt

<!-- compliance-line: chk-a08 -->
- [ ] A.8 Rollenmatrix/Eskalation vor Go-Live

<!-- compliance-line: chk-a09 -->
- [ ] A.9 Vorlage Produktiv-Go abgestimmt

<!-- compliance-line: chk-b01 -->
- [ ] B.1 Pflichtangaben Mandantenrechnung freigegeben

<!-- compliance-line: chk-b02 -->
- [ ] B.2 Steuersätze/Sonderregeln für Pilot geklärt

<!-- compliance-line: chk-b03 -->
- [ ] B.3 Brutto/Netto/Rundung mit StB abgestimmt

<!-- compliance-line: chk-b04 -->
- [ ] B.4 Währung EUR ausreichend für Pilot

<!-- compliance-line: chk-b05 -->
- [ ] B.5 Korrekturbelege/Konzept mit StB geklärt

<!-- compliance-line: chk-b06 -->
- [ ] B.6 Leistungsbeschreibung LV mit StB ok

<!-- compliance-line: chk-b07 -->
- [ ] B.7 Grenzfälle SaaS/OSS/Leistungsort — Scope

<!-- compliance-line: chk-b08 -->
- [ ] B.8 DACH-Zielmärkte steuerlich eingeordnet

<!-- compliance-line: chk-b09 -->
- [ ] B.9 Plattformabrechnung außerhalb Produktumfang — PL Scope bestätigt

<!-- compliance-line: chk-b10 -->
- [ ] B.10 Steuerliche Matrix Leistungsarten Mandantenrechnungen geklärt

<!-- compliance-line: chk-b11 -->
- [ ] B.11 USt-Id/Unternehmereigenschaft geklärt

<!-- compliance-line: chk-c01 -->
- [ ] C.1 Belegkette Traceability mit StB bestätigt

<!-- compliance-line: chk-c02 -->
- [ ] C.2 Mahn-E-Mail Footer/Impressum freigegeben

<!-- compliance-line: chk-c03 -->
- [ ] C.3 Handelsregister/USt-Id Stammdaten vollständig

<!-- compliance-line: chk-c04 -->
- [ ] C.4 Mahntexte/System-Footer inhaltlich frei

<!-- compliance-line: chk-c05 -->
- [ ] C.5 Massen-E-Mail 5c — StB+DSB+PL gemeinsam

<!-- compliance-line: chk-c06 -->
- [ ] C.6 Gebuchte Rechnung unveränderlich — StB

<!-- compliance-line: chk-c07 -->
- [ ] C.7 Rechnungsnummernkreis ohne verdeckte Lücken

<!-- compliance-line: chk-c08 -->
- [ ] C.8 Aufbewahrung PDF/XML geklärt

<!-- compliance-line: chk-c09 -->
- [ ] C.9 GoBD-Idee / Nachvollziehbarkeit mit StB

<!-- compliance-line: chk-d01 -->
- [ ] D.1 E-Rechnung Anwendungsfall/Zeitrahmen

<!-- compliance-line: chk-d02 -->
- [ ] D.2 DE/AT/CH Profil-Unterschiede geklärt

<!-- compliance-line: chk-d03 -->
- [ ] D.3 Pflichtfelder vs. Stammdaten Matrix

<!-- compliance-line: chk-d04 -->
- [ ] D.4 Steuersemantik XML = Rechnung

<!-- compliance-line: chk-d05 -->
- [ ] D.5 Signatur/Übermittlung falls genutzt

<!-- compliance-line: chk-d06 -->
- [ ] D.6 QS Validator-Pipeline mit StB

<!-- compliance-line: chk-e01 -->
- [ ] E.1 VVT zu Rechnung/Zahlung/E-Mail/Export

<!-- compliance-line: chk-e02 -->
- [ ] E.2 Zweckbindung/Minimierung DSB

<!-- compliance-line: chk-e03 -->
- [ ] E.3 Hosting/Zugriff Ausland DSB+PL

<!-- compliance-line: chk-e04 -->
- [ ] E.4 Aufbewahrung vs. Löschung StB+DSB

<!-- compliance-line: chk-e05 -->
- [ ] E.5 Auskunft/Portabilität geklärt

<!-- compliance-line: chk-e06 -->
- [ ] E.6 Unterauftragsverarbeiter dokumentiert

<!-- compliance-line: chk-e07 -->
- [ ] E.7 TOM Backups/Verschlüsselung

<!-- compliance-line: chk-e08 -->
- [ ] E.8 Belege außerhalb ERP vs. GoBD-Kette Endkunden aufgelöst

<!-- compliance-line: chk-e09 -->
- [ ] E.9 CH/Drittland/EU-Hosting

<!-- compliance-line: chk-e10 -->
- [ ] E.10 Löschung während Aufbewahrungspflicht

<!-- compliance-line: chk-f01 -->
- [ ] F.1 Wer darf im Pilot mahnen/versenden

<!-- compliance-line: chk-f02 -->
- [ ] F.2 SMTP/Mail-Dienst und Empfänger DSB

<!-- compliance-line: chk-f03 -->
- [ ] F.3 Kein stiller Massenversand — gemeinsame Freigabe

<!-- compliance-line: chk-g01 -->
- [ ] G.1 A–F geklärt oder Scope dokumentiert

<!-- compliance-line: chk-g02 -->
- [ ] G.2 Steuerliche Gesamtfreigabe Pilot StB

<!-- compliance-line: chk-g03 -->
- [ ] G.3 Datenschutz-Kurzprüfung DSB

<!-- compliance-line: chk-g04 -->
- [ ] G.4 Pilotmandant/Umfang/Monitoring

<!-- compliance-line: chk-g05 -->
- [ ] G.5 Technisches Release ≠ fachliches Go — PL

<!-- compliance-line: chk-g06 -->
- [ ] G.6 FIN-/Roadmap-Ziele Pilot abgestimmt
