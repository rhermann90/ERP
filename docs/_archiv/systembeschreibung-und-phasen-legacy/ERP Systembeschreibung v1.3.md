# ERP Systembeschreibung v1.3

Dieses Dokument ist die fachlich verbindliche Version 1.3 des Domaenenmodells fuer ein modulares, mandantenfaehiges ERP-System fuer Geruestbauunternehmen.

**Aenderung gegenueber v1.2:** Das **Finanz-Submodell** (Rechnung, Zahlungsbedingungen inkl. Nachlaesse/Abzuege/Einbehalte, Zahlungsbedingungs-Versionen, Differenzbuchungen, Zahlungseingang, Zahlungszuordnung, Zahlungsstatus, Mahnwesen, Steuer- und Rundungslogik, **Waehrung EUR**, **Steuer-Sonderfaelle** in Abschnitt 8.16, **mandantenspezifische Textbausteine** Mahnung/Rechnung (8.10), Projekt-Finanzuebersicht, DSGVO-Minimierung Zahlungsdaten) ist **vollstaendig** in diese Systembeschreibung integriert und gilt als **verbindlicher** Bestandteil der Domain-Core-Definition (Abschnitt 8). Technische Umsetzung erfolgt phasenweise; v1.2-Abschnitte 1–7, 9–16 bleiben grundsaetzlich gueltig, soweit nicht durch v1.3 ergaenzt oder praezisiert.

**Aenderung gegenueber v1.1 (historisch, v1.2):** Lebenszyklus und Unveraenderbarkeit des **Angebots** praezisiert: Anpassungen in **Entwurf** und **Versendet** (vor Annahme); nach **Annahme** nur **Nachtrag** (siehe Abschnitte 2 und 5.2).

## 1. Zielbild und Geltungsbereich

Das System bildet den vollstaendigen Geschaeftsprozess rechtssicher und nachvollziehbar ab:

`Kunde -> Projekt -> Leistungsverzeichnis -> Angebot -> Nachtrag -> Ausfuehrung -> Aufmass -> Rechnung`

**Erweiterte finanzielle Traceability (v1.3, verbindlich):** Jede finanzielle Veraenderung muss nachvollziehbar sein. **Zahlungsbedingungen** sind am **Projekt** (bzw. vertraglich festgelegter Kopf) gebunden und versioniert; jede **Rechnung** traegt eine **Referenz auf die zum Zeitpunkt der Rechnungslegung gueltige Zahlungsbedingungs-Version** (siehe Abschnitt 4 und 8.5). Kette fachlich-logisch:

`Projekt -> Zahlungsbedingungen / Version(en) -> Rechnung (mit gebundener Konditions-Version) -> Differenzbuchung (falls zutreffend) -> Zahlungseingang -> Zahlungszuordnung -> Zahlungsstatus`

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
- **Traceability Pflicht**: Rechnung muss ueber Aufmass, LV, Angebot, Projekt bis Kunde rueckverfolgbar sein (soweit fuer den Rechnungstyp vorgesehen; siehe 5.5 und 8.2). **Zahlungs- und Konditionsaenderungen** muessen zur **Projekt- und Rechnungslinie**, zur referenzierten **Konditions-Version** und zu **Zahlungseingaengen / -zuordnungen** rueckverfolgbar sein (siehe Abschnitt 8).
- **Trennung Systemtext/Bearbeitungstext**: Externe und buchhalterische Daten duerfen nicht durch Freitextaenderungen beeinflusst werden.
- **Realitaetsabbildung Bauwesen**: Miet-, Mengen- und Zeitlogik duerfen nicht auf einfache CRUD-Muster reduziert werden.

## 3. Entitaetenkatalog (v1.1, erweitert v1.3)

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
- **Zahlungsbedingungen (Kopf, versioniert)** — v1.3
- **Zahlungsbedingungs-Version** — v1.3
- **Nachlassregel** (geordnete Liste, kaskadierend) — v1.3
- **Abzugsregel** — v1.3
- **Einbehaltregel** — v1.3
- **Differenzbuchung** — v1.3
- **Zahlungseingang** — v1.3
- **Zahlungszuordnung** — v1.3
- **Mahnkonfiguration / Mahnstufe** (mandantenspezifisch) — v1.3
- **Mahnung / Mahnlauf** (Protokoll inkl. Versandart) — v1.3

### 3.2 Querschnittsentitaeten (neu in v1.1)

- Freigabevorgang
- AuditEvent
- Exportlauf
- Datenanfrage (DSGVO Auskunft)
- Loesch-/Anonymisierungsvorgang

## 4. Beziehungen (fachlich-logisch, erweitert v1.3)

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
- Rechnung -> Aufmass (n:1 oder 1:1 je Rechnungstyp; **Gutschrift / Stornodokument** gemaess 5.5 und 8.2: Referenz auf Ausgangsrechnung bzw. Aufmass nur soweit fachlich erforderlich — im Datenmodell explizit modellieren)
- Rechnung -> Rechnungsversion (1:n logisch, fachlich nur bei nicht gebuchten Entwuerfen aenderbar)
- Rechnung -> Projekt -> Kunde (vollstaendige Kette)
- **Projekt -> Zahlungsbedingungen (1:1 oder 1:n je Mandantenregel); Zahlungsbedingungen -> Zahlungsbedingungs-Versionen (1:n, jede Aenderung neue Version)** — v1.3
- **Zahlungsbedingungs-Version -> Nachlassregeln / Abzugsregeln / Einbehaltregeln (1:n, geordnet wo relevant)** — v1.3
- **Rechnung -> referenzierte Zahlungsbedingungs-Version** (verbindlich fuer Berechnung zum Stichtag der Rechnung) — v1.3
- **Differenzbuchung** bei Aenderung der Zahlungsbedingungen: referenziert alte/neue Konditionsversion, wird als eigene Buchung gespeichert und **automatisch in die naechste Rechnung integriert** — v1.3
- **Zahlungseingang -> Zahlungszuordnungen (1:n); Zahlungszuordnung -> Rechnung (n:1), Teilbetrag** — v1.3
- **Mahnung** bezieht sich auf eine oder mehrere offene Rechnungspositionen / Rechnungen mit Protokoll (Stufe, Zeitpunkt, Versandart) — v1.3

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

