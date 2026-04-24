# ERP Systembeschreibung v1.2

**Hinweis:** Fachlich verbindliche Weiterentwicklung ab **v1.3** siehe `ERP Systembeschreibung v1.3.md` (Finanz-Submodell integriert). Dieses Dokument bleibt als Referenz fuer den Stand bis v1.2.

Dieses Dokument ist die fachlich verbindliche Version 1.2 des Domänenmodells fuer ein modulares, mandantenfaehiges ERP-System fuer Geruestbauunternehmen.

**Aenderung gegenueber v1.1:** Lebenszyklus und Unveraenderbarkeit des **Angebots** praezisiert: Anpassungen sind in **Entwurf** und im Status **Versendet** (solange **nicht** angenommen) zulaessig; nach verbindlicher **Annahme** sind Aenderungen **ausschliesslich ueber Nachtrag** moeglich (siehe Abschnitte 2 und 5.2).

## 1. Zielbild und Geltungsbereich

Das System bildet den vollstaendigen Geschaeftsprozess rechtssicher und nachvollziehbar ab:

`Kunde -> Projekt -> Leistungsverzeichnis -> Angebot -> Nachtrag -> Ausfuehrung -> Aufmass -> Rechnung`

Pflichtprinzipien:

- mandantenfaehig
- modular
- versioniert
- rechtssicher (inkl. XRechnung, GAEB)
- DSGVO-konform
- fachliche Korrektheit hat Vorrang vor technischer Vereinfachung

## 2. Verbindliche Grundprinzipien

- **Mandantentrennung absolut**: Jede Entitaet gehoert genau einem Mandanten. Keine mandantenuebergreifenden Datenbeziehungen.
- **Versionierung statt Ueberschreiben**: Geschaeftskritische Aenderungen erzeugen neue Versionen bzw. folgen einem definierten, nicht-destruktiven Aenderungsmodell (kein stillschweigendes Ueberschreiben geschaeftskritischer Historie).
- **Unveraenderbarkeit rechtlicher Dokumente**: **Gebuchte** bzw. rechtswirksam festschreibende **Rechnungen** sind unveraenderbar (Korrekturen nur per Storno/Gutschrift und Folgedokument). **Angebote** sind **nach verbindlicher Annahme** (`Angenommen`) inhaltlich fixiert: Aenderungen an Leistungsumfang, Preisbasis oder vergleichbaren Kerninhalten sind **ausschliesslich ueber Nachtrag** zulaessig. In **Entwurf** und im Status **Versendet** (solange das Angebot **nicht** angenommen wurde) sind **Anpassungen und Abweichungen** der Angebotsversion zulaessig — unter Einhaltung von Rollenrecht, Auditpflicht und technischem Nicht-Destruktivitaetsmodell.
- **Traceability Pflicht**: Rechnung muss ueber Aufmass, LV, Angebot, Projekt bis Kunde rueckverfolgbar sein.
- **Trennung Systemtext/Bearbeitungstext**: Externe und buchhalterische Daten duerfen nicht durch Freitextaenderungen beeinflusst werden.
- **Realitaetsabbildung Bauwesen**: Miet-, Mengen- und Zeitlogik duerfen nicht auf einfache CRUD-Muster reduziert werden.

## 3. Entitaetenkatalog (v1.1)

### 3.1 Kernentitaeten

- Mandant
- Benutzer
- Rolle
- Berechtigung
- Kunde
- Ansprechpartner
- Objekt (Baustelle)
- Projekt
- Projektbeteiligter (Rolle im Projekt)
- LV (Leistungsverzeichnis)
- LV-Strukturknoten (Bereich, Titel, Untertitel)
- LV-Position
- Stammposition
- Mietposition
- Angebot
- Angebotsversion
- Nachtragsangebot
- Nachtragsversion
- Aufmass
- Aufmassposition
- Rechnung
- Rechnungsposition

### 3.2 Querschnittsentitaeten (neu in v1.1)

- Freigabevorgang
- AuditEvent
- Exportlauf
- Datenanfrage (DSGVO Auskunft)
- Loesch-/Anonymisierungsvorgang

## 4. Beziehungen (fachlich-logisch)

- Mandant -> alle Entitaeten (1:n)
- Kunde -> Projektbeteiligter (1:n)
- Projekt -> Projektbeteiligter (1:n)
- Projekt -> Objekt (n:1)
- Projekt -> LV (1:n, versioniert)
- LV -> LV-Strukturknoten (1:n)
- LV-Strukturknoten -> LV-Position (1:n)
- LV-Position -> Stammposition (n:1, optional)
- LV-Position -> Mietposition (1:n, optional)
- Angebot -> Angebotsversion (1:n)
- Angebotsversion -> LV-Version (1:1)
- Nachtragsangebot -> Nachtragsversion (1:n)
- Nachtragsversion -> Angebotsversion (n:1, referenziert Basisstand)
- Aufmass -> LV-Version (n:1)
- Aufmass -> Aufmassposition (1:n)
- Rechnung -> Aufmass (n:1 oder 1:1 je Rechnungstyp)
- Rechnung -> Rechnungsversion (1:n logisch, fachlich nur bei nicht gebuchten Entwuerfen aenderbar)
- Rechnung -> Projekt -> Kunde (vollstaendige Kette)