**Storno vs. Gutschrift (v1.3, Begriffsklaerung):** **Storno** bezeichnet den **fachlichen Vorgang** / Statusuebergang (gebuchte Rechnung wird storniert, mit Audit und Folgebeleg). **Gutschrift** ist ein **Rechnungstyp** (negativer oder ausgleichender Rechnungsbeleg). **Stornorechnung** (falls als eigener Beleg gefuehrt) ist mit **Gutschrift** oder neutraler **Korrekturrechnung** im Mandantenwortlaut zu vereinheitlichen und in API/Export **ein** konsistentes Enum/Aktionsschema abzubilden.

**Rechnungstypen (v1.3, verbindlich):** Abschlagsrechnung, Teilrechnung, Schlussrechnung, Gutschrift. Inhaltlich (nach Buchung / rechtswirksamer Festschreibung): Netto-/Bruttobetraege, Steuersaetze, Steuerbetraege, **Referenz auf die zum Zeitpunkt der Rechnungslegung gueltige Zahlungsbedingungs-Version**, enthaltene Nachlaesse, Abzuege, Einbehalte, enthaltene Differenzbuchungen. **Rechnung als rechtliches Dokument** ist nach Erstellung im gebuchten Sinne **unveraenderbar** und vollstaendig dokumentiert.

**Zahlungsstatus (v1.3, automatisch aus Zahlungszuordnung und Faelligkeit):** Offen, Teilbezahlt, Bezahlt, Ueberbezahlt, Ueberfaellig.

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

## 8. Finanz-Submodell (v1.3 — vollstaendig und integriert)

Dieses Unterkapitel ist **integral** Bestandteil der Domain-Core-Definition und verbindlich fuer Datenmodell, API, Buchhaltungsexporte und Pruefungspfad.

### 8.1 Grundprinzipien

**Trennung von Ebenen:**

- **Rechnung** = rechtliches Dokument (**unveraenderbar** nach gebuchter/rechtswirksamer Festschreibung im Sinne von 5.5).
- **Zahlungsbedingungen** = vertragliche Grundlage (**versionierbar**); jede Aenderung erzeugt eine **neue Zahlungsbedingungs-Version**; gilt **nur fuer zukuenftige** Rechnungen (bestehende Rechnungen behalten ihre referenzierte Version).
- **Zahlungen** = Ereignisse (**additiv**): Zahlungseingang und Zahlungszuordnung.
- **Differenzen** = Korrekturmechanismus bei Aenderung der Zahlungsbedingungen (siehe 8.6).

**Vollstaendige Traceability:** Jede finanzielle Veraenderung muss rueckverfolgbar sein: Rechnung (inkl. gebundener **Zahlungsbedingungs-Version**), Projekt-Konditionshistorie, Differenzbuchung (falls zutreffend), Zahlungseingang, Zahlungszuordnung, Zahlungsstatus.

### 8.2 Rechnung (erweitert)

**Typen:** Abschlagsrechnung, Teilrechnung, Schlussrechnung, Gutschrift.

**Inhalte (Mindestinhalt, erweiterbar nach Mandantenregel):** Netto-/Bruttobetrag, Steuersaetze, Steuerbetrag, Referenz auf **Zahlungsbedingungs-Version**, enthaltene Nachlaesse, Abzuege, Einbehalte, enthaltene Differenzbuchungen.

**Eigenschaften:** Unveraenderbar nach Erstellung im Sinne von 5.5; vollstaendig dokumentiert; Export- und buchhaltungsrelevante Felder von Bearbeitungstext trennen (siehe Abschnitt 9).

### 8.3 Zahlungsbedingungen (final)

**Struktur (Kopf / Version):**

- **Zahlungsziel** (z. B. Tage)
- **Skonto:** Prozentsatz, Frist; **Skonto wird ausschliesslich auf den finalen Rechnungsendbetrag angewendet** (nach verbindlicher Berechnungskette gemaess **Abschnitt 8.4**; nicht verwechseln mit **Abschnitt 8.5** „Zahlungsbedingungs-Versionen“).

**Nachlaesse (mehrstufig und kaskadierend):**

- Mehrere Nachlaesse moeglich; **Reihenfolge ist entscheidend**.
- Je Nachlass: Bezeichnung; **Typ:** prozentual oder fixer Betrag; **Berechnungsbasis:** Gesamtbetrag **oder** Zwischensumme nach vorherigem Nachlass (konfigurierbar je Regel).
- **Verhalten:** Nachlaesse werden in definierter Reihenfolge angewendet (Beispiel: Nachlass A auf Gesamtbetrag, Nachlass B auf reduzierte Zwischensumme, Nachlass C optional wieder auf Gesamtbetrag — exakt so modellieren, dass die Reihenfolge auditierbar ist).

**Abzuege (typische Beispiele):** Baustrom, Bauwasser, Baustellen-WC, Bauwesenversicherung u. a.

- Je Abzug: Bezeichnung; Typ prozentual oder fix; Berechnungsbasis Gesamtbetrag oder Zwischensumme; **Zeitpunkt:** einmalig oder optional **verteilt** ueber Perioden (fachlich zu definieren pro Regel).
- **Verhalten:** Reduzieren den Auszahlungsbetrag; **transparent** ausweisen.

**Einbehalte:**

- Prozentual oder fix; **temporaer**; spaetere Auszahlung erforderlich; transparent ausweisen.

### 8.4 Berechnungslogik (verbindliche Reihenfolge)

1. LV-Summe (Netto)  
2. Nachlaesse (kaskadierend, Reihenfolge aus Konfiguration)  
3. Zwischensumme  
4. Abzuege  
5. Zwischensumme  
6. Einbehalte  
7. Steuerberechnung (Netto → Steuer → Brutto, gesetzeskonform, siehe 8.11)  
8. **Rechnungsendbetrag (Brutto)**  
9. Skonto optional **bei Zahlung** (nur nach den obigen Regeln, auf finalen Endbetrag)

**Mahngebuehren (Anbindung an Forderung):** Mahngebuehren, die einer **Mahnstufe** (Abschnitt 8.10) zugeordnet sind, sind **nicht** stillschweigend in den Rechnungsendbetrag (Schritte 1 bis 8) einzumischen, sondern als **eigene Forderungs-/Buchungszeile** oder klar definierter **Nebenforderungsbestandteil** mit eigener Audit-Spur abzubilden; Auswirkung auf **offenen Saldo** und **Zahlungsstatus** (8.9) ist mandantenkonfigurierbar festzulegen. Der **buchhalterisch gefuehrte Betrag** der Mahngebuehr fuer einen konkreten Mahnlauf muss **identisch** sein mit dem Wert, der in die Pflicht-Platzhalter-Ersetzung **`{{MahngebuehrEUR}}`** in den **Mahn-Vorlagen** (8.10) einfliesst.

**Skonto in Zahlungserinnerung / Zahlungsavis (Anbindung an Kondition):** Die Werte fuer **`{{SkontoBetragEUR}}`** und **`{{SkontofristDatum}}`** (8.10) sind **ausschliesslich** aus der fuer die Forderung massgebenden **Rechnungs- und Zahlungsbedingungslogik** (8.4 Schritt 9, 8.5) abzuleiten; **kein** vom Mandanten frei erfundener Skontotext. Semantik und **normierte** Darstellung bei fehlendem, aktivem oder abgelaufenem Skonto: **8.10** (Pflicht).

### 8.5 Zahlungsbedingungs-Versionen

- Jede fachliche Aenderung der Zahlungsbedingungen erzeugt eine **neue Version**.
- Neue Version gilt **nur** fuer **zukuenftige** Rechnungen; bestehende Rechnungen bleiben an ihre referenzierte Version gebunden.

### 8.6 Differenzbuchungen

- **Zweck:** Ausgleich bei Aenderungen der Zahlungsbedingungen (gegenueber bereits abgerechneten / offenen Leistungen, fachlich im Projekt zu steuern).
- **Verhalten:** Differenzen werden berechnet, als **eigene Buchung** gespeichert und **automatisch in die naechste Rechnung integriert** (kein stiller Wegfall).

**Randfaelle (verbindlich zu modellieren, kein stilles Verhalten):** (a) Es liegt **keine** planbare „naechste“ Rechnung vor (Projektende, Schlussrechnung bereits erfolgt) — Ausgleich nur ueber definierten Alternativpfad (z. B. Gutschrift, Ausgleichsposten, manuelle Freigabe). (b) **Mehrere** gleichzeitig offene Folgerechnungen — Prioritaetsregel festlegen. (c) **Storno** einer bereits mit Zahlungen belegten Rechnung — Zuordnungen rueckabwickeln oder umverteilen nach GoBD-konformem Regelwerk (Domaenenfehler statt stiller Loeschung).

### 8.7 Zahlungseingang

- **Zweck:** Erfassung realer Zahlungseingaenge (zunaechst **ungeklaert** / roh erfasst).
- **Inhalte:** Betrag, Datum, Zahler, Verwendungszweck (roh).
- **Status:** ungeklaert, teilweise zugeordnet, vollstaendig zugeordnet.

**Idempotenz / Duplikate (Pflicht):** Bank- oder Kassenimporte koennen **doppelt** ankommen; jeder Eingang traegt einen **technischen Schluessel** (z. B. Bank-Transaktions-ID, Hash aus Datum+Betrag+Verwendungszweck) **mandantenweit eindeutig** oder es ist ein **expliziter** Merge-/Kollisionsworkflow vorgesehen — **kein** doppeltes Verbuchen ohne Domaenenereignis/Audit.

**Bank- / Importgebuehren (bewusst verschoben):** Abweichende **Bankspesen** oder **Importgebuehren** gegenueber dem Zahlungskernbetrag sind in **v1.3.x** **nicht** normativ geregelt; fachliche und buchhalterische Abbildung erfolgt **ueber separates Ticket** mit GoBD-/Audit-Freigabe, sobald die Projektleitung priorisiert.

### 8.8 Zahlungszuordnung

- **Zweck:** Verteilung von Zahlungen auf Rechnungen.
- **Inhalte:** Referenz Zahlungseingang, Referenz Rechnung, Teilbetrag; Summe der Zuordnungen darf fachliche Regeln fuer Ueberzahlung / Teilzahlung nicht verletzen (mit klarem Domaenenfehler statt stiller Korrektur).

**Rueckbuchungen / Chargebacks:** Bankseitige Belastungskorrekturen sind als **eigenes Ereignis** (negativer Zahlungseingang oder Storno-Zuordnung) mit Rueckverfolgung auf die **urspruengliche Zuordnung** zu modellieren; Auswirkung auf Saldo und **Zahlungsstatus** ohne stille Datenloeschung.

### 8.9 Zahlungsstatus (automatisch)

Aus Zahlungszuordnungen, Rechnungsbetrag und Faelligkeit abgeleitet: Offen, Teilbezahlt, Bezahlt, Ueberbezahlt, Ueberfaellig.

### 8.10 Mahnwesen (vollstaendig)