## 5. Lebenszyklusmodelle (neu konkretisiert)

### 5.1 Projekt

`Entwurf -> Kalkulation -> In Ausfuehrung -> Abgeschlossen -> Archiviert`

Regeln:

- Abschluss nur bei fachlich abgeschlossenen Leistungen
- Archiviert ist schreibgeschuetzt (bis auf DSGVO-anonymisierbare Personendaten)

### 5.2 Angebot

`Entwurf -> In Freigabe -> Freigegeben -> Versendet -> Angenommen/Abgelehnt -> Archiviert`

Regeln:

- **Entwurf** sowie **Versendet** (solange **keine** verbindliche **Annahme** vorliegt): Inhaltliche **Anpassungen und Abweichungen** der Angebotsversion sind zulaessig, sofern Rollenrecht, Auditierbarkeit und das technische Modell **nicht-destruktiver** Aenderungen (z. B. neue Angebotsversion statt Ueberschreibung geschaeftskritischer Historie) eingehalten werden.
- **Angenommen**: Die angenommene Angebotsversion ist **fachlich fixiert**. Weitere Aenderungen an Leistungsumfang, Preisbasis oder vergleichbaren Kerninhalten sind **ausschliesslich ueber ein Nachtragsangebot** (Nachtragsversion mit Referenz auf die konkrete Basis-Angebotsversion) zulaessig. **Kein** paralleler „Nachbearbeitungs“-Pfad am angenommenen Hauptangebot.
- **Abgelehnt** / **Archiviert**: Keine fachlichen Aenderungen, die den definierten Endstatus ausheben (ausser explizit modellierte Korrektur-/Wiedereroeffnungsprozesse).

### 5.3 Nachtragsangebot

`Entwurf -> In Freigabe -> Freigegeben -> Versendet -> Beauftragt/Abgelehnt -> Archiviert`

Regeln:

- Nachtrag aendert nie historisch die Ursprungsversion
- Wirkung auf abrechenbare Mengen erst nach Status `Beauftragt`

### 5.4 Aufmass

`Entwurf -> Geprueft -> Freigegeben -> Abgerechnet -> Archiviert`

Regeln:

- Aufmasspositionen referenzieren LV-Positionen und Mengenkontext
- Nach Freigabe nur Korrektur ueber neue Aufmassversion

### 5.5 Rechnung

`Entwurf -> Geprueft -> Freigegeben -> Gebucht/Versendet -> Bezahlt/Teilbezahlt -> Storniert`

Regeln:

- Nur Entwurf ist editierbar
- Mit `Gebucht/Versendet` unveraenderbar
- Korrekturen nur per Storno/Gutschrift und Folgedokument

## 6. Dokumenten- und Versionierungslogik

- Jede Version hat: Versionnummer, Erstellzeitpunkt, Ersteller, Freigabestatus, Gueltigkeitsbezug.
- Alte Versionen bleiben lesbar und referenzierbar.
- Keine destruktiven Updates geschaeftskritischer Daten.
- Nachtraege referenzieren immer eine konkrete Basisversion des Angebots.

## 7. Nachtragslogik (neu geschaerft)

Nachtragspositionen koennen:

- neue Positionen hinzufuegen
- Mengen erhoehen oder reduzieren (Differenzlogik)
- Preise aendern (mit Begruendung und Freigabe)
- Leistungszeitraum erweitern

Pflichtregeln:

- Ursprungsangebot bleibt historisch unveraendert
- Finanzielle Wirkung erst bei beauftragtem Nachtrag
- Jede Abweichung muss im Aufmass und in der Rechnung nachvollziehbar sein

## 8. Finanzlogik (neu ergaenzt, rechtlich kritisch)

Pflichtfaehigkeiten:

- Abschlagsrechnung
- Schlussrechnung
- Teilrechnung
- Stornorechnung / Gutschrift
- Skonto
- Zahlungsziel und Mahnstufen
- Rundungsregeln (positions- und gesamtdokumentbezogen)
- Mehrwertsteuerlogik inkl. steuerfreier bzw. abweichender Faelle nach Mandantenregel

Regeln:

- Finanzstatus ist getrennt vom Projektstatus
- Jede Zahlung und Korrektur ist auditierbar
- Rechnungsfolgen muessen saldenseitig konsistent sein

## 9. LV- und Textlogik

LV-Hierarchie bleibt verbindlich:

`Bereich -> Titel -> Untertitel -> Position`

Je LV-Position:

- hierarchische, editierbare Ordnungszahl
- Mengen, Einheit, Preis, Typ (Normal, Alternativ, Eventual)
- optional Stammpositionsreferenz
- optional Mietpositionslogik

Texttrennung (verbindlich):

- **Systemtext**: unveraenderbar, export- und buchhaltungsrelevant
- **Bearbeitungstext**: editierbar, anzeige- und angebotsrelevant

## 10. Mietlogik (Geruestbau)

- Hauptposition beschreibt Grundleistung
- mehrere Mietpositionen pro Hauptposition erlaubt
- Teilmengenabrechnung erlaubt
- Zeitraeume steuern Abrechnung
- keine 1:1 Vereinfachung zulaessig

## 11. Rollen- und Berechtigungsmodell (neu praezisiert)

### 11.1 Rollenbeispiele

- Disposition
- Bauleitung
- Kalkulation
- Vertrieb
- Buchhaltung
- Geschaeftsfuehrung
- Admin

### 11.2 Aktionsrechte je Status (Pflicht)

Fachlich zu definieren pro Entitaet und Status:

- erstellen
- bearbeiten
- freigeben
- versenden/exportieren
- stornieren
- archivieren
- anonymisieren (DSGVO-konform)

Regel:

- Kritische Statusuebergaenge (z. B. Freigabe, Buchung, Storno) erfordern berechtigte Rolle und AuditEvent.

## 12. Auditierbarkeit (neu konkretisiert)

AuditEvent Pflichtfelder:

- Mandant
- Entitaetstyp
- Entitaets-ID
- Aktion
- Zeitstempel
- Ausfuehrender Benutzer
- Vorher-/Nachher-Zustand (fachlich relevante Felder)
- Grund/Kommentar (bei kritischen Aktionen)

Minimal zu protokollierende Aktionen:

- Statuswechsel
- Freigaben
- Versand
- Exportlaeufe
- finanzielle Korrekturen
- Loesch-/Anonymisierungsvorgaenge

## 13. DSGVO-Overlay (v1.1 konkretisiert)

Verbindlich:

- Datenminimierung und Zweckbindung je Datenfeld
- Trennung geschaeftspflichtiger Daten und personenbezogener Zusatzdaten
- Loeschen als Anonymisierung, wenn Aufbewahrungspflichten bestehen
- Export personenbezogener Daten pro betroffener Person
- Trennung aktive Daten / Archivdaten

Neu konkret:

- DSGVO-Anfragen als eigener Vorgang mit Frist, Status und Nachweis
- Anonymisierung darf fachliche Nachvollziehbarkeit nicht brechen

## 14. Export- und Schnittstellenlogik (neu praezisiert)

Pflichtformate:

- PDF
- XRechnung
- GAEB Import
- GAEB Export
- Buchhaltungsexporte (z. B. DATEV)

Fachliche Mapping-Regeln (Pflicht):

- fuer jedes Format: Pflichtfelder, Quellenentitaet, Validierungsregel, Fehlerverhalten
- fehlerhafte Exporte duerfen keine rechtsverbindlichen Dokumente erzeugen
- Exportlauf wird als `Exportlauf` protokolliert

## 15. Validierung und Quality Gate (v1.1)

Phase 1 ist nur abgeschlossen, wenn:

- keine Pflichtentitaet fehlt
- keine Beziehung unklar oder isoliert ist
- Lebenszyklusmodelle je Kerndokument definiert sind
- Versionierung und Unveraenderbarkeit konsistent umgesetzt sind (inkl. Angebot: Anpassung bis vor Annahme; nach Annahme nur Nachtrag)
- Finanzlogik inkl. Korrekturprozesse fachlich definiert ist
- Nachtragswirkung eindeutig geregelt ist
- Rollen-/Aktionsrechte je Status definiert sind
- AuditEvent-Modell umgesetzt ist
- DSGVO- und Exportregeln mit Pflichtfeldern dokumentiert sind

## 16. Offene Risiken und Annahmen (Pflichtabschnitt)

Bei jeder Fortschreibung aktiv zu dokumentieren:

- offene Risiken (fachlich/rechtlich/operativ)
- explizite Annahmen
- Komplexitaetsbereiche
- Vorschlaege fuer die naechste Phase

**Annahme v1.2:** Angebotsanpassungen nach Versand (vor Annahme) sind fachlich gewollt; **rechtliche** Bewertung (z. B. Bindungswirkung nach Zugang beim Kunden) bleibt mandanten- bzw. vertragsspezifisch und muss bei Export/Versandprozessen beruecksichtigt werden.

---

**Version:** 1.2  
**Status:** Fachlich verbindlicher Entwurf fuer weitere Phasen (Datenmodell, API, Frontend, QA)  
**Hinweis:** Bei Konflikt zwischen Einfachheit und fachlicher Korrektheit gilt immer fachliche Korrektheit.