**Mahnuebersicht (zentrale Ansicht):** Alle offenen / ueberfaelligen Rechnungen, zugehoerige Kunden, offene Betraege, Faelligkeiten, aktuelle Mahnstufe.

**Mahnstufen:** Konfigurierbar je Mandant (Beispiele: Zahlungserinnerung, Mahnung, Letzte Mahnung). Je Stufe: Bezeichnung, Frist, optional Mahngebuehr, Textvorlage; jede Stufe traegt einen **Vorlagen-Typ** (mindestens **Zahlungserinnerung**, **Zahlungsavis**, **Mahnung**), der die **Pflicht-Platzhalter** nach **8.10** steuert.

**Tagesfristen und Mahngebuehren — Produkt-Standard, mandanteneditierbar (Pflicht):** Pro Mahnstufe werden **Tagesfristen** (relative **Kalendertage**, Referenzbasis z. B. ausschliesslich **Rechnungsfaelligkeit** oder **Abstand zur vorherigen** Stufe) sowie **Mahngebuehr-Betraege** in **EUR** (**zwei** Nachkommastellen, **8.12**) mit **vom Produkt ausgelieferten Standardwerten** vorbelegt. Die **gewaehlte** Referenzbasis fuer Fristen ist **pro Mandant** einstellbar, **tenant-weit** **einheitlich** und in **Implementierung/ADR** festzuhalten (**keine** stillen Mischmodi pro Einzelversand). Der **Mandant** kann **Fristen** und **Hoehen** der Mahngebuehren **jederzeit** in den **Mandanteneinstellungen** aendern; die zum **Versandzeitpunkt** gueltige Konfiguration ist **massgeblich** fuer **Automatik/Eskalation**, **Buchung** der Mahngebuehr (**8.4**) und die Ersetzung von **`{{MahngebuehrEUR}}`**. **Aenderungen** an diesen Werten sind **auditierbar** (**12**). Bei **Neuanlage** eines Mandanten bzw. **Erstaktivierung** des Mahnwesens gelten die **Produkt-Standardwerte**, bis der Mandant sie ueberschreibt.

**Vorlagen-Typ — Kardinalitaet (Pflicht):** Jede Mahnstufe hat **genau einen** Vorlagen-Typ (**Zahlungserinnerung**, **Zahlungsavis** oder **Mahnung**). **Mehrfach-Typisierung** oder **hybride** Stufen (z. B. gleichzeitig Avis und Mahnung) sind **unzulaessig**; gemischte Anforderungen sind ueber **mehrere Stufen** und/oder Formulierung **innerhalb eines** Typs abzubilden.

**Abgrenzung Zahlungserinnerung / Zahlungsavis (v1.3.x):** **Zahlungserinnerung** = primaer **erinnernde** Kommunikation (typisch **fruehe** Stufe). **Zahlungsavis** = **betonte Zahlungsaufforderung** mit klarer Aufforderung zur Begleichung (typisch **nach** erster Erinnerung, **vor** oder an der Schwelle zur **Mahnung**). Beide Typen nutzen dieselben **Skonto-Pflichtplatzhalter**; die **Reihenfolge** der Stufen ist **mandantenkonfigurierbar**. **Go-Live-Checkliste (Pflicht):** Fuer jede **produktive** Mahnstufe sind **Vorlagen-Typ**, zugehoerige Vorlagen (E-Mail/Druck) und **fachliche Freigabe** durch eine **befugte Mandantenrolle** (z. B. Administrator/in oder dokumentierte Stellvertretung) **nachweisbar** (Audit 12).

**Mahnlogik:** Basiert auf Faelligkeit; beruecksichtigt Zahlungen und Differenzen.

**Mahnprozess:** Benutzer waehlt mehrere offene Posten; **Systementscheidung:** wenn E-Mail vorhanden → Versand per Mail; wenn keine E-Mail → Druck erforderlich.

**Sicherheit und Bedienung (Pflicht):** Vor **Massenversand** (E-Mail oder Sammeldruck) **Empfaenger- und Betragsvorschau** (Tenant + Kunde + Rechnungsliste); **kein** Versand ohne explizite Bestaetigung der ausgewaehlten Posten. **Empfaengeradresse** muss zum **Mandanten und Kunden des Projekts** passen (technische Pruefung gegen Stammdaten). **Mahn-PDF-Downloads** nur mit **autorisierter** Session und **tenant-scoped** URL bzw. Einmal-Token; optional **Wasserzeichen** mit Mandantenkennung.

**Ausgabe:** PDF-Dokumente; Sammeldruck und Sammelversand moeglich.

**Mandantenspezifische Textbausteine (Pflicht — Mahnung, Rechnung, Steuerhinweise):**

- Pro **Mandant** pflegbare **Vorlagen** fuer: (a) **jede Mahnstufe** (Text fuer E-Mail und fuer Druck/PDF, getrennt erlaubt), wobei **Vorlagen-Typen** mindestens **Zahlungserinnerung**, **Zahlungsavis** und **Mahnung** (weitere Stufen mandantenkonfigurierbar) **fachlich trennscharf** gekennzeichnet sind; (b) **Rechnungsbelege** und **Gutschrift-/Stornodokumente** inkl. **fester Pflicht-Hinweiszeilen**, sobald **Steuer-Sonderfaelle** nach **8.16** aktiv sind (z. B. Kleinunternehmer-Hinweis, Steuerschuldnerschaft des Leistungsempfaengers / §13b-konformer Kurztext nach mandantenintern freigegebener Formulierung).
- **Sprache:** Pflichtsprache aller Vorlagen in **v1.3.x** ist **Deutsch**; **weitere Sprachen** (z. B. EN) nur nach separatem **Lokalisierungs-Ticket** und expliziter Freigabe (Export/GoBD-Relevanz).
- **Platzhalter** nur aus einer **vom System vorgegebenen Whitelist** (keine freie Skript- oder Formellogik im Freitext), z. B.: `{{Rechnungsnummer}}`, `{{Faelligkeitsdatum}}`, `{{OffenerBetragEUR}}`, `{{RechnungsbetragBruttoEUR}}`, `{{Projektname}}`, `{{Kundenname}}`, `{{MandantenFirmenname}}`, `{{Leistungszeitraum}}`, `{{ZahlungszielTage}}`, `{{SkontoBetragEUR}}`, `{{SkontofristDatum}}` — Erweiterungen der Liste nur mit **Versionsprung** der Spezifikation oder ADR.
- **Pflicht-Platzhalter Mahngebuehr:** In **jeder** Vorlage zu **jeder Mahnstufe** (E-Mail **und** Druck/PDF) muss der Platzhalter **`{{MahngebuehrEUR}}`** vorkommen und beim Rendering ersetzt werden (**zwei Nachkommastellen**, EUR); betraegt die fuer die Stufe anfallende Mahngebuehr **null**, ist **`0,00`** (bzw. **0.00** je Locale-Regel des Mandanten) auszuweisen — **kein** Weglassen des Platzhalters. Validierung schlaegt fehl, wenn der Platzhalter in einer Mahnstufen-Vorlage fehlt (Pflicht fuer Mahn-Vorlagen; Rechnungs-/Gutschrift-Vorlagen ohne Mahngebuehr: Platzhalter **nicht** erforderlich, sofern Vorlage klar als **nicht-Mahn**-Typ gekennzeichnet ist).
- **Pflicht-Platzhalter Skonto (Zahlungserinnerung / Zahlungsavis):** In **jeder** Vorlage vom Typ **Zahlungserinnerung** oder **Zahlungsavis** (E-Mail **und** Druck/PDF) muessen **`{{SkontoBetragEUR}}`** und **`{{SkontofristDatum}}`** vorkommen; Validierung schlaegt fehl, wenn einer der Platzhalter-Strings in der Vorlage fehlt. **Normierte Aufloesung (Pflicht, mandantenweit einheitlich, keine konkurrierenden Darstellungsvarianten):** `{{SkontoBetragEUR}}` = der zum **Versand-/Erstellungszeitpunkt** des Belegs noch **wirksame** Skontobetrag in **EUR** (**zwei** Nachkommastellen) aus **8.4**/ **8.5**; ist **kein** Skonto vereinbart oder **keiner** mehr wirksam (einschliesslich **abgelaufen**), ist **`0,00`** (bzw. **`0.00`** je Locale-Regel des Mandanten) auszuweisen. `{{SkontofristDatum}}` = der **letzte Kalendertag**, bis zu dem Skonto haette genutzt werden koennen: bei **aktivem** Skonto dieses Datum; bei **abgelaufenem** Skonto das **tatsaechliche** (historische) Enddatum derselben Frist (**kein** Leeren, **kein** Erfinden); ist in den gebundenen Konditionen **kein** Skonto vorgesehen, Ersetzung durch genau **ein** Zeichen: **Em Dash** (Unicode **U+2014**); **gleiche** Datumsformatierung wie fuer `{{Faelligkeitsdatum}}`, sobald ein Kalenderdatum ausgegeben wird. **Leerstring** als Ausgabe ist **unzulaessig**. **Vorlagen-Typ** **Mahnung** ist **von dieser Skonto-Pflicht ausgenommen** (Skonto-Platzhalter dort **nicht** erforderlich).
- **Pflicht-Footer E-Mail (Mahnwesen):** Jede per **E-Mail** versendete Mahn- oder Erinnerungsnachricht (alle Mahnstufen inkl. Zahlungserinnerung, soweit Versandweg E-Mail) erhaelt **serverseitig** einen **nicht loeschbaren**, vom **Freitext der Vorlage getrennten** **System-Footer**. Inhaltspflicht: **Impressum- bzw. Geschaeftsbriefpflichtangaben** des Mandanten aus **strukturierten Stammdaten** (kein reines HTML-Freifeld); zusaetzlich ein **kurzer, vom System vorgegebener Rechtshinweis** (Rahmen **Wettbewerbsrecht / UWG** und **ordnungsgemaesses Forderungsmanagement** in **neutraler** Formulierung, **v1.3.x** **Deutsch**). **Mandanten-Freitext** im Footer ist **nicht** zulaessig; optional **zusaetzliche** mandantenfreigegebene **Signaturzeile** nur in einem **eigenen, validierten** Teilfeld (Zeichenlimit, **kein** HTML). **Validierung:** E-Mail-Versand **blockiert**, wenn fuer den Mandanten die **Pflichtfelder** fuer den E-Mail-Footer (Impressum) **unvollstaendig** sind. **Rechtsvorbehalt:** Zusammensetzung und Kurztext des Footers sind **keine** Rechtsberatung; **inhaltliche** Richtigkeit, Angemessenheit im Einzelfall (z. B. **Inkasso**, Branche, **B2B** vs. **B2C**) und **Vollstaendigkeit** der Mandantenangaben liegen beim **Mandanten** — **fachliche Freigabe** vor Produktiv-Go ist **empfohlen** (Qualitaetstor, siehe 15).
- **Rendering:** Ersetzung **serverseitig** unmittelbar vor PDF-Erzeugung und Versand; **Validierung:** fehlender oder unaufloesbarer Platzhalter fuer den aktuellen Kontext fuehrt zu **Domaenenfehler** (kein leerer Mahn- oder Rechnungstext im Produktivversand).
- **Sicherheit / UX:** Eingabe mit **Vorschau** (Beispieldaten); **kein** ungefiltertes HTML ohne **Sanitization** und dokumentierte XSS-Policy; Aenderungen an Vorlagen **auditierbar** (Abschnitt 12).
- **Versionierung (empfohlen, fachlich anschlussfaehig an 8.5):** Aenderung einer Vorlage mit Revision (Zeitstempel, Ersteller); Gueltigkeit fuer **nachfolgende** Versaende/Mahnen; bei kritischen **Steuer-Hinweisen** Abstimmung mit **8.16** und Export-Mapping (Abschnitt 14).

**Protokollierung (Pflicht):** wann gemahnt wurde, welche Mahnstufe, Versandart — jeweils auditierbar.

### 8.11 Steuerlogik

- Steuersatz pro Position oder Rechnung (mandantenkonfigurierbar, im Rahmen gesetzlicher Vorgaben).
- Netto → Steuer → Brutto; gesetzeskonform; keine implizite Rundung vor finaler Summenbildung ohne dokumentierte Regel (siehe 8.12).
- **Steuer-Sonderfaelle** (Reverse Charge, Kleinunternehmer, §13b UStG Bauleistungen u. a.): verbindliche fachliche Regeln und Ausweisung in Rechnung/Export in **Abschnitt 8.16**; ohne dortige Modellierung kein Produktiv-Go fuer betroffene Mandanten.

### 8.12 Rundungslogik

- **Zentrale Rundungsregel**; **kaufmaennisch**; maximal **zwei Nachkommastellen** fuer Geldbetraege im System (Ausnahmen nur mit expliziter Mandantenregel und Export-Mapping).

### 8.13 Projekt-Finanzuebersicht

Aggregierte Werte (Lesemodell, aus Buchungen/Rechnungen/Zahlungen abgeleitet, nicht losgeloest erfindbar): Gesamtvolumen, abgerechnet, bezahlt, offen, einbehalten.

### 8.14 DSGVO (Zahlungsdaten)

- Keine unnoetigen Zahlungsdaten speichern; **minimale Speicherung**; klare Zuordnung zu Mandant und Zweck.
- Verwendungszweck / Rohdaten nur soweit fuer Zuordnung und GoBD-Aufbewahrung erforderlich; Loesch-/Anonymisierungsvorgaenge muessen mit Aufbewahrungspflichten vereinbar sein (siehe Abschnitt 13).
- **Klassifikation:** Felder wie **IBAN**, **Kontoinhaber**, **Verwendungszweck** sind in der Datenkategorie (personenbezogen / geschaeftlich) zu dokumentieren; **Maskierung** in UI-Listen und **Redaction** in technischen Logs (keine vollstaendigen Verwendungszwecke in Application-Logs ohne Rechtsgrund).
- **Volltextsuche** auf Roh-Verwendungszweck nur mit dokumentiertem Zweck und Zugriffsbeschraenkung (Rollenrecht).
- **PWA / Client:** **Kein** Offline-Schreiben von Zahlungseingaengen oder -zuordnungen; **keine** clientseitige Rundung oder Neuberechnung von Geldbetraegen — **Server-Domaene** (8.4 / 8.12) ist massgeblich.

### 8.15 Einbehalte — Auszahlung / Aufloesung

**Einbehalte** (8.3) sind **temporaer**; die **Auszahlung** oder **Verrechnung** erfolgt durch einen definierten Geschaeftsfall (z. B. Mangelfreiheit, Fristablauf, Nachweis) mit **eigenem Audit-Ereignis** und Auswirkung auf **Projekt-Finanzuebersicht** (8.13). Ohne definierten Ausloesepfad kein automatisches „Verfallen“ von Betraegen ohne Buchung.

### 8.16 Waehrung (EUR) und Steuer-Sonderfaelle

**Waehrung (Stand v1.3.x):** Das System fuehrt **ausschliesslich Euro (EUR)** als buchfuehrungs- und ausweisrelevante Waehrung. **Kein** Mehrwaehrungsbetrieb, **keine** Wechselkursumrechnung und **keine** parallelen Fremdwaehrungs-Salden bis zu einer spaeteren, explizit freigegebenen Release-Erweiterung. Betraege in **8.4**, **8.12**, Exporten und UI sind **EUR**; Mandanten mit Fremdwaehrungsbedarf: nur ueber **gesondertes Konzept** (nicht Gegenstand dieses Abschnitts).

**Steuer-Sonderfaelle (verbindlich zu unterstuetzen, soweit Mandant aktiviert):**

1. **Reverse-Charge / Steuerschuldnerschaft des Leistungsempfaengers (§13b UStG u. a.):** Auf Rechnung und in der **Steuerzeile** muss der **Ausweis** (z. B. Steuerschuldnerschaft des Leistungsempfaengers) und die **Berechnungslogik** (Umsatzsteuer vom Leistungsempfaenger geschuldet, ggf. **0 %** Ausweis USt mit Hinweistext) **trennscharf** von der normalen USt-Berechnung (8.11) modelliert sein. **Traceability:** Rechnungsposition bzw. Rechnungskopf traegt **Steuerart** / **Begruendungscode**; Export (XRechnung, DATEV) muss dieselbe Semantik tragen — **kein** stiller Fallback auf Standard-USt.

2. **Kleinunternehmerregelung (§19 UStG):** Wenn der Mandant als Kleinunternehmer gefuehrt wird: **keine** Umsatzsteuer ausweisen, **Pflicht** auf Rechnung und in Exporten (Hinweistext gemaess gesetzlicher Vorgabe); Kalkulation und **8.4** so zu fahren, dass **keine** USt-Zeile erzeugt wird, ohne die Brutto-Netto-Konsistenz zu verletzen.

3. **Bauleistungen §13b UStG (typischer Geruestbau-Kontext):** Sofern zutreffend: **Leistungsempfaenger** als Steuerschuldner ausweisen; **Abgrenzung** zu normalem Inlandsumsatz und zu **Reverse-Charge**-Grenzfaellen **mandantenkonfigurierbar** (z. B. Schwellen, Nachweis Unternehmerstatus Auftraggeber). **Schnittstellen** (XRechnung) muessen die gewaehlte **Steuerkategorie** pro Position oder Rechnung abbilden.

**Rechtlicher Vorbehalt:** Konkrete **Formulierungen** und **Grenzfaelle** (grenzueberschreitende Dienstleistungen, Sonderregeln) bleiben **steuerrechtlich** vom Mandanten / Steuerberater zu bestaetigen; das System liefert **technische Felder** und **keine** automatische Rechtsberatung.

**Audit und Qualitaet:** Jede Aktivierung oder Aenderung von **Steuer-Sonderfall**-Einstellungen am Mandanten oder Projekt ist **auditierbar** (Abschnitt 12); Regressionstests fuer **8.4** + Export sind **Pflicht**, wenn ein Sonderfall aktiviert wird.

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

**v1.3 Ergaenzung:** Zahlungsbedingungen versionieren, Zahlungseingang erfassen, Zahlungszuordnung, Mahnlauf ausloesen, Mahnstufen pflegen — jeweils mit expliziten actionIds im Contract und Uebereinstimmung mit schreibenden API-Routen (SoT).

**Segregation of Duties (empfohlen, bei Produktivbetrieb verbindlich festzulegen):** Erfassung von **Zahlungseingang** (Import/Rohdaten) und **Zahlungszuordnung** / **Freigabe** auf Rechnungen sollten **rollentechnisch trennbar** sein, wo ein Mandant dies verlangt; jede Zuordnungsaenderung ist **auditierbar** (Abschnitt 12).

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
- **Zahlungszuordnung, Aenderung Zahlungsbedingungen, Mahnlauf** — v1.3
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

**v1.3 Ergaenzung:** Zahlungsdaten und Verwendungszwecke nur minimal speichern (siehe 8.14).

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

## 15. Validierung und Quality Gate (v1.1, erweitert v1.3)

Phase 1 ist nur abgeschlossen, wenn:

- keine Pflichtentitaet fehlt
- keine Beziehung unklar oder isoliert ist
- Lebenszyklusmodelle je Kerndokument definiert sind
- Versionierung und Unveraenderbarkeit konsistent umgesetzt sind (inkl. Angebot: Anpassung bis vor Annahme; nach Annahme nur Nachtrag)
- Finanzlogik inkl. Korrekturprozesse fachlich definiert ist — **v1.3: Finanz-Submodell Abschnitt 8 vollstaendig und konsistent mit Lebenszyklen und Traceability**
- Nachtragswirkung eindeutig geregelt ist
- Rollen-/Aktionsrechte je Status definiert sind — **v1.3: inkl. Zahlungs- und Mahnaktionen**
- AuditEvent-Modell umgesetzt ist
- DSGVO- und Exportregeln mit Pflichtfeldern dokumentiert sind

## 16. Offene Risiken und Annahmen (Pflichtabschnitt)

Bei jeder Fortschreibung aktiv zu dokumentieren:

- offene Risiken (fachlich/rechtlich/operativ)
- explizite Annahmen
- Komplexitaetsbereiche
- Vorschlaege fuer die naechste Phase

**Annahme v1.2:** Angebotsanpassungen nach Versand (vor Annahme) sind fachlich gewollt; **rechtliche** Bewertung (z. B. Bindungswirkung nach Zugang beim Kunden) bleibt mandanten- bzw. vertragsspezifisch und muss bei Export/Versandprozessen beruecksichtigt werden.

**Annahme v1.3:** Technische Umsetzung des Finanz-Submodells erfolgt **inkrementell** (Domaenenmodelle, API, Persistenz, PWA); bis zur vollstaendigen Implementierung bleiben Schnittstellen zwischen **teilpersistierten** und **In-Memory**-Aggregaten klar zu dokumentieren (kein Produktions-Go ohne vollstaendige Persistenz und Audit-Strategie).

**Festlegung v1.3.6 (Mahnwesen / 8.10):** Skonto-Platzhalter-Aufloesung und **Vorlagen-Typ-Kardinalitaet** sind **verbindlich** in **8.10** geregelt. **Restrisiko** (bewusst ausserhalb der Spez): Einzelfall-Bewertungen **Inkasso**, **Wettbewerbsrecht**, **Verbraucherschutz** je Branche und Kommunikationskanal — **Mandanten-Freigabe** und ggf. **externe** Rechts-/Inkassoberatung bleiben **Pflicht** fuer produktive Texte und Footer.

**Festlegung v1.3.8 (Mahnwesen / 8.10, Anhang 17):** **Tagesfristen** und **Mahngebuehr-Hoehen** je Mahnstufe werden **vom Produkt** mit **Standardwerten** ausgeliefert und sind **mandanteneditierbar**; die zum **Versand** gueltige Konfiguration ist **auditierbar** (**12**) und **massgeblich** fuer Eskalation, **8.4** und **`{{MahngebuehrEUR}}`**. Die **Referenzlogik** fuer Fristen (Faelligkeit vs. Abstand zur Vorstufe) ist **pro Mandant** **einheitlich** und in **Implementierung/ADR** zu dokumentieren. Zahlen in **Anhang 17** (Muster-Tabelle) sind **Illustration**, **keine** rechtliche oder buchhalterische **Norm**.

## 17. Anhang — Kurz-Glossar und UI-Leitplanken (v1.3)

**Begriffe:** **Nachlass** = positions- oder summenbezogene Ermaessigung laut definierter Reihenfolge (8.3); nicht mit werblichem **Rabatt** ausserhalb der kalkulierten Kette verwechseln (Rabatt ggf. Angebots-/LV-Ebene, nicht Finanz-Submodell ohne Abbildung). **Teilrechnung** / **Abschlagsrechnung** / **Schlussrechnung** = Rechnungstypen mit unterschiedlicher **Aufmass-** und **Saldenlogik** (5.5, 8.2). **Differenzbuchung** = Ausgleich bei Konditionswechsel (8.6), nicht automatisch identisch mit **Gutschrift**. **Waehrung** = bis auf Weiteres nur **EUR** (8.16); **Steuer-Sonderfaelle** = 8.16 in Verbindung mit 8.11. **Mahngebuehr** in Mahntexten = Pflicht-Platzhalter `{{MahngebuehrEUR}}` (8.10), Wert konsistent mit Buchung (8.4); **Hoehe** und **Tagesfristen** je Stufe: Produkt-Standard, **mandanteneditierbar** (8.10). **Skonto** auf Zahlungserinnerung/Zahlungsavis = Pflicht-Platzhalter `{{SkontoBetragEUR}}`, `{{SkontofristDatum}}` (8.10), Werte aus 8.4/8.5; **normierte** Neutralfaelle **8.10** (Betrag `0,00`; ohne Skonto in Kondition: Datum-Ausgabe = Em Dash U+2014). **E-Mail-Mahnwesen** = editierbarer Vorlagentext plus **Pflicht-Systemfooter** (Impressum, Rechtshinweis) nach 8.10.

**UI/UX (verbindliche Leitplanken):** Rechenweg der Rechnung **1:1** zur Server-Berechnung (8.4) anzeigen (**Zwischensummen** sichtbar). Vor **Buchung** einer Rechnung und vor **Mahnversand** **Vorschau** mit Schlussbestaetigung. **Zahlungsstatus** und **Fehler** benutzerfreundlich und **ohne** interne Enum-Namen als alleinige Anzeige. **Zahlungseingang ungeklaert:** Zuordnungsvorschlaege nur mit dokumentiertem **Konfidenz-Schwellwert**; kein automatisches Buchen ohne Regelwerk. **Textbausteine** Mahnung/Rechnung/Steuerhinweise: siehe **8.10** (Whitelist-Platzhalter, serverseitiges Rendering, E-Mail-Pflichtfooter).

### Muster-Go-Live-Konfiguration Mahnstufen (Orientierung, **nicht verbindlich**)

Die folgende **vierstufige** Reihenfolge dient **nur** als **Startvorlage** fuer Mandanten im Geruestbau-Umfeld. **Tagesfristen** und **Mahngebuehren** sind **vom Produkt** mit **Standardwerten** belegt (**8.10**, mandanteneditierbar); **konkrete** Zahlen in dieser Tabelle sind **Illustration**, nicht **Norm**. **Bezeichnungen** und **rechtliche** Angemessenheit bleiben **mandantenindividuell** zu pruefen. **Verbindlich** bleiben **8.10** (u. a. **genau ein** Vorlagen-Typ pro Stufe, Pflichtplatzhalter, E-Mail-Footer, Audit der Konfiguration) sowie die **Go-Live-Checkliste** (Freigabe, Audit).

| Stufe (Bezeichnung Beispiel) | Vorlagen-Typ | Platzhalter-Hinweis (Auszug) | Bemerkung (Beispiel) |
|------------------------------|--------------|------------------------------|----------------------|
| 1 — Zahlungserinnerung | **Zahlungserinnerung** | `{{MahngebuehrEUR}}` (typisch **0,00**); `{{SkontoBetragEUR}}`, `{{SkontofristDatum}}`; uebrige Whitelist nach Bedarf | Illustration Standard: **+7** Kalendertage nach Rechnungsfaelligkeit; Mahngebuehr-Standard z. B. **0,00** EUR |
| 2 — Zahlungsavis | **Zahlungsavis** | wie Stufe 1 bzgl. Skonto und Mahngebuehr | Illustration Standard: **+14** Tage nach Faelligkeit (oder **+7** nach Stufe 1, je nach gewaehlter Referenzlogik); Mahngebuehr-Standard z. B. **0,00** EUR |
| 3 — Mahnung | **Mahnung** | `{{MahngebuehrEUR}}` (ggf. **> 0** sofern Stufe und Buchung das vorsehen); **keine** Pflicht zu `{{SkontoBetragEUR}}` / `{{SkontofristDatum}}` | Illustration Standard: **+21** Tage nach Faelligkeit; Mahngebuehr-Standard z. B. **5,00** EUR (Mandant editierbar) |
| 4 — Letzte Mahnung | **Mahnung** | wie Stufe 3 | Illustration Standard: **+28** Tage nach Faelligkeit; Mahngebuehr-Standard z. B. **10,00** EUR (Mandant editierbar); Inkasso siehe **16** |

**Hinweis zur Drei-Stufen-Variante:** Mandanten mit **drei** Stufen koennen z. B. **Zahlungserinnerung** — **Zahlungsavis** — **Mahnung** (Letzte entfaellt) waehlen; **Typisierung** und Platzhalter-Regeln bleiben **8.10** unterworfen.

---

**Version:** 1.3  
**Revision:** 1.3.8 (8.10: Standard-Tagesfristen und -Mahngebuehren, mandanteneditierbar, Audit; Anhang 17: illustrative Standardzahlen; 16: Festlegung v1.3.8)  
**Status:** Fachlich verbindlicher Entwurf fuer weitere Phasen (Datenmodell, API, Frontend, QA)  
**Hinweis:** Bei Konflikt zwischen Einfachheit und fachlicher Korrektheit gilt immer fachliche Korrektheit.  
**Verweis v1.2:** `ERP Systembeschreibung v1.2.md` bleibt als Referenz fuer bereits umgesetzte Phasen-1/2-Slices lesbar; **verbindliche Weiterentwicklung** erfolgt ab v1.3 gegen dieses Dokument.
